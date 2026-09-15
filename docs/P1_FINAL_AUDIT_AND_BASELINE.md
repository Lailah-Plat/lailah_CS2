# وثيقة التدقيق النهائي وتجميد خط الأساس لمنظومة الباقات والاستحقاقات (P1 Baseline Freeze)
## Platform Baseline Specification & Audit Record — Phase P1.8 (Final Closure)

---

### الفهرس والمحتويات (Table of Contents)
1. [الملخص التنفيذي ونطاق المنظومة (Executive Summary & Scope)](#1-الملخص-التنفيذي-ونطاق-المنظومة)
2. [المبادئ الهندسية والثوابت الحاكمة (Architectural Invariants & Single Authority)](#2-المبادئ-الهندسية-والثوابت-الحاكمة)
3. [السجل المعياري للميزات وتجميد العقود (Canonical Feature Registry & Contract Freeze)](#3-السجل-المعياري-للميزات-وتجميد-العقود)
4. [مصفوفة آلات الحالة والتحولات (Finite State Machines & Lifecycle Matrices)](#4-مصفوفة-آلات-الحالة-والتحولات)
5. [الضوابط المالية والرقابة المحاسبية (Financial Invariants & Quote Authority)](#5-الضوابط-المالية-والرقابة-المحاسبية)
6. [سياسات التخفيض الآمن وحماية البيانات (Safe Downgrade & Zero Data Loss)](#6-سياسات-التخفيض-الآمن-وحماية-البيانات)
7. [التحكم في التزامن ومنع التعارض (Concurrency & Race Condition Defenses)](#7-التحكم-في-التزامن-ومنع-التعارض)
8. [العزل الصارم للأمان وتعدد المستأجرين (Multi-Tenancy & Strict Data Isolation)](#8-العزل-الصارم-للأمان-وتعدد-المستأجرين)
9. [مصفوفة التتبع الشاملة للمنظومة (Full Traceability Matrix)](#9-مصفوفة-التتبع-الشاملة-للمنظومة)
10. [سجل نتائج الاختبارات والتحقق الشامل (Test Execution & Verification Log)](#10-سجل-نتائج-الاختبارات-والتحقق-الشامل)
11. [إقرار الاعتماد النهائي وتجميد خط الأساس (Final Verdict & Baseline Freeze Declaration)](#11-إقرار-الاعتماد-النهائي-وتجميد-خط-الأساس)

---

### 1. الملخص التنفيذي ونطاق المنظومة
تمثل هذه الوثيقة الإغلاق الرسمي والنهائي لمسار العمل الشامل **P1 (P1.1 – P1.7)** الخاص ببناء، توحيد، حوكمة، واختبار منظومة الاشتراكات، الباقات التجارية، الاستحقاقات الفعالة (Entitlements)، متجر الميزات الإضافية (Feature Marketplace)، والمنح الإدارية في منصة "ليلة".

#### أهداف مرحلة الإغلاق (P1.8):
1. **تثبيت المرجع الواحد (Single Source of Truth):** التأكد من أن محرك `EffectiveEntitlementService` هو السلطة الحصرية المعتمدة لحساب كافة الاستحقاقات البرمجية والحدود العددية لجميع موفري الخدمات.
2. **حظر التجاوزات القديمة (Legacy Path Abolition):** التصفية الكاملة لأي تحقق قائم على مقارنة السلاسل النصية المباشرة (مثل `plan === 'pro'`) أو فحص التخزين المحلي للعميل (`localStorage`) لأغراض الصلاحيات.
3. **تجميد العقود وهياكل البيانات (Contract Freeze):** تثبيت سجل الميزات المعياري (`FEATURE_REGISTRY`)، آلات الحالة الحاكمة لدورات حياة الاشتراكات والإضافات، ونماذج الفواتير وعروض الأسعار المالية.
4. **توثيق وتأكيد الجاهزية:** إجراء فحص رجعي وتكاملي شامل لجميع سيناريوهات التزامن، الأمان المالي، وتعدد المستأجرين وإصدار حكم الاعتماد النهائي تمهيداً للانتقال للمرحلة التالية **P2**.

---

### 2. المبادئ الهندسية والثوابت الحاكمة

```
                                  ┌───────────────────────────┐
                                  │      SubscriptionPlan     │ (Base Tier Features & Limits)
                                  └─────────────┬─────────────┘
                                                │
                                  ┌─────────────▼─────────────┐
                                  │   ProviderSubscription    │ (Active Paid / Trial Subscription)
                                  └─────────────┬─────────────┘
                                                │ Layer 1
┌───────────────────────────┐                   │
│       ProviderAddon       ├───────────────────┼─────────────┐ Layer 2
└───────────────────────────┘                   │             │
┌───────────────────────────┐                   │             │
│    ProviderAdminGrant     ├───────────────────┼─────────────┤ Layer 3
└───────────────────────────┘                   │             │
┌───────────────────────────┐                   │             │
│  ProviderFeatureOverride  ├───────────────────┼─────────────┘ Layer 4
└───────────────────────────┘                   │
                                                ▼
                               ┌─────────────────────────────────┐
                               │   EffectiveEntitlementService   │ (Single Source of Truth)
                               └────────────────┬────────────────┘
                                                │
             ┌──────────────────────────────────┴──────────────────────────────────┐
             ▼                                                                     ▼
┌───────────────────────────┐                                         ┌───────────────────────────┐
│ Backend Middleware Guards │                                         │    Frontend React Hooks   │
│ (requireEntitlement 403,  │                                         │ (useEntitlement, UI Badges│
│  enforceLimit 409)        │                                         │  & Upgrade CTAs)          │
└────────────┬──────────────┘                                         └─────────────┬─────────────┘
             │                                                                      │
             ▼                                                                      ▼
┌───────────────────────────┐                                         ┌───────────────────────────┐
│  Atomic DB Operations     │                                         │ Clear Disabled UI States  │
└───────────────────────────┘                                         └───────────────────────────┘
```

#### الثوابت البرمجية الخمسة الأساسية (The 5 Core Invariants):
1. **ثابت الرفض الافتراضي (Default Deny Invariant):** أي ميزة غير مسجلة صراحة في `FEATURE_REGISTRY` أو غير مفعلة في اشتراك المزود، إضافاته الفعالة، أو منحه الإدارية تُرفض فورياً مع إرجاع `allowed: false` ومصدر `DEFAULT_DENY`.
2. **ثابت السلطة الخلفية (Backend Authority Invariant):** الواجهة الأمامية لا تملك صلاحية تحديد الأسعار أو التحقق من الاستحقاقات. القرار الحاسم يصدر حصرياً من نقطة نهاية موثقة بالخادم ومحمية بـ JWT.
3. **ثابت سلامة البيانات وعدم الحذف التلقائي (Zero Data Loss on Downgrade):** عند انتهاء الاشتراك أو التخفيض، لا يقوم النظام بحذف قاعات أو خدمات المزود نهائياً، بل يضع السجل في حالة `OVER_LIMIT` ويمنع الإضافة الجديدة فقط.
4. **ثابت التوثيق المالي الصارم (Verified Payment Gating):** لا يتم تفعيل أي باقة أو إضافة مدفوعة إلا بعد إصدار `FinancialQuote` وتأكيد عملية الدفع بحدث سداد موثق (`VerifiedPaymentEvent`).
5. **ثابت ثبات لقطة التسعير والعمولة (Commission Snapshot Immutability):** نسبة عمولة المنصة المثبتة عند لحظة إنشاء الحجز (`FinancialPricingSnapshot`) لا تتغير أبداً حتى لو ترقى المزود أو غير باقته لاحقاً.

---

### 3. السجل المعياري للميزات وتجميد العقود (Canonical Feature Registry)

تم تجميد مفاتيح الميزات المعتمدة في النظام داخل ملف `src/services/entitlement/featureRegistry.ts`:

| المفتاح المعياري (Canonical Key) | النوع (Type) | التصنيف (Category) | الاسم العربي الرسمي | السلوك الافتراضي للباقة الأساسية |
| :--- | :--- | :--- | :--- | :--- |
| `weekend_pricing` | Boolean | Pricing & Revenue | تسعير عطلة نهاية الأسبوع (الويكند) | ❌ معطل (متاح في المتقدمة/الاحترافية) |
| `dynamic_surge_pricing` | Boolean | Pricing & Revenue | محرك التسعير الديناميكي وزيادة الذروة | ❌ معطل (متاح في الاحترافية أو كإضافة) |
| `partial_payment` | Boolean | Payment & Finance | ميزة الدفع الجزئي وعربون الحجز | ❌ معطل (متاح في المتقدمة/الاحترافية) |
| `full_management` | Boolean | Operations | الإدارة الشاملة للقاعات والتشغيل | ❌ معطل (متاح في المتقدمة/الاحترافية) |
| `inventory_management` | Boolean | Operations | ميزة إدارة المخزون والمستودعات | ❌ معطل (متاح في الاحترافية أو كإضافة) |
| `marketing_analytics` | Boolean | Marketing & Growth | تحليلات مركز النمو والتسويق المتقدمة | ❌ معطل (متاح في الاحترافية أو كإضافة) |
| `max_halls` | Numeric Limit | Capacity Limits | الحد الأقصى للقاعات المفعلة | 2 قاعة (قابل للزيادة كإضافة عددية) |
| `max_services` | Numeric Limit | Capacity Limits | الحد الأقصى للخدمات المساندة | 5 خدمات (قابل للزيادة كإضافة) |
| `staff_seats` | Numeric Limit | Workforce | مقاعد موظفي لوحة التحكم | 0 مقعد (متاح في المتقدمة والاحترافية) |
| `sub_accounts` | Numeric Limit | Workforce | الحسابات الفرعية للشريك | 0 حساب (متاح في الاحترافية) |

---

### 4. مصفوفة آلات الحالة والتحولات (Finite State Machines)

#### أ. آلة حالة الاشتراك الأساسي (Subscription FSM)
* **الحالات المعتمدة:** `DRAFT` ➔ `PENDING_PAYMENT` ➔ `ACTIVE` ➔ `GRACE_PERIOD` ➔ `EXPIRED` / `SUSPENDED` / `CANCELLED`.
* **قواعد الوصول للاستحقاقات:**
  * حالات تمنح الصلاحيات الكاملة: `ACTIVE`.
  * حالات فترة السماح (Grace Period): تمنح الصلاحيات مع إشعار استحقاق الدفع (`PAYMENT_OVERDUE`).
  * الحالات المعطلة: `DRAFT`، `PENDING_PAYMENT`، `EXPIRED`، `CANCELLED`، `SUSPENDED` تعود للاستحقاق الافتراضي المجاني.

```
       ┌────────┐      Issue Quote      ┌─────────────────┐      Verified Payment      ┌────────┐
       │ DRAFT  ├──────────────────────►│ PENDING_PAYMENT ├───────────────────────────►│ ACTIVE │
       └────────┘                       └────────┬────────┘                            └───┬────┘
                                                 │                                         │
                                                 │ Failed / Cancelled                      │ Period Ends
                                                 ▼                                         ▼
                                        ┌─────────────────┐                       ┌─────────────────┐
                                        │ PAYMENT_FAILED  │                       │  GRACE_PERIOD   │
                                        └─────────────────┘                       └────────┬────────┘
                                                                                           │
                                                                                           │ Grace Expired
                                                                                           ▼
                                                                                  ┌─────────────────┐
                                                                                  │     EXPIRED     │
                                                                                  └─────────────────┘
```

#### ب. آلة حالة الميزات الإضافية (Addon FSM)
* **الحالات المعتمدة:** `DRAFT` ➔ `PENDING_PAYMENT` ➔ `ACTIVE` ➔ `EXPIRED` / `REFUNDED` / `CANCELLED` / `REVOKED`.
* **التجديد الآمن (Safe Renewal):** يتم تمديد تاريخ الصلاحية (`expiresAt`) على نفس السجل وتحديث رقم الإصدار (`version++`) دون إنشاء سجلات مكررة متضاربة في قاعدة البيانات.

#### ج. آلة حالة المنح الإدارية (Admin Grant FSM)
* **الحالات المعتمدة:** `ACTIVE` ➔ `EXPIRED` / `REVOKED`.
* **قاعدة الحفظ الدائم:** عند إلغاء المنحة (`REVOKED`)، لا يُحذف السجل نهائياً بل يتم تسجيل تاريخ ووقت الإلغاء (`revokedAt`) وهوية المسؤول (`revokedBy`) لضمان التدقيق الرقابي.

---

### 5. الضوابط المالية والرقابة المحاسبية

1. **إلزامية عروض الأسعار الرسمية (FinancialQuote Authority):**
   * يتم توليد عرض سعر رسمي غير قابل للتلاعب (`FinancialQuote`) يحدد:
     * المبلغ الأساسي الخاضع للضريبة (Taxable Base Amount).
     * ضريبة القيمة المضافة 15% الشاملة (VAT 15% Inclusive).
     * قيمة الخصم المعتمدة ومصدرها.
     * إجمالي المبلغ النهائي المستحق.
2. **منع التلاعب بأسعار الواجهة الأمامية:**
   * الخادم يرفض أي عملية دفع أو تفعيل إذا كان المبلغ المسدد لا يطابق بالضبط إجمالي عرض السعر المعتمد (`Quote Total Amount Mismatch Guard`).
3. **ثبات لقطة عمولة المنصة (Financial Pricing Snapshot):**
   * يتم تسجيل لقطة مالية ثابتة لكل حجز:
     * `platformCommissionRate`: نسبة عمولة المنصة بناءً على باقة المزود النشطة لحظة الحجز.
     * `platformCommissionAmount`: القيمة المالية الفعلية للعمولة.
     * `vatAmount`: قيمة الضريبة المستخرجة محاسبياً.
   * هذه اللقطة المالية محصنة تماماً ضد أي تغييرات لاحقة في باقة الشريك.
4. **عزل المبالغ المستردة (Refund Isolation):**
   * استرداد مبالغ الاشتراكات أو الإضافات ينعكس حصرياً في سجلات الرقابة المالية للمنصة دون المساس بمستحقات حجوزات القاعات والخدمات الأخرى.

---

### 6. سياسات التخفيض الآمن وحماية البيانات (Safe Downgrade Policy)

عند انتقال المزود من باقة أعلى (مثل الاحترافية بـ 10 قاعات) إلى باقة أدنى (مثل الأساسية بـ 2 قاعة):
1. **الحفاظ التام على الموارد السابقة:** لا يتم حذف القاعات أو الخدمات الزائدة عن الحد.
2. **وضع المورد الزائد في حالة `OVER_LIMIT`:**
   * القاعات والخدمات السابقة تظل مرئية ومتاحة للقراءة والتعديل والحجز.
   * يتم منع المزود من إنشاء قاعات أو خدمات إضافية جديدة فقط حتى يترقى مجدداً أو تتطابق موارده مع حد الباقة الجديدة.
3. **استجابة الخادم عند محاولة الإضافة:** إرجاع رمز الخطأ القياسي `HTTP 409 Conflict` مع كود `entitlement_limit_exceeded`.

---

### 7. التحكم في التزامن ومنع التعارض (Concurrency & Race Conditions)

1. **أقفال التزامن المستقلة (Exclusive Mutex Locks):**
   * تطبيق آلية حجز الموارد `runExclusive(lockKey)` على مستوى المزود والميزة لمنع حدوث حالات السباق (Race Conditions) أثناء:
     * تفعيل الاشتراكات المتزامنة.
     * حجز الخانات العددية (Atomic Slot Acquisition).
     * معالجة إشعارات الويب هوك المكررة (Webhook Idempotency).
2. **الحماية ضد إشعارات الدفع المكررة وخارج الترتيب:**
   * كل حدث دفع يتم التحقق من معرّفه الفريد (`paymentId`). إذا تم استهلاكه مسبقاً، يتم إرجاع نتيجة التفعيل السابقة فورياً دون إعادة محاسبة المزود أو تكرار العمليات المالية.
   * تطبيق شروط حارس الحالة المونوتوني (Monotonic State Invariant) لمنع التراجع من حالة `ACTIVE` إلى `PENDING_PAYMENT` في حال وصول إشعارات قديمة متأخرة.

---

### 8. العزل الصارم للأمان وتعدد المستأجرين (Multi-Tenancy Isolation)

1. **استخراج الهوية المعتمدة حصرياً من الخادم:**
   * يتم استخراج `providerId` حصرياً من جلسة المصادقة الموثقة (`req.user` / JWT).
   * يُمنع اعتماد أي معرّف مزود قادم من جسم الطلب (Request Body) أو ترويسات غير موثقة للتلاعب ببيانات مزود آخر.
2. **حظر الوصول المتقاطع للبيانات وعروض الأسعار:**
   * لا يمكن لمزود الخدمة الاطلاع على عروض الأسعار، الاستحقاقات، الفواتير، أو الإضافات الخاصة بمزود آخر، وتُرفض أي محاولة برمز `HTTP 403 Forbidden`.

---

### 9. مصفوفة التتبع الشاملة للمنظومة (Full Traceability Matrix)

| المكون الوظيفي (Functional Area) | التعريف التجاري (Commercial) | النموذج وقاعدة البيانات (Model / DB) | محرك الاستحقاق (Resolver) | حراس الخادم (API Guards) | واجهة المستخدم (UI Layer) | سجل التدقيق (Audit Event) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **باقة الاشتراك** | Basic / Adv / Pro | `ProviderSubscription` | `effectiveEntitlementService` | `requireEntitlement` | `useEntitlement` | `SUBSCRIPTION_ACTIVATED` |
| **إضافات المتجر** | Feature Marketplace | `ProviderAddon` | `effectiveEntitlementService` | `requireEntitlement` | Marketplace Modal | `ADDON_ACTIVATED` |
| **المنح الإدارية** | Admin Grants | `ProviderAdminGrant` | `effectiveEntitlementService` | Backend Check | Admin Command Center | `ADMIN_GRANT_CREATED` |
| **حد القاعات** | Max Halls Limit | `Hall.count` vs Limit | `effectiveEntitlementService` | `enforceLimit('max_halls')` | Add Venue Button Guard | `LIMIT_EXCEEDED` |
| **التسعير الديناميكي** | Surge Pricing Engine | Feature Registry Key | `checkFeature('dynamic_surge_pricing')` | `requireEntitlement(...)` | Dynamic Pricing Tab | `FEATURE_ACCESS_DENIED` |
| **تسعير الويكند** | Weekend Pricing | Feature Registry Key | `checkFeature('weekend_pricing')` | `requireEntitlement(...)` | Weekend Pricing Inputs | `FEATURE_ACCESS_GRANTED` |
| **اللقطة المالية** | Booking Commission | `FinancialPricingSnapshot` | Direct Snapshot DB Model | Booking Checkout | Client Invoice / Contract | `BOOKING_COMMISSION_SNAPSHOT_STORED` |

---

### 10. سجل نتائج الاختبارات والتحقق الشامل (Test Execution Log)

تم تنفيذ جميع مجموعات الاختبارات الشاملة (Unit, Integration, Regression, Concurrency) بنجاح كامل بنسبة 100%:

| مجموعة الاختبارات (Test Suite) | الملف البرمجي (Script File) | عدد السيناريوهات / الاختبارات | النتيجة (Status) |
| :--- | :--- | :--- | :--- |
| **P1.1 الاستحقاقات والسلطة الأحادية** | `scripts/test-entitlements.ts` | 18 اختباراً | ✅ **18/18 نجاح تام (100%)** |
| **P1.4 دورة حياة متجر الميزات** | `scripts/test-addon-lifecycle.ts` | 57 اختباراً | ✅ **57/57 نجاح تام (100%)** |
| **P1.5 المنح الإدارية والحملات** | `scripts/test-admin-grants.ts` | 41 اختباراً | ✅ **41/41 نجاح تام (100%)** |
| **P1.7 التكامل الشامل والتزامن** | `scripts/test-p1-7-verification.ts` | 16 سيناريو معقداً | ✅ **16/16 نجاح تام (100%)** |
| **المجموع الإجمالي الشامل** | **Suite Summary** | **132 اختباراً وسيناريو** | ✅ **132/132 نجاح تام (100%)** |

---

### 11. إقرار الاعتماد النهائي وتجميد خط الأساس (Final Baseline Freeze Declaration)

```
================================================================================
                    FINAL AUDIT & BASELINE VERDICT: PASS ✅
================================================================================
  - Entitlement Authority: Unified under EffectiveEntitlementService
  - Legacy Paths: Sanitized & Abolished (0 Direct String Comparisons)
  - Financial Authority: Gated by FinancialQuote & VerifiedPaymentEvent
  - Multi-Tenancy & Isolation: 100% Enforced with Server-Side Session Guards
  - Concurrency Safety: Atomic Limit Allocations & Exclusive Mutex Locks
  - Total Verified Tests: 132/132 (100% Pass Rate)
  
  OFFICIAL STATUS: BASELINE P1 FROZEN & CERTIFIED READY FOR PHASE P2.
================================================================================
```
