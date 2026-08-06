import { IFeedbackRepository } from '../feedback.repository.js';

export class SyncFeedbackUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(data: { reviews?: any[]; chats?: any[]; messages?: any[] }): Promise<string[]> {
    const { reviews, chats, messages } = data;
    const logs: string[] = [];

    // Migrate Reviews
    if (Array.isArray(reviews) && reviews.length > 0) {
      let insertedReviews = 0;
      for (const rev of reviews) {
        const exists = await this.feedbackRepository.findReviewByCriteria({
          customerName: rev.customerName,
          comment: rev.comment,
          rating: rev.rating
        });
        if (!exists) {
          await this.feedbackRepository.createReview(rev);
          insertedReviews++;
        }
      }
      logs.push(`✅ تم ترحيل ومزامنة ${insertedReviews} من التقييمات المحلية بنجاح.`);
    }

    // Migrate Chats
    if (Array.isArray(chats) && chats.length > 0) {
      let insertedChats = 0;
      for (const ch of chats) {
        const exists = await this.feedbackRepository.findChatById(Number(ch.id));
        if (!exists) {
          await this.feedbackRepository.createChat({
            id: ch.id,
            customerId: ch.customerId || "anonymous_client",
            customerName: ch.customerName || "عميل",
            agentId: ch.agentId || null,
            agentName: ch.agentName || null,
            status: ch.status || 'ended',
            topic: ch.topic || null,
            department: ch.department || null
          });
          insertedChats++;
        }
      }
      logs.push(`✅ تم ترحيل ومزامنة ${insertedChats} من جلسات المحادثات الكلية بنجاح.`);
    }

    // Migrate Messages
    if (Array.isArray(messages) && messages.length > 0) {
      let insertedMsgs = 0;
      for (const msg of messages) {
        const exists = await this.feedbackRepository.findChatMessageByCriteria({
          chatId: msg.chatId,
          text: msg.text,
          senderName: msg.senderName,
          time: msg.time
        });
        if (!exists) {
          await this.feedbackRepository.createChatMessage({
            chatId: msg.chatId,
            text: msg.text,
            senderType: msg.senderType,
            senderName: msg.senderName,
            time: msg.time || ""
          });
          insertedMsgs++;
        }
      }
      logs.push(`✅ تم ترحيل ومزامنة ${insertedMsgs} رسالة دعم محادثات داخلية بنجاح.`);
    }

    return logs;
  }
}
