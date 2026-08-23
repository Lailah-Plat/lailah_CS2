/**
 * @file entitlementService.ts
 * @description خدمة التحقق والبت في صلاحيات وميزات الشركاء (Entitlement Resolver Service).
 * تعمل كمصدر الحقيقة النهائي (Single Source of Truth) للتحقق من الميزات المدفوعة
 * مثل ميزة "متجر المنتجات والمستلزمات المصغر" (mini_products_store).
 */

export type FeatureKey = 
  | 'mini_products_store'
  | 'inventory'
  | 'suppliers'
  | 'invoice_export'
  | 'support'
  | 'growth_charts'
  | 'financial_forecast'
  | 'partial_payment'
  | 'advanced_stats'
  | 'full_management'
  | 'advanced_provider_dashboard'
  | 'logistics_portal'
  | 'provider_staff';

export type EntitlementSource = 'plan' | 'addon' | 'admin_grant' | 'promo' | 'none';

export interface EntitlementResolution {
  featureKey: FeatureKey | string;
  isEntitled: boolean;
  source: EntitlementSource;
  planName?: string;
  expiresAt?: string | null;
  notes?: string;
  isLocked: boolean;
  grantedBy?: string;
}

export interface EntitlementAuditLogEntry {
  id: string;
  providerId: string | number;
  providerName: string;
  featureKey: string;
  featureName: string;
  action: 'grant' | 'revoke' | 'purchase' | 'renew' | 'expire' | 'plan_upgrade';
  source: EntitlementSource;
  performedBy: string;
  reason: string;
  timestamp: string;
  details?: Record<string, any>;
}

class EntitlementService {
  private auditLogsKey = 'SYSTEM_ENTITLEMENT_AUDIT_LOGS';
  private overridesKey = 'SYSTEM_FEATURE_OVERRIDES';

  /**
   * جلب معلومات التحقق الشاملة للميزة لمزود محدد
   */
  public resolve(providerIdOrName: string | number, feature: FeatureKey | string): EntitlementResolution {
    try {
      const pKey = String(providerIdOrName || '').trim();
      const currentProviderName = localStorage.getItem('currentProviderName') || '';
      const currentUserStr = localStorage.getItem('currentUser');
      let currentUser: any = null;
      if (currentUserStr) {
        try { currentUser = JSON.parse(currentUserStr); } catch (e) {}
      }

      // إذا كان المستخدم الحالي مشرف أو مدير نظام (Admin) فلديه الصلاحية الكاملة للاختبار
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
        return {
          featureKey: feature,
          isEntitled: true,
          source: 'admin_grant',
          planName: 'إدارة النظام الشاملة',
          isLocked: false,
          notes: 'صلاحية مدير النظام السيادية'
        };
      }

      // 1. التحقق من الاستثناءات والمنح الإداري (Admin Overrides / Grants)
      const overrides = this.getOverrides();
      const directOverride = overrides.find(o => 
        (String(o.providerId) === pKey || o.providerName === pKey || o.providerName === currentProviderName) &&
        o.featureKey === feature
      );

      if (directOverride) {
        // فحص تاريخ انتهاء الصلاحية
        if (!directOverride.expiresAt || new Date(directOverride.expiresAt) > new Date()) {
          if (directOverride.isGranted !== false && directOverride.value !== 'false') {
            return {
              featureKey: feature,
              isEntitled: true,
              source: 'admin_grant',
              expiresAt: directOverride.expiresAt,
              notes: directOverride.notes || 'منح إداري مباشر',
              isLocked: false,
              grantedBy: directOverride.grantedBy || 'الإدارة'
            };
          } else {
            // معطل صراحة بواسطة الإدارة
            return {
              featureKey: feature,
              isEntitled: false,
              source: 'admin_grant',
              notes: 'تم تعطيل الميزة بواسطة الإدارة',
              isLocked: true
            };
          }
        }
      }

      // 2. التحقق من اشتراك المزود والملحقات المشتراة (Addons)
      const keysToTry = [
        pKey ? `provider_subscription_${pKey}` : null,
        currentProviderName ? `provider_subscription_${currentProviderName}` : null,
        currentUser?.name ? `provider_subscription_${currentUser.name}` : null,
        currentUser?.providerName ? `provider_subscription_${currentUser.providerName}` : null,
        'provider_subscription'
      ].filter(Boolean) as string[];

      let subData: any = null;
      for (const k of keysToTry) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            subData = JSON.parse(raw);
            if (subData) break;
          } catch (e) {}
        }
      }

      if (subData) {
        const addons = Array.isArray(subData.addons) ? subData.addons : [];
        const planName = subData.packageName || subData.packageName_display || subData.planName || subData.name || '';

        // أ) التحقق من الشراء كملحق إضافي (Add-on)
        if (
          addons.includes(feature) || 
          (feature === 'mini_products_store' && (addons.includes('mini_store') || addons.includes('mini_products_store') || addons.includes('venue_products_store') || subData.hasMiniStore || subData.includesMiniStore))
        ) {
          return {
            featureKey: feature,
            isEntitled: true,
            source: 'addon',
            planName: planName,
            isLocked: false,
            notes: 'تم الشراء والتفعيل كإضافة مستقلة من سوق الميزات'
          };
        }

        // ب) التحقق من الاشتمال في الباقة الأساسية (Plan Included)
        const planNorm = planName.toLowerCase();
        if (feature === 'mini_products_store') {
          if (
            subData.includesMiniProductsStore === true ||
            subData.includesMiniStore === true || 
            subData.hasMiniStore === true ||
            planNorm.includes('الاحترافية') || 
            planNorm.includes('pro') || 
            planNorm.includes('التميز') ||
            planNorm.includes('الذهبية')
          ) {
            return {
              featureKey: feature,
              isEntitled: true,
              source: 'plan',
              planName: planName,
              isLocked: false,
              notes: `مشمولة ضمن مميزات ${planName || 'الباقة النشطة'}`
            };
          }
        } else if (feature === 'inventory') {
          if (subData.includesInventory || subData.hasInventory || planNorm.includes('business') || planNorm.includes('pro') || planNorm.includes('أعمال') || planNorm.includes('احترافية')) {
            return { featureKey: feature, isEntitled: true, source: 'plan', planName, isLocked: false };
          }
        }
      }

      // في حال عدم وجود أي استحقاق نشط
      return {
        featureKey: feature,
        isEntitled: false,
        source: 'none',
        isLocked: true,
        notes: 'الميزة غير مفعلة في باقتك الحالية'
      };
    } catch (err) {
      console.error('Error resolving entitlement for feature:', feature, err);
      return {
        featureKey: feature,
        isEntitled: false,
        source: 'none',
        isLocked: true
      };
    }
  }

  /**
   * دالة سريعة للتحقق الثنائي البسيط
   */
  public hasFeature(providerIdOrName: string | number, feature: FeatureKey | string): boolean {
    const res = this.resolve(providerIdOrName, feature);
    return res.isEntitled;
  }

  public isEntitled(providerIdOrName: string | number, feature: FeatureKey | string): boolean {
    return this.hasFeature(providerIdOrName, feature);
  }

  /**
   * شراء وتفعيل ميزة للمزود محلياً
   */
  public activateAddon(providerName: string, feature: FeatureKey | string, details?: Record<string, any>): boolean {
    try {
      const subKey = providerName ? `provider_subscription_${providerName}` : 'provider_subscription';
      let currentSub: any = {};
      const existingRaw = localStorage.getItem(subKey) || localStorage.getItem('provider_subscription');
      if (existingRaw) {
        try { currentSub = JSON.parse(existingRaw); } catch (e) {}
      }

      const addons = Array.isArray(currentSub.addons) ? [...currentSub.addons] : [];
      if (!addons.includes(feature)) {
        addons.push(feature);
      }
      if (feature === 'mini_products_store') {
        currentSub.hasMiniStore = true;
        currentSub.includesMiniStore = true;
      }

      currentSub.addons = addons;
      localStorage.setItem(subKey, JSON.stringify(currentSub));
      localStorage.setItem('provider_subscription', JSON.stringify(currentSub));

      // تسجيل في سجل التدقيق Audit Log
      this.addAuditLog({
        providerId: currentSub.providerId || providerName,
        providerName: providerName || currentSub.providerName || 'مزود الخدمة',
        featureKey: String(feature),
        featureName: feature === 'mini_products_store' ? 'متجر المنتجات والمستلزمات المصغر' : String(feature),
        action: 'purchase',
        source: 'addon',
        performedBy: providerName || 'مزود الخدمة (سداد فوري)',
        reason: 'شراء وتفعيل فوري من سوق الميزات الإضافية',
        details
      });

      // إرسال حدث عام لتحديث كافة الواجهات والمكونات الحية
      window.dispatchEvent(new CustomEvent('entitlementUpdated', { detail: { feature, providerName } }));
      return true;
    } catch (e) {
      console.error('Error activating addon:', e);
      return false;
    }
  }

  /**
   * منح أو سحب إداري لميزة مع تسجيل التدقيق
   */
  public setAdminOverride(
    providerId: string | number,
    providerName: string,
    feature: FeatureKey | string,
    isGranted: boolean,
    performedBy: string,
    reason: string,
    expiresAt?: string | null
  ): void {
    const overrides = this.getOverrides().filter(o => 
      !(String(o.providerId) === String(providerId) && o.featureKey === feature)
    );

    overrides.push({
      providerId,
      providerName,
      featureKey: feature,
      isGranted,
      value: isGranted ? 'true' : 'false',
      expiresAt: expiresAt || null,
      grantedBy: performedBy,
      notes: reason,
      updatedAt: new Date().toISOString()
    });

    localStorage.setItem(this.overridesKey, JSON.stringify(overrides));

    // تسجيل التدقيق
    this.addAuditLog({
      providerId,
      providerName,
      featureKey: String(feature),
      featureName: feature === 'mini_products_store' ? 'متجر المنتجات والمستلزمات المصغر' : String(feature),
      action: isGranted ? 'grant' : 'revoke',
      source: 'admin_grant',
      performedBy,
      reason,
      details: { expiresAt }
    });

    window.dispatchEvent(new CustomEvent('entitlementUpdated', { detail: { feature, providerId, providerName } }));
  }

  /**
   * جلب قائمة الاستثناءات الإدارية
   */
  public getOverrides(): any[] {
    try {
      const raw = localStorage.getItem(this.overridesKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * جلب سجل التدقيق الشامل
   */
  public getAuditLogs(): EntitlementAuditLogEntry[] {
    try {
      const raw = localStorage.getItem(this.auditLogsKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    // سجلات افتراضية تأسيسية
    return [
      {
        id: 'LOG-ENT-001',
        providerId: 'PROV-1',
        providerName: 'شركة القاعات المتميزة',
        featureKey: 'mini_products_store',
        featureName: 'متجر المنتجات والمستلزمات المصغر',
        action: 'grant',
        source: 'plan',
        performedBy: 'نظام الباقات',
        reason: 'تضمين تلقائي ضمن الباقة الاحترافية',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'LOG-ENT-002',
        providerId: 'PROV-2',
        providerName: 'قاعة الروشن الملكية',
        featureKey: 'mini_products_store',
        featureName: 'متجر المنتجات والمستلزمات المصغر',
        action: 'purchase',
        source: 'addon',
        performedBy: 'مدير المنشأة',
        reason: 'شراء الإضافة من سوق الميزات بسعر 89 ر.س/شهرياً',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
  }

  /**
   * إضافة سجل تدقيق جديد
   */
  public addAuditLog(entry: Omit<EntitlementAuditLogEntry, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getAuditLogs();
      const newEntry: EntitlementAuditLogEntry = {
        ...entry,
        id: `LOG-ENT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEntry);
      localStorage.setItem(this.auditLogsKey, JSON.stringify(logs.slice(0, 200)));
    } catch (e) {
      console.error('Error recording audit log:', e);
    }
  }
}

export const entitlementService = new EntitlementService();
export default entitlementService;
