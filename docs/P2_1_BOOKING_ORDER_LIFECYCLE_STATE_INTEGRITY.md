# وثيقة التصميم المعماري الموحد لدورة حياة الحجوزات والطلبات وتكامل حالاتها
# P2.1 — Unified Booking & Order Lifecycle and State Integrity Architecture Specification

**تاريخ الإصدار:** 2026-09-05  
**الإصدار:** 2.1.0  
**النطاق المعماري:** منصة "ليلة" (Lailah Platform) — محرك دورة حياة الحجوزات، طلبات الخدمات المستقلة، الباقات، الخدمات الإضافية، والعمليات المالية والتشغيلية المقترنة.  
**المرحلة:** **P2.1 — توحيد دورة حياة الحجز والطلب وضبط تكامل الحالات (State Integrity & Unified State Machine)**.

---

## 1. ملخص تنفيذي ودوافع الهيكلة (Executive Summary & Motivation)

### 1.1 معالجة الخلل الهيكلي: فخ "الحالة الواحدة لكل شيء" (The Single-Status Anti-Pattern)
في الأنظمة التقليدية أو البدايات البرمجية، يتم الاعتماد على حقل نصي أحادي (مثل `status = 'pending' | 'confirmed' | 'cancelled'`) لتمثيل جميع أبعاد الطلب. يُعد هذا النمط خطأً معماريًا فادحًا يؤدي إلى:
1. **خلط الدفع بالتشغيل:** اعتبار الطلب "مؤكداً" لمجرد دفع العميل، حتى وإن لم يوافق المزود أو لم يتم حجز الموعد فعلياً.
2. **خلط الإلغاء بالاسترداد:** افتراض أن إلغاء الحجز يعني بالضرورة إتمام استرداد الأموال للعميل فوراً، مما يعطل تتبع مسارات الاسترداد المصرفية المعلقة.
3. **خلط النزاع بالإلغاء:** إلغاء الحجز تلقائياً بمجرد فتح تذكرة نزاع أو شكوى، مما يحرم الأطراف من استكمال المناسبة أو التسوية الودية.
4. **خلط التنفيذ بالتسوية المالية:** افتراض أن انتهاء وقت الحفلة يعني تحويل الأموال تلقائياً لحساب المزود البنكي دون مراعاة فترة حظر النزاعات (Holding Period) أو اقتطاع عمولة المنصة والضرائب.

### 1.2 المبادئ الحاكمة والثوابت المعمارية الستة (The 6 Golden Invariants)
تُلزم هذه الوثيقة النظام بتطبيق القواعد المعمارية الثابتة التالية بشكل صارم لا يقبل التجاوز:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             الثوابت المعمارية الستة لدورة حياة الحجوزات                          │
├────┬──────────────────────────────────────┬─────────────────────────────────────────────────────┤
│ #1 │ Authorization ≠ Captured Payment     │ التفويض المصرفي وحجز الرصيد (Hold) ليس تحصيلاً نقدياً│
├────┼──────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ #2 │ Cancellation ≠ Refund                │ إلغاء الحجز تشغيلياً يختلف تماماً عن مسار الاسترداد المالي│
├────┼──────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ #3 │ Dispute ≠ Cancelled Booking          │ فتح نزاع أو شكوى لا يلغي الحجز بل يجمّد استحقاق المزود│
├────┼──────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ #4 │ Completion ≠ Settlement              │ اكتمال المناسبة تشغيلياً لا يعني إتمام التسوية المالية│
├────┼──────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ #5 │ Atomic Slot Reservation              │ لا تأكيد لأي حجز دون قفل ذري للموعد لمنع الحجز المزدوج│
├────┼──────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ #6 │ Snapshot Immutability                │ لقطة السياسة والتسعير مثبتة عند الإنشاء ولا تتغير أبداً │
└────┴──────────────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 2. الأبعاد الثمانية المتعامدة لحالة الحجز والطلب (The 8 Orthogonal State Axes)

لكل حجز أو طلب خدمة في النظام، يتم تمثيل حالته عبر **8 محاور مستقلة ومتكاملة**، بحيث يتم تحديث كل محور وفق أحداثه الخاصة دون التأثير المشوه على المحاور الأخرى:

```
                                  ┌───────────────────────────┐
                                  │      Booking / Order      │
                                  │     (الكيان الشامل للحجز)   │
                                  └─────────────┬─────────────┘
          ┌──────────────────┬──────────────────┼──────────────────┬──────────────────┐
          ▼                  ▼                  ▼                  ▼                  ▼
   [1. Lifecycle]     [2. Provider]       [3. Payment]       [4. Refund]       [5. Dispute]
   حالة دورة الحياة     قرار المزود         حالة الدفع        حالة الاسترداد        حالة النزاع
          │                  │                  │                  │                  │
          └──────────────────┴─────────┬────────┴──────────────────┴──────────────────┘
                                       ▼
                       ┌───────────────┴───────────────┐
                       ▼                               ▼
               [6. Fulfillment]              [7. Entitlement & 8. Settlement]
               حالة التنفيذ الميداني              استحقاق المزود والتسوية المالية
```

### 2.1 تفصيل المحاور الثمانية ومصفوفة قيمها:

| # | المحور البرمجي | الحقل في قاعدة البيانات | القيم المعتمدة (Enum Values) | الوصف والدلالة التشغيلية |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **دورة الحياة التشغيلية (Lifecycle)** | `lifecycleStatus` | `DRAFT`<br>`REQUESTED`<br>`AWAITING_PROVIDER`<br>`PROVIDER_ACCEPTED`<br>`CONFIRMED`<br>`IN_EXECUTION`<br>`COMPLETED`<br>`CANCELLED`<br>`REJECTED`<br>`EXPIRED` | يمثل المرحلة العامة للحجز من لحظة الإنشاء وحتى انتهاء المناسبة أو إغلاق الطلب. |
| **2** | **قرار واستجابة المزود (Provider Decision)** | `providerDecision` | `PENDING`<br>`ACCEPTED`<br>`REJECTED`<br>`TIMED_OUT`<br>`AUTO_ACCEPTED` | يوثق موقف المزود الرسمي ومهلة الاستجابة الممنوحة له. |
| **3** | **حالة الدفع والعمليات المصرفية (Payment)** | `paymentState` | `UNPAID`<br>`AUTHORIZED`<br>`AWAITING_PAYMENT`<br>`PROCESSING`<br>`PAID`<br>`FAILED`<br>`VOIDED` | يمثل الوضع المالي الحقيقي لدى بوابة الدفع (مدفوع فعلياً، مفوض ومحجوز، قيد الانتظار). |
| **4** | **حالة الاسترداد المالي (Refund)** | `refundState` | `NONE`<br>`REQUESTED`<br>`UNDER_REVIEW`<br>`APPROVED`<br>`PROCESSED`<br>`REJECTED`<br>`PARTIAL` | يتابع تدفق إعادة الأموال للعميل سواء بالكامل أو جزئياً بناءً على سياسة الإلغاء. |
| **5** | **حالة النزاعات والشكاوى (Dispute)** | `disputeState` | `NONE`<br>`OPEN`<br>`UNDER_INVESTIGATION`<br>`RESOLVED_CLIENT`<br>`RESOLVED_PROVIDER`<br>`REJECTED`<br>`ESCALATED_ADMIN` | يوثق وجود شكوى مفتوحة ويتحكم في تجميد المستحقات المالية تلقائياً. |
| **6** | **حالة التنفيذ الميداني (Fulfillment)** | `fulfillmentState` | `NOT_STARTED`<br>`PREPARING`<br>`IN_PROGRESS`<br>`DELIVERED`<br>`VERIFIED_BY_CLIENT`<br>`ISSUE_REPORTED` | يتابع تجهيز القاعة أو تسليم الخدمة المساندة من قبل فريق المزود على أرض الواقع. |
| **7** | **استحقاق المزود المالي (Entitlement)** | `entitlementState` | `PENDING_HOLD`<br>`MATURED`<br>`BLOCKED_DISPUTE`<br>`RELEASED_FOR_PAYOUT`<br>`FORFEITED` | يتحكم في جاهزية أرباح المزود للتحويل بعد خصم عمولة المنصة والضرائب وانقضاء فترة النزاع. |
| **8** | **التسوية البنكية والتحويل (Settlement)** | `settlementState` | `UNSETTLED`<br>`INCLUDED_IN_BATCH`<br>`SETTLED_PAID`<br>`REVERSED` | يوثق حركة التحويل المالي الفعلي من حساب وسيط المنصة (Escrow) لحساب المزود البنكي (IBAN). |

---

## 3. مسارات دورة الحياة عبر السياسات الأربع المعتمدة (Lifecycle Flows by 4 Policies)

تعتمد النواة الموحدة على مسارات متفرعة بحسب السياسة المثبتة في لقطة الحجز (`bookingPaymentPolicySnapshot`):

```
                               ┌───────────────────────────────────┐
                               │  Customer Submits Booking Request │
                               │  (إنشاء الحجز وتثبيت لقطة السياسة)│
                               └─────────────────┬─────────────────┘
                                                 │
                  ┌──────────────────────────────┼──────────────────────────────┐
                  ▼                              ▼                              ▼
        [1. INSTANT CONFIRM]           [2. APPROVE THEN PAY]          [3. PAY THEN APPROVE]
        ┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
        │ 1. Direct Pay    │           │ 1. Wait Approval │           │ 1. Pre-Pay Hold  │
        │ 2. CONFIRMED     │           │ 2. Open Pay Win  │           │ 2. Wait Approval │
        │ 3. Instant Slot  │           │ 3. Pay & CONFIRM │           │ 3. Accept=CONFIRM│
        └──────────────────┘           └──────────────────┘           │ 4. Reject=REFUND │
                                                                      └──────────────────┘
                                                 │
                                                 ▼
                                       [4. AUTH THEN CAPTURE]
                                       ┌──────────────────┐
                                       │ 1. Pre-Auth Hold │
                                       │ 2. Wait Approval │
                                       │ 3. Accept=Capture│
                                       │ 4. Reject=Void   │
                                       └──────────────────┘
```

---

### 3.1 السياسة الأولى: الحجز الفوري (`INSTANT_CONFIRMATION`)
* **الاستحقاق:** مقتصرة على المزودين المؤهلين المعتمدين في الباقات المتقدمة/الاحترافية مع نسبة التزام تشغيلي عالية.
* **مخطط الحالات التفصيلي:**

```
[DRAFT] 
   └── (Customer Initiates & Submits with Payment)
         ├── Check: Slot Available + Gateway Success (Webhook/Callback Verified)
         ├── Transition:
         │     lifecycleStatus:   CONFIRMED
         │     providerDecision:  AUTO_ACCEPTED
         │     paymentState:      PAID
         │     refundState:       NONE
         │     fulfillmentState:  NOT_STARTED
         │     entitlementState:  PENDING_HOLD
         └── Event Emitted: 'BookingInstantConfirmed'
```

* **قواعد الإلغاء والنزاع:**
  - إلغاء العميل: يخضع لجدول الاسترداد الزمني للسياسة (`refundState = REQUESTED -> APPROVED -> PROCESSED`).
  - إلغاء المزود: **محظور كلياً للمزود بشكل مباشر**؛ يجب رفع طلب عبر الدعم الفني / القوة القاهرة (`Force Majeure`).

---

### 3.2 السياسة الثانية: الموافقة قبل الدفع (`APPROVAL_BEFORE_PAYMENT`) — الخيار الافتراضي الآمن
* **الاستحقاق:** الخيار الأساسي والآمن المتاح لجميع المزودين لتفادي رسوم الاسترداد والنزاعات.
* **مخطط الحالات التفصيلي:**

```
[DRAFT] 
   └── (Customer Submits Request — No Payment Charged)
         ├── Slot Status: SOFT_HOLD (مؤقت حتى رد المزود أو انتهاء المهلة)
         ├── Transition:
         │     lifecycleStatus:   AWAITING_PROVIDER
         │     providerDecision:  PENDING (with providerResponseDeadline)
         │     paymentState:      UNPAID
         └── Event Emitted: 'BookingRequested'

[AWAITING_PROVIDER]
   ├── Action A: المزود يوافق (PROVIDER_ACCEPT)
   │     ├── Transition:
   │     │     lifecycleStatus:   PROVIDER_ACCEPTED
   │     │     providerDecision:  ACCEPTED
   │     │     paymentState:      AWAITING_PAYMENT (with paymentDeadline, e.g. 24h)
   │     └── Event Emitted: 'ProviderAccepted_PaymentWindowOpened'
   │
   │     └── Sub-flow: العميل يدفع خلال المهلة (PAYMENT_CAPTURED)
   │           ├── Transition:
   │           │     lifecycleStatus:   CONFIRMED
   │           │     paymentState:      PAID
   │           │     fulfillmentState:  NOT_STARTED
   │           │     entitlementState:  PENDING_HOLD
   │           └── Event Emitted: 'BookingPaymentConfirmed'
   │
   │     └── Sub-flow: العميل لا يدفع وتنقضي المهلة (PAYMENT_TIMEOUT)
   │           ├── Transition:
   │           │     lifecycleStatus:   EXPIRED
   │           │     paymentState:      VOIDED
   │           └── Event Emitted: 'PaymentWindowExpired_SlotReleased'
   │
   ├── Action B: المزود يعتذر/يرفض (PROVIDER_REJECT)
   │     ├── Transition:
   │     │     lifecycleStatus:   REJECTED
   │     │     providerDecision:  REJECTED
   │     │     paymentState:      UNPAID (لا يوجد أي استرداد لعدم وجود دفع أصلاً)
   │     └── Event Emitted: 'BookingRejectedByProvider'
   │
   └── Action C: انقضاء مهلة رد المزود آلياً (PROVIDER_TIMEOUT)
         ├── Transition:
         │     lifecycleStatus:   EXPIRED
         │     providerDecision:  TIMED_OUT
         │     paymentState:      UNPAID
         └── Event Emitted: 'ProviderResponseTimedOut'
```

---

### 3.3 السياسة الثالثة: الدفع قبل موافقة المزود (`PAYMENT_BEFORE_APPROVAL`)
* **المفهوم:** العميل يدفع مقدماً في حساب الضمان (Escrow) قبل مراجعة المزود.
* **مخطط الحالات التفصيلي:**

```
[DRAFT] 
   └── (Customer Submits and Pays in Advance)
         ├── Transition:
         │     lifecycleStatus:   AWAITING_PROVIDER
         │     providerDecision:  PENDING (with providerResponseDeadline)
         │     paymentState:      PAID
         │     refundState:       NONE
         └── Event Emitted: 'BookingPaymentEscrowed_AwaitingProvider'

[AWAITING_PROVIDER]
   ├── Action A: المزود يوافق (PROVIDER_ACCEPT)
   │     ├── Transition:
   │     │     lifecycleStatus:   CONFIRMED
   │     │     providerDecision:  ACCEPTED
   │     │     paymentState:      PAID
   │     │     fulfillmentState:  NOT_STARTED
   │     │     entitlementState:  PENDING_HOLD
   │     └── Event Emitted: 'EscrowBookingConfirmed'
   │
   ├── Action B: المزود يرفض (PROVIDER_REJECT)
   │     ├── Transition:
   │     │     lifecycleStatus:   REJECTED
   │     │     providerDecision:  REJECTED
   │     │     paymentState:      PAID
   │     │     refundState:       REQUESTED -> APPROVED -> PROCESSED (استرداد كامل 100% فوري)
   │     └── Event Emitted: 'EscrowBookingRejected_RefundTriggered'
   │
   └── Action C: انقضاء مهلة رد المزود (PROVIDER_TIMEOUT)
         ├── Transition:
         │     lifecycleStatus:   EXPIRED
         │     providerDecision:  TIMED_OUT
         │     refundState:       REQUESTED -> APPROVED -> PROCESSED (استرداد كامل 100% فوري)
         └── Event Emitted: 'EscrowBookingTimedOut_RefundTriggered'
```

---

### 3.4 السياسة الرابعة: التفويض ثم التحصيل (`AUTHORIZE_THEN_CAPTURE`)
* **المفهوم:** حجز مؤقت لمبلغ الحجز على بطاقة العميل (Pre-Auth Hold) دون خصم فعلي، والالتقاط عند موافقة المزود.
* **مخطط الحالات التفصيلي:**

```
[DRAFT] 
   └── (Customer Authorizes Card Hold)
         ├── Transition:
         │     lifecycleStatus:   AWAITING_PROVIDER
         │     providerDecision:  PENDING
         │     paymentState:      AUTHORIZED (Hold Placed)
         │     refundState:       NONE
         └── Event Emitted: 'PreAuthHoldPlaced'

[AWAITING_PROVIDER]
   ├── Action A: المزود يوافق (PROVIDER_ACCEPT)
   │     ├── Trigger: Payment Gateway Capture Call (`POST /v1/payments/:id/capture`)
   │     ├── Transition:
   │     │     lifecycleStatus:   CONFIRMED
   │     │     providerDecision:  ACCEPTED
   │     │     paymentState:      PAID
   │     │     fulfillmentState:  NOT_STARTED
   │     │     entitlementState:  PENDING_HOLD
   │     └── Event Emitted: 'PreAuthCaptured_BookingConfirmed'
   │
   ├── Action B: المزود يرفض (PROVIDER_REJECT)
   │     ├── Trigger: Payment Gateway Void Call (`POST /v1/payments/:id/void`)
   │     ├── Transition:
   │     │     lifecycleStatus:   REJECTED
   │     │     providerDecision:  REJECTED
   │     │     paymentState:      VOIDED (فك الحجز فوراً بدون رسوم استرداد)
   │     └── Event Emitted: 'PreAuthVoided_HoldReleased'
   │
   └── Action C: انقضاء مهلة المزود (PROVIDER_TIMEOUT)
         ├── Trigger: Payment Gateway Void Call
         ├── Transition:
         │     lifecycleStatus:   EXPIRED
         │     providerDecision:  TIMED_OUT
         │     paymentState:      VOIDED
         └── Event Emitted: 'PreAuthTimedOut_HoldReleased'
```

---

## 4. مصفوفة الانتقالات الصارمة وقواعد الحماية (Strict State Transition Matrix)

### 4.1 مصفوفة الصلاحيات والانتقالات المسموحة لكل طرف:

| من حالة (From) | إلى حالة (To) | الفاعل المسموح (Actor) | الشروط الإلزامية (Guards / Preconditions) |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `AWAITING_PROVIDER` | `Customer` | اكتمال بيانات الحجز، عدم وجود تعارض زمني في الموعد. |
| `DRAFT` | `CONFIRMED` | `Customer` / `System` | **فقط في سياسة الحجز الفوري** + نجاح الدفع الموثق. |
| `AWAITING_PROVIDER` | `PROVIDER_ACCEPTED` | `Provider` / `Admin` | خلال مهلة الرد (`now < providerResponseDeadline`). |
| `AWAITING_PROVIDER` | `REJECTED` | `Provider` / `Admin` | تسجيل سبب الاعتذار رسمياً. |
| `AWAITING_PROVIDER` | `EXPIRED` | `System (Cron)` | انقضاء مهلة الرد (`now >= providerResponseDeadline`). |
| `AWAITING_PROVIDER` | `CANCELLED` | `Customer` | قبل صدور قرار المزود (إلغاء مبكر بدون غرامة). |
| `PROVIDER_ACCEPTED` | `CONFIRMED` | `Customer` / `Gateway` | سداد ناجح وموثق خلال مهلة الدفع (`now < paymentDeadline`). |
| `PROVIDER_ACCEPTED` | `EXPIRED` | `System (Cron)` | انقضاء مهلة الدفع دون سداد (`now >= paymentDeadline`). |
| `CONFIRMED` | `IN_EXECUTION` | `System` / `Provider` | حلول تاريخ/ساعة المناسبة المتفق عليها. |
| `CONFIRMED` | `CANCELLED` | `Customer` / `Admin` | تطبيق جدول سياسة الإلغاء وحساب الغرامات. |
| `CONFIRMED` | `CANCELLED` | `Provider` | ⛔ **محظور كلياً للمزود مباشرة** (يتطلب طلب قوة قاهرة/إدارة). |
| `IN_EXECUTION` | `COMPLETED` | `System` / `Provider` | انتهاء فترة المناسبة وانقضاء مهلة تسجيل الشكاوى الفورية. |
| `COMPLETED` | `*` (أي حالة) | — | ⛔ **حالة نهائية غير قابلة للتعديل أو الرجوع**. |

---

## 5. الحماية الذرية لمنع الحجز المزدوج (Atomic Slot Reservation & Concurrency Guard)

لمنع حدوث تعارض الحجوزات أو تكرار حجز نفس القاعة في نفس الفترة الزمنية تحت وطأة الطلبات المتزامنة، يتم تطبيق بروتوكول القفل الثنائي:

```
┌────────────────────────────────────────────────────────────────────────┐
│               Double-Booking Prevention Protocol                       │
├──────────────────────────────────┬─────────────────────────────────────┤
│ 1. Database-Level Lock           │ استخدام معاملات عزل قاعدة البيانات  │
│                                  │ (Transaction Isolation Level)       │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 2. Active Slot Status Exclusion  │ استبعاد الحالات التالية فقط:        │
│                                  │ ['CANCELLED', 'REJECTED', 'EXPIRED']│
│                                  │ واعتبار كل ما عداها حاجزاً للموعد.   │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 3. Soft-Hold Expiration          │ الحجوزات قيد الانتظار تحجز الموعد   │
│                                  │ مؤقتاً حتى انقضاء المهل المحددة.    │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 6. إدارة المهل الزمنية والتنفيذ الخادمي الصارم (Server-Side Timeouts & SLA Governance)

يُمنع منعاً باتاً الاعتماد على متصفح العميل أو واجهة المزود لتحديد انقضاء المهل، ويتم تنفيذ الرقابة بالكامل عبر الخادم:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        خادم الرقابة على المهل (Deadline & SLA Worker)                  │
├───────────────────────────────┬────────────────────────────────────────────────────────┤
│ دورية الفحص (Interval)        │ تشغيل آلي كل 60 ثانية عبر `startBookingDeadlineWorker` │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ فحص مهلة رد المزود            │ `WHERE status = 'AWAITING_PROVIDER' AND deadline < NOW`│
│                               │ الإجراء: تحويل إلى `EXPIRED` + إطلاق حدث فوري + تحرير   │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ فحص مهلة سداد العميل          │ `WHERE status = 'PROVIDER_ACCEPTED' AND payDead < NOW` │
│                               │ الإجراء: تحويل إلى `EXPIRED` + إطلاق حدث فوري + تحرير   │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ البث اللحظي (Realtime Events) │ إرسال إشعارات WebSocket (Socket.IO) فورية للطرفين       │
└───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 7. استراتيجية التوافق مع البيانات القديمة وقواعد البيانات (Schema & Backward Compatibility)

لضمان عدم كسر أي حجوزات أو بيانات سابقة في قاعدة البيانات:
1. **الاحتفاظ بالحقول التاريخية:** الإبقاء على حقل `status` و `paymentStatus` مع ربطهما بمحولات قياسية (Getters/Setters & Normalizers) تعكس المحاور الثمانية الجديدة.
2. **الترقية المتدرجة (Dynamic Migration):** إضافة الأعمدة الجديدة (`lifecycleStatus`, `providerDecision`, `refundState`, `disputeState`, `fulfillmentState`, `entitlementState`, `settlementState`) مع تعيين قيم افتراضية آمنة متوافقة مع الحالات السابقة.
3. **لقطات السياسة الموثقة:** تخزين `bookingPaymentPolicySnapshot` كنص JSON غير قابل للتعديل لكل حجز جديد.

---

## 8. مصفوفة سجل الأحداث والتدقيق السيادي (Domain Events & Audit Logging)

يتم تسجيل حدث مدقق (`DomainEvent`) في قاعدة البيانات مع كل انتقال حالة، متضمناً:
* `eventType`: اسم الحدث المعياري (مثل `BookingConfirmed`, `RefundProcessed`, `DisputeOpened`).
* `entityType`: `booking` أو `support_service_request`.
* `entityId`: المعرّف الرقمي والتسلسلي القياسي.
* `actorId` و `actorRole`: معرّف ورتبة المنفذ (`customer`, `provider`, `admin`, `system`).
* `payload`: لقطة كاملة للحالة السابقة والحالة الجديدة والتفاصيل المالية المقترنة.
* `ipAddress` و `timestamp`: العنوان والوقت الدقيق بالثانية.

---

## 9. خلاصة وخطة التنفيذ البرمجي (Implementation Sign-Off)

تم اعتماد هذه المواصفة كمرجع هندسي وحيد وملزم لكافة عمليات دورة حياة الحجوزات والطلبات في منصة "ليلة"، ويتم الانتقال بناءً عليها لتطبيق التحديثات الميدانية في الواجهات الخلفية والأمامية وفق أعلى معايير الجودة والصلابة البرمجية.
