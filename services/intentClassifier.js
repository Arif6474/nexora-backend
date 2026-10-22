/**
 * Robust Multilingual Intent Classifier for Nexora AI Assistant.
 * Accurately routes customer inquiries across English, Bengali, Banglish, Italian, and Hindi.
 */

// Explicit Allowlist of Supported System Intents
export const SYSTEM_INTENTS = [
    'greeting',
    'guest_checkout',
    'order_tracking',
    'order_cancellation',
    'policy_shipping',
    'policy_returns',
    'policy_payment',
    'policy_contact',
    'policy_discount',
    'ambiguous_request',
    'product_comparison',
    'product_availability',
    'product_search',
    'general'
];

// Patterns for Guest Checkout / Account Requirements
const GUEST_CHECKOUT_PATTERNS = [
    // English
    /\b(order without (?:login|log in|logging in|account|signing in)|buy without (?:login|log in|logging in|account)|guest checkout|checkout as (?:a )?guest|do i need (?:an )?account to (?:order|buy)|can i (?:order|buy|purchase) without (?:an? )?(?:account|login|log in|logging in)|without (?:an? )?(?:account|login|log in|logging in|signing in))\b/i,
    // Banglish
    /\b(login\s+(?:kra\s+)?chara\s+(?:order|kinte|buy)|account\s+chara\s+(?:order|kinte)|sign\s*in\s+chara\s+order|guest\s+checkout\s+kora\s+jabe|login\s+na\s+kore\s+order)\b/i,
    // Bengali (Unicode)
    /(?:লগইন|লগ ইন|একাউন্ট|অ্যাকাউন্ট)\s*(?:ছাড়া|ছাড়া|না\s*করে)\s*(?:অর্ডার|কেনাকাটা|কিনতে|নেওয়া)/u,
    /(?:গেস্ট|অতিথি)\s*চেকআউট/u,
    // Italian
    /\b(ordinare senza (?:account|login|registrazione|accesso)|effettuare (?:un )?ordine senza (?:account|login|accesso)|senza effettuare l'accesso|checkout ospite|acquistare senza (?:account|login))\b/i,
    // Hindi (Unicode)
    /(?:लॉगिन|अकाउंट|खाता)\s*(?:किए\s*बिना|के\s*बिना|बिना)\s*(?:ऑर्डर|खरीदारी)/u,
    /(?:गेस्ट|अतिथि)\s*चेकआउट/u
];

// Patterns for Explicit Order Tracking (Requires tracking intent or explicit Order ID)
const ORDER_TRACKING_PATTERNS = [
    // English
    /\b(where is my order|track (?:my )?order|order status|track shipment|check my order|has my order (?:been )?shipped|order delivery status|when will my order (?:arrive|deliver))\b/i,
    // Banglish
    /\b(amar\s+order\s+kothay|order\s+kobe\s+(?:ashbe|pabo)|order\s+(?:er\s+)?status|order\s+track|order\s+kothay\s+ache)\b/i,
    // Bengali (Unicode)
    /(?:আমার\s+)?অর্ডার\s*(?:কোথায়|কবে\s*(?:পাবো|পাব|আসবে)|স্ট্যাটাস|ট্র্যাক|ট্র্যাকিং)/u,
    // Italian
    /\b(dov'è (?:il mio )?ordine|tracciare (?:l'|il mio )?ordine|stato (?:del|dell')?ordine|quando arriva (?:il mio )?ordine|il mio ordine è (?:stato )?spedito)\b/i,
    // Hindi (Unicode)
    /(?:मेरा\s+)?ऑर्डर\s*(?:कहाँ\s+है|कब\s+आएगा|ट्रैक|की\s+स्थिति)/u
];

// Patterns for Order Cancellation
const ORDER_CANCELLATION_PATTERNS = [
    // English
    /\b(cancel (?:my )?order|order cancellation|how (?:can|do) i cancel (?:my )?order|want to cancel order)\b/i,
    // Banglish
    /\b(order\s+(?:cancel|batil)\s+(?:korte|korbo|chai)|amar\s+order\s+cancel)\b/i,
    // Bengali (Unicode)
    /অর্ডার\s*(?:বাতিল|ক্যান্সেল)/u,
    // Italian
    /\b(annullare (?:il mio )?ordine|cancellare (?:il mio )?ordine|annullamento ordine)\b/i,
    // Hindi (Unicode)
    /ऑर्डर\s*(?:रद्द|कैंसिल)/u
];

// Ambiguous single-token questions (e.g., "Order ta?", "দাম কত?", "price?")
const AMBIGUOUS_PATTERNS = [
    /^(?:order\s*ta\??|order\??|amar\s*order\??|অর্ডার\s*টা\??|অর্ডার\??|ordine\??)$/i,
    /^(?:eta\??|oita\??|eta\s*koto\??|koto\??|price\??|dam\s*koto\??|দাম\s*কত\??|prezzo\??)$/i
];

// Greetings across 5 languages
const GREETING_PATTERNS = [
    /^(?:hi|hello|hey|greetings|good\s+(?:morning|afternoon|evening)|howdy)\b/i,
    /^(?:নমস্কার|হ্যালো|সালাম|আসসালামু\s*আলাইকুম|কেমন\s*আছেন)/u,
    /^(?:kemon\s*acho|kemon\s*achen|assalamu\s*alaikum|salam|helo)\b/i,
    /^(?:ciao|buongiorno|buonasera|salve)\b/i,
    /^(?:नमस्ते|नमस्कार|प्रणाम|हेलो)\b/u
];

export class IntentClassifier {
    /**
     * Classifies the intent of a customer message with high precision.
     * @param {string} text
     * @param {Object} context
     * @returns {{ intent: string, orderIdCandidate: string|null, confidence: number }}
     */
    classify(text = '', context = {}) {
        const raw = (text || '').trim();
        const lower = raw.toLowerCase();

        // 1. Check for explicit Order ID (e.g. SM0503263SNAT)
        const orderIdMatch = raw.match(/\b(SM[A-Z0-9]{8,16})\b/);
        const orderIdCandidate = orderIdMatch ? orderIdMatch[1] : null;

        // 2. Ambiguous query check
        for (const pattern of AMBIGUOUS_PATTERNS) {
            if (pattern.test(raw)) {
                return { intent: 'ambiguous_request', orderIdCandidate, confidence: 0.95 };
            }
        }

        // 3. Guest Checkout / Account Requirements check (BEFORE any order check!)
        for (const pattern of GUEST_CHECKOUT_PATTERNS) {
            if (pattern.test(raw)) {
                return { intent: 'guest_checkout', orderIdCandidate: null, confidence: 0.99 };
            }
        }

        // 4. Order Cancellation check
        for (const pattern of ORDER_CANCELLATION_PATTERNS) {
            if (pattern.test(raw)) {
                return { intent: 'order_cancellation', orderIdCandidate, confidence: 0.98 };
            }
        }

        // 5. Order Tracking check (must have tracking phrase OR explicit Order ID)
        const hasTrackingPhrase = ORDER_TRACKING_PATTERNS.some(p => p.test(raw));
        if (hasTrackingPhrase || (orderIdCandidate && !/cancel/i.test(lower))) {
            return { intent: 'order_tracking', orderIdCandidate, confidence: 0.95 };
        }

        // 6. Payment Policy
        if (/payment|cod|credit card|debit card|cash on delivery|pagamento|পেমেন্ট|টাকা দেব|भुगतान|ক্যাশ অন ডেলিভারি/i.test(raw)) {
            return { intent: 'policy_payment', orderIdCandidate: null, confidence: 0.92 };
        }

        // 7. Returns & Refunds Policy
        if (/return|refund|exchange|reso|rimborso|ফেরত|রিটার্ন|বদল|वापसी|रिफंड/i.test(raw)) {
            return { intent: 'policy_returns', orderIdCandidate: null, confidence: 0.92 };
        }

        // 8. Shipping & Delivery Policy
        if (/shipping|delivery charges|delivery cost|shipping fee|delivery time|spedizione|consegna|শিপিং|ডেলিভারি চার্জ|ডেলিভারি খরচ|डिलीवरी शुल्क|शिपिंग शुल्क/i.test(raw)) {
            return { intent: 'policy_shipping', orderIdCandidate: null, confidence: 0.92 };
        }

        // 9. Contact & Store Studio Details
        if (/contact|phone number|email support|studio address|office address|opening hours|contatto|যোগাযোগ|ঠিকানা|ফোন নাম্বার|ইমেইল|संपर्क|पता/i.test(raw)) {
            return { intent: 'policy_contact', orderIdCandidate: null, confidence: 0.92 };
        }

        // 10. Discounts & Promo Codes
        if (/discount|promo code|coupon|voucher|offer|ছাড়|ডিসকাউন্ট|কুপন|promozione|sconto|छूट|कूपन/i.test(raw)) {
            return { intent: 'policy_discount', orderIdCandidate: null, confidence: 0.90 };
        }

        // 11. Greeting check
        for (const pattern of GREETING_PATTERNS) {
            if (pattern.test(raw)) {
                return { intent: 'greeting', orderIdCandidate: null, confidence: 0.90 };
            }
        }

        // 12. Product Comparison
        if (/\b(compare|which is cheaper|cheapest|better|কোনটি সস্তা|সবচেয়ে সস্তা|quale costa meno|qual è più economico|तुलना|सबसे सस्ता)\b/i.test(raw)) {
            return { intent: 'product_comparison', orderIdCandidate: null, confidence: 0.88 };
        }

        // 13. Product Availability / Size Check
        if (/\b(available in size|have size|in stock|size m|size l|size s|size 40|size 42|স্টকে আছে|সাইজ আছে|disponibile in taglia|साइज उपलब्ध)\b/i.test(raw)) {
            return { intent: 'product_availability', orderIdCandidate: null, confidence: 0.88 };
        }

        // 14. Product Search (default for shopping queries)
        return { intent: 'product_search', orderIdCandidate: null, confidence: 0.80 };
    }
}

export const intentClassifier = new IntentClassifier();
export default intentClassifier;
