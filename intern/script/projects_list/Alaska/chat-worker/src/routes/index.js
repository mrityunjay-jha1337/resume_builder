import { Router } from 'express';
import { createMessage } from '../controllers/messagesController.js';
import { getChatsBetween } from '../controllers/chatsController.js';
import { internalAuthMiddleware } from '../middlewares/auth.js';

const router = Router();

// GET /chats/between/:senderId/:receiverId
router.get('/chats/between/:senderId/:receiverId', getChatsBetween);

// POST /messages
router.use('/messages', internalAuthMiddleware);
router.post('/messages', createMessage);

export default router;
