import { Router } from 'express';
import { handleChatMessage, getChatbotHealth } from '#controllers/chatbotController.js';
import { optionalCustomerAuth, chatbotRateLimiter, validateChatbotInput } from '#middlewares/chatbotSecurity.js';

const router = Router();

// Health check endpoint
router.get('/health', getChatbotHealth);

// Main chat endpoint with optional auth, rate limiting, and input sanitization
router.post('/message', optionalCustomerAuth, chatbotRateLimiter, validateChatbotInput, handleChatMessage);

export default router;
