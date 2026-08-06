import { Request, Response } from 'express';
import { SequelizeSubscriptionRepository } from './subscription.repository.js';
import { GetPlansUseCase } from './usecases/GetPlans.usecase.js';
import { CreateOrEditPlanUseCase } from './usecases/CreateOrEditPlan.usecase.js';
import { DeletePlanUseCase } from './usecases/DeletePlan.usecase.js';
import { GetProviderSubscriptionUseCase } from './usecases/GetProviderSubscription.usecase.js';
import { GetAllOverridesUseCase } from './usecases/GetAllOverrides.usecase.js';
import { GetAllSubscriptionsUseCase } from './usecases/GetAllSubscriptions.usecase.js';
import { UpgradeSubscriptionUseCase } from './usecases/UpgradeSubscription.usecase.js';
import { OverrideFeatureUseCase } from './usecases/OverrideFeature.usecase.js';
import { DeleteFeatureOverrideUseCase } from './usecases/DeleteFeatureOverride.usecase.js';

export class SubscriptionController {
  private subscriptionRepository = new SequelizeSubscriptionRepository();
  private getPlansUseCase = new GetPlansUseCase(this.subscriptionRepository);
  private createOrEditPlanUseCase = new CreateOrEditPlanUseCase(this.subscriptionRepository);
  private deletePlanUseCase = new DeletePlanUseCase(this.subscriptionRepository);
  private getProviderSubscriptionUseCase = new GetProviderSubscriptionUseCase(this.subscriptionRepository);
  private getAllOverridesUseCase = new GetAllOverridesUseCase(this.subscriptionRepository);
  private getAllSubscriptionsUseCase = new GetAllSubscriptionsUseCase(this.subscriptionRepository);
  private upgradeSubscriptionUseCase = new UpgradeSubscriptionUseCase(this.subscriptionRepository);
  private overrideFeatureUseCase = new OverrideFeatureUseCase(this.subscriptionRepository);
  private deleteFeatureOverrideUseCase = new DeleteFeatureOverrideUseCase(this.subscriptionRepository);

  getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const plans = await this.getPlansUseCase.execute();
      res.json({ success: true, plans });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getPlans:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب باقات الاشتراك' });
    }
  };

  createOrEditPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const plan = await this.createOrEditPlanUseCase.execute(req.body);
      res.json({ success: true, plan });
    } catch (error: any) {
      console.error('Error in SubscriptionController.createOrEditPlan:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء حفظ الباقة' });
    }
  };

  deletePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedCount = await this.deletePlanUseCase.execute(id);
      res.json({ success: true, message: 'تم حذف الباقة بنجاح من قاعدة البيانات.', deletedCount });
    } catch (error: any) {
      console.error('Error in SubscriptionController.deletePlan:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء حذف الباقة' });
    }
  };

  getProviderSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const result = await this.getProviderSubscriptionUseCase.execute(Number(providerId));
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getProviderSubscription:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب اشتراك الموفر' });
    }
  };

  getAllOverrides = async (req: Request, res: Response): Promise<void> => {
    try {
      const overrides = await this.getAllOverridesUseCase.execute();
      res.json({ success: true, overrides });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getAllOverrides:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب الاستثناءات' });
    }
  };

  getAllSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const subscriptions = await this.getAllSubscriptionsUseCase.execute();
      res.json({ success: true, subscriptions });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getAllSubscriptions:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب الاشتراكات الكلية' });
    }
  };

  upgradeSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const results = await this.upgradeSubscriptionUseCase.execute(req.body);
      res.json({
        success: true,
        message: `تم تطبيق ترقية الباقة بنجاح لعدد ${results.length} من مزودي الخدمة المحددين.`,
        results
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.upgradeSubscription:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء ترقية الاشتراك' });
    }
  };

  overrideFeature = async (req: Request, res: Response): Promise<void> => {
    try {
      const results = await this.overrideFeatureUseCase.execute(req.body);
      res.json({
        success: true,
        message: `تم منح الميزة المخصصة بنجاح لعدد ${results.length} من مزودي الخدمة المحددين.`,
        results
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.overrideFeature:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء منح الميزة المخصصة' });
    }
  };

  deleteFeatureOverride = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId, featureKey } = req.body;
      await this.deleteFeatureOverrideUseCase.execute(Number(providerId), featureKey);
      res.json({ success: true, message: 'تم إرجاع الميزة المخصصة وحذف الاستثناء بنجاح.' });
    } catch (error: any) {
      console.error('Error in SubscriptionController.deleteFeatureOverride:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء حذف استثناء الميزة' });
    }
  };
}
