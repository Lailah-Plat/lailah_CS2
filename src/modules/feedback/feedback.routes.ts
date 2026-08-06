import express from 'express';
import { FeedbackController } from './feedback.controller.js';

const router = express.Router();
const controller = new FeedbackController();

// 1. REVIEWS ENDPOINTS
router.get("/reviews", controller.getReviews);
router.post("/reviews", controller.createReview);
router.delete("/reviews/:id", controller.deleteReview);

// 2. SERVICE CHATS ENDPOINTS
router.get("/chats", controller.getChats);
router.post("/chats", controller.upsertChat);
router.get("/chats/:chatId/messages", controller.getChatMessages);
router.post("/chats/:chatId/messages", controller.addChatMessage);

// 3. BULK MIGRATION/SYNC SYNC ENDPOINT
router.post("/migration/sync", controller.syncFeedback);

export default router;
