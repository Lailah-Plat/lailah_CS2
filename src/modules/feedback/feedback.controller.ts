import { Request, Response } from 'express';
import { SequelizeFeedbackRepository } from './feedback.repository.js';
import { GetReviewsUseCase } from './usecases/GetReviews.usecase.js';
import { CreateReviewUseCase } from './usecases/CreateReview.usecase.js';
import { DeleteReviewUseCase } from './usecases/DeleteReview.usecase.js';
import { GetChatsUseCase } from './usecases/GetChats.usecase.js';
import { UpsertChatUseCase } from './usecases/UpsertChat.usecase.js';
import { GetChatMessagesUseCase } from './usecases/GetChatMessages.usecase.js';
import { AddChatMessageUseCase } from './usecases/AddChatMessage.usecase.js';
import { SyncFeedbackUseCase } from './usecases/SyncFeedback.usecase.js';

export class FeedbackController {
  private feedbackRepository = new SequelizeFeedbackRepository();
  private getReviewsUseCase = new GetReviewsUseCase(this.feedbackRepository);
  private createReviewUseCase = new CreateReviewUseCase(this.feedbackRepository);
  private deleteReviewUseCase = new DeleteReviewUseCase(this.feedbackRepository);
  private getChatsUseCase = new GetChatsUseCase(this.feedbackRepository);
  private upsertChatUseCase = new UpsertChatUseCase(this.feedbackRepository);
  private getChatMessagesUseCase = new GetChatMessagesUseCase(this.feedbackRepository);
  private addChatMessageUseCase = new AddChatMessageUseCase(this.feedbackRepository);
  private syncFeedbackUseCase = new SyncFeedbackUseCase(this.feedbackRepository);

  getReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const reviews = await this.getReviewsUseCase.execute();
      res.json({ success: true, reviews });
    } catch (error: any) {
      console.error('Error in FeedbackController.getReviews:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب التقييمات' });
    }
  };

  createReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const review = await this.createReviewUseCase.execute(req.body);
      res.json({ success: true, review });
    } catch (error: any) {
      console.error('Error in FeedbackController.createReview:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إضافة التقييم' });
    }
  };

  deleteReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.deleteReviewUseCase.execute(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'التقييم غير موجود' });
        return;
      }
      res.json({ success: true, message: 'تم حذف التقييم بنجاح.' });
    } catch (error: any) {
      console.error('Error in FeedbackController.deleteReview:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء حذف التقييم' });
    }
  };

  getChats = async (req: Request, res: Response): Promise<void> => {
    try {
      const chats = await this.getChatsUseCase.execute();
      res.json({ success: true, chats });
    } catch (error: any) {
      console.error('Error in FeedbackController.getChats:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب المحادثات' });
    }
  };

  upsertChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const chat = await this.upsertChatUseCase.execute(req.body);
      res.json({ success: true, chat });
    } catch (error: any) {
      console.error('Error in FeedbackController.upsertChat:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء حفظ المحادثة' });
    }
  };

  getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chatId } = req.params;
      const messages = await this.getChatMessagesUseCase.execute(chatId);
      res.json({ success: true, messages });
    } catch (error: any) {
      console.error('Error in FeedbackController.getChatMessages:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب الرسائل' });
    }
  };

  addChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chatId } = req.params;
      const msg = await this.addChatMessageUseCase.execute(chatId, req.body);
      res.json({ success: true, message: msg });
    } catch (error: any) {
      console.error('Error in FeedbackController.addChatMessage:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إضافة الرسالة' });
    }
  };

  syncFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const logs = await this.syncFeedbackUseCase.execute(req.body);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.error('Error in FeedbackController.syncFeedback:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء المزامنة والترحيل' });
    }
  };
}
