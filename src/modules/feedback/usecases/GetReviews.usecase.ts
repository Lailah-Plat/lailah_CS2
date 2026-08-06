import { IFeedbackRepository } from '../feedback.repository.js';
import { Review } from '../../../models/FeedbackModels.js';

export class GetReviewsUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(): Promise<Review[]> {
    return this.feedbackRepository.findAllReviews();
  }
}
