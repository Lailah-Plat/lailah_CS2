import { IFeedbackRepository } from '../feedback.repository.js';
import { ServiceChat } from '../../../models/FeedbackModels.js';

export class GetChatsUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(): Promise<ServiceChat[]> {
    return this.feedbackRepository.findAllChats();
  }
}
