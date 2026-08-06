import { IFeedbackRepository } from '../feedback.repository.js';
import { ServiceChat } from '../../../models/FeedbackModels.js';

export class UpsertChatUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(data: any): Promise<ServiceChat> {
    const { id } = data;
    if (!id) {
      throw new Error('معرّف الجلسة مطلوب لعمليات الإدخال أو التحديث');
    }

    const existingChat = await this.feedbackRepository.findChatById(Number(id));
    if (existingChat) {
      return this.feedbackRepository.updateChat(existingChat, data);
    } else {
      return this.feedbackRepository.createChat(data);
    }
  }
}
