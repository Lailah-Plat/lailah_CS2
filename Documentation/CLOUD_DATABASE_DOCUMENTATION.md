# الدليل المرجعي الكامل للوثائق التقنية لقاعدة البيانات السحابية - منصة "ليلة" 🗄️⚡
*(Lailah Platform Cloud Database Architecture & Schema Specification)*

يقدم هذا المستند توثيقاً شاملاً، تفصيلياً، ومعيارياً لكافة جداول، علاقات، مفاتيح، وقيود قاعدة البيانات السحابية لمنصة "ليلة" الملكية (**PostgreSQL / Supabase / Express Sequelize ORM**). يُعد هذا المستند المرجع الفني والأمني الأعلى لجميع المطورين والمهندسين وأدوات الذكاء الاصطناعي عند تطوير، تحديث، أو ربط أي وحدة برمجية بالمنصة أو بتطبيقات الجوال والويب.

---

## 🏛️ 1. النظرة العامة والمهندسية للنظام (Architecture Overview)

- **محرك قاعدة البيانات الأساسي:** PostgreSQL 15+ (Cloud SQL / Supabase).
- **ترميز البيانات (Character Set & Collation):** UTF-8 مع دعم كامل للغة العربية والترميز ثنائي الاتجاه (RTL).
- **نموذج الربط البرمجي (ORM):** Sequelize / Drizzle ORM مع نماذج جافاسكريبت/تايب سكريبت مشتقة مباشرة في `src/models/*.ts`.
- **نظام التعددية والتأجير المزدوج (Multi-Tenancy):** نموذج عزل صارم يعتمد على حقل المورد `providerId` لمعزل كافة الأصول والعمليات، وحقل العميل `customerId` لحماية بيانات الأفراد.
- **سياسة المعرفات التسلسلية (Serial Generation Rules):** أرقام معيارية سنوية تبدأ من `0000000001` وتتجدد تلقائياً بداية كل عام ميلادي (`YY`).

---

## 🗺️ 2. النطاقات الرئيسية وخريطة العلاقات (Domain Classification & ERD Mapping)

تتوزع قاعدة البيانات على **9 نطاقات تشغيلية وتنظيمية متكاملة**:

```text
                       ┌───────────────────────────────────────────┐
                       │          مستخدمي النظام (Users)          │
                       └─────────────────────┬─────────────────────┘
                                             │
      ┌──────────────────────┬───────────────┴───────────────┬──────────────────────┐
      │                      │                               │                      │
┌─────▼──────────┐   ┌───────▼────────┐             ┌────────▼─────────┐   ┌────────▼────────┐
│  1. القاعات    │   │  2. الحجوزات   │             │  3. الفوترة      │   │ 4. إدارة الموارد│
│   والخدمات     │   │   والطلبات     │             │    والمحافظ      │   │   والعاملين     │
│(Halls/Services)│   │(Bookings/SRV)  │             │(Invoices/Wallets)│   │(Employees/Roles)│
└────────────────┘   └────────────────┘             └──────────────────┘   └─────────────────┘
```

---

## 📋 3. التوثيق التفصيلي للقطاعات والجداول (Detailed Schema Dictionary)

---

### 👤 القطاع الأول: المستخدمين، الهوية، والصلاحيات (Users & Authentication Domain)

#### 1️⃣ جدول المستخدمين (`Users`) - [موديل `User`]
* **الوصف:** السجل المركزي لجميع أفراد المنصة (عملاء، شركاء/مزودين، مسوقين، موظفي الشركاء، ومدراء النظام).

| اسم العمود (Column Name) | نوع البيانات (Data Type) | القيود / القيمة الافتراضية | الوصف والدلالة |
|--------------------------|--------------------------|----------------------------|----------------|
| `id`                     | `INTEGER`                | PRIMARY KEY, AUTO_INC      | المعرف الفريد للمستخدم |
| `name`                   | `VARCHAR(255)`           | NOT NULL                   | الاسم الكامل |
| `email`                  | `VARCHAR(255)`           | NOT NULL, UNIQUE           | البريد الإلكتروني الرسمي |
| `role`                   | `VARCHAR(50)`            | NOT NULL, Default `'عميل'`  | الدور: `Admin`, `provider`, `provider_staff`, `Marketer`, `عميل` |
| `password_hash`          | `VARCHAR(255)`           | ALLOW NULL                 | تشفير كلمة المرور بـ bcrypt (Salt >= 10) |
| `phone`                  | `VARCHAR(50)`            | ALLOW NULL                 | رقم الجوال (مثال: `05xxxxxxxx`) |
| `region`                 | `VARCHAR(100)`           | ALLOW NULL                 | المنطقة الجغرافية |
| `city`                   | `VARCHAR(100)`           | ALLOW NULL                 | المدينة الحالية |
| `addressDetails`         | `VARCHAR(255)`           | ALLOW NULL                 | تفاصيل العنوان الفعلي |
| `bankName`               | `VARCHAR(150)`           | ALLOW NULL                 | اسم البنك للحساب المالي |
| `iban`                   | `VARCHAR(50)`            | ALLOW NULL                 | الحساب البنكي الدولي IBAN |
| `commercialRecord`       | `VARCHAR(100)`           | ALLOW NULL                 | رقم السجل التجاري (للمزودين والشركات) |
| `status`                 | `VARCHAR(50)`            | Default `'نشط'`            | حالة الحساب: `نشط`, `معطل` |
| `avatarUrl`              | `VARCHAR(550)`           | ALLOW NULL                 | رابط صورة الملف الشخصي |
| `pushToken`              | `VARCHAR(255)`           | ALLOW NULL                 | توكن الإشعارات للجوال (FCM/APNs) |
| `deviceUuid`             | `VARCHAR(255)`           | ALLOW NULL                 | بصمة جهاز الهاتف الفريدة |
| `biometricEnabled`       | `BOOLEAN`                | Default `false`            | إمكانية الدخول بالبصمة/الوجه |
| `createdAt`              | `TIMESTAMP`              | Default `CURRENT_TIMESTAMP`| تاريخ إنشاء الحساب |

#### 2️⃣ جدول التسجيلات المعلقة (`PendingRegistrations`) - [موديل `PendingRegistration`]
* **الوصف:** تخزين بيانات التسجيل الجديدة مؤقتاً لحين إتمام التحقق الثنائي عبر الجوال والبريد (OTP Verification).

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد |
| `registrationToken` | `VARCHAR(255)` | UNIQUE, NOT NULL | رمز الجلسة المؤقتة |
| `phone` | `VARCHAR(50)` | NOT NULL | رقم الجوال المراد تفعيله |
| `email` | `VARCHAR(255)` | NOT NULL | البريد المراد تفعيله |
| `phoneOtp` | `VARCHAR(10)` | NOT NULL | كود OTP الجوال |
| `emailOtp` | `VARCHAR(10)` | NOT NULL | كود OTP البريد |
| `payload` | `TEXT` | NOT NULL | بيانات الحساب المودعة بصيغة JSON String |
| `expiresAt` | `TIMESTAMP` | NOT NULL | تاريخ انتهاء صلاحية الـ OTP |

---

### 🏛️ القطاع الثاني: القاعات والمنشآت والمخزون (Venues, Halls & Inventory Domain)

#### 1️⃣ جدول القاعات والمنشآت (`Halls`) - [موديل `Hall`]
* **الوصف:** سجل قاعات الأفراح والمناسبات والشاليهات التابعة للشركاء.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للقاعة |
| `providerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف المزود مالك القاعة (العزل الصارم) |
| `name` | `VARCHAR(255)` | NOT NULL | اسم القاعة التجاري |
| `type` | `VARCHAR(100)` | NOT NULL | نوع المنشأة (`أفراح`, `مؤتمرات`, `شاليه`, `استراحة`) |
| `description` | `TEXT` | ALLOW NULL | الوصف تفصيلي |
| `contractTerms` | `TEXT` | ALLOW NULL | شروط وأحكام العقد والالتزامات للعميل |
| `capacity` | `INTEGER` | NOT NULL | الطاقة الاستيعابية الضيوف |
| `hourlyRate` | `DOUBLE PRECISION` | NOT NULL | سعر التأجير بالساعة |
| `price` | `DOUBLE PRECISION` | Default `0` | السعر الأساسي للتأجير اليومي |
| `depositAmount` | `DOUBLE PRECISION` | Default `0` | قيمة العربون المستحق مقدماً |
| `cancellationPeriod` | `INTEGER` | Default `14` | مهلة الإلغاء المجاني بالأيام |
| `approvalStatus` | `VARCHAR(50)` | Default `'pending'` | حالة الاعتماد الإداري (`pending`, `approved`, `rejected`) |
| `status` | `VARCHAR(50)` | Default `'active'` | حالة التشغيل والجاهزية |
| `city` | `VARCHAR(100)` | Default `'الرياض'` | المدينة التي تقع بها القاعة |
| `region` | `VARCHAR(100)` | Default `'الرياض'` | المنطقة الجغرافية |
| `rating` | `DOUBLE PRECISION` | Default `4.5` | تقييم العملاء |
| `image` | `TEXT` | ALLOW NULL | صورة غلاف القاعة الرئيسي (حد أقصى 500KB) |
| `images` | `TEXT` | ALLOW NULL | مصفوفة الصور الفرعية بصيغة JSON |
| `videoUrl` | `TEXT` | ALLOW NULL | رابط فيديو توضيحي MP4 (حد أقصى 10MB) |
| `location` | `VARCHAR(255)` | ALLOW NULL | إحداثيات الخريطة الجغرافية |

#### 2️⃣ جدول خدمات القاعة الإضافية (`HallExtraServices`) - [موديل `HallExtraServices`]
* **الوصف:** الخدمات الإضافية الملحقة الموفرة من نفس المزود صاحب القاعة (الضيافة، الإضاءة، الكوشة) لتطبيق **قاعدة التسعير الهجين وحظر الازدواجية**.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد |
| `hallId` | `INTEGER` | NOT NULL, FK -> `Halls(id)` | معرف القاعة التابعة لها الخدمة |
| `name` | `VARCHAR(255)` | NOT NULL | اسم الخدمة المضافة |
| `category` | `VARCHAR(100)` | NOT NULL | الفئة الخدمية (`hospitality`, `photography`, `lighting`, `decoration`) |
| `price` | `DOUBLE PRECISION` | NOT NULL | سعر الخدمة الإضافية |
| `isAvailable` | `BOOLEAN` | Default `true` | التوفر التشغيلي |

---

### 📅 القطاع الثالث: الحجوزات والخدمات والقوة القاهرة (Bookings & Orders Domain)

#### 1️⃣ جدول الحجوزات الرئيسية (`Bookings`) - [موديل `Booking`]
* **الوصف:** سجل الحجوزات والمناسبات الرسمية مع أرقام السلاسل المعيارية والفوترة الزكوية.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للحجز |
| `bookingNumber` | `VARCHAR(100)` | UNIQUE, NOT NULL | الرقم التسلسلي المعياري: `BKG-YY-XXXXXXXXXX` |
| `customerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف العميل |
| `hallId` | `INTEGER` | NOT NULL, FK -> `Halls(id)` | معرف القاعة المحجوزة |
| `providerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف المزود صاحب القاعة |
| `bookingDate` | `VARCHAR(50)` | NOT NULL | تاريخ المناسبة (`YYYY-MM-DD`) |
| `slot` | `VARCHAR(50)` | Default `'evening'` | الفترة الزمنية (`morning`, `evening`, `full_day`) |
| `totalPrice` | `DOUBLE PRECISION` | NOT NULL | المبلغ الإجمالي النهائي شامل الضريبة والخدمات |
| `subtotal` | `DOUBLE PRECISION` | NOT NULL | المبلغ الأساسي الخاضع للضريبة |
| `vatAmount` | `DOUBLE PRECISION` | NOT NULL | قيمة ضريبة القيمة المضافة (15% VAT) |
| `depositPaid` | `DOUBLE PRECISION` | Default `0` | المبلغ المدفوع كعربون |
| `commissionAmount` | `DOUBLE PRECISION` | Default `0` | عمولة المنصة المقتطعة آلياً بحسب باقة المزود |
| `status` | `VARCHAR(50)` | Default `'pending'` | حالة الحجز (`pending`, `confirmed`, `completed`, `cancelled`) |
| `paymentStatus` | `VARCHAR(50)` | Default `'unpaid'` | حالة الدفع (`unpaid`, `partially_paid`, `paid`, `refunded`) |
| `paymentMethod` | `VARCHAR(50)` | ALLOW NULL | طريقة الدفع (`Mada`, `Visa`, `ApplePay`, `Cash`) |
| `cancellationReason` | `TEXT` | ALLOW NULL | سبب الإلغاء إن وجد |

#### 2️⃣ جدول خدمات الحجز الملحقة (`booking_services`) - [موديل `BookingService`]
* **الوصف:** جدول الربط بين الحجز الأساسي والخدمات الفرعية المساندة المختارة.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد |
| `bookingId` | `INTEGER` | NOT NULL, FK -> `Bookings(id)` | معرف الحجز التابع له |
| `serviceId` | `INTEGER` | ALLOW NULL, FK -> `Services(id)` | معرف الخدمة المستقلة إن وجدت |
| `extraServiceId` | `INTEGER` | ALLOW NULL | معرف خدمة القاعة الداخلية |
| `price` | `DOUBLE PRECISION` | NOT NULL | السعر المحتسب للخدمة وقت الحجز |

#### 3️⃣ جدول طلبات الخدمات المساندة المستقلة (`SupportServiceRequests`) - [موديل `SupportServiceRequest`]
* **الوصف:** طلبات الخدمات المساندة المستقلة بالرقم التسلسلي `SRV-YY-XXXXXXXXXX`.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للطلب |
| `requestNumber` | `VARCHAR(100)` | UNIQUE, NOT NULL | الرقم التسلسلي المعياري: `SRV-YY-XXXXXXXXXX` |
| `customerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف العميل |
| `serviceId` | `INTEGER` | NOT NULL, FK -> `Services(id)` | معرف الخدمة المطلوبة |
| `providerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف المزود المنفذ للخدمة |
| `amount` | `DOUBLE PRECISION` | NOT NULL | قيمة الخدمة الإجمالية |
| `status` | `VARCHAR(50)` | Default `'pending'` | حالة الطلب (`pending`, `approved`, `completed`, `cancelled`) |

---

### 💰 القطاع الرابع: المالية والمحافظ والفوترة الزكوية (Finance & Invoicing Domain)

#### 1️⃣ جدول الفواتير الضريبية (`Invoices`) - [موديل `Invoice`]
* **الوصف:** الفواتير الضريبية المتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA Stage 2).

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للفاتورة |
| `invoiceNumber` | `VARCHAR(100)` | UNIQUE, NOT NULL | الرقم التسلسلي المعياري: `INV-YYXXXXXXXXXX` |
| `bookingId` | `INTEGER` | ALLOW NULL, FK -> `Bookings(id)` | معرف الحجز المرتبط |
| `customerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف العميل |
| `providerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف المزود |
| `amount` | `DOUBLE PRECISION` | NOT NULL | المبلغ الخاضع للضريبة |
| `taxAmount` | `DOUBLE PRECISION` | NOT NULL | قيمة الضريبة المضافة (15%) |
| `totalAmount` | `DOUBLE PRECISION` | NOT NULL | المبلغ الإجمالي الصافي |
| `status` | `VARCHAR(50)` | Default `'issued'` | حالة الفاتورة (`issued`, `paid`, `cancelled`) |
| `issueDate` | `VARCHAR(50)` | NOT NULL | تاريخ إصدار الفاتورة |
| `qrCodeData` | `TEXT` | ALLOW NULL | نص التشفير لرمز ZATCA QR Code |

#### 2️⃣ جدول محافظ الشركاء (`Wallets`) - [موديل `Wallet`]
* **الوصف:** المحفظة المالية التشغيلية للمزود لتتبع الأرصدة القابلة للسحب والمعلقة.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للمحفظة |
| `providerId` | `INTEGER` | UNIQUE, NOT NULL, FK -> `Users(id)` | معرف المزود مالك المحفظة |
| `balance` | `DOUBLE PRECISION` | Default `0.0` | الرصيد الفعلي المتاح للسحب البنكي |
| `pendingBalance` | `DOUBLE PRECISION` | Default `0.0` | الرصيد المعلق لحين اكتمال المناسبة |

#### 3️⃣ جدول الرصيد المحتجز والقوة القاهرة (`CustomerHeldBalances`) - [موديل `CustomerHeldBalance`]
* **الوصف:** إدارة أموال العملاء المحتجزة بسبب ظروف استثنائية أو إقالات رسمية.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد |
| `customerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف العميل صاحب المبلغ |
| `originalBookingId` | `INTEGER` | NOT NULL, FK -> `Bookings(id)` | الحجز الأصلي الملغى بقوة قاهرة |
| `originalProviderId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | المزود الأصلي للحجز |
| `amount` | `DOUBLE PRECISION` | NOT NULL | المبلغ المحتجز للعميل |
| `status` | `VARCHAR(50)` | Default `'held'` | حالة المبلغ (`held`, `converted_to_cash`, `expired`) |
| `reason` | `VARCHAR(255)` | Default `'force_majeure'` | سبب الاحتجاز الرسمي |

#### 4️⃣ جدول الإيرادات المباشرة (`Revenues`) - [موديل `Revenue`]
* **الوصف:** تسجيل قيود الإيرادات المالية بالرقم المعياري `REV-YY-XXXXXXXXXX`.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد |
| `revenueNumber` | `VARCHAR(100)` | UNIQUE, NOT NULL | الرقم التسلسلي المعياري: `REV-YY-XXXXXXXXXX` |
| `amount` | `DOUBLE PRECISION` | NOT NULL | قيمة الإيراد |
| `description` | `TEXT` | NOT NULL | بيان وصف الإيراد |
| `date` | `VARCHAR(50)` | NOT NULL | تاريخ قيد الإيراد |
| `providerId` | `INTEGER` | ALLOW NULL, FK -> `Users(id)` | المزود المرتبط إن وجد |

#### 5️⃣ جدول المصروفات المالية (`Expenses`) - [موديل `Expense`]
* **الوصف:** تسجيل قيود المصروفات المالية بالرقم المعياري `EXP-YY-XXXXXXXXXX`.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد |
| `expenseNumber` | `VARCHAR(100)` | UNIQUE, NOT NULL | الرقم التسلسلي المعياري: `EXP-YY-XXXXXXXXXX` |
| `amount` | `DOUBLE PRECISION` | NOT NULL | قيمة المصروف |
| `description` | `TEXT` | NOT NULL | بيان المصروف التشغيلي |
| `date` | `VARCHAR(50)` | NOT NULL | تاريخ القيد |
| `category` | `VARCHAR(100)` | NOT NULL | فئة المصروف |

---

### 💳 القطاع الخامس: هندسة المدفوعات والتقسيم الآلي (Payment Architecture Domain)

#### 1️⃣ جدول المعاملات المقسمة (`SplitTransactions`) - [موديل `SplitTransaction`]
* **الوصف:** التوزيع الفوري التلقائي بين حصة المزود وحصة عمولة المنصة وحصة ضريبة القيمة المضافة.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد |
| `bookingId` | `INTEGER` | NOT NULL, FK -> `Bookings(id)` | الحجز التابعة له الدفعة |
| `totalAmount` | `DOUBLE PRECISION` | NOT NULL | المبلغ الإجمالي المدفوع |
| `providerShare` | `DOUBLE PRECISION` | NOT NULL | صافي مستحق المزود المحول لمحفظته |
| `platformCommission` | `DOUBLE PRECISION` | NOT NULL | عمولة المنصة المحتسبة آلياً |
| `taxAmount` | `DOUBLE PRECISION` | NOT NULL | حصة الضريبة الموردة للهيئة |
| `status` | `VARCHAR(50)` | Default `'processed'` | حالة تقسيم الدفعة |

---

### 📦 القطاع السادس: باقات اشتراك الشركاء وعمولات المنصة (Subscription Domain)

#### 1️⃣ جدول باقات الاشتراكات (`subscription_plans`) - [موديل `SubscriptionPlan`]
* **الوصف:** الباقات المتاحة للمزودين (الأساسية، المتقدمة، الاحترافية) ونسبة العمولة الخاصة بكل باقة.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للباقة |
| `name` | `VARCHAR(150)` | NOT NULL | اسم الباقة التجاري |
| `price` | `DOUBLE PRECISION` | NOT NULL | قيمة الاشتراك الدوري |
| `commissionRate` | `DOUBLE PRECISION` | NOT NULL | نسبة عمولة المنصة المقتطعة من كل حجز (مثال: `0.05` للباقة الاحترافية) |
| `maxStaffSeats` | `INTEGER` | Default `3` | عدد مقاعد الموظفين المتاحة بحساب المزود مجاناً |
| `features` | `TEXT` | ALLOW NULL | قائمة الميزات بصيغة JSON |

#### 2️⃣ جدول اشتراكات المزودين الحالية (`provider_subscriptions`) - [موديل `ProviderSubscription`]
* **الوصف:** تتبع الاشتراك الفعال للمزود ونسبة العمولة المطبقة عليه حالياً.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للاشتراك |
| `providerId` | `INTEGER` | UNIQUE, NOT NULL, FK -> `Users(id)` | معرف المزود المشترك |
| `planId` | `INTEGER` | NOT NULL, FK -> `subscription_plans(id)` | الباقة المفعلة |
| `startDate` | `TIMESTAMP` | NOT NULL | تاريخ بدء الاشتراك |
| `endDate` | `TIMESTAMP` | NOT NULL | تاريخ انتهاء الاشتراك |
| `status` | `VARCHAR(50)` | Default `'active'` | حالة الاشتراك (`active`, `expired`, `cancelled`) |

---

### 💬 القطاع السابع: الدعم الفني، التقييمات، والدردشة (Support & Engagement Domain)

#### 1️⃣ جدول التقييمات والآراء (`reviews`) - [موديل `Review`]
* **الوصف:** التقييمات والتعليقات المعتمدة من العملاء بعد اكتمال المناسبة.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للتقييم |
| `hallId` | `INTEGER` | ALLOW NULL, FK -> `Halls(id)` | القاعة المقيمة |
| `serviceId` | `INTEGER` | ALLOW NULL, FK -> `Services(id)` | الخدمة المقيمة |
| `customerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | العميل كاتب التقييم |
| `rating` | `INTEGER` | NOT NULL | عدد النجوم (من 1 إلى 5) |
| `comment` | `TEXT` | ALLOW NULL | التعليق المكتوب |

#### 2️⃣ جدول محادثات الخدمة (`service_chats`) - [موديل `ServiceChat`]
* **الوصف:** غرف الدردشة المباشرة بين العميل والمزود حول حجز محدد.

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للدردشة |
| `bookingId` | `INTEGER` | ALLOW NULL, FK -> `Bookings(id)` | الحجز المرتبط بالدردشة |
| `customerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف العميل |
| `providerId` | `INTEGER` | NOT NULL, FK -> `Users(id)` | معرف المزود |
| `createdAt` | `TIMESTAMP` | Default `CURRENT_TIMESTAMP` | تاريخ فتح الغرفة |

---

### 👔 القطاع الثامن: الموظفين والتراخيص التشغيلية (Staff & HR Domain)

#### 1️⃣ جدول الموظفين والتراخيص (`Employees`) - [موديل `Employee`]
* **الوصف:** إدارة الموظفين الداخليين للمنصة أو موظفي الشركاء والمزودين (`provider_staff`).

| اسم العمود | نوع البيانات | القيود | الوصف والدلالة |
|------------|--------------|--------|----------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INC | المعرف الفريد للموظف |
| `userId` | `INTEGER` | UNIQUE, NOT NULL, FK -> `Users(id)` | معرف مستخدم الموظف |
| `providerId` | `INTEGER` | ALLOW NULL, FK -> `Users(id)` | المزود التابع له الموظف (لإدارة مقاعد الموظفين) |
| `roleId` | `INTEGER` | NOT NULL, FK -> `Roles(id)` | الدور والمسميات الوظيفية الصريحة |
| `department` | `VARCHAR(100)` | ALLOW NULL | القسم الوظيفي |
| `status` | `VARCHAR(50)` | Default `'active'` | حالة الموظف التشغيلية |

---

## 🔗 4. مصفوفة المفاتيح الأجنبية وقواعد الربط (Foreign Key Matrix & Cascade Behavior)

| الجدول المصدر (Source Table) | الحقل المصدر (FK Column) | الجدول الهدف (Target Table) | الحقل الهدف (PK Column) | نوع العلاقة (Type) | سلوك الحذف (On Delete) |
|------------------------------|--------------------------|-----------------------------|-------------------------|--------------------|------------------------|
| `Halls` | `providerId` | `Users` | `id` | 1:N (مزود -> قاعات) | `RESTRICT` |
| `Bookings` | `customerId` | `Users` | `id` | 1:N (عميل -> حجوزات) | `RESTRICT` |
| `Bookings` | `hallId` | `Halls` | `id` | 1:N (قاعة -> حجوزات) | `RESTRICT` |
| `Bookings` | `providerId` | `Users` | `id` | 1:N (مزود -> حجوزات) | `RESTRICT` |
| `Invoices` | `bookingId` | `Bookings` | `id` | 1:1 (حجز -> فاتورة) | `SET NULL` |
| `Wallets` | `providerId` | `Users` | `id` | 1:1 (مزود -> محفظة) | `CASCADE` |
| `booking_services` | `bookingId` | `Bookings` | `id` | 1:N (حجز -> خدمات) | `CASCADE` |
| `CustomerHeldBalances` | `customerId` | `Users` | `id` | 1:N (عميل -> مبالغ) | `RESTRICT` |
| `ProviderSubscription` | `providerId` | `Users` | `id` | 1:1 (مزود -> اشتراك) | `CASCADE` |
| `Employees` | `providerId` | `Users` | `id` | 1:N (مزود -> موظفين) | `CASCADE` |

---

## 🔢 5. قواعد الترميز والتسلسل الرقمي (Serial Number Formatting Rules)

تُطبق الأداة المركزية لتوليد السلاسل الرقمية القواعد التالية بداية من `0000000001` لكل سنة ميلادية جديدة:

1. **حجوزات القاعات:** `BKG-YY-XXXXXXXXXX` (مثال: `BKG-26-0000000001`)
2. **طلبات الخدمات المساندة:** `SRV-YY-XXXXXXXXXX` (مثال: `SRV-26-0000000001`)
3. **الفواتير الضريبية الزكوية:** `INV-YYXXXXXXXXXX` *(بدون واصلة بعد YY)* (مثال: `INV-260000000001`)
4. **الإيرادات المالية:** `REV-YY-XXXXXXXXXX` (مثال: `REV-26-0000000001`)
5. **المصروفات المالية:** `EXP-YY-XXXXXXXXXX` (مثال: `EXP-26-0000000001`)

---

## 🔒 6. قواعد العزل الصارم ومكافحة تسريب البيانات (Multi-Tenancy Security Rules)

1. **تطبيق الاستعلام المشروط في الخلفية (API Middleware Filter):**
   ```sql
   -- عزل استعلامات المزود في كافة الجداول التشغيلية
   SELECT * FROM "Bookings" WHERE "providerId" = :activeProviderId;
   SELECT * FROM "Halls" WHERE "providerId" = :activeProviderId;
   SELECT * FROM "Wallets" WHERE "providerId" = :activeProviderId;
   ```
2. **حظر الوصول لوظائف الإدارة عن المزودين:**
   - يُحظر برمجياً إظهار أو تنفيذ أي استعلام يخص `SystemSettings` أو `PlatformConfigs` أو الفواتير الضريبية الموحدة لحسابات الشركاء والمزودين (`role: 'provider'`).

---

## 🚀 7. الفهارس وتحسين الأداء (Indexes & Performance Tuning)

تم إنشاء الفهارس التالية لتسريع استعلامات البحث والفلترة اللحظية في قاعدة البيانات السحابية:

```sql
-- فهارس السرعة والاستعلام التكراري
CREATE INDEX idx_bookings_provider_date ON "Bookings" ("providerId", "bookingDate");
CREATE INDEX idx_bookings_customer ON "Bookings" ("customerId");
CREATE INDEX idx_halls_provider_status ON "Halls" ("providerId", "approvalStatus");
CREATE INDEX idx_invoices_number ON "Invoices" ("invoiceNumber");
CREATE INDEX idx_users_phone_email ON "Users" ("phone", "email");
```

---
*تم تحرير وتوثيق هذا الدليل التقني ليغطي قاعدة البيانات السحابية لمنصة "ليلة" بنسبة 100% متوافقاً مع كافة اشتراطات الحوكمة والأمان العالمية.*
