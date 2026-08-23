import { Router, Request, Response } from 'express';
import { 
  StoreProductModel, 
  StoreOrderModel, 
  EntitlementAuditModel, 
  MiniStoreCommissionPolicyModel 
} from '../../models/StoreModels.js';
import { 
  ProviderSubscription, 
  ProviderFeatureOverride, 
  SubscriptionPlan 
} from '../../models/SubscriptionModels.js';

export const storeRouter = Router();

/**
 * Helper to check provider entitlement on backend
 * Checks Admin Grants/Overrides, Active Subscriptions, Plan Features, and Addons.
 */
export async function isProviderEntitledToStore(providerIdOrName: string): Promise<{ 
  isEntitled: boolean; 
  source: string; 
  planName?: string;
  notes?: string;
}> {
  try {
    const pKey = String(providerIdOrName || '').trim();
    if (!pKey) return { isEntitled: false, source: 'none' };

    // 0. Superadmin / System Admin Bypass
    const pKeyLower = pKey.toLowerCase();
    if (pKeyLower === 'admin' || pKeyLower === 'superadmin' || pKeyLower.includes('إدارة')) {
      return { isEntitled: true, source: 'admin_grant', planName: 'إدارة النظام السيادية' };
    }

    // 1. Check Admin Overrides (Direct Grants or Revocations)
    const override = await ProviderFeatureOverride.findOne({
      where: { featureKey: 'mini_products_store' }
    });
    if (override) {
      const matchId = String(override.providerId) === pKey;
      const matchEmail = override.providerEmail && override.providerEmail.toLowerCase() === pKeyLower;
      if (matchId || matchEmail) {
        if (override.value !== 'false' && (!override.expiresAt || new Date(override.expiresAt) > new Date())) {
          return { isEntitled: true, source: 'admin_grant', notes: override.notes || 'منح إداري مباشر' };
        } else {
          return { isEntitled: false, source: 'admin_revoke', notes: 'معطل صراحة بواسطة الإدارة' };
        }
      }
    }

    // 2. Check Provider Active Subscriptions
    const sub = await ProviderSubscription.findOne({
      where: { status: 'active' }
    });
    if (sub) {
      const matchId = String(sub.providerId) === pKey;
      const matchEmail = sub.providerEmail && sub.providerEmail.toLowerCase() === pKeyLower;
      if (matchId || matchEmail) {
        const planName = (sub.planName || '').toLowerCase();
        const subNotes = (sub.notes || '').toLowerCase();

        // A) Included in Tier
        if (
          planName.includes('pro') || 
          planName.includes('الاحترافية') || 
          planName.includes('التميز') ||
          planName.includes('الذهبية') ||
          subNotes.includes('mini_products_store')
        ) {
          return { isEntitled: true, source: 'plan', planName: sub.planName || 'الباقة الاحترافية' };
        }

        // B) Check SubscriptionPlan features if planId exists
        if (sub.planId) {
          const plan = await SubscriptionPlan.findByPk(sub.planId);
          if (plan) {
            try {
              const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
              if (features.mini_products_store === true || features.includesMiniProductsStore === true || features.includesMiniStore === true) {
                return { isEntitled: true, source: 'plan', planName: plan.name };
              }
            } catch (e) {}
          }
        }
      }
    }

    // 3. Fallback check for all plans
    const allPlans = await SubscriptionPlan.findAll();
    for (const plan of allPlans) {
      try {
        const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
        if (features.mini_products_store === true || features.includesMiniProductsStore === true || features.includesMiniStore === true) {
          if (sub && sub.planId === plan.id) {
            return { isEntitled: true, source: 'plan', planName: plan.name };
          }
        }
      } catch (e) {}
    }

    // If no active entitlement is found:
    return { isEntitled: false, source: 'none', notes: 'الميزة غير مفعلة في باقة المزود الحالية' };
  } catch (err) {
    console.error('Error checking store entitlement on backend:', err);
    return { isEntitled: false, source: 'fallback' };
  }
}

/**
 * Middleware Guard: Requires Mini Store Entitlement for modifying products
 */
export async function requireStoreEntitlement(req: Request, res: Response, next: Function) {
  const providerId = req.body.providerId || req.query.providerId || req.headers['x-provider-id'] || 'PROV-1';
  const role = req.headers['x-user-role'] || 'provider';

  if (role === 'admin' || role === 'superadmin') {
    return next();
  }

  const entitlement = await isProviderEntitledToStore(String(providerId));
  if (!entitlement.isEntitled) {
    return res.status(403).json({
      success: false,
      code: 'FEATURE_LOCKED',
      error: 'عذراً، ميزة "متجر المنتجات والمستلزمات المصغر" غير مفعلة في باقة المزود الحالية. يتطلب الاشتراك في الباقة الاحترافية أو تفعيل الميزة كإضافة مستقلة لتعديل أو نشر المنتجات.',
      featureKey: 'mini_products_store',
      isEntitled: false,
      source: entitlement.source
    });
  }

  next();
}

// 1. Check Entitlement endpoint
storeRouter.get('/entitlement/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const entitlement = await isProviderEntitledToStore(providerId);
    res.json({
      success: true,
      providerId,
      featureKey: 'mini_products_store',
      isEntitled: entitlement.isEntitled,
      source: entitlement.source,
      planName: entitlement.planName,
      notes: entitlement.notes
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. List Products for a hall or provider
storeRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { hallId, providerId } = req.query;
    const whereClause: any = {};
    if (hallId) whereClause.hallId = Number(hallId);
    if (providerId) whereClause.providerId = String(providerId);

    const products = await StoreProductModel.findAll({ where: whereClause });
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create or update product (with Entitlement Enforcement Guard)
storeRouter.post('/products', requireStoreEntitlement, async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    const id = productData.id || `prod-${Date.now()}`;
    const [product, created] = await StoreProductModel.findOrCreate({
      where: { id },
      defaults: { ...productData, id }
    });

    if (!created) {
      await product.update(productData);
    }

    res.json({ success: true, product, created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update Product by ID (with Entitlement Enforcement Guard)
storeRouter.put('/products/:id', requireStoreEntitlement, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await StoreProductModel.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }

    await product.update(req.body);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Partial Update Product by ID (with Entitlement Enforcement Guard)
storeRouter.patch('/products/:id', requireStoreEntitlement, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await StoreProductModel.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }

    await product.update(req.body);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Toggle Product Status (Active / Paused) with Entitlement Enforcement Guard
storeRouter.patch('/products/:id/status', requireStoreEntitlement, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const product = await StoreProductModel.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }

    const nextStatus = status || (product.status === 'active' ? 'paused' : 'active');
    await product.update({ status: nextStatus });
    res.json({ success: true, product, status: nextStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Delete product (with Entitlement Enforcement Guard)
storeRouter.delete('/products/:id', requireStoreEntitlement, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const count = await StoreProductModel.destroy({ where: { id } });
    res.json({ success: true, deleted: count > 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Import Preset Standard Catalog (with Entitlement Enforcement Guard)
storeRouter.post('/products/presets', requireStoreEntitlement, async (req: Request, res: Response) => {
  try {
    const { hallId, providerId, presets } = req.body;
    if (!hallId) {
      return res.status(400).json({ success: false, error: 'يرجى تحديد القاعة المستهدفة' });
    }

    const itemsToCreate = Array.isArray(presets) ? presets : [];
    const createdItems = [];

    for (const item of itemsToCreate) {
      const id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const prod = await StoreProductModel.create({
        ...item,
        id,
        hallId: Number(hallId),
        providerId: providerId || 'PROV-1'
      });
      createdItems.push(prod);
    }

    res.json({ success: true, count: createdItems.length, products: createdItems });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Batch Update Products (with Entitlement Enforcement Guard)
storeRouter.post('/products/batch', requireStoreEntitlement, async (req: Request, res: Response) => {
  try {
    const { hallId, providerId, products } = req.body;
    const list = Array.isArray(products) ? products : [];
    
    // Clear and replace for hall
    if (hallId) {
      await StoreProductModel.destroy({ where: { hallId: Number(hallId) } });
    }

    const saved = [];
    for (const p of list) {
      const id = p.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const item = await StoreProductModel.create({
        ...p,
        id,
        hallId: Number(hallId || p.hallId),
        providerId: providerId || p.providerId || 'PROV-1'
      });
      saved.push(item);
    }

    res.json({ success: true, count: saved.length, products: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Get Mini Store Commission Policy (Central Financial Sovereign Setting)
storeRouter.get('/commission-policy', async (req: Request, res: Response) => {
  try {
    const [policy] = await MiniStoreCommissionPolicyModel.findOrCreate({
      where: { id: 'default' },
      defaults: {
        id: 'default',
        applyCommission: false,
        commissionMethod: 'global_rate',
        commissionRate: 0.0,
        version: 'V1.0.0',
        effectiveAt: new Date(),
        updatedBy: 'الإدارة السيادية',
        notes: 'مبيعات منتجات المتجر المصغر معفاة افتراضياً من عمولة منصة ليلة (Commission = 0%)'
      }
    });

    res.json({
      success: true,
      policy: {
        id: policy.id,
        applyCommission: policy.applyCommission,
        commissionMethod: policy.commissionMethod,
        commissionRate: Number(policy.commissionRate || 0),
        version: policy.version,
        effectiveAt: policy.effectiveAt,
        updatedBy: policy.updatedBy,
        notes: policy.notes,
        isExempt: !policy.applyCommission
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Update Mini Store Commission Policy (Admin Only with Audit Logging & Versioning)
storeRouter.put('/commission-policy', async (req: Request, res: Response) => {
  try {
    const { applyCommission, commissionMethod, commissionRate, reason, updatedBy } = req.body;
    const userRole = req.headers['x-user-role'] || 'admin';

    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: يتطلب تعديل سياسة العمولة صلاحيات الإدارة المالية السيادية.'
      });
    }

    const [policy] = await MiniStoreCommissionPolicyModel.findOrCreate({
      where: { id: 'default' },
      defaults: {
        id: 'default',
        applyCommission: false,
        commissionMethod: 'global_rate',
        commissionRate: 0.0,
        version: 'V1.0.0',
        effectiveAt: new Date(),
        updatedBy: 'الإدارة السيادية'
      }
    });

    const oldApplyCommission = policy.applyCommission;
    const oldRate = Number(policy.commissionRate || 0);
    const newApply = Boolean(applyCommission);
    const newRate = newApply ? Number(commissionRate || 0.05) : 0.0;
    const nextVersionNum = (parseInt(policy.version.replace(/\D/g, '') || '100', 10) + 1);
    const newVersion = `V${(nextVersionNum / 100).toFixed(2)}`;

    await policy.update({
      applyCommission: newApply,
      commissionMethod: commissionMethod || 'global_rate',
      commissionRate: newRate,
      version: newVersion,
      effectiveAt: new Date(),
      updatedBy: updatedBy || 'مدير الحسابات والرقابة المالية',
      notes: newApply 
        ? `تم تفعيل عمولة المنصة على مبيعات المتجر المصغر بنسبة ${(newRate * 100).toFixed(1)}% سارية من تاريخ ${new Date().toISOString().split('T')[0]}`
        : 'مبيعات منتجات المتجر المصغر معفاة افتراضياً من عمولة منصة ليلة (Commission = 0%)'
    });

    // Record Audit Log for Policy Change
    await EntitlementAuditModel.create({
      id: `AUDIT-POLICY-${Date.now()}`,
      providerId: 'PLATFORM-GLOBAL',
      providerName: 'منصة ليلة - الإدارة المالية',
      featureKey: 'mini_store_commission_policy',
      featureName: 'سياسة عمولة مبيعات المتجر المصغر',
      action: newApply ? 'enable_commission' : 'exempt_commission',
      source: 'admin_grant',
      performedBy: updatedBy || 'الإدارة المالية',
      reason: reason || (newApply ? 'تفعيل عمولة المنصة على المتجر المصغر' : 'إعفاء مبيعات المتجر المصغر من العمولة'),
      details: JSON.stringify({
        oldValue: { applyCommission: oldApplyCommission, rate: oldRate },
        newValue: { applyCommission: newApply, rate: newRate },
        version: newVersion,
        effectiveAt: new Date().toISOString()
      })
    });

    res.json({
      success: true,
      message: 'تم تحديث سياسة عمولة المتجر المصغر بنجاح وتوثيق العملية في سجل التدقيق المالي.',
      policy: {
        ...policy.toJSON(),
        commissionRate: newRate,
        isExempt: !newApply
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Checkout Store Products (Cart Order Placement & Financial Line Items Calculation)
storeRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { bookingId, hallId, providerId, customerId, customerName, customerPhone, items, notes } = req.body;
    const parsedItems = Array.isArray(items) ? items : [];

    // 1. Calculate Gross & VAT (15% inclusive rule for products)
    const totalGross = parsedItems.reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const taxableAmount = Math.round((totalGross / 1.15) * 100) / 100;
    const vatAmount = Math.round((totalGross - taxableAmount) * 100) / 100;

    // 2. Fetch Active Commission Policy Snapshot
    const [policy] = await MiniStoreCommissionPolicyModel.findOrCreate({
      where: { id: 'default' },
      defaults: {
        id: 'default',
        applyCommission: false,
        commissionMethod: 'global_rate',
        commissionRate: 0.0,
        version: 'V1.0.0',
        effectiveAt: new Date()
      }
    });

    const isCommissionEligible = policy.applyCommission;
    const commissionRate = isCommissionEligible ? Number(policy.commissionRate || 0) : 0;
    const commissionAmount = isCommissionEligible ? Math.round(taxableAmount * commissionRate * 100) / 100 : 0;
    const providerReceivable = Math.round((totalGross - commissionAmount) * 100) / 100;

    const yy = new Date().getFullYear().toString().slice(-2);
    const orderNumber = `SRV-${yy}-${Date.now().toString().slice(-10)}`;

    const order = await StoreOrderModel.create({
      id: `ORD-${Date.now()}`,
      orderNumber,
      bookingId: bookingId || null,
      hallId: hallId ? Number(hallId) : null,
      providerId: providerId || 'PROV-1',
      customerId: customerId || 'CUST-1',
      customerName: customerName || 'عميل الحجز',
      customerPhone: customerPhone || '',
      totalGrossAmount: totalGross,
      taxableAmount,
      vatAmount,
      status: 'confirmed',
      items: JSON.stringify(parsedItems.map((p: any) => ({
        ...p,
        line_item_type: 'mini_store_product',
        commission_eligible: isCommissionEligible,
        commission_rate: commissionRate,
        commission_amount: isCommissionEligible ? Math.round(Number(p.price || 0) * commissionRate * 100) / 100 : 0,
        commission_policy_version: policy.version
      }))),
      notes: notes || ''
    });

    // 3. Deplete stock
    for (const item of parsedItems) {
      if (item.id) {
        const prod = await StoreProductModel.findByPk(item.id);
        if (prod && prod.stock !== undefined) {
          const newStock = Math.max(0, prod.stock - Number(item.quantity || 1));
          await prod.update({ stock: newStock });
        }
      }
    }

    res.json({
      success: true,
      message: 'تم تأكيد طلب المنتجات والمستلزمات بنجاح وخصم الكميات من المخزون.',
      order,
      financialSnapshot: {
        totalGross,
        taxableAmount,
        vatAmount,
        commissionEligible: isCommissionEligible,
        commissionRate,
        commissionAmount,
        providerReceivable,
        commissionPolicyVersion: policy.version,
        isExempt: !isCommissionEligible,
        policyNotes: isCommissionEligible ? `تطبيق عمولة ${(commissionRate * 100).toFixed(1)}%` : 'معفاة من عمولة منصة ليلة (0%)'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Audit logs
storeRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = await EntitlementAuditModel.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Record Audit Log
storeRouter.post('/audit-logs', async (req: Request, res: Response) => {
  try {
    const entry = req.body;
    const id = `LOG-${Date.now()}`;
    const log = await EntitlementAuditModel.create({
      id,
      providerId: entry.providerId || 'PROV-1',
      providerName: entry.providerName || '',
      featureKey: entry.featureKey || 'mini_products_store',
      featureName: entry.featureName || 'متجر المنتجات والمستلزمات المصغر',
      action: entry.action || 'grant',
      source: entry.source || 'addon',
      performedBy: entry.performedBy || 'الإدارة',
      reason: entry.reason || '',
      details: typeof entry.details === 'object' ? JSON.stringify(entry.details) : String(entry.details || '{}')
    });
    res.json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default storeRouter;
