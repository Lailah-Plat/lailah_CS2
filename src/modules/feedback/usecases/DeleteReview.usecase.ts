import { IFeedbackRepository } from '../feedback.repository.js';

export class DeleteReviewUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(id: string | number): Promise<boolean> {
    if (!id) {
      throw new Error('معرّف التقييم مطلوب');
    }
    return this.feedbackRepository.deleteReview(id);
  }
}
