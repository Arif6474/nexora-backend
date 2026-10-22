import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import mongoose from 'mongoose';
import ollamaService from '../services/ollamaService.js';
import productQueryService from '../services/productQueryService.js';
import orderQueryService from '../services/orderQueryService.js';
import multilingualService from '../services/multilingualService.js';
import { STORE_POLICIES, getPolicyAnswer } from '../services/storePolicyService.js';
import { parseProductSearchIntent } from '../services/productIntentParser.js';
import intentClassifier from '../services/intentClassifier.js';
import conversationContextManager from '../services/conversationContextManager.js';
import Conversation from '#models/conversationModel.js';

/**
 * Handle incoming customer chat message with strict routing, grounding, privacy,
 * and conversation persistence with context isolation.
 */
export const handleChatMessage = asyncHandler(async (req, res) => {
    const rawMessage = req.sanitizedMessage || (req.body && req.body.message) || '';
    const history = req.safeConversationHistory || [];
    const customer = req.customer; // Attached by optionalCustomerAuth if customer is logged in

    const targetConversationId = req.conversationId || req.body?.conversationId;
    const targetSessionId = req.sessionId || req.body?.sessionId;
    let conversation = null;

    // 1. Conversation session lookup with strict customer isolation
    try {
        if (customer) {
            if (targetConversationId && mongoose.Types.ObjectId.isValid(targetConversationId)) {
                // Strict customer ownership: customer cannot access or append to another customer's conversation
                conversation = await Conversation.findOne({
                    _id: targetConversationId,
                    customer: customer._id,
                    isActive: true
                });
            }
            if (!conversation) {
                // Start a new isolated conversation for this customer
                conversation = await Conversation.create({
                    customer: customer._id,
                    sessionId: targetSessionId || crypto.randomUUID(),
                    title: 'New Consultation',
                    messages: []
                });
            }
        } else if (targetSessionId) {
            // Guest conversation strictly isolated by sessionId and customer: null
            conversation = await Conversation.findOne({
                sessionId: targetSessionId,
                customer: null,
                isActive: true
            });
            if (!conversation) {
                conversation = await Conversation.create({
                    customer: null,
                    sessionId: targetSessionId,
                    title: 'Guest Chat',
                    messages: []
                });
            }
        }
    } catch (err) {
        console.warn('Conversation init warning:', err.message);
    }

    // 2. Hydrate effective history from database if client sent empty history
    let effectiveHistory = history;
    if (effectiveHistory.length === 0 && conversation && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
        effectiveHistory = conversation.messages.slice(-8).map(m => ({
            role: m.role,
            content: m.content
        }));
    }

    // 3. Language detection
    const detectedLang = multilingualService.detectLanguage(rawMessage);
    const languageInstructions = multilingualService.getLanguagePromptInstructions(detectedLang);

    // 4. Extract conversation context from prior turns
    const previousContext = conversationContextManager.extractContext(effectiveHistory);

    // 5. Robust Intent & Entity Classification
    const { intent, orderIdCandidate, confidence } = intentClassifier.classify(rawMessage, { previousContext });

    // Helper to persist conversation turn and return standard JSON
    const sendChatResponse = async (payload, status = 200) => {
        if (conversation) {
            try {
                conversation.messages.push({
                    role: 'user',
                    content: rawMessage,
                    timestamp: new Date()
                });
                conversation.messages.push({
                    role: 'assistant',
                    content: payload.message || '',
                    intent: payload.intent || intent,
                    language: payload.language || detectedLang,
                    products: payload.products || [],
                    order: payload.order || null,
                    requiresAuth: !!payload.requiresAuth,
                    verifiedSource: payload.verifiedSource || null,
                    quickReplies: payload.quickReplies || [],
                    timestamp: new Date()
                });
                conversation.lastMessageAt = new Date();
                if ((!conversation.title || conversation.title === 'New Consultation' || conversation.title === 'Guest Chat') && rawMessage) {
                    conversation.title = rawMessage.slice(0, 45).trim() || conversation.title;
                }
                await conversation.save();
                payload.conversationId = conversation._id;
                payload.sessionId = conversation.sessionId;
            } catch (err) {
                console.warn('Conversation save warning:', err.message);
            }
        }
        return res.status(status).json(payload);
    };

    // ----------------------------------------------------
    // SCENARIO 1: GREETINGS & CASUAL HELLOS
    // ----------------------------------------------------
    if (intent === 'greeting') {
        let greetingText = '';
        if (detectedLang.lang === 'bn' || detectedLang.lang === 'banglish') {
            greetingText = 'নমস্কার! Nexora লাক্সারি ফ্যাশন হাউসে আপনাকে স্বাগতম। আজ আপনাকে কীভাবে সাহায্য করতে পারি? নতুন কালেকশন দেখতে পারেন অথবা অর্ডার, শিপিং ও স্টোর পলিসি সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।';
        } else if (detectedLang.lang === 'it') {
            greetingText = 'Benvenuto su Nexora. Come posso assisterti oggi? Posso aiutarti a scoprire le nostre collezioni esclusive, verificare le opzioni di consegna o tracciare un ordine.';
        } else if (detectedLang.lang === 'hi') {
            greetingText = 'नमस्ते! Nexora लग्जरी फैशन में आपका स्वागत है। आज हम आपकी क्या मदद कर सकते हैं? आप हमारे नए संग्रह देख सकते हैं या ऑर्डर और डिलीवरी के बारे में पूछ सकते हैं।';
        } else {
            greetingText = 'Welcome to Nexora. How may I assist you today? Feel free to explore our curated collections, inquire about your orders, or ask about our shipping and store policies.';
        }

        return await sendChatResponse({
            success: true,
            message: greetingText,
            language: detectedLang,
            intent,
            products: [],
            order: null,
            quickReplies: ['Browse Catalog', 'Shipping Policy', 'Guest Checkout', 'Track Order'],
            verifiedSource: 'concierge_greeting'
        });
    }

    // ----------------------------------------------------
    // SCENARIO 2: GUEST CHECKOUT / ACCOUNT REQUIREMENTS
    // Verified Grounding: app/checkout/page.js requires login; guest checkout is disallowed.
    // ZERO order cards, ZERO order fetching, ZERO tracking.
    // ----------------------------------------------------
    if (intent === 'guest_checkout') {
        const responseText = multilingualService.getGuestCheckoutResponse(detectedLang);

        return await sendChatResponse({
            success: true,
            message: responseText,
            language: detectedLang,
            intent,
            products: [],
            order: null, // Strictly null: never return order cards or customer orders
            requiresAuth: false,
            quickReplies: ['Sign In / Register', 'Browse Collections', 'Payment Methods', 'Shipping Details'],
            verifiedSource: 'store_policy'
        });
    }

    // ----------------------------------------------------
    // SCENARIO 3: AMBIGUOUS OR VAGUE INQUIRIES (e.g. "Order ta?", "দাম কত?")
    // Clarifies intent before attempting any database operations.
    // ----------------------------------------------------
    if (intent === 'ambiguous_request') {
        const responseText = multilingualService.getAmbiguousResponse(detectedLang);

        return await sendChatResponse({
            success: true,
            message: responseText,
            language: detectedLang,
            intent,
            products: [],
            order: null,
            quickReplies: ['Track Order', 'Store Policies', 'Browse Collection'],
            verifiedSource: 'clarification'
        });
    }

    // ----------------------------------------------------
    // SCENARIO 4: ORDER CANCELLATION
    // Explains cancellation window & status requirements deterministically.
    // ----------------------------------------------------
    if (intent === 'order_cancellation') {
        const responseText = multilingualService.getOrderCancellationResponse(detectedLang);

        return await sendChatResponse({
            success: true,
            message: responseText,
            language: detectedLang,
            intent,
            products: [],
            order: null,
            quickReplies: ['Contact Concierge', 'Track Order', 'Return Policy'],
            verifiedSource: 'store_policy'
        });
    }

    // ----------------------------------------------------
    // SCENARIO 5: ORDER TRACKING (STRICT AUTHORIZATION & PRIVACY)
    // ----------------------------------------------------
    if (intent === 'order_tracking') {
        const verifiedSource = 'order_service';
        if (!customer) {
            // Unauthenticated guest requesting private order details
            let guestMsg = '';
            if (detectedLang.lang === 'bn' || detectedLang.lang === 'banglish') {
                guestMsg = 'আপনার অর্ডারের বর্তমান অবস্থা এবং বিস্তারিত জানতে অনুগ্রহ করে আপনার Nexora অ্যাকাউন্টে লগইন করুন। গ্রাহকের তথ্যের সুরক্ষার জন্য লগইন ছাড়া কোনো ব্যক্তিগত অর্ডার তথ্য প্রকাশ করা হয় না।';
            } else if (detectedLang.lang === 'it') {
                guestMsg = 'Per visualizzare lo stato e i dettagli del tuo ordine in modo sicuro, accedi al tuo account Nexora. La privacy dei tuoi ordini è protetta.';
            } else if (detectedLang.lang === 'hi') {
                guestMsg = 'अपने ऑर्डर की स्थिति और विवरण देखने के लिए कृपया अपने Nexora खाते में लॉगिन करें। सुरक्षा कारणों से बिना प्रमाणीकरण के ऑर्डर विवरण नहीं दिखाए जाते हैं।';
            } else {
                guestMsg = 'To track and view your order details securely, please sign in to your Nexora account. We keep all customer order information strictly confidential.';
            }

            return await sendChatResponse({
                success: true,
                message: guestMsg,
                language: detectedLang,
                intent,
                products: [],
                order: null,
                requiresAuth: true,
                quickReplies: ['Sign In', 'Browse Catalog', 'Shipping Policy'],
                verifiedSource
            });
        }

        // Authenticated customer: fetch only their authorized orders
        const orderResult = await orderQueryService.getCustomerOrder({
            customerId: customer._id,
            orderId: orderIdCandidate,
            isExplicitTracking: true
        });

        let responseText = '';
        let orderPayload = null;
        let quickReplies = ['Browse Catalog', 'Contact Concierge'];

        if (!orderResult.found) {
            responseText = orderResult.message;
        } else {
            orderPayload = orderResult.primaryOrder;
            const status = orderPayload.orderStatus;
            const orderId = orderPayload.orderId;
            const total = orderPayload.totalAmount;

            if (detectedLang.lang === 'bn' || detectedLang.lang === 'banglish') {
                responseText = `আপনার অর্ডার #${orderId} পাওয়া গেছে। বর্তমান স্ট্যাটাস: "${status}"। সর্বমোট মূল্য: $${total}। ট্র্যাকিং নম্বর: ${orderPayload.trackingNumber}।`;
            } else if (detectedLang.lang === 'it') {
                responseText = `Abbiamo trovato il tuo ordine #${orderId}. Lo stato attuale è: "${status}". Totale: $${total}. Numero di tracciamento: ${orderPayload.trackingNumber}.`;
            } else if (detectedLang.lang === 'hi') {
                responseText = `आपका ऑर्डर #${orderId} मिल गया है। वर्तमान स्थिति: "${status}" है। कुल राशि: $${total}। ट्रैकिंग संख्या: ${orderPayload.trackingNumber}।`;
            } else {
                responseText = `We located your order #${orderId}. Current status is: "${status}". Total: $${total}. Tracking number: ${orderPayload.trackingNumber}.`;
            }
            quickReplies = ['Track another order', 'Shipping Policy', 'Contact Concierge'];
        }

        return await sendChatResponse({
            success: true,
            message: responseText,
            language: detectedLang,
            intent,
            products: [],
            order: orderPayload,
            quickReplies,
            verifiedSource
        });
    }

    // ----------------------------------------------------
    // SCENARIO 6: STORE POLICIES & FAQ (AUTHORITATIVE)
    // ----------------------------------------------------
    if (intent.startsWith('policy_')) {
        const verifiedSource = 'store_policy';
        let policyCategory = 'general';
        if (intent === 'policy_shipping') policyCategory = 'shipping';
        else if (intent === 'policy_returns') policyCategory = 'returns';
        else if (intent === 'policy_payment') policyCategory = 'payment';
        else if (intent === 'policy_contact') policyCategory = 'contact';
        else if (intent === 'policy_discount') policyCategory = 'discounts';

        const policyFact = getPolicyAnswer(policyCategory);

        // Synthesize polite response using LLM or deterministic fallback
        const promptMessages = [
            {
                role: 'system',
                content: `You are the concierge AI for Nexora, a luxury fashion house.
${languageInstructions}
Authoritative Policy Fact: "${policyFact}"
Instructions:
- Explain this policy clearly to the customer in their language.
- Do NOT alter any numeric figures (e.g. $200 threshold, 3-5 business days, 30-day return).
- Keep the tone polite, elegant, and concise.`
            },
            ...effectiveHistory,
            { role: 'user', content: rawMessage }
        ];

        let responseText = policyFact;
        const aiResponse = await ollamaService.chat(promptMessages, { temperature: 0.3, maxTokens: 250 });
        if (aiResponse.success && aiResponse.content) {
            responseText = aiResponse.content;
        }

        const quickReplies = ['Browse Catalog', 'Shipping Details', 'Return Policy', 'Contact Concierge'];

        return await sendChatResponse({
            success: true,
            message: responseText,
            language: detectedLang,
            intent,
            products: [],
            order: null,
            quickReplies,
            verifiedSource
        });
    }

    // ----------------------------------------------------
    // SCENARIO 7: PRODUCT SEARCH, VARIANTS, AVAILABILITY, & COMPARISONS (MONGODB)
    // ----------------------------------------------------
    const verifiedSource = 'mongodb';

    // Check for follow-up query context (e.g. size check, color shift)
    const followUp = conversationContextManager.resolveFollowUp(rawMessage, intent, previousContext);
    const parsedIntent = parseProductSearchIntent(rawMessage);

    // Merge follow-up context if applicable
    if (followUp.isFollowUp) {
        if (followUp.categorySlug && !parsedIntent.categorySlug) {
            parsedIntent.categorySlug = followUp.categorySlug;
        }
        if (followUp.color && !parsedIntent.color) {
            parsedIntent.color = followUp.color;
        }
        if (followUp.size && !parsedIntent.size) {
            parsedIntent.size = followUp.size;
        }
    }

    // Search verified MongoDB products using parsed structured filters
    let productsPayload = await productQueryService.searchProducts({
        query: parsedIntent.cleanQuery,
        category: parsedIntent.categorySlug,
        color: parsedIntent.color,
        size: parsedIntent.size,
        minPrice: parsedIntent.minPrice,
        maxPrice: parsedIntent.maxPrice,
        limit: 6
    });

    // If no products found with exact combination, relax text query while retaining category/price/color/size
    if (productsPayload.length === 0 && (parsedIntent.categorySlug || parsedIntent.color || parsedIntent.size || parsedIntent.maxPrice)) {
        productsPayload = await productQueryService.searchProducts({
            category: parsedIntent.categorySlug,
            color: parsedIntent.color,
            size: parsedIntent.size,
            minPrice: parsedIntent.minPrice,
            maxPrice: parsedIntent.maxPrice,
            limit: 6
        });
    }

    // Build LLM context from verified products only
    let productFactsText = '';
    if (productsPayload.length > 0) {
        productFactsText = productsPayload.map((p, idx) => {
            const sizeList = (p.sizes || []).filter(s => s.inStock).map(s => s.size).join(', ') || 'Standard';
            return `${idx + 1}. "${p.title}" | Price: $${p.price} (Final: $${p.finalPrice}) | Category: ${p.category} | Brand: ${p.brand} | In Stock: ${p.inStock ? 'Yes' : 'No'} | Colors: ${p.colors.join(', ') || 'Standard'} | Available Sizes: ${sizeList}`;
        }).join('\n');
    }

    let comparisonInstruction = '';
    if (intent === 'product_comparison') {
        comparisonInstruction = '\nThe customer is asking for a comparison or to find the cheapest item. Explicitly compare their prices and highlight the most budget-friendly or suitable piece among the verified items.';
    }

    const systemPrompt = `You are the customer assistant for Nexora Luxury Atelier.
${languageInstructions}

STRICT GROUNDING RULES:
1. The database source of truth returned ${productsPayload.length} verified products:
${productFactsText || 'No matching products were found in the database.'}

2. You must NEVER invent or hallucinate product titles, prices, discounts, stock, or URLs.
3. If no matching products were found, politely inform the customer and invite them to explore our other curated collections.
4. Present the verified items gracefully in the customer's language. Mention prices using the dollar sign ($) as verified in the catalog.${comparisonInstruction}
5. Keep your response concise, polite, and helpful.`;

    const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...effectiveHistory,
        { role: 'user', content: rawMessage }
    ];

    const aiResult = await ollamaService.chat(aiMessages, { temperature: 0.4, maxTokens: 400 });

    let responseText = '';
    if (aiResult.success && aiResult.content) {
        responseText = aiResult.content;
    } else {
        // Deterministic multilingual fallback if Ollama is unreachable
        if (productsPayload.length > 0) {
            if (detectedLang.lang === 'bn' || detectedLang.lang === 'banglish') {
                responseText = `আমরা আপনার পছন্দের সাথে মানানসই ${productsPayload.length}টি পণ্য পেয়েছি। নিচে তালিকাভুক্ত পণ্যগুলো দেখুন:`;
            } else if (detectedLang.lang === 'it') {
                responseText = `Abbiamo trovato ${productsPayload.length} articoli per la tua richiesta. Eccoli di seguito:`;
            } else if (detectedLang.lang === 'hi') {
                responseText = `हमें आपके अनुरोध के अनुसार ${productsPayload.length} उत्पाद मिले हैं। नीचे विवरण देखें:`;
            } else {
                responseText = `Here are ${productsPayload.length} verified pieces matching your selection from our collection:`;
            }
        } else {
            if (detectedLang.lang === 'bn' || detectedLang.lang === 'banglish') {
                responseText = 'দুঃখিত, আপনার নির্দিষ্ট রিকোয়েস্ট অনুযায়ী কোনো পণ্য পাওয়া যায়নি। অনুগ্রহ করে অন্য কোনো ক্যাটাগরি বা বাজেটে খুঁজে দেখুন।';
            } else if (detectedLang.lang === 'it') {
                responseText = 'Siamo spiacenti, non abbiamo trovato articoli corrispondenti alla tua ricerca. Prova a regolare i criteri di filtro.';
            } else if (detectedLang.lang === 'hi') {
                responseText = 'क्षমা करें, आपके अनुरोध से मेल खाने वाला कोई उत्पाद नहीं मिला। कृपया अपने मानदंड बदलकर पुनः प्रयास करें।';
            } else {
                responseText = 'We could not find any products matching those specific criteria. Would you like to explore another collection or price range?';
            }
        }
    }

    const quickReplies = [
        'Blazers & Tailoring',
        'T-Shirts under $100',
        'Footwear collection',
        'Shipping & Returns'
    ];

    return await sendChatResponse({
        success: true,
        message: responseText,
        language: detectedLang,
        intent,
        products: productsPayload,
        order: null,
        quickReplies,
        verifiedSource,
        modelUsed: aiResult.model || 'deterministic-engine'
    });
});

/**
 * Start a fresh conversation (New Chat) with isolated context
 */
export const startNewChat = asyncHandler(async (req, res) => {
    const customer = req.customer;
    const newSessionId = crypto.randomUUID();

    let conversation = null;
    if (customer) {
        conversation = await Conversation.create({
            customer: customer._id,
            sessionId: newSessionId,
            title: 'New Consultation',
            messages: []
        });
    }

    res.status(200).json({
        success: true,
        message: 'New conversation started',
        conversationId: conversation?._id || null,
        sessionId: newSessionId
    });
});

/**
 * List customer conversations with ownership isolation
 */
export const getCustomerConversations = asyncHandler(async (req, res) => {
    const customer = req.customer;
    if (!customer) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required to view conversations.',
            conversations: []
        });
    }

    const conversations = await Conversation.find({
        customer: customer._id,
        isActive: true
    })
        .select('_id sessionId title lastMessageAt createdAt messages')
        .sort({ lastMessageAt: -1 })
        .limit(30)
        .lean();

    const formatted = conversations.map(c => {
        const lastMsg = c.messages?.[c.messages.length - 1];
        return {
            id: c._id,
            sessionId: c.sessionId,
            title: c.title || 'Consultation',
            lastMessageAt: c.lastMessageAt || c.createdAt,
            messageCount: c.messages?.length || 0,
            preview: lastMsg?.content ? lastMsg.content.slice(0, 80) : ''
        };
    });

    res.status(200).json({
        success: true,
        conversations: formatted
    });
});

/**
 * Retrieve single conversation by ID with strict customer ownership check
 */
export const getConversationById = asyncHandler(async (req, res) => {
    const customer = req.customer;
    const { id } = req.params;

    if (!customer) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required to view conversation.'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid conversation ID format.'
        });
    }

    // Strict customer isolation: query includes customer._id
    const conversation = await Conversation.findOne({
        _id: id,
        customer: customer._id,
        isActive: true
    }).lean();

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: 'Conversation not found or access denied.'
        });
    }

    res.status(200).json({
        success: true,
        conversation: {
            id: conversation._id,
            sessionId: conversation.sessionId,
            title: conversation.title,
            messages: conversation.messages,
            lastMessageAt: conversation.lastMessageAt,
            createdAt: conversation.createdAt
        }
    });
});

/**
 * Soft delete single conversation with ownership verification
 */
export const deleteConversation = asyncHandler(async (req, res) => {
    const customer = req.customer;
    const { id } = req.params;

    if (!customer) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid conversation ID format.'
        });
    }

    const result = await Conversation.findOneAndUpdate(
        { _id: id, customer: customer._id, isActive: true },
        { isActive: false },
        { new: true }
    );

    if (!result) {
        return res.status(404).json({
            success: false,
            message: 'Conversation not found or access denied.'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully.'
    });
});

/**
 * Clear all conversations for authenticated customer
 */
export const clearCustomerConversations = asyncHandler(async (req, res) => {
    const customer = req.customer;
    if (!customer) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    await Conversation.updateMany(
        { customer: customer._id, isActive: true },
        { isActive: false }
    );

    res.status(200).json({
        success: true,
        message: 'All conversations cleared successfully.'
    });
});

/**
 * Health check endpoint for chatbot & Ollama connectivity
 */
export const getChatbotHealth = asyncHandler(async (req, res) => {
    const health = await ollamaService.checkHealth();
    res.status(200).json({
        success: true,
        service: 'Nexora AI Chatbot Engine',
        timestamp: new Date().toISOString(),
        ollama: health
    });
});
