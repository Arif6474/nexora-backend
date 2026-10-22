/**
 * High-precision language and writing style detector for multilingual customer support.
 * Supports: English, Bengali (বাংলা), Banglish (Latin Bengali), Italian (Italiano), and Hindi (हिन्दी).
 */

const BANGLISH_PATTERNS = [
    /\b(ache|achhe|achee|koto|dam|daam|taka|takar|moddhe|moddhey|dekhaw|dekhao|dekhaben)\b/i,
    /\b(lagbe|dorkar|chai|hobe|ki|kono|apnader|amader|ei|eta|oita|kothay|shobcheye)\b/i,
    /\b(kalo|shada|laal|neel|kom|beshi|valo|bhalo|notun|puran|pabo|parbo|chara|krte|korte|korbo|kinte)\b/i,
    /\b(koto taka|takar vitore|kalo ronger|shart|tshirt ache|order krte|order korte|order pabo)\b/i
];

const ITALIAN_PATTERNS = [
    /\b(ciao|buongiorno|buonasera|grazie|prego|avete|quanto|costa|costano|prezzo)\b/i,
    /\b(maglietta|magliette|camicia|camicie|vestito|abito|pantaloni|scarpe|nero|nera|neri|nere)\b/i,
    /\b(spedizione|consegna|reso|rimborso|ordine|dov'è|dove si trova|posso|vorrei|sotto i)\b/i,
    /\b(per favore|disponibile|disponibili|taglia|colore|qualità|senza|effettuare|annullare)\b/i
];

export class MultilingualService {
    /**
     * Detects language and script of incoming text.
     * @param {string} text
     * @returns {{ lang: 'en'|'bn'|'banglish'|'it'|'hi', name: string, script: string, targetLanguageName: string }}
     */
    detectLanguage(text = '') {
        if (!text || typeof text !== 'string') {
            return { lang: 'en', name: 'English', script: 'Latin', targetLanguageName: 'English' };
        }

        const trimmed = text.trim();

        // 1. Bengali script check (U+0980 to U+09FF)
        const bengaliCharCount = (trimmed.match(/[\u0980-\u09FF]/g) || []).length;
        if (bengaliCharCount >= 2) {
            return {
                lang: 'bn',
                name: 'Bengali',
                script: 'Bengali',
                targetLanguageName: 'Bengali (বাংলা)'
            };
        }

        // 2. Devanagari script check (U+0900 to U+097F)
        const devanagariCharCount = (trimmed.match(/[\u0900-\u097F]/g) || []).length;
        if (devanagariCharCount >= 2) {
            return {
                lang: 'hi',
                name: 'Hindi',
                script: 'Devanagari',
                targetLanguageName: 'Hindi (हिन्दी)'
            };
        }

        // 3. Banglish check (Latin Bengali)
        const isBanglish = BANGLISH_PATTERNS.some(regex => regex.test(trimmed));
        if (isBanglish) {
            return {
                lang: 'banglish',
                name: 'Banglish',
                script: 'Latin',
                targetLanguageName: 'Bengali'
            };
        }

        // 4. Italian check
        const isItalian = ITALIAN_PATTERNS.some(regex => regex.test(trimmed));
        if (isItalian) {
            return {
                lang: 'it',
                name: 'Italian',
                script: 'Latin',
                targetLanguageName: 'Italian (Italiano)'
            };
        }

        // Default to English
        return {
            lang: 'en',
            name: 'English',
            script: 'Latin',
            targetLanguageName: 'English'
        };
    }

    /**
     * Constructs prompt instructions to enforce language consistency and factual fidelity.
     */
    getLanguagePromptInstructions(detectedLang) {
        switch (detectedLang.lang) {
            case 'bn':
                return `CUSTOMER LANGUAGE: BENGALI (বাংলা).
Respond completely in natural, elegant, polite Bengali using standard Bengali script (বাংলা লিপি).
Preserve all product titles, brand names, model numbers, order IDs, URLs, and numeric currency values (e.g. $100 or ৳) exactly as provided. Do not translate brand or product names.`;
            case 'banglish':
                return `CUSTOMER LANGUAGE: BANGLISH (Bengali written in English letters).
The customer asked in Banglish. By default, respond warmly in natural Bengali using standard Bengali script (বাংলা লিপি).
If the customer explicitly asked for English or Latin script, write in natural conversational Banglish.
Preserve product names, brand names, URLs, order IDs, and exact numeric prices.`;
            case 'it':
                return `CUSTOMER LANGUAGE: ITALIAN (Italiano).
Respond completely in fluent, courteous Italian suitable for a luxury fashion house.
Preserve exact product names, brand names, order numbers, URLs, and prices.`;
            case 'hi':
                return `CUSTOMER LANGUAGE: HINDI (हिन्दी).
Respond completely in polite, natural Hindi using Devanagari script (हिन्दी).
Preserve exact product titles, brand names, order IDs, URLs, and numeric prices.`;
            case 'en':
            default:
                return `CUSTOMER LANGUAGE: ENGLISH.
Respond in refined, polite, helpful English suitable for an upscale fashion e-commerce brand.
Keep prices, brand names, and URLs factual and unaltered.`;
        }
    }

    /**
     * Deterministic response for Guest Checkout questions
     */
    getGuestCheckoutResponse(detectedLang) {
        switch (detectedLang.lang) {
            case 'bn':
            case 'banglish':
                return "Nexora-তে অর্ডার সম্পন্ন করতে অ্যাকাউন্টে লগইন থাকা বাধ্যতামূলক। লগইন ছাড়া গেস্ট হিসেবে সরাসরি অর্ডার করার সুবিধা বর্তমানে নেই। আপনি চেকআউটের সময় সহজে ইমেইল অথবা গুগল অ্যাকাউন্ট দিয়ে লগইন বা রেজিস্টার করে অর্ডার সম্পন্ন করতে পারেন।";
            case 'it':
                return "Su Nexora è necessario accedere a un account per effettuare un ordine. Al momento il checkout come ospite senza effettuare l'accesso non è supportato. Puoi accedere o registrarti facilmente con la tua email o account Google durante il checkout.";
            case 'hi':
                return "Nexora पर ऑर्डर देने के लिए अकाउंट में लॉगिन करना अनिवार्य है। बिना लॉगिन किए सीधे ऑर्डर करने की सुविधा वर्तमान में उपलब्ध नहीं है। आप चेकआउट के समय अपने ईमेल या गूगल अकाउंट से आसानी से लॉगिन या रजिस्टर करके ऑर्डर पूरा कर सकते हैं।";
            case 'en':
            default:
                return "At Nexora, an account is required to place an order. Guest checkout without logging in is currently not supported. You can easily sign in or register with your email or Google account during checkout to complete your purchase.";
        }
    }

    /**
     * Deterministic response for Ambiguous or Vague queries
     */
    getAmbiguousResponse(detectedLang) {
        switch (detectedLang.lang) {
            case 'bn':
            case 'banglish':
                return "আপনার অনুরোধটি কি একটু বিস্তারিত বলবেন? আপনি কি কোনো নির্দিষ্ট অর্ডার ট্র্যাক করতে চান, নতুন অর্ডার দিতে চান, নাকি আমাদের কালেকশন বা পলিসি সম্পর্কে জানতে চান?";
            case 'it':
                return "Potresti chiarire la tua richiesta? Desideri tracciare un ordine esistente, avere informazioni su un prodotto o conoscere le nostre politiche di spedizione?";
            case 'hi':
                return "क्या आप अपने अनुरोध को थोड़ा और स्पष्ट कर सकते हैं? क्या आप किसी मौजूदा ऑर्डर को ट्रैक करना चाहते हैं, या हमारे संग्रह और नीतियों के बारे में जानना चाहते हैं?";
            case 'en':
            default:
                return "Could you please provide a few more details? Are you looking to track an existing order, explore a specific collection, or ask about our store policies?";
        }
    }

    /**
     * Deterministic response for Order Cancellation
     */
    getOrderCancellationResponse(detectedLang) {
        switch (detectedLang.lang) {
            case 'bn':
            case 'banglish':
                return "অর্ডার শুধুমাত্র 'Pending' অবস্থায় থাকা অবস্থাতেই বাতিল করা সম্ভব। প্রসেসিং বা শিপিং শুরু হয়ে গেলে সরাসরি বাতিল করা যায় না। আপনার অর্ডার বাতিল করার জন্য অনুগ্রহ করে অর্ডার আইডি সহ hello@nexora.com এ দ্রুত যোগাযোগ করুন।";
            case 'it':
                return "Gli ordini possono essere annullati solo mentre sono nello stato 'Pending', prima dell'elaborazione o della spedizione. Per richiedere l'annullamento, contatta tempestivamente hello@nexora.com indicando il tuo ID ordine.";
            case 'hi':
                return "ऑर्डर केवल तभी रद्द किए जा सकते हैं जब उनकी स्थिति 'Pending' हो। प्रोसेसिंग या शिपिंग शुरू होने के बाद उन्हें रद्द नहीं किया जा सकता। रद्दीकरण अनुरोध के लिए कृपया अपनी ऑर्डर आईडी के साथ hello@nexora.com पर तुरंत संपर्क करें।";
            case 'en':
            default:
                return "Orders can only be cancelled while their status is 'Pending', before processing and fulfillment begins. To request a cancellation, please email hello@nexora.com with your Order ID as soon as possible.";
        }
    }
}

export const multilingualService = new MultilingualService();
export default multilingualService;
