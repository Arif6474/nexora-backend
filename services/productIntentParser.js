/**
 * Multilingual Product Intent & Entity Extractor.
 * Correctly handles Unicode character boundaries for Bengali, Hindi, and Latin scripts.
 */

// Category patterns with Unicode-safe boundaries
const CATEGORY_MAP = [
    {
        slug: 'blazers-tailoring',
        patterns: [
            /(?:^|[\s\p{P}])(blazer|blazers|tailoring|suit|jacket|giacca|giacche|ব্লেজার|ब्लेज़र|blezar)(?:$|[\s\p{P}])/iu,
            /ব্লেজার/u,
            /ब्लेज़र/u
        ]
    },
    {
        slug: 'coats-outerwear',
        patterns: [
            /(?:^|[\s\p{P}])(coat|coats|trench|overcoat|parka|puffer|shearling|cappotto|cappotti|outerwear)(?:$|[\s\p{P}])/iu,
            /কোট/u,
            /कोट/u
        ]
    },
    {
        slug: 't-shirt',
        patterns: [
            /(?:^|[\s\p{P}])(t-shirt|tshirt|t-shirts|tshirts|tee|tees|crewneck|tank top|maglietta|magliette)(?:$|[\s\p{P}])/iu,
            /টি-শার্ট|টি শার্ট|টিশার্ট|টি-সার্ট/u,
            /टी-शर्ट|टी शर्ट|टीशर्ट/u
        ]
    },
    {
        slug: 'shirts-blouses',
        patterns: [
            /(?:^|[\s\p{P}])(shirt|shirts|blouse|blouses|poplin|camicia|camicie|shart)(?:$|[\s\p{P}])/iu,
            /শার্ট/u,
            /कमीज|शर्ट/u
        ]
    },
    {
        slug: 'dresses-gowns',
        patterns: [
            /(?:^|[\s\p{P}])(dress|dresses|gown|gowns|midi|slip dress|abito|abiti|vestito|vestiti)(?:$|[\s\p{P}])/iu,
            /ড্রেস|পোশাক/u,
            /गाउन|ड्रेस/u
        ]
    },
    {
        slug: 'knitwear-sweaters',
        patterns: [
            /(?:^|[\s\p{P}])(knit|knitwear|sweater|sweaters|cardigan|cashmere|maglione|maglioni)(?:$|[\s\p{P}])/iu,
            /সোয়েটার|কার্ডিগান/u,
            /स्वेटर/u
        ]
    },
    {
        slug: 'trousers-pants',
        patterns: [
            /(?:^|[\s\p{P}])(trouser|trousers|pant|pants|slacks|culottes|pantaloni|pantalone)(?:$|[\s\p{P}])/iu,
            /প্যান্ট/u,
            /पतलून/u
        ]
    },
    {
        slug: 'footwear',
        patterns: [
            /(?:^|[\s\p{P}])(shoe|shoes|footwear|loafers|derby|boots|sandals|mules|scarpa|scarpe|stivali|sandali)(?:$|[\s\p{P}])/iu,
            /জুতো|জুতা|জুতোজোড়া/u,
            /जूते|जूता/u
        ]
    },
    {
        slug: 'handbags-leather',
        patterns: [
            /(?:^|[\s\p{P}])(bag|bags|handbag|handbags|tote|crossbody|clutch|borsa|borse)(?:$|[\s\p{P}])/iu,
            /ব্যাগ|হ্যান্ডব্যাগ/u,
            /बैग/u
        ]
    },
    {
        slug: 'jewelry-accessories',
        patterns: [
            /(?:^|[\s\p{P}])(jewelry|jewellery|necklace|earring|earrings|ring|rings|bracelet|gioielli|gioiello)(?:$|[\s\p{P}])/iu,
            /গয়না|জুয়েলারি/u,
            /आभूषण/u
        ]
    }
];

// Color mapping across 5 languages
const COLOR_MAP = [
    {
        canonical: 'black',
        searchTerms: ['black', 'noir', 'nero', 'nera', 'neri', 'nere', 'কালো', 'কালা', 'काला', 'काली', 'kala', 'kalo']
    },
    {
        canonical: 'white',
        searchTerms: ['white', 'blanc', 'bianco', 'bianca', 'bianchi', 'bianche', 'সাদা', 'सफेद', 'सफ़ेद', 'shada', 'safed']
    },
    {
        canonical: 'blue',
        searchTerms: ['blue', 'navy', 'blu', 'azzurro', 'নীল', 'নেভি', 'नीला', 'नीली', 'neel']
    },
    {
        canonical: 'brown',
        searchTerms: ['brown', 'camel', 'espresso', 'marrone', 'marroni', 'বাদামী', 'ক্যামেল', 'भूरा', 'खैरा']
    },
    {
        canonical: 'cream',
        searchTerms: ['cream', 'ecru', 'panna', 'avorio', 'ক্রিম', 'क्रीमी']
    },
    {
        canonical: 'green',
        searchTerms: ['green', 'olive', 'verde', 'verdi', 'সবুজ', 'हरा', 'हरी', 'shobuj']
    },
    {
        canonical: 'red',
        searchTerms: ['red', 'rosso', 'rossa', 'rossi', 'লাল', 'लाल', 'laal']
    }
];

// Conversational stop words to remove
const CONVERSATIONAL_STOP_WORDS = [
    // English
    /\b(show me|do you have|i need|i want|find me|find|looking for|can i see|are there|tell me about|what are|please|available|collection|best|pieces|items|under|below|less than|sotto\s+i|over|above|more than|sopra\s+i)\b/gi,
    // Bengali & Banglish
    /(আমাকে দেখান|আমাকে দেখাও|আছে কি|আছে|দেখান|দেখাও|খুঁজে দিন|পাওয়া যাবে|চাই|দরকার|লাগবে|কোনো|আমারে|আমার|হবে|মধ্যে|ভিতরে|কম|বেশি)/gu,
    /\b(ache|achhe|dekhaw|dekhao|dekhaben|lagbe|chai|dorkar|hobe|amake|apnader|kono|pabo|parbo|moddhe|moddhey|vitore|kom|beshi)\b/gi,
    // Italian
    /\b(avete|mostrami|vorrei|cerco|ci sono|per favore|potete mostrarmi|disponibili|disponibile|qualcosa di|sotto|sopra)\b/gi,
    // Hindi
    /(क्या आपके पास|दिखाइए|दिखाओ|चाहिए|मुझे|उपलब्ध है|क्या है|खोजिए|से कम|से अधिक|के नीचे|के अंदर|है)/gu
];

/**
 * Parses raw multilingual message into structured database search filters
 */
export function parseProductSearchIntent(message = '') {
    const raw = (message || '').trim();
    if (!raw) return { categorySlug: null, color: null, minPrice: null, maxPrice: null, cleanQuery: '' };

    // 1. Extract category slug
    let categorySlug = null;
    for (const cat of CATEGORY_MAP) {
        if (cat.patterns.some(p => p.test(raw))) {
            categorySlug = cat.slug;
            break;
        }
    }

    // 2. Extract color
    let detectedColor = null;
    const lower = raw.toLowerCase();
    for (const colorEntry of COLOR_MAP) {
        if (colorEntry.searchTerms.some(term => lower.includes(term.toLowerCase()))) {
            detectedColor = colorEntry.canonical;
            break;
        }
    }

    // 3. Extract price constraints
    // Bengali digits to standard digits
    const normalizedDigits = raw.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));

    let maxPrice = null;
    let minPrice = null;

    // Max price patterns:
    // "under 1000", "1000 takar moddhe", "১০০০ টাকার মধ্যে", "sotto i 1000", "1000 से कम", "300 से कम", "300 takar"
    const maxMatch = normalizedDigits.match(/(?:under|below|less than|sotto\s+i|kom|moddhe|moddhey|vitore|ভিতরে|মধ্যে|কম|कम)\s*(?:[$৳]|taka|takar)?\s*(\d+)/i)
        || normalizedDigits.match(/(\d+)\s*(?:[$৳]|taka|takar|টাকা|टका)?\s*(?:er\s+kom|er\s+moddhe|moddhe|moddhey|takar\s+moddhe|টাকার\s*মধ্যে|থেকে\s*কম|সে\s*কম|से\s*कम|के\s*अंदर|के\s*नीचे|तक)/iu);

    if (maxMatch && maxMatch[1]) {
        maxPrice = parseFloat(maxMatch[1]);
    }

    // Min price patterns: "over 500", "more than 500", "sopra i 500", "500 takar beshi", "500 से अधिक"
    const minMatch = normalizedDigits.match(/(?:over|above|more than|sopra\s+i|beshi|বেশি|অধিক|अधिक)\s*(?:[$৳]|taka|takar)?\s*(\d+)/i)
        || normalizedDigits.match(/(\d+)\s*(?:[$৳]|taka|takar|টাকা|टका)?\s*(?:beshi|বেশি|অধিক|से\s*अधिक|से\s*ज्यादा)/iu);
    if (minMatch && minMatch[1]) {
        minPrice = parseFloat(minMatch[1]);
    }

    // 4. Clean search query
    let cleaned = normalizedDigits
        .replace(/[$৳]|taka|takar|টাকা|टका/gi, ' ')
        .replace(/[?।!.,;:()]/g, ' ')
        .replace(/\b\d+\b/g, ' ');

    for (const stopRegex of CONVERSATIONAL_STOP_WORDS) {
        cleaned = cleaned.replace(stopRegex, ' ');
    }

    // If color was detected, remove color word from clean query
    if (detectedColor) {
        for (const cEntry of COLOR_MAP) {
            for (const term of cEntry.searchTerms) {
                cleaned = cleaned.replace(new RegExp(term, 'gi'), ' ');
            }
        }
    }

    // If category was detected, remove category words from clean query
    if (categorySlug) {
        const cat = CATEGORY_MAP.find(c => c.slug === categorySlug);
        if (cat) {
            for (const p of cat.patterns) {
                cleaned = cleaned.replace(p, ' ');
            }
        }
    }

    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // If category was already detected and the remaining query is short residual particle (e.g. "r", "র", "का"), clear it
    if (categorySlug && cleaned.length <= 2) {
        cleaned = '';
    }

    return {
        categorySlug,
        color: detectedColor,
        minPrice,
        maxPrice,
        cleanQuery: cleaned
    };
}
