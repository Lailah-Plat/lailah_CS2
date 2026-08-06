# وثيقة المعمارية الموحدة والمعايير التشغيلية الشاملة لمعالجة المدفوعات والتقسيم والتسوية المؤجلة والاسترداد
## (Unified Payments, Split Transactions, Deferred Payouts & Refunds Architecture Reference)
**الإصدار الموحد النهائي: Version 2.5 (Master Integration)**  
**التاريخ: 1 أغسطس 2026**  
**الجهة: منصة ليلة (Laylah Platform) - المرجع الهندسي والتنفيذي الأعلى**

---

## 1. الملخص التنفيذي وفلسفة التصميم المعماري (Executive Summary & Architectural Philosophy)

تحدد هذه الوثيقة المرجعية الموحدة والمعمارية المتكاملة الهيكلية النهائية لمعالجة المدفوعات، والتقسيم المالي، والتسويات المؤجلة، والاسترداد الكلي والجزئي، والمطابقة البنكية لمنصة **ليلة** بصفتها منصة حجوزات ومناسبات وسيطة بين العملاء (Clients) ومزودي الخدمات والمنشآت (Providers).

### 1.1 المبدأ المركزي: الفصل الثلاثي المستقل (The Triple-Separation Principle)
تعتمد معمارية منصة ليلة على الفصل الصارم والكامل بين ثلاثة مفاهيم مالية وتشغيلية مستقلة:

1. **تحصيل المبلغ من العميل (Payment / Capture):**
   تنفيذ عملية الاقتطاع النقدي الفعلي من بطاقة العميل أو وسيلة الدفع (مدا، فيزا، ماستركارد، أمريكان إكسبريس، تابي، تمارا) عبر بوابة دفع مرخصة.
2. **تسجيل الحقوق والالتزامات (Internal Financial Ledger):**
   دفتر الأستاذ الداخلي المزدوج القيود (Double-entry Ledger) الذي يعكس الحقيقة المحاسبية الفورية والالتزامات المالية المستحقة لكل طرف (المنصة، المزود، الضرائب، الرسوم)، دون أن يمثل محفظة نقدية قانونية أو حساب ضمان.
3. **تحويل صافي المستحق للمزود (Payout / Deferred Settlement):**
   إصدار أمر التحويل المالي الفعلي لصافي مستحقات المزود إلى حسابه البنكي المعتمد بعد انقضاء المناسبة وتحقق كافة شروط التحرير النظامية والتشغيلية.

```
 +------------------+        +--------------------------+        +------------------------+
 |   1. Capture     | -----> |  2. Double-Entry Ledger  | -----> |   3. Deferred Payout   |
 | (Customer Pay)   |        | (Internal Commitments)   |        | (Provider Bank Xfer)   |
 +------------------+        +--------------------------+        +------------------------+
```

### 1.2 قرارات التصميم الأساسية (Core Design Principles)
* **تثبيت اللقطة المالية (Transaction Snapshot):** يتم تثبيت إجمالي الحجز، عمولة المنصة، الضرائب، ونسبة التقسيم في سجل لقطة مالية لا يتغير عند إنشاء الدفع لمنع أي نزاع أو تغير مستقبلي في شرائح العمولات.
* **التحصيل الفوري والتسوية المؤجلة (Immediate Capture & Deferred Payout):** عدم الاعتماد على التفويض طويل الأجل (Authorization) الممتد لأشهر؛ يتم التحصيل الفوري (Capture) عند تأكيد الحجز وتأجيل التحويل (Payout) حتى بعد انتهاء المناسبة.
* **إستراتيجية المستفيدين المعتمدين (Beneficiary Onboarding & KYB):** ربط كل مزود بملف تحري هوية تجارية (KYB/KYC) وحساب بنكي موثق ومطابق للاسم الرسمي قبل إطلاق أي دفعة.
* **محرك تسوية ذو آلة حالات مستقلة (State Machine Settlement Engine):** تمثيل كل تعليمة تسوية ككيان مستقل له آلة حالات صارمة ونقاط توقف وتعليق (Hold/Cancel) قبل نقطة عدم الرجوع (Cutoff).
* **معالجة الاسترداد المنفصلة (Decoupled Refund Allocations):** احتساب أثر الاسترداد والإلغاء وفق نموذج مخصص يحسب غرامات الإلغاء وعكس العمولات بشكل مستقل عن نسبة التقسيم الأصلية.
* **كتالوج الأحداث الموحد ومراعاة الموثوقية (Canonical Event Catalog & Webhook Ingestion):** اعتبار إشعارات الـ Webhooks إشارات خارجية مهمة يتم التحقق من صحتها وتخزينها، مع إجراء المطابقة الدورية عبر الـ APIs وكشوف الحسابات كمصدر نهائي للحقيقة.
* **جدول القدرات الديناميكي للبوابات (Gateway Capability Matrix):** عدم افتراض دعم أي ميزة في البوابة (مثل عكس التحويل أو التقسيم التلقائي) بناءً على التسويق العام، بل ربط كل بوابة بجدول قدرات موثق تعاقدياً وتقنياً.

---

## 2. سجلات القرارات المعمارية الموحدة (Architecture Decision Records - ADRs)

### ADR-001: عدم الاعتماد على Authorization طويل الأجل حتى تاريخ المناسبة
* **السياق (Context):** تحجز المناسبات قبل موعدها بأسابيع أو أشهر. بعض البوابات تتيح حجز المبلغ (Authorization)، لكن قواعد الشبكات العالمية تفرض انتهاء التفويض خلال 7 إلى 14 يوماً.
* **القرار (Decision):** اعتماد التحصيل الفوري (Capture) عند تأكيد الحجز، وتأجيل صرف مستحق المزود (Payout) عبر محرك التسوية (Settlement Engine) مع تفعيل آلة الحالات.
* **الأثر الإيجابي (Positive Impact):** تجنب فشل التفويضات التلقائي عند حلول موعد الحجز، وتبسيط التوافق بين مختلف بوابات الدفع.
* **الأثر السلبي (Negative Impact):** تحمل المنصة التزام محاسبي أطول، وتحتاج منطق استرداد مالي محكم قبل وبعد التسوية.
* **الخيارات المستبعدة (Rejected Alternatives):** الاعتماد على تمديد الـ Auth (غير مضمون شبكياً)، أو استخدام حساب Escrow خارجي دون ترخيص صريح.

### ADR-002: فصل دفتر الأستاذ (Financial Ledger) كمكون قيادي مستقل
* **السياق (Context):** حاجة المنصة لتمثيل الالتزامات المالية، العمولات، المديونيات، والاحتياطيات بشكل دقيق ومستقل عن حالة الاتصال اللحظية ببوابة الدفع.
* **القرار (Decision):** بناء دفتر أستاذ داخلي بقيد مزدوج (Double-entry Financial Ledger) كمصدر الحقيقة المحاسبي الموحد، مع منع الكتابة المباشرة فيه إلا عبر خدمات قيادية مختصة.
* **الأثر الإيجابي (Positive Impact):** إمكانية تدقيق ومطابقة كافة الأرصدة والقيود بدقة، وإعادة اشتقاق الأرصدة من واقع القيود التراكمية.
* **الأثر السلبي (Negative Impact):** زيادة طبقات المزامنة وتحديد قواعد الاتساق التدريجي (Eventual Consistency).
* **الخيارات المستبعدة (Rejected Alternatives):** الاعتماد على تقارير البوابات الخارجية كمصدر حقيقة وحيد.

### ADR-003: استقلالية محرك التسوية (Settlement Engine) كآلة حالات منفصلة
* **السياق (Context):** دورة حياة تحويل المستحق للمزود تتضمن مراجعات KYB، التأكد من عدم وجود نزاع، فترات سماح، وحالات تعليق إداري.
* **القرار (Decision):** فصل تعليمات التسوية في جدول مستقل `settlement_instructions` يملك آلة حالات خاصة به ومستقلة عن حالة الدفع الأصلية `payments`.
* **الأثر الإيجابي (Positive Impact):** إمكانية تعليق أو إعادة جدولة تحويل المزود دون تغيير حالة دفع العميل الأصلية، ودعم التحويلات الجزئية والمُعادة.
* **الأثر السلبي (Negative Impact):** الحاجة لمزامنة دقيقة بين الأحداث المالية ومرجع أمر التسوية.
* **الخيارات المستبعدة (Rejected Alternatives):** دمج حالة التسوية كحقل نصي فرعي داخل جدول الحجوزات أو المدفوعات.

### ADR-004: عدم قابلية تعديل اللقطة المالية (Transaction Snapshot Immutability)
* **السياق (Context):** قد تتغير قواعد العمولات أو نسبة ضريبة القيمة المضافة أو سياسات الإلغاء بالنظام أثناء الفترة بين الحجز وموعد المناسبة.
* **القرار (Decision):** تجميد وتثبيت كافة القيم النسبية والمالية في سجل `split_transactions` و Snapshot عند إنشاء الحجز، واعتبار أي تصحيح مالي لاحق بمثابة قيد تعديلي جديد (`Adjustment Journal`).
* **الأثر الإيجابي (Positive Impact):** حماية المنصة والمزود من النزاعات التجارية، وحفظ سجل تدقيق قانوني ومالي غير قابل للتلاعب.
* **الأثر السلبي (Negative Impact):** تطلب منطق محاسبي إضافي للتعامل مع الفروقات.
* **الخيارات المستبعدة (Rejected Alternatives):** إعادة إشعال وإعادة حساب العمولة بناءً على السياسات الحالية لحظة التحويل.

### ADR-005: فصل استرداد الإلغاء (Refund Allocation) عن التقسيم الأصلي (Original Split)
* **السياق (Context):** عند إلغاء الحجز، قد تختلف سياسة تحميل الخسارة والغرامات حسب الطرف المتسبب (مثلاً: العميل يلغى بداعي شخصي فتُطبق غرامة إلغاء، أو المزود يتخلف عن تقديم الخدمة فيتحمل كافة الرسوم).
* **القرار (Decision):** بناء جدول ومحرك استرداد مستقل `refund_allocations` يحسب حصة العميل والمزود والمنصة والبوابة لكل عملية استرداد على حدة.
* **الأثر الإيجابي (Positive Impact):** مرونة كاملة في تطبيق مختلف سياسات الإلغاء (Customer cancellation vs Provider no-show vs Force Majeure).
* **الأثر السلبي (Negative Impact):** وجود مصدر حقيقة إضافي لحساب مبالغ الاسترداد يتطلب مطابقة دورية.
* **الخيارات المستبعدة (Rejected Alternatives):** عكس نسب التقسيم الأصلية تلقائياً وبحتمية 100% لكافة حالات الإلغاء.

### ADR-006: إدارة قدرات البوابات عبر Capability Matrix بدل الافتراض
* **السياق (Context):** تختلف بوابات الدفع بالسعودية (ميسر، هايبرباي، بي تابس، جيديا، تابي، تمارا) في دعم ميزات التقسيم الآلي، عكس التحويل، وتوفير الـ APIs الاستعلامية.
* **القرار (Decision):** تسجيل قدرات كل بوابة في مصفوفة `gateway_capabilities` وتفعيل الميزات برمجياً بناءً على العقد المبرم والبيئة الاختبارية.
* **الأثر الإيجابي (Positive Impact):** منع الفشل الصامت أو الانهيارات التشغيلية عند استدعاء أساليب غير مدعومة لدى بوابة معينة.
* **الأثر السلبي (Negative Impact):** الحاجة لتنفيذ مسارات برمجية بديلة (Fallback workflows) عند غياب ميزة لدى البوابة.
* **الخيارات المستبعدة (Rejected Alternatives):** الافتراض المسبق بدعم جميع البوابات للـ Instant Split أو الـ Native Reverse Payout.

---

## 3. المعمارية المرجعية وحدود ملكية البيانات (Architecture & Domain Boundaries)

### 3.1 المكونات التسعة الأساسية ووظائفها
1. **خدمة الحجوزات (Booking Service):** إنشاء الحجز، تثبيت السعر وتاريخ المناسبة، وإدارة شروط التحرير وقواعد الإلغاء.
2. **موجه المدفوعات (Payment Orchestrator):** توجيه عمليات الدفع للبوابة المناسبة، توحيد الطلبات والاستجابات، وإدارة محاولات الدفع.
3. **موصّلات البوابات (Gateway Adapters):** تطبيق بروتوكولات وتفاصيل البوابات (Moyasar, HyperPay, PayTabs, etc.) دون تسريبها للداخل.
4. **دفتر الأستاذ المالي (Financial Ledger):** تسجيل القيود المزدوجة، إدارة حسابات المقاصة، والالتزامات، والمديونيات.
5. **محرك التسوية (Settlement Engine):** جدولة، تعليق، وإطلاق تعليمات تحويل أرباح المزودين بعد تحقق الشروط.
6. **محرك الاسترداد (Refund Engine):** احتساب عرض الاسترداد (Quote)، تطبيق الغرامات، وإصدار قيود عكس الحصص.
7. **مستقبل الإشعارات (Webhook Ingestion):** الاستقبال الآمن، التحقق من التوقيع الرقمي، منع التكرار، والنشر في الطوابير (Queue).
8. **خدمة المطابقة الماليـة (Reconciliation Service):** الاستعلام الدوري، مقارنة كشوف الحسابات والتحويلات مع الدفتر الداخلي وإغلاق الفروقات.
9. **خدمة المخاطر والنزاعات (Risk & Dispute Service):** إدارة تجميد التسويات بسبب النزاعات، الاحتيال، التشارج باك، ومتابعة اكتمال KYB.

```
                                +-----------------------------------+
                                |          Booking Service          |
                                +-----------------------------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |        Payment Orchestrator       |
                                +-----------------------------------+
                                  /               |               \
                                 v                v                v
                     +-----------------+  +---------------+  +-----------------+
                     | Moyasar Adapter |  | PayTabs Adapt |  | HyperPay Adapt  |
                     +-----------------+  +---------------+  +-----------------+
                                  \               |               /
                                   +--------------+--------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |    Webhook Ingestion Service      |
                                +-----------------------------------+
                                                  |
                                                  v
   +-----------------------+    +-----------------------------------+    +-----------------------+
   |  Financial Ledger     | <==|      Canonical Event Bus          |==> |   Settlement Engine   |
   +-----------------------+    +-----------------------------------+    +-----------------------+
               ^                                  ||                                 ^
               |                                  vv                                 |
   +-----------------------+            +-------------------+            +-----------------------+
   |     Refund Engine     |            |  Reconciliation   |            | Risk & Dispute Service|
   +-----------------------+            +-------------------+            +-----------------------+
```

### 3.2 جدول حدود الخدمات وملكية البيانات (Microservices Data Ownership Matrix)
تطبق المنصة قاعدة صارمة: **"لكل جدول خدمة مالكة واحدة فقط يحظر على أي خدمة أخرى الكتابة المباشرة فيه"**.

| الخدمة (Service) | الجداول المملوكة حصرياً (Data Ownership) | عمليات الكتابة المسموحة | القواعد والقيود المحظورة |
| :--- | :--- | :--- | :--- |
| **Booking Service** | `bookings` | إنشاء وتحديث حالة الحجز والتاريخ | يُمنع عليها الكتابة المباشرة في أي جدول دفع أو تسوية |
| **Payment Service** | `payments`, `payment_attempts`, `split_transactions` | تسجيل محاولات الدفع وتثبيت الـ Snapshot | يُمنع الكتابة المباشرة في `ledger_entries`؛ ترسل حدثاً لـ Ledger |
| **Beneficiary Service** | `beneficiaries`, `payment_provider_accounts` | إدارة ملفات المزودين والربط البنكي | يُمنع إنشاء أو تعديل `settlement_instructions` مباشرة |
| **Ledger Service** | `ledger_journals`, `ledger_entries` | تسجيل القيود المحاسبية المزدوجة المتوازنة | يُمنع التعديل أو الحذف؛ التصحيح يتم بقيود عكسية فقط |
| **Settlement Engine**| `settlement_instructions`, `payout_attempts` | إطلاق وتجدولة وتعليق أمر التحويل | يُمنع تعديل `split_transactions` الأصلية بجدول الدفع |
| **Refund Engine** | `refunds`, `refund_allocations` | احتساب وإصدار أوامر الاسترداد | يُنسق مع Settlement Engine لوقف التحويل ولا يغير الدفتر مباشرة |
| **Webhook Ingestion**| `gateway_events` | حفظ جُسيم الإشعار الخام وتوثيق صحته | يُمنع تعديل حالات المدفوعات؛ يكتفي بنشر Canonical Events |
| **Reconciliation** | `reconciliation_runs`, `reconciliation_items` | تسجيل نتائج المطابقة والفروقات | قراءة فقط لكافة الجداول التشغيلية المتبقية |

---

## 4. شجرة الحسابات المنطقية وقيود الدفتر المزدوج (Chart of Accounts & Double-entry Rules)

### 4.1 قائمة الحسابات المعتمدة في الـ Ledger

| اسم الحساب (Account Name) | طبيعة الحساب (Type) | وصف الحساب والهدف منه |
| :--- | :--- | :--- |
| `Gateway clearing` | أصل / حساب مقاصة (Asset) | المبالغ التي تم اقتطاعها وتجميعها لدى البوابة ولم تُطابق بنكياً بعد. |
| `Customer refunds payable` | التزام (Liability) | المبالغ المستحقة للإعادة للعميل ولم تُحول لبطاقته بعد. |
| `Provider payable - pending` | التزام (Liability) | حصة المزود المحتجزة حتى انقضاء الحجز وتحقق شروط التحرير. |
| `Provider payable - available` | التزام (Liability) | حصة المزود المؤهلة والجاهزة للتحويل المالي الفعلي. |
| `Provider payable - paid` | حساب مراقبة (Control) | إجمالي الحصص التي تم تحويلها بالفعل إلى حساب المزود البنكي. |
| `Platform commission revenue` | إيراد (Revenue) | صافي عمولة منصة ليلة المكتسبة قبل/بعد الضريبة. |
| `Gateway fees expense` | مصروف (Expense) | رسوم اقتطاع البوابة والخدمات البنكية التشغيلية. |
| `Provider debit balance` | أصل / مديونية (Asset) | المبالغ المستحقة على المزود نتيجة استرداد لاحق لتسوية مكتملة. |
| `Chargeback reserve` | احتياطي / التزام (Reserve) | مبالغ محتجزة مؤقتاً لتغطية المخاطر والنزاعات والتشارج باك. |

### 4.2 نموذج القيود المحاسبية القياسية (Standard Journal Entries)

1. **عند نجاح تحصيل الحجز من العميل (Capture Success):**
   * **مدين (Debit):** `Gateway clearing` (إجمالي مبلغ الحجز)
   * **دائن (Credit):** `Provider payable - pending` (حصة المزود قبل الرسوم)
   * **دائن (Credit):** `Platform commission revenue` (عمولة المنصة)
   * **دائن (Credit):** `Gateway fees expense` (رسوم البوابة المتوقعة / حسب الترتيب)

2. **عند استحقاق وتحرير حصة المزود بعد المناسبة (Eligibility Reached):**
   * **مدين (Debit):** `Provider payable - pending` (حصة المزود)
   * **دائن (Credit):** `Provider payable - available` (حصة المزود)

3. **عند تنفيذ تحويل المستحق بنجاح لبنك المزود (Payout Execution):**
   * **مدين (Debit):** `Provider payable - available` (المبلغ المحول)
   * **دائن (Credit):** `Gateway/Bank clearing` (المبلغ المحول)

4. **عند الاسترداد للعميل قبل تسوية المزود (Refund Before Payout):**
   * **مدين (Debit):** `Customer refunds payable / Contra accounts` (المبلغ المردود)
   * **دائن (Credit):** `Gateway clearing` أو `Customer refund payable`
   * *(إضافة لقيود عكس حصص المزود والمنصة المعلقة)*

5. **عند الاسترداد للعميل بعد تسوية المزود وتسليم الأرباح (Refund After Payout):**
   * **مدين (Debit):** `Provider debit balance` (حصة المزود المراد استردادها)
   * **مدين (Debit):** `Platform commission reversal` (عكس عمولة المنصة)
   * **دائن (Credit):** `Customer refund payable / Gateway clearing`

6. **عند نجاح استرداد المديونية من تسوية مستقبليـة للمزود (Reverse Transfer Success):**
   * **مدين (Debit):** `Gateway clearing`
   * **دائن (Credit):** `Provider debit balance`

7. **عند تسجيل نزاع تشارج باك (Chargeback Dispute Initiated):**
   * **مدين (Debit):** `Chargeback expense / Reserve`
   * **دائن (Credit):** `Gateway clearing`

### 4.3 قاعدة التوازن الصارمة (Strict Balance Rule)
يُمنع حتماً في قاعدة البيانات ونظام الدفتر نشر أي قيد محاسبي (`Journal`) لا يتحقق فيه شرط:
$$\sum \text{Debits} = \sum \text{Credits}$$
لكل عملة على حدة، وتفشل الممرّة البرمجية تلقائياً ويُرفع تنبيه عالي الخطورة عند حدوث أي اختلال.

---

## 5. دورة حياة العمليات وآلات الحالات (Financial Lifecycles & State Machines)

### 5.1 حالات عملية الدفع (Payment Statuses)

```
                       +-------------------+
                       |     initiated     |
                       +-------------------+
                                 |
                                 v
                       +-------------------+
                       |  requires_action  |
                       +-------------------+
                       /                   \
                      v                     v
            +-------------------+    +-------------------+
            |    authorized     |    |      failed       |
            +-------------------+    +-------------------+
                      |
                      v
            +-------------------+
            |  captured / paid  |
            +-------------------+
             /        |        \
            v         v         v
   +----------+ +-----------+ +--------------------+
   | refunded | | partially | | disputed/chargeback|
   +----------+ | _refunded | +--------------------+
                +-----------+
```

| الحالة (Status) | المعنى التشغيلي | تأثيرها على تأكيد الحجز |
| :--- | :--- | :--- |
| `initiated` | أنشئ الطلب ولم يبدأ العميل عملية الدفع بعد. | لا يؤكد الحجز. |
| `requires_action` | يتطلب خطوة إضافية من العميل (مثل 3DS OTP). | لا يؤكد الحجز. |
| `authorized` | تم حجز المبلغ على بطاقة العميل دون اقتطاع. | عادة لا يؤكد الحجز نهائياً إلا بحالات خاصة. |
| `captured` / `paid` | تم تحصيل واقتطاع المبلغ بنجاح الموثق. | **يؤكد الحجز رسمياً.** |
| `failed` | فشلت عملية الدفع بنهاية مطاف المحاولات. | لا يؤكد الحجز. |
| `voided` | ألغي تفويض الاقتطاع قبل التحصيل. | يلغى الحجز. |
| `partially_refunded`| تم إعادة جزء من المبلغ المقتطع للعميل. | يعتمد على حالة الحجز وسياسة الإلغاء. |
| `refunded` | تم إعادة المبلغ بالكامل للعميل. | يلغى الحجز تلقائياً. |
| `disputed` / `chargeback` | رفع العميل منازعة مع بنكه؛ تجمّد التسوية. | ترفع حالة مخاطر وتجمد المبالغ. |

### 5.2 حالات تعليمات التسوية للمزود (Settlement Instruction States)

```
+-------+     +--------------------+     +-----------+     +---------+
| draft | --> | pending_eligibility| --> | scheduled | --> | on_hold | (Freeze/KYC)
+-------+     +--------------------+     +-----------+     +---------+
                                               |                | (Resume)
                                               v                v
                                   +-------------------+  +---------------+
                                   | release_requested |  |   cancelled   |
                                   +-------------------+  +---------------+
                                             |
                                             v
                                   +-------------------+
                                   |    processing     |
                                   +-------------------+
                                    /                 \
                                   v                   v
                         +-------------------+   +-------------------+
                         |       paid        |   |      failed       |
                         +-------------------+   +-------------------+
                                   |
                                   v
                         +-------------------+
                         | reversed /        |
                         | partially_reversed|
                         +-------------------+
```

* **ملاحظة معمارية حاسمة:** لا تُستخدم حالة `released` للدلالة على وصول الأموال! تم الفصل الصارم بين `release_requested` (طلب تحرير المستحق)، `processing` (أمر بنكي قيد التنفيذ)، و `paid` (تأكيد وصول التحويل للبنك والمرجع البنكي مكتمل).

---

## 6. قواعد ومخطط تفرع الاسترداد (Unified Refund Decision Logic)

```
                             [ طلب استرداد مالي ]
                                       |
                                       v
                        { هل الطلب مصرح به وسياسة الإلغاء تسمح؟ }
                                 /          \
                             (نعم)          (لا) ---> [ رفض موثق مع السبب ]
                               /
                              v
                   [ حساب Quote المبلغ القابل للاسترداد ]
                               |
                               v
                  { هل تم تحويل حصة المزود بنكياً؟ }
                            /            \
                        (قبل)            (بعد)
                         /                  \
                        v                    v
       [ خفض/إلغاء settlement_instruction ]   [ إن أمكن Reverse Transfer ]
       [ وعكس الحصص المعلقة              ]   [ وإلا تسجيل Provider Debit ]
                        \                    /
                         +---------+--------+
                                   |
                                   v
                   [ إرسال Full/Partial Refund للبوابة ]
                                   |
                                   v
                        { هل نجح الاسترداد للبوابة؟ }
                               /          \
                           (نعم)          (غير مؤكد/Timeout)
                             /                      \
                            v                        v
             [ تسجيل قيود الاسترداد بالدفتر ]     [ حالة refund_pending ]
             [ وتحديث المبالغ وإشعار الطرفين]     [ تشغيل Reconcile قبل Retry ]
```

### 6.1 مصفوفة الاسترداد حسب اللحظة المالية (Refund Timing Matrix)

| اللحظة المالية (Financial Phase) | الأثر على آلة التسوية | الإجراء المالي والتطبيقي الصحيح |
| :--- | :--- | :--- |
| **قبل التحصيل (Pre-Capture)** | لا توجد حصة محصلة للمزود. | تنفيذ `Cancel` أو `Void` للتفويض، وليس `Refund`. |
| **بعد التحصيل وقبل التسوية (Post-Capture / Pre-Payout)** | إلغاء أو تخفيض قيمة `settlement_instruction`. | تنفيذ `Full/Partial Refund` مع خفض المستحق المعلق فوراً. |
| **أثناء معالجة التحويل (During Processing / Cutoff)** | محاولة إلغاء أمره البنكي أو انتظار نتيجة البنك. | وضع الطلب بحالة `refund_pending_settlement_resolution`. |
| **بعد التحويل للمزود (Post-Payout / Paid)** | استرداد من تسويات مستقبلية أو تسديد مديونية. | تنفيذ `Refund` للعميل، واستدعاء `Reverse Transfer` للمزود أو تقييد `Provider Debit`. |

---

## 7. قاعدة البيانات الشاملة الموحدة (Unified Database Schema - ERD)

```
 +------------------+          +------------------+          +-------------------+
 |     bookings     | 1      N |     payments     | 1      N |   beneficiaries   |
 |------------------|<---------|------------------|--------->|-------------------|
 | id (PK)          |          | id (PK)          |          | id (PK)           |
 | provider_id (FK) |          | booking_id (FK)  |          | provider_id (FK)  |
 | customer_id (FK) |          | gross_amount     |          | kyc_status        |
 | event_at         |          | status           |          | bank_account_id   |
 +------------------+          +------------------+          +-------------------+
          ^                             |                              ^
          | 1                           | 1                            | 1
          |                             v N                            |
          |                    +------------------+                    |
          |                    |split_transactions|                    |
          |                    |------------------|                    |
          |                    | id (PK)          |                    |
          |                    | payment_id (FK)  |                    |
          |                    | provider_id (FK) |                    |
          |                    | role, amount     |                    |
          |                    +------------------+                    |
          |                             | 1                            |
          |                             v N                            |
          |                    +-----------------------+               |
          +--------------------|settlement_instructions|---------------+
                               |-----------------------| N
                               | id (PK)               |
                               | payment_id (FK)       |
                               | beneficiary_id (FK)   |
                               | amount, status        |
                               +-----------------------+
                                        | 1
                                        v N
                               +--------------------+
                               |refunds / allocations|
                               +--------------------+
```

### 7.1 جدول التقسيم المالي المثبّت (`split_transactions`)

```sql
CREATE TABLE split_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    provider_id UUID NULL REFERENCES providers(id) ON DELETE RESTRICT, -- NULL for platform/general fees
    role VARCHAR(32) NOT NULL CHECK (role IN ('platform', 'provider', 'gateway_fee', 'tax', 'discount', 'reserve', 'other')),
    type VARCHAR(16) NOT NULL CHECK (type IN ('fixed', 'percentage')),
    amount BIGINT NOT NULL CHECK (amount >= 0), -- Amount in Halalas (e.g., 100000 = 1000.00 SAR)
    percentage DECIMAL(9,6) NULL, -- Reference snapshot percentage
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'available', 'paid', 'refunded', 'reversed', 'cancelled')),
    refundable BOOLEAN NOT NULL DEFAULT TRUE,
    fee_source VARCHAR(32) NOT NULL DEFAULT 'platform',
    rule_version VARCHAR(64) NOT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_split_payment_role_provider UNIQUE (payment_id, role, provider_id, rule_version)
);
```

### 7.2 جدول تعليمات التسوية (`settlement_instructions`)

```sql
CREATE TABLE settlement_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE RESTRICT,
    split_transaction_id UUID NOT NULL REFERENCES split_transactions(id) ON DELETE RESTRICT,
    instruction_no VARCHAR(64) UNIQUE NOT NULL, -- Public business reference (e.g. SRV-26-0000000001)
    amount BIGINT NOT NULL CHECK (amount >= 0), -- Halalas
    currency CHAR(3) NOT NULL DEFAULT 'SAR',
    eligible_at TIMESTAMPTZ NOT NULL, -- Earliest allowed payout time
    scheduled_at TIMESTAMPTZ NULL, -- Target execution date
    status VARCHAR(32) NOT NULL DEFAULT 'pending_eligibility' CHECK (status IN ('draft', 'pending_eligibility', 'scheduled', 'on_hold', 'release_requested', 'processing', 'paid', 'cancelled', 'failed', 'reversed', 'partially_reversed')),
    hold_reason VARCHAR(255) NULL,
    hold_until TIMESTAMPTZ NULL,
    release_conditions JSONB NULL,
    gateway_transfer_id VARCHAR(128) NULL,
    released_at TIMESTAMPTZ NULL,
    paid_at TIMESTAMPTZ NULL,
    failure_code VARCHAR(64) NULL,
    version INT NOT NULL DEFAULT 1, -- Optimistic locking
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 7.3 جدول الجداول المساندة المالية المكتملة

* **`beneficiaries`**: بيانات وملفات المزودين المعتمدين لدى البوابات وحالة الـ KYB والحسابات البنكية.
* **`payment_provider_accounts`**: ربط المزود بحسابه لدى بوابة التحويل الخارجية والعملة المعتمدة.
* **`refunds`**: تسجيل طلب الاسترداد، الحالة، السبب المرجعي، ومبلغ الاسترداد الإجمالي.
* **`refund_allocations`**: توزيع أثر الاسترداد على حصة العميل، المزود، المنصة، والضريبة لكل عملية.
* **`ledger_journals` & `ledger_entries`**: القيود المحاسبية المزدوجة المحفوظة نهائياً وغير القابلة للتعديل.
* **`gateway_events`**: الأحداث الخام الواردة عبر الـ Webhook مع البصمة الرقمية وحالة المعالجة.
* **`payment_attempts`**: سجل تفصيلي لجميع محاولات الدفع المستقلة التي يجريها العميل للحجز نفسه.
* **`payout_attempts`**: محاولات التحويل البنكي للمزود وإجابات وأكواد البوابات الخارجية.
* **`reconciliation_runs` & `reconciliation_items`**: جولات المطابقة الفروقات المالية المكتشفة وإجراءات تسويتها.
* **`disputes` / `chargebacks`**: النزاعات والمبالغ المحتجزة ومستندات الأدلة المرفوعة للبنوك.
* **`financial_policy_versions`**: أرشيف نسخ سياسات العمولة، الإلغاء، ورسوم الخدمة عبر التاريخ.
* **`audit_logs`**: سجل تدقيق أمني شامل لكافة العمليات اليدوية والقرارات الإدارية الحساسة.

---

## 8. كتالوج الأحداث الموحد المكتمل (Canonical Event Catalog)

| اسم الحدث الداخلي (Canonical Event) | الناشر (Publisher) | المستهلكون (Consumers) | هل يسبب نشراً لقيود مالية؟ | قابلية إعادة الإرسال (Replayability) |
| :--- | :--- | :--- | :--- | :--- |
| `payment.initiated` | Payment Service | Notification Service | لا | نعم (Idempotent) |
| `payment.authorized` | Webhook Ingestion | Payment Service | لا | نعم (Idempotent) |
| `payment.captured` | Webhook Ingestion | Payment Service, Ledger, Settlement Engine | **نعم — قيد تحصيل وتقسيم** | نعم (Idempotent عبر `payment_id`) |
| `payment.failed` | Webhook Ingestion | Payment Service, Notification Service | لا | نعم |
| `refund.pending` | Refund Engine | Ledger Service (حجز مبدئي) | نعم — حجز رصيد | نعم |
| `refund.completed` | Webhook / API | Ledger Service, Settlement, Notification | **نعم — قيد عكسي وتصفية** | نعم (Idempotent عبر `refund_id`) |
| `payout.requested` | Settlement Engine | Gateway Adapter, Notification | لا | نعم (عبر `instruction_no`) |
| `payout.processing` | Webhook Ingestion | Settlement Engine | لا | نعم |
| `payout.paid` | Webhook / Kashf API | Settlement Engine, Ledger Service, Notification | **نعم — إقفال الالتزام** | نعم (Idempotent) |
| `payout.failed` | Webhook Ingestion | Settlement Engine, Risk Service | لا | نعم |
| `dispute.opened` | Webhook / BNPL | Settlement Engine (Hold), Risk & Dispute | نعم — احتياطي مبدئي | نعم |
| `chargeback.completed` | Webhook / Bank | Ledger Service, Risk & Dispute Service | **نعم — خسارة/مديونية نهائية** | نعم |

---

## 9. استقبال الـ Webhooks وإستراتيجية المطابقة (Webhook Ingestion & Reconciliation)

### 9.1 مسار استقبال الإشعار الآمن (Secure Webhook Pipeline)
1. **استقبال الطلب عبر HTTPS:** تطبيق حماية WAF، تحديد معدل الطلبات (Rate Limiting)، والتحقق من حجم الحجم والمهلة.
2. **التحقق من التوقيع الرقمي (Signature Verification):** فحص HMAC Secret أو RSA Signature الخاص بالبوابة بصورة حتمية قبل القبول.
3. **التسجيل الفوري للحدث الخام (Raw Persistence):** حفظ كامل الـ Payload والـ Headers مع وقت الوصول وسيريال الحدث الفريد في `gateway_events` وإرجاع رد `200 OK` فوراً.
4. **منع التكرار (Deduplication):** فحص معرّف الحدث الخارجي `external_event_id` أو بصمة الـ Payload Hash لحظر المعالجة المكررة.
5. **التحويل للحدث الموحد (Canonical Event Translation):** تحويل صياغة البوابة إلى الحدث الموحد بالنظام ونشره بالطابور المعالج (Queue Worker).
6. **معالجة أخطاء التنفيذ:** إعادة المحاولة بتزايد أسي (Exponential Backoff) حتى 5 محاولات، ثم النقل إلى طابور الرسائل الميتة (Dead-Letter Queue - DLQ) المخصص للمراجعة اليدوية.

### 9.2 محرك المطابقة المالي المستمر (Continuous Multi-tier Reconciliation)

```
[ البيانات التشغيلية الداخلية ]  <--->  [ API الاستعلام الدوري ]  --->  (مطابقة لحظية / كل 15 دقيقة)
[ الدفتر الداخلي Ledger       ]  <--->  [ كشوف التسوية اليومية   ]  --->  (مطابقة يومية Line-by-Line)
[ الأرصدة التجميعية الحسابية  ]  <--->  [ التقارير البنكية الشهرية]  --->  (مطابقة شهرية وإغلاق كشف)
```

1. **المطابقة اللحظية (Near Real-time Matching):** استعلام دوري كل 15-30 دقيقة للعمليات المعلقة (`processing` / `initiated`) لتحديث حالتها وتلافي ضياع الـ Webhooks.
2. **المطابقة اليومية التفصيلية (Daily Line-by-Line Reconciliation):** مقارنة ملف كشف حساب البوابة اليومي (Statement CSV/SFTP/API) حقل بحقل مع سجلات الدفتر، وتأكيد قيود العمولات والضرائب الفعلية المقتطعة.
3. **إدارة وتسوية الفروقات (Discrepancy Item Resolution):** عند اكتشاف أي فرق مالي (Mismatch)، ينشأ سجل `reconciliation_item` بحالة `open` ويحظر إغلاق الكشف اليومي تلقائياً حتى معالجة السبب وتأييده بإجراء إداري معتمد.

---

## 10. إستراتيجية تكامل البوابات وسياسات إعادة المحاولة (Gateway Adapters & Retry Policies)

### 10.1 نموذج الموصل الموحد (Standard Adapter Interface)
تعرض كافة موصلات البوابات واجهة استدعاء موحدة (`Unified Gateway Interface`):
* `createPayment(payload)`: إنشاء الدفع وإعادة بيانات توجيه العميل.
* `fetchPayment(payment_id)`: الاستعلام عن الحالة الموحدة والمبالغ الفعلية والرسوم.
* `refundPayment(refund_id, amount)`: تنفيذ طلب استرداد كلي أو جزئي.
* `createBeneficiary(provider_data)`: تسجيل المزود كمستفيد لدى البوابة.
* `createPayout(transfer_data)`: إصدار أمر تحويل بنكي للمستفيد.
* `cancelPayout(transfer_id)`: إلغاء أمر تحويل جدوِل مسبقاً قبل الـ Cutoff.
* `reversePayout(transfer_id)`: طلب عكس تحويل أرباح سبق تسليمها للمزود.
* `verifyWebhook(headers, body)`: التحقق الهيكلي والتشفيري من صحة الإشعار.
* `listSettlements(filters)`: جلب كشوفات التسوية والعمولات الفعلية من البوابة.

### 10.2 مصفوفة قدرات البوابات في السعودية (Saudi Gateway Capability Matrix)

| القدرة التقنية (Capability) | Moyasar (ميسر) | PayTabs (بي تابس) | HyperPay (هايبرباي) | Geidea (جيديا) | Tabby / Tamara (BNPL) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `split_at_payment` | logical_only | native (Split Payout) | native (HyperSplit) | logical_only | logical_only |
| `beneficiary_onboarding` | dashboard/api | api | api | dashboard | api |
| `deferred_payout` | platform_schedule| native_schedule | native_schedule | platform_schedule| platform_schedule|
| `cancel_scheduled_payout` | yes_until_cutoff | yes_until_cutoff | yes_until_cutoff | yes_until_cutoff | N/A |
| `reverse_paid_payout` | future_offset_only| native / offset | native / offset | future_offset_only| N/A |
| `partial_refund` | yes | yes | yes | yes | yes |
| `negative_beneficiary_balance`| platform_ledger | native / platform | native / platform | platform_ledger | platform_ledger |

### 10.3 سياسات إعادة المحاولة المستقلة (`policy_retry_payout` vs `policy_retry_refund`)
تم فصل سياسة إعادة محاولة تحويل المزود عن سياسة إعادة محاولة استرداد العميل لاختلاف الأثر على رضا العميل والالتزام النظامي:

#### أ) سياسة إعادة محاولة استرداد العميل (`policy_retry_refund`)
* **الهدف:** الضمان المباشر لإعادة حق العميل بأسرع وقت دون تكرار العملية.
* **الحد الأقصى للمحاولات تلقائياً (`max_attempts`):** 3 محاولات فقط.
* **جدول الفواصل الزمنية (`backoff_schedule`):** فوري $\rightarrow$ بعد 5 دقائق $\rightarrow$ بعد 30 دقيقة.
* **الأخطاء القابلة لإعادة المحاولة التلقائية (`retryable_error_codes`):** `timeout`, `5xx_server_error`, `rate_limit_exceeded`.
* **الأخطاء غير القابلة لإعادة المحاولة (Non-retryable):** `insufficient_funds` (في حساب التاجر), `invalid_source`, `already_refunded`.
* **قاعدة الحافة المباشرة:** يلزم تنفيذ استعلام `fetchPayment` قبل أي محاولة `Retry` للحد من مخاطر الاسترداد المضاعف عند حدوث Timeout ظاهري.
* **إجراء التصعيد اليدوي (`escalation_action`):** نقل الطلب فوراً لـ `review_manual_failed_refund` وإشعال تنبيه لفريق العمليات.

#### ب) سياسة إعادة محاولة تحويل المزود (`policy_retry_payout`)
* **الهدف:** معالجة تعثر تحويلات أرباح المزودين بسبب أخطاء الآيبان أو توقف البنوك.
* **الحد الأقصى للمحاولات:** 5 محاولات عبر 48 ساعة.
* **إجراء التصعيد:** تعليق تعليمة التسوية وحجز المبلغ وإبلاغ المزود لتحديث الآيبان المعتمد.

---

## 11. الأمان والسلامة والامتثال التنظيمي (Security & Regulatory Compliance)

1. **نطاق امتثال بطاقات الدفع (PCI DSS Scope Reduction):**
   حظر تخزين أو مرور بيانات البطاقات البنكية الحساسة (PAN, CVV, Expiry) عبر خوادم المنصة؛ الاستخدام الحصري لتقنيات الـ Hosted Checkout Page، SDKs، أو الـ Tokenization المعتمَدة.
2. **إدارة الأسرار والمفاتيح (Secret Management):**
   تشفير مفاتيح البوابات والـ API Keys بداخل Google Secret Manager مع تدوير دوري للقيم وتطبيق مبدأ الأقل صلاحية (Least Privilege).
3. **فصل الصلاحيات والموافقات الثنائية (Dual-Control Approvals):**
   إلزام الموافقة الثنائية (Maker-Checker Approval) لأي عمليات استرداد أو تسوية يدوية تجاوز قيمتها السقف المعتمد (مثلاً أكبر من 5,000 ريال سعودي).
4. **الامتثال للبنك المركزي السعودي (SAMA Rulebook Compliance):**
   * الالتزام بقواعد البنك المركزي لتجميع المدفوعات وخدمات الدفع.
   * **تنبيه حاسم:** يُمنع تسويق أو صياغة العقود باستخدام عبارات قانونية مقيدة مثل "حساب ضمان" (Escrow Account) ما لم تكن المنصة حاصلة على الترخيص المباشر المحدد لذلك أو متعاقدة مع بنك/مؤسسة مالية مرخصة تحت ترتيب قانوني صريح.
5. **الوقاية من غسل الأموال والتحقق من الهوية (KYB/AML):**
   تطوير آليات التحقق من السجل التجاري والأنشطة المعتمدة لكل مزود قبل تفعيل خيار تلقي الأموال، مع تطبيق قوائم المنع والمراقبة اليومية للحسابات البنكية.

---

## 12. المتطلبات غير الوظيفية ومؤشرات الأداء (Non-Functional Requirements - NFRs)

### 12.1 زمن الاستجابة والأداء (Latency Targets)

| العملية المحددة (Operation) | الحد الأقصى المقبول (P95 Latency Target) | ملاحظات ومعالجة |
| :--- | :--- | :--- |
| **إنشاء الدفع (`POST /payments`)** | أقل من **2.0 ثانية** (< 2000ms) | باستثناء زمن معالجة البوابة الخارجية |
| **استعلام حالة الدفع (`GET /payments/{id}`)** | أقل من **300 مللي ثانية** (< 300ms) | قراءة سريعة من الدفتر المحلي |
| **احتساب عرض الاسترداد (`Quote Refund`)** | أقل من **500 مللي ثانية** (< 500ms) | احتساب حاسوبي في الذاكرة دون تنفيذ |
| **معالجة الـ Webhook حتى الرد بـ 2xx** | أقل من **1.0 ثانية** (< 1000ms) | حفظ الإشعار بالـ DB وإرجاع الرد فوراً |

### 12.2 الإنتاجية والإنقاذ والكوارث (Throughput, SLA & RPO/RTO)

```
=============================================================================
* إنتاجية الذروة (Peak TPS): تصميم النظام لتحمل 3 إلى 5 أضعاف الحمل اليومي.
* التوفر المستهدف (Availability SLA): 99.9% شهرياً للمدفوعات واستقبال الإشعارات.
* مؤشر التعافي من الكوارث (RPO): RPO <= 5 دقائق (أقصى فقد مقبول للبيانات).
* زمن الاستعادة الفعلي (RTO): RTO <= 30 دقيقة للعودة التشغيلية المكتملة.
* إستراتيجية النسخ الاحتياطي: Point-In-Time Recovery (PITR) مع WAL Streaming مستمر.
* تمارين الاستعادة الميدانية: إجراء تمرين استعادة فعلي (Restore Drill) ربع سنوياً.
=============================================================================
```

---

## 13. السيناريوهات الحرجة وحالات الحافة (Critical Edge Cases & Race Condition Handlers)

1. **نجاح الدفع لدى البوابة وفشل رد المتصفح (Browser Timeout / Callback Failure):**
   تلقي الـ Webhook الموثوق أو استعلام الـ Polling التلقائي يؤكد العملية فوراً ويصدر القيد المحاسبي وحجز القاعة دون إنشاء أمر دفع ثانٍ.
2. **تكرار إرسال الـ Webhook عشر مرات متتالية (Duplicate Webhook Storm):**
   فحص `external_event_id` يكتشف معالجة الحدث مسبقاً، ويتم إرجاع `200 OK` فوراً دون تكرار القيود أو نداءات الخدمات.
3. **تنافس طلب الاسترداد مع طلب التحويل بالنظام في اللحظة نفسها (Payout & Refund Race):**
   استخدام قفل التفاؤل القياسي (Optimistic Locking via `version`) في قاعدة البيانات مع قفل السجل المعني زمنيًا (`SELECT FOR UPDATE`)؛ يفوز أحدهما بوقف الآخر وتعديل مساره.
4. **تغيير الحساب البنكي (IBAN) للمزود بعد جدولة التسوية:**
   ترتبط كل تعليمة تسوية بنسخة معتمدة ومحددة من المستفيد `beneficiary_id` لحظة الإنشاء؛ لا يؤثر التعديل اللاحق بالملف على الأمور المدرجة قيد المعالجة الفعلية.
5. **استرداد مالي أكبر من الرصيد المتبقي المتاح للمزود:**
   رفض المعاملة برمجياً من خلال القيد `reservation_refund` المطبّق على مستوى قاعدة البيانات لمنع إرجاع مبالغ تتجاوز المقبوض المتبقي.
6. **حدوث Timeout ظاهري من البوابة عند إرسال طلب Refund مع نجاحه فعلياً لديهم:**
   يمنع نظام `policy_retry_refund` إنشاء استرداد ثانٍ ويقوم أولاً باستدعاء `fetchPayment` أو `Reconcile` لمعرفة الحالة الحقيقية قبل اتخاذ قرار إعادة الإرسال.

---

## 14. خطة التنفيذ المرحلية ومعايير القبول الشاملة (Phased Implementation & Golden Acceptance Criteria)

### 14.1 خطة التنفيذ المعتمدة (Implementation Roadmap)

* **المرحلة 1: البنية التحتية الأساسية (Foundation):**
  تطوير `Payment Orchestrator` الموحد، موصّل البوابة الأول، الدفتر المحاسبي المزدوج `Ledger`، ومستقبل الـ Webhook Inbox.
* **المرحلة 2: محرك التسوية المؤجلة (Deferred Payout Engine):**
  بناء جدول المستفيدين `beneficiaries`، محرك وجدولة التسويات `settlement_instructions` وآلة الحالات وحظر الـ Hold/Release.
* **المرحلة 3: محرك الاسترداد المطور (Refunds & Allocation Engine):**
  تطوير حاسبة `Refund Quotes` وتوزيع أثر الاسترداد وعكس الحصص والتعامل مع المديونيات.
* **المرحلة 4: خدمة المطابقة التلقائية (Reconciliation Service):**
  تكامل استيراد كشوف الحسابات والـ APIs، وبناء لوحات المراقبة وتقارير الفروقات.
* **المرحلة 5: دعم البوابات المتعددة والـ BNPL (Multi-Gateway & BNPL):**
  تفعيل مصفوفة القدرات `Capability Matrix` وموصّلات تابي وتمارا وبوابات إضافية.
* **المرحلة 6: إدارة المخاطر والتوسع (Risk & Scale):**
  تفعيل إدارة الاحتياطيات والنزاعات والتشارج باك، وربط الموافقات الثنائية والتحليلات المتقدمة.

### 14.2 معايير القبول المعتمدة - القواعد الذهبية الـ 16 (16 Golden Acceptance Criteria Rules)
1. **لا يتم تأكيد أي حجز مدفوع بناءً على إعادة توجيه المتصفح (Redirect) فقط.**
2. **كل عملية مالية تنشئ قيد محاسبي مزدوج (`Journal`) متوازن 100% وبمرجع فريد.**
3. **يُحظر تحرير مستحق أي مزود غير مكتمل الـ KYB/KYC أو مفروض عليه تعليق إداري (`Hold`).**
4. **مجموع مبالغ الاسترداد الناجحة والمعلقة لا يتجاوز بأي حال إجمالي المبلغ المحصل من العميل.**
5. **لا تنفذ تعليمة التحويل المالي للمزود (`Payout`) مرتين حتى عند إعادة المحاولة المكررة.**
6. **يمكن اشتقاق وتفسير رصيد كل مزود محاسبياً من واقع القيود دون الاعتماد المباشر على حقل مخزن.**
7. **تكشف خدمة المطابقة أي فرق مالي بين البوابة والدفتر وتمنع إغلاق الكشف اليومي تلقائياً.**
8. **توثق جميع الإجراءات اليدوية والقرارات المالية في سجل التدقيق غير القابل للتعديل (`Audit Log`).**
9. **لا تتجاوز محاولات إعادة إرسال طلب الاسترداد الحد المحدد في `policy_retry_refund` دون التصعيد للمراجعة اليدوية.**
10. **كل محاولة استرداد متكررة تعيد استخدام نفس مفتاح عدم التكرار (`idempotency_key`).**
11. **لا يمكن التعديل المباشر في جداول الخدمة المالكة من قبل خدمات خارجية إلا عبر الـ API المعتمد أو الحدث الموحد.**
12. **تجمّد وتسجل مديونية رسمية على المزود عند حدوث استرداد أو تشارج باك بعد تحويل الأرباح.**
13. **تحفظ كافة القيمة المالية في قاعدة البيانات بوحدة الهللة الصحيحة (`BIGINT`) لتفادي أخطاء التقريب.**
14. **تتطابق مخرجات استعلامات الاسترداد والعمولات مع النسخة المثبتة في اللقطة المالية (`Snapshot`).**
15. **يتم التحقق التشفيري الرقمي (HMAC/Signature) لجميع إشعارات البوابات الواردة قبل المعالجة.**
16. **يحقق النظام مؤشرات الأداء والأمان ومعدلات الاستجابة والتغطية الموثقة بجدول الـ NFRs.**

---

## 15. الملاحق الفنية والتشغيلية الموحدة (Technical Appendices)

### ملحق أ: قائمة الأسئلة التعاقدية والتقنية الإلزامية للبوابات قبل التوقيع
1. ما الكيان القانوني المرخص والمتعاقد معه رسمياً داخل المملكة العربية السعودية؟
2. هل يدعم النظام نموذج التقسيم المباشر عند الدفع (`Split at Payment`) أم التحويل اللاحق من حساب التاجر (`Deferred Payout`)؟
3. من الطرف المسؤول نظاماً عن جمع والتحقق من وثائق KYB/KYC للمزودين؟
4. هل يمكن جدولة الـ Payout لتاريخ محدد تلقائياً؟ وما الحد الأقصى لفترة الاحتفاظ؟
5. هل تتيح البوابة إلغاء أو تعليق أمر التحويل المجدول قبل حلول موعد الـ Cutoff؟
6. هل يوجد خيار عكس التحويل (`Reverse Transfer`) بعد تسليم الأرباح؟ وكيف يُعالج الرصيد السالب؟
7. هل الاسترداد الجزئي متاح لكافة وسائل الدفع (مدا، فيزا، تابي، تمارا)؟ وما حدوده الزمنية؟
8. هل تخصيص الطرف المتحمل لرسوم البوابة عند الاسترداد قابل للتهيئة برمجياً؟
9. ما هي سياسة رسوم الخدمة (MDR) ورسوم الاسترداد والإلغاء وتطبيق ضريبة القيمة المضافة؟
10. ما هي إشعارات الـ Webhooks المتاحة؟ وما آلية التحقق التشفيري وإعادة الإرسال؟
11. هل توفر البوابة الـ APIs أو تقارير Kashf لخطوط التسوية اليومية والتفصيلية؟
12. ما هي اتفاقية مستوى الخدمة (SLA) للتحويلات المحلية وحالات الفشل؟
13. هل تتوفر بيئة اختبارية كاملة (Sandbox) تجاكي المستفيدين والتحويلات والاسترداد؟
14. ما هي مسؤولية وإجراءات إدارة التشارج باك والأدلة المرفوعة والاحتياطي المالي؟
15. ما هو سلوك البوابة الدقيق عند حدوث Timeout أثناء استدعاء طلب الاسترداد؟ وهل توفر Endpoint استعلام موثوق للنتيجة؟

---

### ملحق ب: القاموس المختصر للحالات الموحدة (Unified Status Dictionary)

| النطاق (Domain) | الحالات غير النهائية (Non-Final / In-Progress States) | الحالات النهائية (Final / Terminal States) |
| :--- | :--- | :--- |
| **Payment** | `initiated`, `requires_action`, `authorized` | `captured/paid`, `failed`, `voided`, `refunded`, `partially_refunded` |
| **Refund** | `requested`, `pending`, `processing` | `completed`, `failed/cancelled` |
| **Settlement Instruction**| `pending_eligibility`, `scheduled`, `on_hold`, `release_requested`, `processing`, `failed-retryable` | `paid`, `cancelled`, `reversed` |
| **Beneficiary** | `pending_kyc`, `under_review`, `suspended` | `active`, `rejected`, `closed` |
| **Reconciliation Item** | `open`, `investigating` | `resolved`, `accepted_difference` |

---
**تمت الوثيقة الموحدة الشاملة والمعمارية التنفيذية النهائية لمنصة ليلة بنجاح**
