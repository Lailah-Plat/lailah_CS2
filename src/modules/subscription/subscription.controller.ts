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
import { effectiveEntitlementService } from '../../services/entitlement/effectiveEntitlementService.js';
import { FEATURE_REGISTRY, normalizeFeatureKey } from '../../services/entitlement/featureRegistry.js';
import { ProviderAddon, ProviderAdminGrant, EntitlementAuditLog } from '../../models/SubscriptionModels.js';
import { extractProviderId } from '../../middleware/entitlement.middleware.js';
import { AdminGrantService, ActorContext } from '../../services/subscription/AdminGrantService.js';

export class SubscriptionController {
  private adminGrantService = AdminGrantService.getInstance();
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

  /**
   * Single Source of Truth: Get Effective Entitlements for a Provider
   */
  getEffectiveEntitlements = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.params.providerId ? Number(req.params.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة غير محدد' });
        return;
      }

      const bypassCache = req.query.refresh === 'true' || req.query.nocache === 'true';
      const entitlements = await effectiveEntitlementService.getEffectiveEntitlements(providerId, bypassCache);

      res.json({
        success: true,
        entitlements
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getEffectiveEntitlements:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء احتساب استحقاقات الخدمة' });
    }
  };

  /**
   * Get Centralized Feature Registry & Catalog
   */
  getFeatureRegistry = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        registry: FEATURE_REGISTRY,
        featureList: Object.values(FEATURE_REGISTRY)
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getFeatureRegistry:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب سجل الميزات' });
    }
  };

  private getActorContext(req: Request): ActorContext {
    const user = (req as any).user;
    return {
      actorId: user?.id,
      actorName: user?.name || user?.email || (req.body.grantedBy as string) || 'Admin',
      role: user?.role || 'Admin',
      permissions: user?.permissions || ['subscription.grant', 'feature.grant', 'discount.grant', 'grant.revoke', 'bulk_grant.create', 'bulk_grant.approve']
    };
  }

  /**
   * List Admin Grants (P1.5)
   */
  listAdminGrants = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.query.providerId ? Number(req.query.providerId) : undefined;
      const status = req.query.status as string | undefined;
      const grantType = req.query.grantType as string | undefined;
      const campaignId = req.query.campaignId as string | undefined;

      const grants = await this.adminGrantService.listGrants({
        providerId,
        status,
        grantType,
        campaignId
      });

      res.json({
        success: true,
        count: grants.length,
        grants
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.listAdminGrants:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب المنح الإدارية' });
    }
  };

  /**
   * Create an Administrative Grant (Feature, Numeric Limit, etc.)
   */
  createAdminGrant = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = this.getActorContext(req);
      const { providerId, featureKey, grantType, value, quantity, startsAt, expiresAt, durationMonths, durationDays, reason, internalNotes, campaignId, financialImpact } = req.body;

      if (!providerId || !reason) {
        res.status(400).json({ success: false, error: 'يجب توفير معرّف المزود، وسبب المنح الإداري الإلزامي.' });
        return;
      }

      // If grantType is a subscription plan grant, route to grantSubscription
      if (['FREE_SUBSCRIPTION', 'PLAN', 'TEMPORARY_UPGRADE'].includes(grantType)) {
        const grant = await this.adminGrantService.grantSubscription({
          providerId: Number(providerId),
          grantType,
          planId: req.body.planId,
          planName: req.body.planName || req.body.featureName,
          durationMonths: Number(durationMonths) || (expiresAt ? undefined : 1),
          startsAt: startsAt ? new Date(startsAt) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          reason: String(reason),
          internalNotes,
          campaignId,
          financialImpact
        }, actor);

        res.status(201).json({
          success: true,
          message: 'تم منح الاشتراك الإداري وتحديث الاستحقاقات بنجاح.',
          grant
        });
        return;
      }

      // If grantType is discount, route to grantDiscount
      if (['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(grantType)) {
        const discountVal = Number(value?.replace(/[^0-9.]/g, '') || req.body.discountValue || 20);
        const grant = await this.adminGrantService.grantDiscount({
          providerId: Number(providerId),
          grantType,
          discountValue: discountVal,
          durationMonths: Number(durationMonths),
          startsAt: startsAt ? new Date(startsAt) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          reason: String(reason),
          internalNotes,
          campaignId,
          listPrice: req.body.listPrice
        }, actor);

        res.status(201).json({
          success: true,
          message: 'تم تطبيق الخصم الإداري بنجاح.',
          grant
        });
        return;
      }

      // Otherwise feature grant
      const grant = await this.adminGrantService.grantFeature({
        providerId: Number(providerId),
        grantType,
        featureKey: featureKey || 'inventory_management',
        featureName: req.body.featureName,
        quantity: Number(quantity) || 1,
        value: value ? String(value) : undefined,
        durationMonths: Number(durationMonths),
        durationDays: Number(durationDays),
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        reason: String(reason),
        internalNotes,
        campaignId,
        financialImpact
      }, actor);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء المنح الإداري وتحديث الاستحقاقات بنجاح.',
        grant
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.createAdminGrant:', error);
      res.status(error.message?.includes('FORBIDDEN') ? 403 : error.message?.includes('VALIDATION') ? 400 : 500).json({
        success: false,
        error: error.message || 'حدث خطأ أثناء حفظ المنح الإداري'
      });
    }
  };

  /**
   * Grant Free Subscription / Plan / Temporary Upgrade (P1.5)
   */
  grantSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = this.getActorContext(req);
      const { providerId, grantType, planId, planName, durationMonths, startsAt, expiresAt, reason, internalNotes, campaignId, financialImpact } = req.body;

      const grant = await this.adminGrantService.grantSubscription({
        providerId: Number(providerId),
        grantType: grantType || 'FREE_SUBSCRIPTION',
        planId: planId ? Number(planId) : undefined,
        planName,
        durationMonths: durationMonths ? Number(durationMonths) : undefined,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        reason: String(reason),
        internalNotes,
        campaignId,
        financialImpact
      }, actor);

      res.status(201).json({
        success: true,
        message: 'تم منح الاشتراك الإداري بنجاح.',
        grant
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.grantSubscription:', error);
      res.status(error.message?.includes('FORBIDDEN') ? 403 : error.message?.includes('VALIDATION') ? 400 : 500).json({
        success: false,
        error: error.message || 'حدث خطأ أثناء منح الاشتراك'
      });
    }
  };

  /**
   * Grant Discount (P1.5)
   */
  grantDiscount = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = this.getActorContext(req);
      const { providerId, grantType, discountValue, durationMonths, startsAt, expiresAt, reason, internalNotes, campaignId, listPrice } = req.body;

      const grant = await this.adminGrantService.grantDiscount({
        providerId: Number(providerId),
        grantType: grantType || 'PERCENTAGE_DISCOUNT',
        discountValue: Number(discountValue),
        durationMonths: durationMonths ? Number(durationMonths) : undefined,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        reason: String(reason),
        internalNotes,
        campaignId,
        listPrice
      }, actor);

      res.status(201).json({
        success: true,
        message: 'تم منح الخصم الإداري بنجاح.',
        grant
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.grantDiscount:', error);
      res.status(error.message?.includes('FORBIDDEN') ? 403 : error.message?.includes('VALIDATION') ? 400 : 500).json({
        success: false,
        error: error.message || 'حدث خطأ أثناء منح الخصم'
      });
    }
  };

  /**
   * Create Bulk Grant (P1.5)
   */
  createBulkGrant = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = this.getActorContext(req);
      const { providerIds, grantType, planId, planName, featureKey, featureName, quantity, value, durationMonths, durationDays, startsAt, expiresAt, reason, internalNotes, campaignId, financialImpactPerProvider } = req.body;

      const result = await this.adminGrantService.createBulkGrant({
        providerIds: Array.isArray(providerIds) ? providerIds.map(Number) : [],
        grantType,
        planId: planId ? Number(planId) : undefined,
        planName,
        featureKey,
        featureName,
        quantity: quantity ? Number(quantity) : undefined,
        value,
        durationMonths: durationMonths ? Number(durationMonths) : undefined,
        durationDays: durationDays ? Number(durationDays) : undefined,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        reason: String(reason),
        internalNotes,
        campaignId,
        financialImpactPerProvider
      }, actor);

      res.status(201).json({
        success: true,
        message: `تم إنشاء المنح الجماعي بنجاح لعدد ${result.createdCount} من مزودي الخدمة بالدفعة [${result.batchId}].`,
        result
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.createBulkGrant:', error);
      res.status(error.message?.includes('FORBIDDEN') ? 403 : error.message?.includes('VALIDATION') ? 400 : 500).json({
        success: false,
        error: error.message || 'حدث خطأ أثناء إنشاء المنح الجماعي'
      });
    }
  };

  /**
   * Revoke an Administrative Grant (P1.5)
   * Enforces mandatory reason, preserves record with revokedAt and revokedBy.
   */
  revokeAdminGrant = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = this.getActorContext(req);
      const { grantId, reason, internalNotes } = req.body;

      if (!grantId || !reason) {
        res.status(400).json({ success: false, error: 'يجب توفير معرّف المنحة وسبب الإلغاء الإلزامي.' });
        return;
      }

      const revokedGrant = await this.adminGrantService.revokeGrant(
        Number(grantId),
        { reason: String(reason), internalNotes },
        actor
      );

      res.json({
        success: true,
        message: 'تم إلغاء المنح الإداري وتحديث الاستحقاقات بنجاح.',
        grant: revokedGrant
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.revokeAdminGrant:', error);
      res.status(error.message?.includes('FORBIDDEN') ? 403 : error.message?.includes('VALIDATION') ? 400 : 500).json({
        success: false,
        error: error.message || 'حدث خطأ أثناء إلغاء المنح الإداري'
      });
    }
  };

  /**
   * Process Expired Grants Cron Trigger (P1.5)
   */
  processExpiredGrants = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.adminGrantService.processExpiredGrants();
      res.json({
        success: true,
        message: `تم معالجة انتهاء ${result.expiredCount} من المنح الإدارية بنجاح.`,
        result
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.processExpiredGrants:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء معالجة انتهاء المنح' });
    }
  };

  /**
   * Request Addon Purchase (Draft / Pending Payment)
   */
  requestAddonPurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId, featureKey, quantity, billingCycle, unitPrice, source, notes } = req.body;
      const pId = providerId ? Number(providerId) : extractProviderId(req);
      if (!pId || !featureKey) {
        res.status(400).json({ success: false, error: 'معرّف المزود ومفتاح الميزة مطلوبان.' });
        return;
      }

      const { addonLifecycleService } = await import('../../services/subscription/AddonLifecycleService.js');
      const result = await addonLifecycleService.requestPurchase({
        providerId: pId,
        providerEmail: req.body.providerEmail || (req.user as any)?.email,
        featureKey,
        quantity: quantity ? Number(quantity) : 1,
        billingCycle,
        unitPrice,
        source,
        notes
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error in SubscriptionController.requestAddonPurchase:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء طلب شراء الميزة' });
    }
  };

  /**
   * Verified Payment & Activate Add-on
   */
  activateAddon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId, featureKey, addonId, paymentId, transactionId, amountPaid, durationMonths, notes } = req.body;
      const pId = providerId ? Number(providerId) : extractProviderId(req);

      if (!pId || !featureKey) {
        res.status(400).json({ success: false, error: 'بيانات غير مكتملة لتفعيل الإضافة.' });
        return;
      }

      const actualPaymentId = paymentId || transactionId || `PAY-${Date.now()}`;
      const { addonLifecycleService } = await import('../../services/subscription/AddonLifecycleService.js');
      const result = await addonLifecycleService.activateAddonWithPayment({
        providerId: pId,
        featureKey,
        addonId: addonId ? Number(addonId) : undefined,
        paymentId: actualPaymentId,
        transactionId: transactionId || actualPaymentId,
        amountPaid: amountPaid ? Number(amountPaid) : undefined,
        verifiedBy: (req.user as any)?.email || `Provider#${pId}`,
        durationMonths: durationMonths ? Number(durationMonths) : undefined,
        notes
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error in SubscriptionController.activateAddon:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تفعيل الإضافة' });
    }
  };

  /**
   * Renew Addon Subscription
   */
  renewAddon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { addonId, paymentId, transactionId, amountPaid, durationMonths, reason } = req.body;
      if (!addonId || (!paymentId && !transactionId)) {
        res.status(400).json({ success: false, error: 'معرّف الميزة ومعرّف السداد الموثق مطلوبان للتجديد.' });
        return;
      }

      const { addonLifecycleService } = await import('../../services/subscription/AddonLifecycleService.js');
      const result = await addonLifecycleService.renewAddon({
        addonId: Number(addonId),
        paymentId: paymentId || transactionId,
        transactionId: transactionId || paymentId,
        amountPaid: amountPaid ? Number(amountPaid) : undefined,
        durationMonths: durationMonths ? Number(durationMonths) : undefined,
        actor: (req.user as any)?.email || 'Provider',
        reason
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in SubscriptionController.renewAddon:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تجديد الميزة' });
    }
  };

  /**
   * Expire Addon Subscription
   */
  expireAddon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { addonId, reason } = req.body;
      if (!addonId) {
        res.status(400).json({ success: false, error: 'معرّف الميزة مطلوب.' });
        return;
      }

      const { addonLifecycleService } = await import('../../services/subscription/AddonLifecycleService.js');
      const result = await addonLifecycleService.expireAddon(
        Number(addonId),
        reason || 'انتهاء فترة صلاحية الميزة الإضافية',
        (req.user as any)?.email || 'Admin'
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error in SubscriptionController.expireAddon:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إنهاء صلاحية الميزة' });
    }
  };

  /**
   * Cancel Addon Subscription
   */
  cancelAddon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { addonId, immediate, reason } = req.body;
      if (!addonId) {
        res.status(400).json({ success: false, error: 'معرّف الميزة مطلوب.' });
        return;
      }

      const { addonLifecycleService } = await import('../../services/subscription/AddonLifecycleService.js');
      const result = await addonLifecycleService.cancelAddon({
        addonId: Number(addonId),
        immediate: immediate ?? false,
        reason,
        actor: (req.user as any)?.email || 'Provider'
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in SubscriptionController.cancelAddon:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إلغاء الميزة' });
    }
  };

  /**
   * Refund Addon Subscription
   */
  refundAddon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { addonId, refundAmount, reason } = req.body;
      if (!addonId || !reason) {
        res.status(400).json({ success: false, error: 'معرّف الميزة وسبب الاسترداد مطلوبان.' });
        return;
      }

      const { addonLifecycleService } = await import('../../services/subscription/AddonLifecycleService.js');
      const result = await addonLifecycleService.refundAddon({
        addonId: Number(addonId),
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
        reason,
        actor: (req.user as any)?.email || 'Admin'
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in SubscriptionController.refundAddon:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء استرداد الميزة' });
    }
  };

  /**
   * Revoke Addon Subscription
   */
  revokeAddon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { addonId, reason } = req.body;
      if (!addonId || !reason) {
        res.status(400).json({ success: false, error: 'معرّف الميزة وسبب السحب مطلوبان.' });
        return;
      }

      const { addonLifecycleService } = await import('../../services/subscription/AddonLifecycleService.js');
      const result = await addonLifecycleService.revokeAddon({
        addonId: Number(addonId),
        reason,
        actor: (req.user as any)?.email || 'Admin'
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in SubscriptionController.revokeAddon:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء سحب الميزة' });
    }
  };

  /**
   * Get Entitlement Audit Logs
   */
  getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.query.providerId ? Number(req.query.providerId) : undefined;
      const eventType = req.query.eventType ? String(req.query.eventType) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 100;

      const where: any = {};
      if (providerId) where.providerId = providerId;
      if (eventType) where.eventType = eventType;

      const logs = await EntitlementAuditLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit
      });

      res.json({
        success: true,
        count: logs.length,
        logs
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getAuditLogs:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء جلب سجلات التدقيق' });
    }
  };

  /**
   * Subscription Lifecycle Endpoints
   */
  createSubscriptionLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const subscription = await subscriptionLifecycleService.createSubscription({
        providerId,
        providerEmail: req.body.providerEmail || req.user?.email || `provider_${providerId}@layla.sa`,
        planId: req.body.planId ? Number(req.body.planId) : undefined,
        planName: req.body.planName,
        billingCycle: req.body.billingCycle,
        pricePaid: req.body.pricePaid,
        isCustom: req.body.isCustom,
        actor: req.user?.email || 'User',
        reason: req.body.reason,
        requestId: req.headers['x-request-id'] as string
      });

      res.status(201).json({ success: true, message: 'تم إنشاء الاشتراك بنجاح.', subscription });
    } catch (error: any) {
      console.error('Error in SubscriptionController.createSubscriptionLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إنشاء الاشتراك' });
    }
  };

  upgradeSubscriptionLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const result = await subscriptionLifecycleService.upgradeSubscription({
        providerId,
        targetPlanId: req.body.targetPlanId ? Number(req.body.targetPlanId) : undefined,
        targetPlanName: req.body.targetPlanName || req.body.planName,
        timing: req.body.timing || 'immediate',
        pricePaid: req.body.pricePaid,
        actor: req.user?.email || 'Provider',
        reason: req.body.reason,
        requestId: req.headers['x-request-id'] as string
      });

      res.json({
        success: true,
        message: result.effectiveImmediately
          ? 'تمت ترقية الاشتراك وتفعيل الميزات فورياً بنجاح.'
          : 'تمت جدولة ترقية الاشتراك لتنفيذها في نهاية دورة الفوترة الحالية.',
        ...result
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.upgradeSubscriptionLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء ترقية الاشتراك' });
    }
  };

  downgradeSubscriptionLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const result = await subscriptionLifecycleService.downgradeSubscription({
        providerId,
        targetPlanId: req.body.targetPlanId ? Number(req.body.targetPlanId) : undefined,
        targetPlanName: req.body.targetPlanName || req.body.planName,
        timing: req.body.timing || 'immediate',
        actor: req.user?.email || 'Provider',
        reason: req.body.reason,
        requestId: req.headers['x-request-id'] as string
      });

      res.json({
        success: true,
        message: result.effectiveImmediately
          ? 'تم تخفيض الباقة بنجاح دون حذف أي بيانات سابقة.'
          : 'تمت جدولة تخفيض الباقة لتنفيذها في نهاية الدورة الحالية.',
        ...result
      });
    } catch (error: any) {
      console.error('Error in SubscriptionController.downgradeSubscriptionLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تخفيض الباقة' });
    }
  };

  renewSubscriptionLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const subscription = await subscriptionLifecycleService.renewSubscription({
        providerId,
        durationMonths: req.body.durationMonths ? Number(req.body.durationMonths) : undefined,
        amountPaid: req.body.amountPaid,
        transactionId: req.body.transactionId,
        actor: req.user?.email || 'Provider',
        reason: req.body.reason,
        requestId: req.headers['x-request-id'] as string
      });

      res.json({ success: true, message: 'تم تجديد الاشتراك بنجاح.', subscription });
    } catch (error: any) {
      console.error('Error in SubscriptionController.renewSubscriptionLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تجديد الاشتراك' });
    }
  };

  startGracePeriodLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const subscription = await subscriptionLifecycleService.startGracePeriod({
        providerId,
        graceDays: req.body.graceDays ? Number(req.body.graceDays) : 7,
        reason: req.body.reason,
        actor: req.user?.email || 'System',
        requestId: req.headers['x-request-id'] as string
      });

      res.json({ success: true, message: 'تم تفعيل مهلة السماح للاشتراك بنجاح.', subscription });
    } catch (error: any) {
      console.error('Error in SubscriptionController.startGracePeriodLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تفعيل مهلة السماح' });
    }
  };

  expireSubscriptionLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const subscription = await subscriptionLifecycleService.expireSubscription(
        providerId,
        req.body.reason || 'انتهاء الاشتراك'
      );

      res.json({ success: true, message: 'تم إنهاء الاشتراك ونقله إلى حالة منتهي بنجاح.', subscription });
    } catch (error: any) {
      console.error('Error in SubscriptionController.expireSubscriptionLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إنهاء الاشتراك' });
    }
  };

  cancelSubscriptionLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const subscription = await subscriptionLifecycleService.cancelSubscription({
        providerId,
        immediate: req.body.immediate,
        reason: req.body.reason,
        actor: req.user?.email || 'Provider',
        requestId: req.headers['x-request-id'] as string
      });

      res.json({ success: true, message: 'تم إلغاء الاشتراك بنجاح.', subscription });
    } catch (error: any) {
      console.error('Error in SubscriptionController.cancelSubscriptionLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إلغاء الاشتراك' });
    }
  };

  paymentFailureLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const subscription = await subscriptionLifecycleService.recordPaymentFailure({
        providerId,
        reason: req.body.reason,
        transactionId: req.body.transactionId,
        actor: req.user?.email || 'PaymentGateway',
        requestId: req.headers['x-request-id'] as string
      });

      res.json({ success: true, message: 'تم تسجيل فشل عملية الدفع للاشتراك بنجاح.', subscription });
    } catch (error: any) {
      console.error('Error in SubscriptionController.paymentFailureLifecycle:', error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تسجيل فشل الدفع' });
    }
  };

  /**
   * P1.6 — Generate Subscription Financial Quote (Backend Source of Truth)
   */
  generateSubscriptionQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      if (!providerId) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة مطلوب' });
        return;
      }
      const { financialQuoteService } = await import('../../services/finance/FinancialQuoteService.js');
      const quote = await financialQuoteService.createSubscriptionQuote({
        providerId,
        providerEmail: req.body.providerEmail || req.user?.email,
        planId: req.body.planId ? Number(req.body.planId) : undefined,
        planName: req.body.planName,
        billingCycle: req.body.billingCycle || 'MONTHLY',
        actor: req.user?.email || 'Provider'
      });

      res.status(201).json({ success: true, quote });
    } catch (error: any) {
      console.error('Error in SubscriptionController.generateSubscriptionQuote:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل في إنشاء عرض السعر المعتمد للاشتراك' });
    }
  };

  /**
   * P1.6 — Generate Addon Financial Quote (Backend Source of Truth)
   */
  generateAddonQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      const featureKey = req.body.featureKey;
      if (!providerId || !featureKey) {
        res.status(400).json({ success: false, error: 'معرّف مزود الخدمة ومفتاح الميزة مطلوبان' });
        return;
      }
      const { financialQuoteService } = await import('../../services/finance/FinancialQuoteService.js');
      const quote = await financialQuoteService.createAddonQuote({
        providerId,
        providerEmail: req.body.providerEmail || req.user?.email,
        featureKey,
        quantity: req.body.quantity ? Number(req.body.quantity) : 1,
        billingCycle: req.body.billingCycle || 'MONTHLY',
        actor: req.user?.email || 'Provider'
      });

      res.status(201).json({ success: true, quote });
    } catch (error: any) {
      console.error('Error in SubscriptionController.generateAddonQuote:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل في إنشاء عرض السعر المعتمد للميزة الإضافية' });
    }
  };

  /**
   * P1.6 — Get Quote Details by Quote ID
   */
  getQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const quoteId = req.params.quoteId;
      if (!quoteId) {
        res.status(400).json({ success: false, error: 'معرّف عرض السعر مطلوب' });
        return;
      }
      const { financialQuoteService } = await import('../../services/finance/FinancialQuoteService.js');
      const quote = await financialQuoteService.getQuote(quoteId);
      if (!quote) {
        res.status(404).json({ success: false, error: 'عرض السعر غير موجود' });
        return;
      }
      res.json({ success: true, quote });
    } catch (error: any) {
      console.error('Error in SubscriptionController.getQuote:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل في جلب تفاصيل عرض السعر' });
    }
  };

  /**
   * P1.6 — Activate Subscription with Verified Payment Event
   */
  activateSubscriptionWithPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = req.body.providerId ? Number(req.body.providerId) : extractProviderId(req);
      const quoteId = req.body.quoteId;
      if (!providerId || !quoteId) {
        res.status(400).json({ success: false, error: 'معرّف المزود ومعرّف عرض السعر المعتمد مطلوبان' });
        return;
      }

      const { subscriptionLifecycleService } = await import('../../services/subscription/SubscriptionLifecycleService.js');
      const result = await subscriptionLifecycleService.activateSubscriptionWithPayment({
        providerId,
        providerEmail: req.body.providerEmail || req.user?.email,
        quoteId,
        paymentId: req.body.paymentId,
        verifiedEventId: req.body.verifiedEventId ? String(req.body.verifiedEventId) : undefined,
        actor: req.user?.email || 'PaymentGateway',
        isUpgrade: req.body.isUpgrade,
        reason: req.body.reason
      });

      res.json({ success: true, message: 'تم تفعيل الاشتراك بنجاح بعد التحقق من الدفع وعرض السعر.', result });
    } catch (error: any) {
      console.error('Error in SubscriptionController.activateSubscriptionWithPayment:', error);
      res.status(error.message?.includes('عدم تطابق') || error.message?.includes('منتهي') || error.message?.includes('تم استخدامه') ? 400 : 500).json({
        success: false,
        error: error.message || 'فشل في تفعيل الاشتراك'
      });
    }
  };

  /**
   * P1.6 — Run Financial Reconciliation Audit
   */
  runReconciliation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { FinancialReconciliationService } = await import('../../services/finance/FinancialReconciliationService.js');
      const reconService = new FinancialReconciliationService();
      
      const providerId = req.body.providerId ? Number(req.body.providerId) : undefined;
      const report = providerId 
        ? await reconService.reconcileProvider(providerId)
        : await reconService.reconcileAll();

      res.json({ success: true, report });
    } catch (error: any) {
      console.error('Error in SubscriptionController.runReconciliation:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل في تشغيل فحص المطابقة المالية' });
    }
  };

  /**
   * P1.6 — Run Test Integrity Suite
   */
  runIntegrityTests = async (req: Request, res: Response): Promise<void> => {
    try {
      const { runFinancialSubscriptionMarketplaceIntegrityTests } = await import('../../tests/financial_subscription_marketplace_integrity.test.js');
      const results = await runFinancialSubscriptionMarketplaceIntegrityTests();
      res.json({ success: true, results });
    } catch (error: any) {
      console.error('Error in SubscriptionController.runIntegrityTests:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل في تشغيل حزمة اختبارات السلامة المالية' });
    }
  };
}

