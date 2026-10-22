import jwt from 'jsonwebtoken';
import Customer from '#models/userModels/customerModel.js';

// In-memory sliding rate limiter per IP address
const ipRequestHistory = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipRequestHistory.entries()) {
        const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
        if (recent.length === 0) {
            ipRequestHistory.delete(ip);
        } else {
            ipRequestHistory.set(ip, recent);
        }
    }
}, 5 * 60 * 1000);

/**
 * Optional Customer Authentication:
 * Extracts Bearer token if present and attaches req.customer.
 * If absent or invalid, sets req.customer = null (does not reject guests).
 */
export const optionalCustomerAuth = async (req, res, next) => {
    req.customer = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token && token !== 'null' && token !== 'undefined') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded && decoded.id) {
                    const customer = await Customer.findById(decoded.id).select('-password').lean();
                    if (customer && customer.isActive) {
                        req.customer = customer;
                    }
                }
            } catch (err) {
                // Token invalid or expired - treat as guest
                req.customer = null;
            }
        }
    }

    next();
};

/**
 * Rate Limiting Middleware for Chatbot API
 */
export const chatbotRateLimiter = (req, res, next) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const timestamps = ipRequestHistory.get(clientIp) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            success: false,
            message: "Too many messages sent. Please wait a moment before sending another message.",
            retryAfterSeconds: Math.ceil((validTimestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)
        });
    }

    validTimestamps.push(now);
    ipRequestHistory.set(clientIp, validTimestamps);
    next();
};

/**
 * Input Validation & Prompt Injection Defense
 */
export const validateChatbotInput = (req, res, next) => {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({
            success: false,
            message: "A valid text message is required."
        });
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Message cannot be empty."
        });
    }

    if (trimmed.length > 500) {
        return res.status(400).json({
            success: false,
            message: "Message is too long. Please keep questions under 500 characters."
        });
    }

    // Strip potentially malicious HTML / script tags
    const sanitizedMessage = trimmed
        .replace(/<[^>]*>?/gm, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');

    // Normalize and cap conversation history to prevent memory explosion or prompt overflow
    let safeHistory = [];
    if (Array.isArray(conversationHistory)) {
        safeHistory = conversationHistory
            .slice(-10) // Keep last 10 messages max
            .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .map(item => ({
                role: item.role,
                content: item.content.slice(0, 400).replace(/<[^>]*>?/gm, '').trim()
            }));
    }

    req.sanitizedMessage = sanitizedMessage;
    req.safeConversationHistory = safeHistory;
    next();
};
