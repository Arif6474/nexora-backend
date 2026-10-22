/**
 * Conversation Context Manager.
 * Safely resolves follow-up queries (size check, color switch, comparison)
 * without allowing history to hijack new independent intents or authorization.
 */

import { parseProductSearchIntent } from './productIntentParser.js';

export class ConversationContextManager {
    /**
     * Extracts active context from conversation history.
     * @param {Array<{role: string, content: string}>} history
     * @returns {{ categorySlug: string|null, color: string|null, lastProductsMentioned: Array }}
     */
    extractContext(history = []) {
        let lastCategorySlug = null;
        let lastColor = null;

        if (!Array.isArray(history) || history.length === 0) {
            return { categorySlug: null, color: null };
        }

        // Look back over the last 4 messages in reverse
        for (let i = history.length - 1; i >= 0; i--) {
            const msg = history[i];
            if (msg && typeof msg.content === 'string') {
                const parsed = parseProductSearchIntent(msg.content);
                if (!lastCategorySlug && parsed.categorySlug) {
                    lastCategorySlug = parsed.categorySlug;
                }
                if (!lastColor && parsed.color) {
                    lastColor = parsed.color;
                }
                if (lastCategorySlug && lastColor) break;
            }
        }

        return {
            categorySlug: lastCategorySlug,
            color: lastColor
        };
    }

    /**
     * Checks if a message is an explicit follow-up (e.g., "in size M?", "what about white?", "which is cheaper?")
     */
    resolveFollowUp(rawMessage = '', currentIntent = '', previousContext = {}) {
        const lower = (rawMessage || '').toLowerCase().trim();

        // If intent is policy, guest_checkout, order, or greeting, DO NOT merge product context
        if (['guest_checkout', 'order_tracking', 'order_cancellation', 'policy_shipping', 'policy_returns', 'policy_payment', 'policy_contact', 'greeting'].includes(currentIntent)) {
            return { isFollowUp: false, mergedIntent: null };
        }

        // Spelled-out size normalization map
        const SIZE_WORD_MAP = {
            'extra small': 'XS', 'xs': 'XS',
            'small': 'S', 's': 'S',
            'medium': 'M', 'm': 'M',
            'large': 'L', 'l': 'L',
            'extra large': 'XL', 'xl': 'XL',
            'double extra large': 'XXL', 'xxl': 'XXL', 'xx large': 'XXL',
            // Italian
            'piccola': 'S', 'piccolo': 'S', 'media': 'M', 'medio': 'M', 'grande': 'L', 'grandi': 'L',
            // Bengali/Banglish
            'chhoto': 'S', 'mejo': 'M', 'boro': 'L'
        };

        // Try to extract a size from spelled-out words first, then abbreviation
        let resolvedSize = null;
        // Check full size words first (e.g. "medium", "extra large")
        for (const [word, abbr] of Object.entries(SIZE_WORD_MAP)) {
            if (word.length > 1 && lower.includes(word)) {
                resolvedSize = abbr;
                break;
            }
        }
        // Fall back to abbreviation match if no word match found
        if (!resolvedSize) {
            const sizeAbbrMatch = lower.match(/\b(?:size\s+)?([smlxl]{1,3}|xs|xxl|\d{2})\b/i);
            if (sizeAbbrMatch) {
                const candidate = sizeAbbrMatch[1].toUpperCase();
                // Make sure it's a real size token (avoid matching single letters that are part of normal words)
                if (['S', 'M', 'L', 'XL', 'XS', 'XXL'].includes(candidate) || /^\d{2}$/.test(candidate)) {
                    resolvedSize = candidate;
                }
            }
        }

        const hasSizeQuery = !!resolvedSize || /\b(size|medium|large|small|সাইজ|taglia|साइज)\b/i.test(lower);

        // Color shift follow-up: e.g. "what about white?", "white color?", "সাদা রঙের?", "আর সাদা?"
        // NOTE: \b fails on non-ASCII (Bengali). Use (?:^|[\s,।]) as anchor instead.
        const isColorShift = /(?:^|[\s,।])(what about|how about|ar|আর|বা|e invece)\s+(?:in\s+)?(white|black|blue|camel|brown|red|green|সাদা|কালো|নীল)/iu.test(lower)
            || /(?:^|[\s,।])(সাদা|কালো|নীল|shada|kalo|neel)\s+(?:রঙের|রঙ|color)/iu.test(lower);

        if ((hasSizeQuery || isColorShift) && previousContext.categorySlug) {
            return {
                isFollowUp: true,
                categorySlug: previousContext.categorySlug,
                color: isColorShift ? null : previousContext.color, // replace color if shifting
                size: resolvedSize || null
            };
        }

        return { isFollowUp: false };
    }
}

export const conversationContextManager = new ConversationContextManager();
export default conversationContextManager;
