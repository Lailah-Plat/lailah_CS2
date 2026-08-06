# توثيق تصحيح وضبط روابط علاقات جداول قاعدة البيانات (Database Relationships Alignment)

تمت إعادة هيكلة وضبط روابط العلاقات بين الجداول المالية وجداول طلبات الدعم مع جدول المستخدمين (`User`) لضمان صحة تكامل البيانات، ومنع الأخطاء البرمجية الناتجة عن تداخل البيانات أو عدم تطابق الأنواع (Data Type Mismatches)، وتثبيت **العزل الصارم المتعدد الشركاء** (Strict Multi-Tenancy Isolation).

---

## 1. ملخص الهيكل الجديد للعلاقات (Relationships Architecture Overview)

بدلاً من الاعتماد على الأسماء النصية (Strings) التي تكون عرضة للأخطاء الإملائية وتغير البيانات، ترتبط جميع الجداول التالية الآن بجدول المستخدمين (`User`) مباشرةً عبر **المعرف الرقمي الفريد للمستخدم** (`id: INTEGER` في جدول `User`).

| اسم الجدول في النظام | فئة الربط | عمود الربط الفريد (Foreign Key) | نوع البيانات | الكيان المرتبط (Target Model) |
| :--- | :--- | :--- | :--- | :--- |
| **الإيرادات (`Revenue`)** | مزود الخدمة (Partner/Provider) | `providerId` | `INTEGER` | `User.id` (مقدم الخدمة) |
| **المصروفات (`Expense`)** | مزود الخدمة أو الإدارة | `providerId` | `INTEGER` | `User.id` (مقدم الخدمة أو الأدمن) |
| **محافظ العملاء (`CustomerWallet`)** | العميل (Client) | `customerId` | `INTEGER` (فريد) | `User.id` (العميل) |
| **المطالبات المالية (`FinancialClaim`)** | مزود الخدمة (Partner/Provider) | `providerId` | `INTEGER` | `User.id` (مقدم الخدمة) |
| **مطالبات القوة القاهرة (`CustomerHeldBalance`)** | العميل ومزود الخدمة | `customerId` <br> `originalProviderId` <br> `originalBookingId` | `INTEGER` <br> `INTEGER` <br> `INTEGER` | `User.id` (العميل) <br> `User.id` (مقدم الخدمة) <br> `Booking.id` (الحجز) |
| **طلبات القوة القاهرة (`ForceMajeureRequest`)** | العميل | `customerId` | `INTEGER` | `User.id` (العميل) |
| **الفواتير (`Invoice`)** | العميل والحجز | `customerId` <br> `bookingId` | `INTEGER` <br> `INTEGER` | `User.id` (العميل) <br> `Booking.id` (الحجز) |
| **التسجيلات المعلقة (`PendingRegistration`)** | المستخدم | `userId` | `INTEGER` | `User.id` (المستخدم المعلق) |
| **التقييمات (`Review`)** | العميل ومزود الخدمة | `userId` <br> `providerId` | `INTEGER` <br> `INTEGER` | `User.id` (العميل) <br> `User.id` (مزود الخدمة) |
| **طلبات الخدمات المساندة (`SupportServiceRequest`)** | العميل ومزود الخدمة والحجز والخدمة | `customerId` <br> `providerId` <br> `bookingId` <br> `serviceId` | `INTEGER` <br> `INTEGER` <br> `INTEGER` <br> `INTEGER` | `User.id` (العميل) <br> `User.id` (مزود الخدمة) <br> `Booking.id` (الحجز) <br> `Service.id` (الخدمة) |
| **محادثات الخدمة (`ServiceChat`)** | العميل وموظف الدعم | `customerId` <br> `agentId` | `INTEGER` <br> `INTEGER` | `User.id` (العميل) <br> `User.id` (الموظف) |
| **رسائل محادثات الدعم والخدمة (`ServiceChatMessage`)** | المحادثة | `chatId` | `INTEGER` | `ServiceChat.id` |
| **تذاكر الدعم ومتابعة المشكلات (`Ticket`)** | العميل وموظف الدعم المخصص | `customerId` <br> `assignedAgentId` | `INTEGER` <br> `INTEGER` | `User.id` (العميل) <br> `User.id` (الموظف) |
| **رسائل تذاكر الدعم (`TicketMessage`)** | التذكرة والمرسل | `ticketId` <br> `senderId` | `INTEGER` <br> `INTEGER` | `Ticket.id` <br> `User.id` |
| **الخدمات المساندة للفعاليات (`Service`)** | مزود الخدمة والقاعة | `providerId` <br> `hallId` | `INTEGER` <br> `INTEGER` | `User.id` (مقدم الخدمة) <br> `Hall.id` (القاعة المرتبطة) |
| **الموردون للخدمات (`Supplier`)** | المستخدم المشغل | `userId` | `INTEGER` | `User.id` (المورد) |
| **اشتراكات الموفر (`ProviderSubscription`)** | مزود الخدمة وخطط الاشتراك | `providerId` <br> `planId` | `INTEGER` <br> `INTEGER` | `User.id` (مقدم الخدمة) <br> `SubscriptionPlan.id` (الخطة) |

---

## 2. تفاصيل التعديلات البرمجية والهيكلية لكل جدول

### أ. جدول الإيرادات (`Revenue`) وجدول المستخدمين (`User`)
* **الوضع السابق:** كان يتم أحيانًا إرسال اسم المزود النصي لتخزينه في حقل `providerId` في الواجهة الأمامية، مما يؤدي إلى فشل الحفظ في قاعدة البيانات لأن النوع المُعرف للعمود هو `INTEGER`.
* **التصحيح المطبق:**
  * تم توحيد الواجهة الأمامية لإرسال الرقم التعريفي الرقمي للمزود (`Number(currentProviderId)`) عند إنشاء إيراد يدوي.
  * تم تعديل الفلترة في الواجهة الخلفية لتطابق الرقم التعريفي الصارم `providerId === finalProviderId`.
  * تظهر كود العلاقة في `Database.ts`:
    ```typescript
    Revenue.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
    User.hasMany(Revenue, { foreignKey: 'providerId', as: 'revenues' });
    ```

### ب. جدول المصروفات (`Expense`) وجدول المستخدمين (`User`)
* **الوضع السابق:** لم يكن جدول المصروفات يحتوي على عمود صريح للـ `providerId` وكان يربط فقط بـ `EmployeeId` أو حقل `category` النصي لتمرير رقم المزود كنص.
* **التصحيح المطبق:**
  * تم إضافة عمود `providerId` من نوع `DataTypes.INTEGER` in كائن الموديل وتفعيله في ترحيل قاعدة البيانات (Migration).
  * تم ربط الموديل برمجيًا ليدعم:
    ```typescript
    Expense.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
    User.hasMany(Expense, { foreignKey: 'providerId', as: 'expenses' });
    ```
  * تم تكييف مسار جلب الإحصائيات الخلفي (`/api/finance/stats`) ليدعم البحث عبر الحقلين لضمان عدم فقدان أي بيانات قديمة:
    ```typescript
    queryExpenses = await Expense.findAll({
      where: {
        [Op.or]: [
          { providerId: finalProviderId },
          { category: String(finalProviderId) }
        ]
      },
      order: [['createdAt', 'DESC']]
    });
    ```

### ج. جدول محافظ العملاء (`CustomerWallet`) وجدول المستخدمين (`User`)
* **الوضع السابق:** كانت المحفظة ترتبط بالبريد الإلكتروني للعميل فقط عبر حقل `customerEmail` بدون ربط معرف رقمي فريد بقاعدة البيانات.
* **التصحيح المطبق:**
  * تم إضافة حقل `customerId` من نوع `DataTypes.INTEGER` (فريد) لربطه بالمستخدم مباشرة.
  * الكود البرمجي للعلاقة:
    ```typescript
    CustomerWallet.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
    User.hasOne(CustomerWallet, { foreignKey: 'customerId', as: 'customerWallet' });
    ```

### د. جدول المطالبات المالية (`FinancialClaim`) وجدول المستخدمين (`User`)
* **الوضع الحالي:** تم التأكد من ربط الجدول بكفاءة عبر `providerId` وهو معرف رقمي من نوع `INTEGER` يشير مباشرة إلى `User.id` الخاص بمزود الخدمة.
  ```typescript
  FinancialClaim.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
  User.hasMany(FinancialClaim, { foreignKey: 'providerId', as: 'financialClaims' });
  ```

### هـ. جدول مطالبات القوة القاهرة (`CustomerHeldBalance`) وجدول الحجوزات والمستخدمين
* **الوضع السابق:** كانت المبالغ المحتجزة ترتبط فقط بالمزود عبر `originalProviderId` ولكن ترتبط بالعميل بنص بريده الإلكتروني `customerEmail` دون ربط الحجز.
* **التصحيح المطبق:**
  * تم إضافة عمود `customerId` من نوع `DataTypes.INTEGER` لربط المعاملة رقميًا بالمستخدم العميل بشكل صحيح.
  * تم إنشاء العلاقة لربط الاعتمادات بالحجز الأصلي عبر المعرف الفريد `originalBookingId`.
  * الكود البرمجي للعلاقات:
    ```typescript
    CustomerHeldBalance.belongsTo(User, { foreignKey: 'originalProviderId', as: 'providerUser' });
    User.hasMany(CustomerHeldBalance, { foreignKey: 'originalProviderId', as: 'heldBalances' });

    CustomerHeldBalance.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
    User.hasMany(CustomerHeldBalance, { foreignKey: 'customerId', as: 'heldBalancesCustomer' });

    CustomerHeldBalance.belongsTo(Booking, { foreignKey: 'originalBookingId', as: 'originalBooking' });
    Booking.hasMany(CustomerHeldBalance, { foreignKey: 'originalBookingId', as: 'heldBalances' });
    ```

### و. جدول طلبات القوة القاهرة (`ForceMajeureRequest`) وجدول المستخدمين (`User`)
* **الوضع السابق:** لم يكن الجدول يحتوي على ربط برقم الهوية الفريد للعميل وكان يكتفي بحفظ بريد العميل كنص `customerEmail`.
* **التصحيح المطبق:**
  * تم إضافة عمود `customerId` من نوع `DataTypes.INTEGER` داخل ملف `BookingModels.ts` الخاص بالموديل.
  * تم إنشاء العلاقة البرمجية وربطها في الملف المركزي `Database.ts`:
    ```typescript
    ForceMajeureRequest.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
    User.hasMany(ForceMajeureRequest, { foreignKey: 'customerId', as: 'forceMajeureRequests' });
    ```

### ز. جدول الفواتير (`Invoice`) وجدول المستخدمين وجدول الحجوزات
* **التصحيح المطبق:**
  * تم تحويل نوع حقول `customerId` و `bookingId` إلى `DataTypes.INTEGER` لربطهما بقاعدة البيانات بشكل صارم من خلال الرقم الفريد للمستخدم وحجزه.
  * الكود البرمجي للعلاقات:
    ```typescript
    Invoice.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
    User.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });

    Invoice.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
    Booking.hasMany(Invoice, { foreignKey: 'bookingId', as: 'invoices' });
    ```

### ح. جدول التسجيلات المعلقة (`PendingRegistration`)
* **التصحيح المطبق:**
  * تم إضافة حقل `userId` من نوع `INTEGER` وإثبات العلاقة مع المستخدم عبر معرّفه الرقمي الفريد.

### ط. جدول التقييمات (`Review`)
* **التصحيح المطبق:**
  * تم ربط جدول التقييمات رقمياً عبر `userId` (معرف العميل) و `providerId` (معرف مزود الخدمة) ليتسنى المطابقة وفصل البيانات بشكل آمن ومحكم.

### ي. جدول طلبات الخدمات المساندة (`SupportServiceRequest`)
* **التصحيح المطبق:**
  * تم إضافة الحقول `customerId` و `providerId` للجدول وربطهما بكفاءة مع جدول المستخدمين وجدول الحجوزات لتمكين الفلترة والدعم اللوجستي بدقة بالغة.

### ك. جدول اشتراكات وميزات الموفر المخصصة (`ProviderSubscription` / `ProviderFeatureOverride`)
* **التصحيح المطبق:**
  * تم تأكيد الربط الرقمي الصارم لجميع الاشتراكات والميزات المخصصة عبر حقل `providerId: INTEGER` مع جدول المستخدمين لمنع تداخل بيانات الشركاء واستعراض الميزات غير المصرح بها.

---

## 3. آلية الترحيل الآمنة والمستمرة (Automatic Database Migrations)

لتجنب حدوث أي تعليق أو فشل لقاعدة البيانات عند تشغيل الخادم وتثبيت التغييرات، تم تضمين كود ترحيل آلي داخل دالة `syncDatabase()` في `Database.ts` يقوم بالخطوات التالية عند تشغيل التطبيق:

1. التأكد من تحويل وتعديل أعمدة المعرفات القديمة لجميع الجداول المالية إلى نوع `INTEGER` متوافق بشكل آمن في قواعد بيانات PostgreSQL و SQLite.
2. الكشف التلقائي عن عدم وجود الأعمدة الجديدة (`providerId` في جدول `Expense`، و `customerId` في كل من `CustomerWallet` و `CustomerHeldBalance` و `ForceMajeureRequest`).
3. تفعيل أوامر `queryInterface.addColumn(...)` برمجيًا لإضافة الأعمدة بأمان بدون تدمير أو حذف السجلات الحالية.
4. إجراء المزامنة النهائية عبر `sequelize.sync()`.
