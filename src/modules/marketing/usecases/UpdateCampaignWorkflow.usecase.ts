import { IMarketingRepository } from '../marketing.repository.js';

export class UpdateCampaignWorkflowUseCase {
  constructor(private marketingRepository: IMarketingRepository) {}

  async execute(id: string, workflowStatus: string) {
    if (!workflowStatus) {
      throw new Error('حالة سير العمل مطلوبة.');
    }
    return this.marketingRepository.updateCampaignWorkflow(id, workflowStatus);
  }
}
