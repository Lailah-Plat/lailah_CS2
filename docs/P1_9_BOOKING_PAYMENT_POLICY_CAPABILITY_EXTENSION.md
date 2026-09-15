# P1.9 — Booking & Payment Policy Capability Extension (تنقيح معماري شامل)
**منصة ليلة — Lailah Platform**
**النطاق:** Subscription Plans / Feature Marketplace / Entitlements / Booking & Payment Policies
**نوع القرار:** Business + Product + Architecture + Financial Control
**الحالة:** معتمد (Approved)

---

## 1. الخلفية والقرار المعماري المعتمد

تعتمد منصة ليلة النموذج المرن والمنضبط التالي لسياسات الحجز والدفع:

1. **السياسة الافتراضية الرسمية للمنصة (Platform Default):** الحجز والتأكيد الفوري (`INSTANT_CONFIRMATION`) هو السياسة الافتراضية الرسمية لمنصة ليلة.
2. **السياسة الأكثر أماناً (Safe Baseline):** موافقة المزود قبل الدفع (`APPROVAL_BEFORE_PAYMENT`) هي المسار الأكثر أماناً وتشغيلياً للمزودين، وليست السياسة الافتراضية للمنصة.
3. **التوحيد الشامل وإلغاء تخصيص الموارد المنفردة (No Per-Resource Overrides):**
   - تم إلغاء أي مفهوم يسمح بتخصيص سياسة الحجز والدفع لكل قاعة أو مكان أو خدمة منفردة.
   - **المعتمد فقط:**
     - **سياسة موحدة لجميع أماكن وقاعات المزود** (`venueBookingPolicy`).
     - **سياسة موحدة لجميع خدمات المزود المستقلة** (`independentServiceBookingPolicy`).
4. **التمكين عبر القدرات والاستحقاقات:** يجوز للإدارة تمكين مزود معين أو باقة معينة من استخدام سياسات بديلة (مثل الدفع المسبق قبل الموافقة، أو التفويض المسبق) عبر مصفوفة الباقات، متجر القدرات (Feature Marketplace)، أو المنح الإدارية (`Admin Grants`).
5. **السيادة والتحكم المالي:** تخضع جميع السياسات لمحرك الاستحقاقات المركزي (`EffectiveEntitlementService`) مع تجميد لقطة السياسة المالية (`BookingPolicySnapshot`) غير القابلة للتعديل عند إنشاء أي حجز.

---

## 2. السياسات الأربع المعتمدة للحجز والدفع (Supported Policies)

| رمز السياسة | المسمى العربي | آلية العمل والتدفق المالي | مستوى الصلاحية والافتراض |
| :--- | :--- | :--- | :--- |
| **`INSTANT_CONFIRMATION`** | **التأكيد الفوري والحجز المباشر** | يتم السداد الفوري وتأكيد الحجز آلياً (`status: confirmed`) دون انتظار موافقة يدوية من المزود، مع التحقق الذري المسبق من عدم وجود تعارض زمني. | **السياسة الافتراضية الرسمية للمنصة (Platform Default)**. |
| **`APPROVAL_BEFORE_PAYMENT`** | **موافقة المزود قبل الدفع (المسار الأكثر أماناً)** | يتم إنشاء الحجز كطلب غير مدفوع (`status: REQUESTED / pending`)، ويُمنح المزود مهلة مراجعة. بعد القبول يسدد العميل خلال مهلة السداد المحددة. | **السياسة الأكثر أماناً تشغيلياً (Safe Baseline)**، وليست الافتراضية للمنصة، ومتاحة لجميع المزودين دون شروط. |
| **`PAYMENT_BEFORE_APPROVAL`** | **الدفع المسبق قبل مراجعة المزود** | يسدد العميل المبلغ كاملاً عند تقديم الطلب (`paymentStatus: مدفوع` أو محتجز كأمانات). في حال رفض المزود أو انتهاء المهلة، تدخل العملية في دورة الاسترداد الرسمية المعتمدة لحساب العميل. | **قدرة مدفوعة / مقيدة (Gated Capability)** تتطلب ترقية الباقة أو تفعيل القدرة من المتجر. |
| **`AUTHORIZE_THEN_CAPTURE`** | **حجز وتفويض المبلغ مسبقاً (Hold & Capture)** | يتم إجراء تفويض مالي وحجز المبلغ على بطاقة العميل الائتمانية / مدى (`status: AUTHORIZED`)، ولا يتم الخصم الفعلي إلا عند قبول المزود للطلب رسمياً. | **قدرة مصرفية متقدمة** تتطلب بوابة دفع تدعم التفويض المسبق والتقاط العمليات. |

---

## 3. محرك الاستحقاقات وربط القدرات (Entitlement Integration)

### 3.1 مفاتيح القدرات في السجل المركزي (`featureRegistry.ts`)
- `booking_payment_policy_control`: القدرة الرئيسية للتحكم المتقدم في سياسات الحجز والدفع.
- `booking_policy.instant_confirmation`: مفتاح السياسة الافتراضية للمنصة.
- `booking_policy.approval_before_payment`: مفتاح المسار الأكثر أماناً (مفعل ومتاح للجميع).
- `booking_policy.payment_before_approval`: مفتاح الدفع المسبق قبل الموافقة.
- `booking_policy.authorize_then_capture`: مفتاح التفويض والحجز المالي المسبق.

### 3.2 قواعد التقييم في `EffectiveEntitlementService`
- يمنع استخدام أي فحص نصي مباشر لنوع الباقة مثل `plan === 'pro'`.
- يتم تقييم الصلاحية ديناميكياً وفق أسبقية الاستحقاق الصارمة:
  $$\text{Override} \succ \text{Temporary Upgrade} \succ \text{Promotion} \succ \text{Admin Grant} \succ \text{Addon} \succ \text{Plan} \succ \text{Default Deny}$$

---

## 4. مستويات التخصيص وهرمية الأسبقية المعتمدة (Precedence Hierarchy)

تحدد السياسة الفعالة لأي حجز وفق الترتيب التنازلي الإلزامي الموحد التالي:

```
[1] سياسة المزود الموحدة (Provider Unified Policy)
    ↳ إما سياسة جميع الأماكن (venueBookingPolicy) أو سياسة جميع الخدمات المستقلة (independentServiceBookingPolicy)
        ↓ (في حال عدم التعيين أو عدم الصلاحية)
[2] السياسة الافتراضية للمنصة (Platform Default Policy)
    ↳ INSTANT_CONFIRMATION (التأكيد الفوري)
        ↓ (في حال عدم توفر صلاحية التأكيد الفوري، يتم الرجوع للمسار الآمن)
[3] المسار الأكثر أماناً (Safe Baseline)
    ↳ APPROVAL_BEFORE_PAYMENT (موافقة المزود قبل الدفع)
```

> **ملاحظة صارمة:** تم إلغاء تجاوز الموارد المنفردة (Resource Overrides). لا توجد سياسة خاصة بقاعة مفردة أو خدمة مفردة.

---

## 5. قواعد الأمان والفشل الآمن (Fail-Closed & Fail-Safe Rules)

1. **الرجوع الآمن التلقائي (Graceful Degradation):**
   إذا تم تكوين المزود بسياسة تتطلب قدرة خاصة ثم انتهى اشتراك المزود أو تم سحب القدرة، فإن محرك `BookingPolicyService` يعيد الحجوزات الجديدة تلقائياً إلى السياسة المتاحة التالية أو المسار الأكثر أماناً `APPROVAL_BEFORE_PAYMENT` دون تعطيل تدفق حجز العملاء.
2. **الرفض الأمني للتكوين غير المصرح به (Security Rejection):**
   عند محاولة المزود تعديل سياسة أماكنه أو خدماته إلى خيار لا يملك استحقاقه عبر الواجهة أو الـ API، يرفض الخادم الطلب برمز **`403 Forbidden`** وكود الخطأ:
   ```json
   {
     "code": "booking_policy_not_entitled",
     "error": "حساب المزود الحالي غير مخول لاستخدام هذه السياسة...",
     "requestedPolicy": "AUTHORIZE_THEN_CAPTURE",
     "allowedPolicies": ["APPROVAL_BEFORE_PAYMENT", "INSTANT_CONFIRMATION"]
   }
   ```

---

## 6. ثبات لقطة السياسة (Immutability of BookingPolicySnapshot)

عند إنشاء أي حجز أو طلب خدمة، يتم التقاط وتجميد كائن اللقطة `BookingPolicySnapshot` وتخزينه بصيغة JSON غير قابلة للتعديل داخل قاعدة البيانات:

```json
{
  "policy": "INSTANT_CONFIRMATION",
  "policySource": "PROVIDER_VENUE_POLICY",
  "resolvedAt": "2026-09-06T10:00:00.000Z",
  "providerId": 1,
  "hallId": 2,
  "providerResponseDeadlineHours": null,
  "customerPaymentDeadlineHours": 0.5,
  "maxPaymentAttempts": 3,
  "termsVersion": "v2.0",
  "entitlementVersion": 1,
  "entitlementsSummary": {
    "hasPolicyControl": true,
    "hasDeadlineControl": false,
    "allowedPolicies": ["APPROVAL_BEFORE_PAYMENT", "INSTANT_CONFIRMATION"]
  },
  "reason": "سياسة الأماكن والقاعات الموحدة المحددة في حساب المزود"
}
```

**قاعدة الثبات:**
- لا تتأثر الحجوزات السابقة بأي تعديل لاحق على سياسات المزود أو باقة اشتراكه.

---

## 7. استقلالية المجالات وفصل المسؤوليات (Separation of Concerns)

تلتزم المنصة بفصل كامل ومستقل بين السياسات التالية وعدم الخلط بينها برمجياً أو محاسبياً:
- **سياسة الحجز والدفع (Booking & Payment Policy):** تحدد توقيت وتدفق السداد والموافقة.
- **سياسة التسعير (Pricing Policy):** تحدد أسعار القاعات، الفترات، المواسم، والويكند (شاملة لضريبة القيمة المضافة 15%).
- **سياسة العمولة (Commission Policy):** تحدد نسبة المنصة السيادية المقتطعة وفق باقة الاشتراك النشطة.
- **سياسة الإلغاء والاسترداد (Cancellation & Refund Policy):** تحدد المهل الزمنية وغرامات الإلغاء ونسب الاسترداد المالي، وتخضع لعمليات الاسترداد الرسمية المعتمدة في النظام.

---

## 8. نقاط النهاية للـ API (API Endpoints Reference)

- `GET /api/bookings/policies/allowed`: جلب السياسات المصرح بها للمزود الحالي وبياناتها التفصيلية.
- `GET /api/bookings/policies/provider-settings`: جلب الإعدادات الموحدة لسياسات المزود (أماكن وخدمات ومهل).
- `PUT /api/bookings/policies/provider-settings`: تحديث الإعدادات الموحدة لسياسات المزود (أماكن وخدمات ومهل).
- `PUT /api/bookings/halls/:id/policy`: (ملغاة ومعطلة آمنياً - ترجع HTTP 410 Deprecated).
- `PUT /api/bookings/services/:id/policy`: (ملغاة ومعطلة آمنياً - ترجع HTTP 410 Deprecated).
- `POST /api/bookings/create`: إنشاء حجز مع حل السياسة وتثبيت `BookingPolicySnapshot`.
- `POST /api/bookings/support-requests`: إنشاء طلب خدمة مع حل السياسة وتثبيت `BookingPolicySnapshot`.
