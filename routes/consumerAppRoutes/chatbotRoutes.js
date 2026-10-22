import { Router } from 'express';
import {
    handleChatMessage,
    getChatbotHealth,
    startNewChat,
    getCustomerConversations,
    getConversationById,
    deleteConversation,
    clearCustomerConversations
} from '#controllers/chatbotController.js';
import { optionalCustomerAuth, chatbotRateLimiter, validateChatbotInput } from '#middlewares/chatbotSecurity.js';

const router = Router();

// Health check endpoint
router.get('/health', getChatbotHealth);

// Start a fresh conversation (New Chat with clean context)
router.post('/new-chat', optionalCustomerAuth, chatbotRateLimiter, startNewChat);

// Conversation History endpoints (with customer ownership isolation)
router.get('/conversations', optionalCustomerAuth, chatbotRateLimiter, getCustomerConversations);
router.get('/conversations/:id', optionalCustomerAuth, chatbotRateLimiter, getConversationById);
router.delete('/conversations/:id', optionalCustomerAuth, chatbotRateLimiter, deleteConversation);
router.delete('/conversations', optionalCustomerAuth, chatbotRateLimiter, clearCustomerConversations);

// Main chat endpoint with optional auth, rate limiting, and input sanitization
router.post('/message', optionalCustomerAuth, chatbotRateLimiter, validateChatbotInput, handleChatMessage);

export default router;
