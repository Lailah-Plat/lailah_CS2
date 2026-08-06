import { IFeedbackRepository } from '../feedback.repository.js';
import { Review } from '../../../models/FeedbackModels.js';

export class CreateReviewUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(data: any): Promise<Review> {
    if (!data.targetType || !data.targetId || !data.targetName || !data.customerName || data.rating === undefined) {
      throw new Error('بيانات التقييم غير مكتملة');
    }
    return this.feedbackRepository.createReview(data);
  }
}
