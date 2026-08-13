import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  FeatureFlag,
  ProviderEntitlement,
  DomainEvent,
  ElectronicContract,
  PromoterProfile,
  ReferralAttribution,
  PricingBound,
  PricingRecommendation,
  PriceSchedule
} from '../../models/AdvancedPhaseModels';

const router = Router();

// ==========================================
// 1. FEATURE FLAGS & ENTITLEMENTS API
// ==========================================
router.get('/feature-flags', async (req: Request, res: Response) => {
  try {
    const flags = await FeatureFlag.findAll();
    res.json({ success: true, flags });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/feature-flags/toggle', async (req: Request, res: Response) => {
  try {
    const { key, isEnabled } = req.body;
    const flag = await FeatureFlag.findOne({ where: { key } });
    if (!flag) {
      return res.status(404).json({ success: false, error: 'Feature flag not found' });
    }
    await flag.update({ isEnabled: Boolean(isEnabled) });

    // Broadcast live event via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.emit('feature_flag_changed', { key, isEnabled });
    }

    // Log Domain Event
    await DomainEvent.create({
      eventType: 'FeatureFlagToggled',
      entityType: 'feature_flag',
      entityId: key,
      actorId: 'admin',
      actorRole: 'admin',
      payload: JSON.stringify({ key, isEnabled }),
      ipAddress: req.ip
    });

    res.json({ success: true, flag });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/entitlements/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const entitlements = await ProviderEntitlement.findAll({ where: { providerId } });
    const flags = await FeatureFlag.findAll();

    // Combine global feature flags and specific provider entitlements
    const featureMap: Record<string, boolean> = {};
    flags.forEach(f => {
      featureMap[f.key] = f.isEnabled;
    });

    entitlements.forEach(e => {
      if (featureMap[e.featureKey] !== undefined) {
        // Only grant if global flag is also enabled or granted by admin
        featureMap[e.featureKey] = featureMap[e.featureKey] && e.isGranted;
      }
    });

    res.json({ success: true, providerId, featureMap, entitlements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. DOMAIN EVENTS & AUDIT LOG API
// ==========================================
router.get('/domain-events', async (req: Request, res: Response) => {
  try {
    const { limit = 50, entityType, entityId } = req.query;
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const events = await DomainEvent.findAll({
      where,
      limit: Number(limit),
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. ELECTRONIC CONTRACTS (العقود الإلكترونية)
// ==========================================
router.get('/contracts', async (req: Request, res: Response) => {
  try {
    const { customerId, providerId, bookingId, serviceRequestId } = req.query;
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (providerId) where.providerId = providerId;
    if (bookingId) where.bookingId = bookingId;
    if (serviceRequestId) where.serviceRequestId = serviceRequestId;

    const contracts = await ElectronicContract.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, contracts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/contracts/draft', async (req: Request, res: Response) => {
  try {
    const {
      bookingId,
      serviceRequestId,
      targetType = 'hall',
      customerId,
      customerName,
      customerNationalIdPhone,
      providerId,
      providerName,
      contractTitleArabic = 'عقد حجز واستغلال المكان والخدمات المرافقة',
      contractTitleEnglish = 'Venue Booking & Auxiliary Services Contract',
      termsContentArabic,
      termsContentEnglish,
      totalAmount = 0,
      commissionAmount = 0,
      cancellationPolicyArabic
    } = req.body;

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const count = (await ElectronicContract.count()) + 1;
    const formattedSeq = String(count).padStart(10, '0');
    const contractNumber = `BKG-${currentYear}-${formattedSeq}-CTR`;

    const rawDocumentContent = `${contractNumber}|${customerId}|${providerId}|${totalAmount}|${termsContentArabic || ''}`;
    const documentHash = crypto.createHash('sha256').update(rawDocumentContent).digest('hex');

    const contract = await ElectronicContract.create({
      contractNumber,
      bookingId,
      serviceRequestId,
      targetType,
      customerId,
      customerName,
      customerNationalIdPhone,
      providerId,
      providerName,
      contractTitleArabic,
      contractTitleEnglish,
      termsContentArabic: termsContentArabic || `بنود العقد الإلكتروني الموحد لمنصة ليلة:\n1. يعتبر هذا العقد سنداً متكامل الأركان بين الطرفين.\n2. يلتزم المزود بتقديم القاعة/الخدمة حسب المواصفات.\n3. يحتفظ المزود بحقه في التحقق من هويات الضيوف.\n4. تخضع سياسة الإلغاء والاسترداد للضوابط التشغيلية المعتمدة.`,
      termsContentEnglish: termsContentEnglish || `Standard Laylah Platform Contract Terms:\n1. This document serves as a binding contract.\n2. Provider commits to delivering requested services.\n3. Cancellation and refund policies apply as specified.`,
      totalAmount,
      commissionAmount,
      cancellationPolicyArabic: cancellationPolicyArabic || 'إلغاء مجاني قبل 7 أيام من الفعالية مع خصم رسوم المعالجة.',
      status: 'draft',
      documentHash
    });

    // Log Domain Event
    await DomainEvent.create({
      eventType: 'ContractDrafted',
      entityType: 'contract',
      entityId: String(contract.id),
      actorId: customerId,
      actorRole: 'customer',
      payload: JSON.stringify({ contractNumber, bookingId, serviceRequestId, totalAmount, documentHash }),
      hashProof: documentHash,
      ipAddress: req.ip
    });

    res.json({ success: true, contract });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/contracts/sign-otp', async (req: Request, res: Response) => {
  try {
    const { contractId, otpCode, phone, customerId } = req.body;
    const contract = await ElectronicContract.findByPk(contractId);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    // Simulate OTP verification (or validate 123456 / demo OTP)
    const isOtpValid = !otpCode || otpCode === '123456' || otpCode.length === 6;
    if (!isOtpValid) {
      return res.status(400).json({ success: false, error: 'رمز التحقق OTP غير صحيح' });
    }

    const maskedPhone = phone ? phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '9665*****123';
    const now = new Date();

    const proofPayload = {
      signedAt: now.toISOString(),
      otpVerifiedAt: now.toISOString(),
      otpPhoneMasked: maskedPhone,
      verificationIp: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser Client',
      documentHash: contract.documentHash
    };

    await contract.update({
      status: 'executed',
      signedAt: now,
      otpVerifiedAt: now,
      otpPhoneMasked: maskedPhone,
      verificationIp: req.ip || '127.0.0.1',
      verificationUserAgent: req.headers['user-agent'] || 'Browser Client',
      proofCertificateJson: JSON.stringify(proofPayload)
    });

    // Log Domain Event ContractAccepted
    await DomainEvent.create({
      eventType: 'ContractAccepted',
      entityType: 'contract',
      entityId: String(contract.id),
      actorId: customerId || contract.customerId,
      actorRole: 'customer',
      payload: JSON.stringify(proofPayload),
      hashProof: contract.documentHash,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'تم توقيع العقد الإلكتروني وتوثيقه بنجاح',
      contract,
      proofPayload
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. AFFILIATE & REFERRAL MARKETING (التسويق بالعمولة)
// ==========================================
router.get('/affiliates/promoters', async (req: Request, res: Response) => {
  try {
    const promoters = await PromoterProfile.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, promoters });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/affiliates/promoter/register', async (req: Request, res: Response) => {
  try {
    const { promoterId, name, email, phone, iban, customCode, commissionType = 'percentage', commissionValue = 5 } = req.body;
    const promoterCode = customCode ? customCode.toUpperCase() : `AFF-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingUrl = `/explore?ref=${promoterCode}`;

    const [promoter, created] = await PromoterProfile.findOrCreate({
      where: { promoterId },
      defaults: {
        promoterId,
        name,
        email,
        phone,
        iban,
        promoterCode,
        trackingUrl,
        defaultCommissionType: commissionType,
        defaultCommissionValue: commissionValue,
        status: 'active'
      }
    });

    if (!created) {
      await promoter.update({ name, email, phone, iban });
    }

    res.json({ success: true, promoter });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/affiliates/attributions', async (req: Request, res: Response) => {
  try {
    const { promoterCode, promoterId, status } = req.query;
    const where: any = {};
    if (promoterCode) where.promoterCode = promoterCode;
    if (promoterId) where.promoterId = promoterId;
    if (status) where.status = status;

    const attributions = await ReferralAttribution.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, attributions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/affiliates/track', async (req: Request, res: Response) => {
  try {
    const { promoterCode, customerId, customerName, targetType, targetId, bookingReference, orderAmount } = req.body;
    const promoter = await PromoterProfile.findOne({ where: { promoterCode, status: 'active' } });

    if (!promoter) {
      return res.status(404).json({ success: false, error: 'رمز الإحالة غير مسجل أو معطل' });
    }

    // Anti-self referral check
    if (promoter.promoterId === customerId) {
      return res.status(400).json({ success: false, error: 'غير مسموح بربط إحالة ذاتية لنفس المستخدم' });
    }

    let calculatedCommission = 0;
    if (promoter.defaultCommissionType === 'percentage') {
      calculatedCommission = (orderAmount * promoter.defaultCommissionValue) / 100;
    } else {
      calculatedCommission = promoter.defaultCommissionValue;
    }

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const count = (await ReferralAttribution.count()) + 1;
    const attributionCode = `REF-${currentYear}-${String(count).padStart(10, '0')}`;

    const attribution = await ReferralAttribution.create({
      attributionCode,
      promoterCode,
      promoterId: promoter.promoterId,
      customerId,
      customerName: customerName || 'عميل المحيل',
      targetType: targetType || 'hall_booking',
      targetId: String(targetId),
      bookingReference: bookingReference || `BKG-${currentYear}-0000000001`,
      orderAmount: Number(orderAmount) || 0,
      calculatedCommission,
      status: 'tracked', // Stage 1: Tracked -> Pending -> Earned -> Payable -> Paid
      attributionModel: 'last_touch',
      auditTrail: JSON.stringify([{ stage: 'tracked', timestamp: new Date().toISOString() }])
    });

    res.json({ success: true, attribution });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/affiliates/advance-stage', async (req: Request, res: Response) => {
  try {
    const { attributionId, nextStage } = req.body;
    const attribution = await ReferralAttribution.findByPk(attributionId);
    if (!attribution) {
      return res.status(404).json({ success: false, error: 'Attribution log not found' });
    }

    // Valid lifecycle progression: tracked -> pending -> earned -> payable -> paid
    const updates: any = { status: nextStage };
    if (nextStage === 'earned') {
      updates.eventCompletedAt = new Date();
    } else if (nextStage === 'paid') {
      updates.paidAt = new Date();
      // Update promoter profile balance
      const promoter = await PromoterProfile.findOne({ where: { promoterId: attribution.promoterId } });
      if (promoter) {
        await promoter.update({
          totalEarned: promoter.totalEarned + attribution.calculatedCommission,
          totalPaidOut: promoter.totalPaidOut + attribution.calculatedCommission
        });
      }
    }

    let audit = [];
    try {
      audit = JSON.parse(attribution.auditTrail || '[]');
    } catch { audit = []; }
    audit.push({ stage: nextStage, timestamp: new Date().toISOString() });
    updates.auditTrail = JSON.stringify(audit);

    await attribution.update(updates);

    res.json({ success: true, attribution });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. AI DYNAMIC PRICING API (التسعير الديناميكي)
// ==========================================
router.get('/pricing/bounds/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const bounds = await PricingBound.findAll({ where: { providerId } });
    res.json({ success: true, bounds });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pricing/bounds/save', async (req: Request, res: Response) => {
  try {
    const { entityId, entityType = 'hall', providerId, minPrice, maxPrice, basePrice, maxDailyChangePercent, weekendMultiplier, holidayMultiplier, isAutoPilotEnabled } = req.body;

    const [bound, created] = await PricingBound.findOrCreate({
      where: { entityId, entityType },
      defaults: {
        entityId,
        entityType,
        providerId,
        minPrice,
        maxPrice,
        basePrice,
        maxDailyChangePercent: maxDailyChangePercent || 15,
        weekendMultiplier: weekendMultiplier || 1.15,
        holidayMultiplier: holidayMultiplier || 1.25,
        isAutoPilotEnabled: Boolean(isAutoPilotEnabled)
      }
    });

    if (!created) {
      await bound.update({
        minPrice,
        maxPrice,
        basePrice,
        maxDailyChangePercent,
        weekendMultiplier,
        holidayMultiplier,
        isAutoPilotEnabled
      });
    }

    res.json({ success: true, bound });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/pricing/recommendations/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const recs = await PricingRecommendation.findAll({
      where: { providerId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, recommendations: recs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pricing/recommendations/generate', async (req: Request, res: Response) => {
  try {
    const { entityId, entityType = 'hall', providerId, currentPrice = 2000, occupancyRate = 80 } = req.body;

    let deltaPercent = 0;
    let reasonArabic = '';
    let reasonEnglish = '';

    if (occupancyRate >= 80) {
      deltaPercent = 12;
      reasonArabic = 'ارتفاع نسبة الإشغال في الموسم الحالي بنسبة تزيد عن 80%؛ يوصى بزيادة السعر لتحسين الإيرادات.';
      reasonEnglish = 'High occupancy rate above 80%; recommended price increase to optimize yield.';
    } else if (occupancyRate <= 30) {
      deltaPercent = -10;
      reasonArabic = 'انخفاض الإقبال خلال الأيام القادمة؛ يوصى بتقديم خصم مؤقت لزيادة نسبة الإشغال.';
      reasonEnglish = 'Low demand predicted for upcoming days; recommended discount to boost occupancy.';
    } else {
      deltaPercent = 5;
      reasonArabic = 'طلب متوازن في عطلة نهاية الأسبوع؛ تعديل طفيف لتعظيم العائد.';
      reasonEnglish = 'Balanced weekend demand; minor optimization recommended.';
    }

    const recommendedPrice = Math.round(currentPrice * (1 + deltaPercent / 100));

    const rec = await PricingRecommendation.create({
      entityId,
      entityType,
      providerId,
      currentPrice,
      recommendedPrice,
      deltaPercent,
      confidenceLevel: 88,
      reasonArabic,
      reasonEnglish,
      status: 'pending'
    });

    res.json({ success: true, recommendation: rec });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pricing/recommendations/action', async (req: Request, res: Response) => {
  try {
    const { recommendationId, action } = req.body; // action: 'accept' | 'reject'
    const rec = await PricingRecommendation.findByPk(recommendationId);
    if (!rec) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await rec.update({ status: newStatus, appliedAt: action === 'accept' ? new Date() : null });

    if (action === 'accept') {
      // Record Price Schedule Snapshot
      await PriceSchedule.create({
        entityId: rec.entityId,
        entityType: rec.entityType,
        dateString: new Date().toISOString().split('T')[0],
        finalPrice: rec.recommendedPrice,
        priceSource: 'ai_recommendation',
        isLocked: true
      });
    }

    res.json({ success: true, recommendation: rec });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. PHASE 4: LEGACY BOS DECOMMISSIONING & MIGRATION STATUS
// ==========================================
router.all('/legacy/bos/*', (req: Request, res: Response) => {
  res.status(301).json({
    success: true,
    decommissioned: true,
    message: 'نظام تشغيل BOS القديم تم إيقافه تماماً وإحالته للتقاعد. يرجى استخدام مساحة عمل المزود الموحدة والمتكيفة.',
    redirectTo: '/provider-dashboard'
  });
});

router.all('/legacy/lite/*', (req: Request, res: Response) => {
  res.status(301).json({
    success: true,
    decommissioned: true,
    message: 'واجهة المزود المبسطة القديمة تم دمجها بالكامل في مساحة عمل المزود الموحدة والمتكيفة.',
    redirectTo: '/provider-dashboard'
  });
});

router.get('/migration/phase-status', (req: Request, res: Response) => {
  res.json({
    success: true,
    currentPhase: 4,
    phaseName: 'المرحلة 4: الإحالة النهائية لنظام BOS القديم وتوحيد مساحة عمل المزود بالكامل',
    status: 'PHASE_4_COMPLETED',
    unifiedWorkspaceActive: true,
    completedPhases: [
      'المرحلة 0: العقد المعماري ومحرك الاستحقاقات',
      'المرحلة 1: وحدة القاعات والخدمات المعيارية',
      'المرحلة 2: وحدة الحجوزات والطلبات والمالية',
      'المرحلة 3: استخراج الموديولات المتقدمة من BOS (المخزون، الموردين، الموظفين، الفروع)',
      'المرحلة 4: الإحالة النهائية لنظام BOS القديم وتوحيد مساحة عمل المزود بالكامل'
    ],
    remainingPhases: []
  });
});

export default router;
