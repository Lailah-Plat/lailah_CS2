import { IFeedbackRepository } from '../feedback.repository.js';
import { ServiceChatMessage } from '../../../models/FeedbackModels.js';

export class GetChatMessagesUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(chatId: string | number): Promise<ServiceChatMessage[]> {
    if (!chatId) {
      throw new Error('معرّف الجلسة مطلوب');
    }
    return this.feedbackRepository.findMessagesByChatId(chatId);
  }
}
