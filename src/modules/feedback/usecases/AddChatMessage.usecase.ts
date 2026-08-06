import { IFeedbackRepository } from '../feedback.repository.js';
import { ServiceChatMessage } from '../../../models/FeedbackModels.js';

export class AddChatMessageUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(chatId: string | number, data: any): Promise<ServiceChatMessage> {
    if (!chatId) {
      throw new Error('معرّف الجلسة مطلوب');
    }
    if (!data.text || !data.senderType || !data.senderName) {
      throw new Error('محتوى الرسالة غير كامل');
    }
    return this.feedbackRepository.createChatMessage({
      chatId,
      ...data
    });
  }
}
