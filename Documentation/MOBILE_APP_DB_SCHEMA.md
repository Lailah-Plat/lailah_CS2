# دليل هياكل جداول قاعدة البيانات لتطبيق الجوال (منصة ليلة) 📱🛡️
*(Database Schema & Technical Specifications for PostgreSQL / Supabase)*

يحتوي هذا الملف على المواصفات التقنية الحرفية والهياكل الكاملة لجميع جداول قاعدة البيانات السحابية لـ **PostgreSQL / Supabase** والمستخدمة بشكل متزامن وبدقة 100% بين تطبيق الجوال (iOS & Android) والواجهة الخلفية لمنصة "ليلة".

تمت مطابقة أسماء الجداول (Table Names) وأسماء الأعمدة (Columns) وأنواع البيانات (Data Types) والقيود (Constraints) مع النماذج الرسمية للنظام (`Database.ts`) والتعليمات السيادية (`AGENTS.md`) لمنع أي تفاوت أو فقدان للبيانات.

---

## 🛠️ معلومات الاتصال وقواعد التسمية العامة
1. **قاعدة البيانات الأساسية:** PostgreSQL (مدارة بواسطة Supabase / Cloud SQL).
2. **حالة الحروف (Case Sensitivity):** الجداول تستخدم صيغة **PascalCase** أو التسمية الصريحة المحددة بالأسفل، وتستدعى حرفياً.
3. **أرقام التسلسل ومفاتيح التعريف التلقائية (ID Generation Rules):**
   * الـ `id` الأساسي يكون `INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY` (أو `SERIAL` متزايد تلقائياً).
   * يتم توليد المعرفات والرموز المالية والخدمية وفق الصيغ المعيارية المبينة في هذا الدليل.

---

## 📂 فهرس الجداول الموثقة فندياً للربط

| م | اسم الجدول الفني في قاعدة البيانات | Model المقابل في الشيفرة | وصف الجدول والوظيفة الأساسية |
|---|------------------------------------|--------------------------|-------------------------------|
| 1 | **`Users`**                        | `User`                   | الحسابات، بيانات العملاء، والمزودين والمسوقين |
| 2 | **`Halls`**                        | `Hall`                   | بيانات قاعات الأفراح، الاستراحات والشاليهات |
| 3 | **`Services`**                     | `Service`                | باقات الخدمات الأساسية والفرعية والمساندة |
| 4 | **`Bookings`**                     | `Booking`                | الحجوزات والمواعيد والمدفوعات والمستفيدين |
| 5 | **`booking_services`**             | `BookingService`         | جدول الربط بين الحجوزات والخدمات المساندة المختارة |
| 6 | **`SupportServiceRequests`**       | `SupportServiceRequest`  | طلبات الخدمات المستقلة المباشرة واليدوية |
| 7 | **`MarketingCampaigns`**           | `MarketingCampaign`      | الإعلانات الرقمية والعروض الترويجية والمدعومة |
| 8 | **`CampaignExpenses`**             | `CampaignExpense`        | مصاريف وفواتير تشغيل الحملات الإعلانية |
| 9 | **`AgencyAgreements`**             | `AgencyAgreement`        | اتفاقيات ونسب عمولات وكالات التسويق المعتمدة |
| 10| **`Roles`**                        | `Role`                   | أدوار وصلاحيات النظام الفنية والإدارية والموظفين |
| 11| **`reviews`**                      | `Review`                 | التقييمات والآراء والتعليقات المكتوبة والنجوم |
| 12| **`Invoices`**                     | `Invoice`                | فواتير الرسوم والخدمات المتوافقة مع هيئة الزكاة |
| 13| **`Wallets`**                      | `Wallet`                 | محافظ شركاء الخدمة ومزودي القاعات |
| 14| **`WalletTransactions`**           | `WalletTransaction`      | حركات قيود ومسحوبات المحافظ التشغيلية |
| 15| **`CustomerWallets`**              | `CustomerWallet`         | محافظ العملاء الرقمية للاسترجاع النقدي الفوري |
| 16| **`CustomerHeldBalances`**         | `CustomerHeldBalance`    | المبالغ المحتجزة المعلقة بانتظار جدولة أو ظروف قاهرة |
| 17| **`AuditLogs`**                    | `AuditLog`               | سجل العمليات والأمان لتتبع العمليات الحساسة |
| 18| **`Employees`**                    | `Employee`               | الموظفين والمنسقين الداخليين وتراخيص الموظفين |
| 19| **`Favorites`**                    | `Favorite`               | القاعات المفضلة والمحفوظة لدى العملاء |
| 20| **`subscription_plans`**           | `SubscriptionPlan`       | باقات اشتراكات المزودين والخدمات في المنصة |
| 21| **`provider_subscriptions`**       | `ProviderSubscription`   | عمليات اشتراك المزودين الحالية ونسب العمولات |
| 22| **`provider_feature_overrides`**   | `ProviderFeatureOverride`| تخصيص ميزات استثنائية لمزودين محددين |
| 23| **`support_tickets`**              | `Ticket`                 | تذاكر الدعم الفني، والمستندات، وساعات الـ SLA |
| 24| **`support_ticket_messages`**     | `TicketMessage`          | ردود ورسائل المحادثات داخل تذاكر الدعم |
| 25| **`service_chats`**                | `ServiceChat`            | محادثات العمل المباشرة بين العميل والمزود |
| 26| **`service_chat_messages`**       | `ServiceChatMessage`     | الرسائل التفصيلية والمرفقات لغرف الدردشة |
| 27| **`Revenues`**                     | `Revenue`                | القيود والسجلات المالية للإيرادات المباشرة |
| 28| **`Expenses`**                     | `Expense`                | السجلات القيادية للمصروفات المالية والتشغيلية |
| 29| **`SystemSettings`**               | `SystemSettings`         | إعدادات النظام وتفعيل التحقق OTP للجوال |
| 30| **`PlatformConfigs`**              | `PlatformConfig`         | متغيرات التهيئة السريعة وعناوين بوابات الدفع |
| 31| **`PendingRegistrations`**         | `PendingRegistration`    | التسجيلات المؤقتة المعلقة بانتظار مصادقة الـ OTP |

---

## 📝 1. تفاصيل وهيكل جدول المستخدمين (`Users`)
* **اسم الجدول الفني:** `Users`
* **الموديل المقابل:** `User`
* **الوصف:** يحتوي على حسابات العملاء، المزودين، المسوقين والمدراء مع بيانات الأمان والجلسات البيومترية.

| اسم الحقل (Column Name) | نوع البيانات (Postgres) | قيود الحقل (Constraints) | الوصف والدلالة |
|-------------------------|--------------------------|--------------------------|----------------|
| `id`                    | `INTEGER`                | PRIMARY KEY, AUTO_INC    | المعرف الفريد للمستخدم |
| `name`                  | `VARCHAR(255)`           | NOT NULL                 | الاسم الكامل للمستخدم |
| `email`                 | `VARCHAR(255)`           | NOT NULL, UNIQUE         | البريد الإلكتروني الرسمية |
| `role`                  | `VARCHAR(50)`            | NOT NULL                 | الدور: `Admin`, `Provider`, `provider_staff`, `Marketer`, `عميل` |
| `password_hash`         | `VARCHAR(255)`           | ALLOW NULL               | كلمة المرور المشفرة بـ bcrypt (Salt >= 10) |
| `phone`                 | `VARCHAR(50)`            | ALLOW NULL               | رقم الجوال (مثال: `05xxxxxxxx`) |
| `region`                | `VARCHAR(100)`           | ALLOW NULL               | المنطقة الجغرافية للمستخدم |
| `city`                  | `VARCHAR(100)`           | ALLOW NULL               | المدينة الحالية للمستخدم |
| `addressDetails`        | `VARCHAR(255)`           | ALLOW NULL               | تفاصيل العنوان الفعلي |
| `bankName`              | `VARCHAR(150)`           | ALLOW NULL               | اسم البنك التابع له الحساب |
| `iban`                  | `VARCHAR(50)`            | ALLOW NULL               | الحساب البنكي الدولي IBAN |
| `commercialRecord`      | `VARCHAR(100)`           | ALLOW NULL               | رقم السجل التجاري (للمزودين والشركات) |
| `status`                | `VARCHAR(50)`            | Default `'نشط'`           | حالة الحساب: `نشط`, `معطل` |
| `avatarUrl`             | `VARCHAR(550)`           | ALLOW NULL               | رابط الصورة الرمزية للملف الشخصي |
| `pushToken`             | `VARCHAR(255)`           | ALLOW NULL               | توكن إشعارات الدفع بالجوال (FCM/APNs) |
| `deviceUuid`            | `VARCHAR(255)`           | ALLOW NULL               | البصمة التعريفية الفريدة لجهاز الهاتف |
| `biometricEnabled`      | `BOOLEAN`                | Default `false`          | تفعيل المصادقة بالبصمة أو الوجه بالهاتف |

---

## 📝 2. تفاصيل وهيكل جدول القاعات (`Halls`)
* **اسم الجدول الفني:** `Halls`
* **الموديل المقابل:** `Hall`
* **الوصف:** يمثل قاعات الأفراح، الاستراحات والشاليهات المتاحة للحجز مع حالة الاعتماد وشروط التسعير.

| اسم الحقل (Column Name) | نوع البيانات (Postgres) | القيود / القيمة الافتراضية | الوصف والدلالة |
|-------------------------|--------------------------|----------------------------|----------------|
| `id`                    | `INTEGER`                | PRIMARY KEY, AUTO_INC      | المعرف الفريد للقاعة |
| `providerId`            | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف المزود مالك القاعة (العزل الصارم) |
| `name`                  | `VARCHAR(255)`           | NOT NULL                   | اسم القاعة التجاري |
| `type`                  | `VARCHAR(100)`           | NOT NULL                   | نوع المنشأة: `أفراح`, `مؤتمرات`, `شاليه`, `استراحة` |
| `description`           | `TEXT`                   | ALLOW NULL                 | الوصف التفصيلي والخدمي للقاعة |
| `contractTerms`         | `TEXT`                   | ALLOW NULL                 | شروط وأحكام العقد والالتزامات للعميل |
| `capacity`              | `INTEGER`                | NOT NULL                   | الطاقة الاستيعابية الفعالة (عدد الضيوف) |
| `hourlyRate`            | `DOUBLE PRECISION`       | NOT NULL                   | سعر التأجير بالساعة |
| `price`                 | `DOUBLE PRECISION`       | Default `0`                | السعر الأساسي للتأجير اليومي |
| `depositAmount`         | `DOUBLE PRECISION`       | Default `0`                | قيمة العربون المستحق مقدماً |
| `cancellationPeriod`    | `INTEGER`                | Default `14`               | مهلة الإلغاء المجاني بالأيام |
| `approvalStatus`        | `VARCHAR(50)`            | Default `'pending'`        | حالة الاعتماد الإداري: `pending`, `approved`, `rejected` |
| `status`                | `VARCHAR(50)`            | Default `'active'`         | حالة العمل والجاهزية التشغيلية |
| `city`                  | `VARCHAR(100)`           | Default `'الرياض'`         | المدينة التي تقع بها القاعة |
| `region`                | `VARCHAR(100)`           | Default `'الرياض'`         | المنطقة الجغرافية |
| `rating`                | `DOUBLE PRECISION`       | Default `4.5`              | متوسط تقييم المستخدمين للقاعة |
| `image`                 | `TEXT`                   | ALLOW NULL                 | رابط الصورة الرئيسية (حد أقصى 500KB) |
| `images`                | `TEXT`                   | ALLOW NULL                 | مصفوفة صور فرعية محفوظة بصيغة JSON String |
| `videoUrl`              | `TEXT`                   | ALLOW NULL                 | رابط فيديو MP4 التوضيحي (حد أقصى 10MB) |
| `location`              | `VARCHAR(255)`           | ALLOW NULL                 | رابط الإحداثيات الجغرافية على الخرائط |

---

## 📝 3. تفاصيل وهيكل جدول الحجوزات (`Bookings`)
* **اسم الجدول الفني:** `Bookings`
* **الموديل المقابل:** `Booking`
* **الوصف:** يحتوي على كافة الحجوزات الرسمية مع الرقم التسلسلي المعياري والضريبة وتفاصيل الاسترجاع.

| اسم الحقل (Column Name) | نوع البيانات (Postgres) | القيود / القيمة الافتراضية | الوصف والدلالة |
|-------------------------|--------------------------|----------------------------|----------------|
| `id`                    | `INTEGER`                | PRIMARY KEY, AUTO_INC      | المعرف الفريد للحجز |
| `bookingNumber`         | `VARCHAR(100)`           | UNIQUE, NOT NULL           | الرقم التسلسلي المعياري: `BKG-YY-XXXXXXXXXX` |
| `customerId`            | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف العميل صاحبة الحجز |
| `hallId`                | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف القاعة المحجوزة |
| `providerId`            | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف المزود صاحب القاعة |
| `bookingDate`           | `VARCHAR(50)`            | NOT NULL                   | تاريخ المناسبة (YYYY-MM-DD) |
| `slot`                  | `VARCHAR(50)`            | Default `'evening'`        | الفترة الزمنية: `morning`, `evening`, `full_day` |
| `totalPrice`            | `DOUBLE PRECISION`       | NOT NULL                   | المبلغ الإجمالي النهائي شامل الضريبة والخدمات |
| `subtotal`              | `DOUBLE PRECISION`       | NOT NULL                   | المبلغ المالي الأساسي قبل الضريبة |
| `vatAmount`             | `DOUBLE PRECISION`       | NOT NULL                   | قيمة ضريبة القيمة المضافة (15% VAT) |
| `depositPaid`           | `DOUBLE PRECISION`       | Default `0`                | المبلغ المدفوع مقدماً كعربون |
| `commissionAmount`      | `DOUBLE PRECISION`       | Default `0`                | عمولة المنصة المقتطعة بناءً على باقة المزود |
| `status`                | `VARCHAR(50)`            | Default `'pending'`        | حالة الحجز: `pending`, `confirmed`, `completed`, `cancelled` |
| `paymentStatus`         | `VARCHAR(50)`            | Default `'unpaid'`         | حالة الدفع: `unpaid`, `partially_paid`, `paid`, `refunded` |
| `paymentMethod`         | `VARCHAR(50)`            | ALLOW NULL                 | طريقة الدفع: `Mada`, `Visa`, `ApplePay`, `Cash` |
| `cancellationReason`    | `TEXT`                   | ALLOW NULL                 | سبب الإلغاء في حال وجوده |

---

## 📝 4. تفاصيل وهيكل جدول الفواتير الضريبية (`Invoices`)
* **اسم الجدول الفني:** `Invoices`
* **الموديل المقابل:** `Invoice`
* **الوصف:** السجلات المعتمدة للفواتير الضريبية المتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA).

| اسم الحقل (Column Name) | نوع البيانات (Postgres) | القيود / القيمة الافتراضية | الوصف والدلالة |
|-------------------------|--------------------------|----------------------------|----------------|
| `id`                    | `INTEGER`                | PRIMARY KEY, AUTO_INC      | المعرف الفريد للفاتورة |
| `invoiceNumber`         | `VARCHAR(100)`           | UNIQUE, NOT NULL           | الرقم التسلسلي المعياري: `INV-YYXXXXXXXXXX` |
| `bookingId`             | `INTEGER`                | ALLOW NULL, FOREIGN KEY    | معرف الحجز المرتبط بالفاتورة |
| `customerId`            | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف العميل |
| `providerId`            | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف المزود |
| `amount`                | `DOUBLE PRECISION`       | NOT NULL                   | المبلغ الصافي الخاضع للضريبة |
| `taxAmount`             | `DOUBLE PRECISION`       | NOT NULL                   | قيمة الضريبة المضافة المحتسبة (15%) |
| `totalAmount`           | `DOUBLE PRECISION`       | NOT NULL                   | الإجمالي النهائي المستحق سداده |
| `status`                | `VARCHAR(50)`            | Default `'issued'`         | حالة الفاتورة: `issued`, `paid`, `cancelled` |
| `issueDate`             | `VARCHAR(50)`            | NOT NULL                   | تاريخ إصدار الفاتورة |
| `qrCodeData`            | `TEXT`                   | ALLOW NULL                 | رمز الاستجابة السريع ZATCA QR Code Data |

---

## 📝 5. تفاصيل وهيكل جدول المحافظ المباشرة للمزودين (`Wallets`)
* **اسم الجدول الفني:** `Wallets`
* **الموديل المقابل:** `Wallet`
* **الوصف:** المحافظ المالية الرسمية للمزودين لتتبع الأرصدة المتاحة والرصيد المعلق.

| اسم الحقل (Column Name) | نوع البيانات (Postgres) | القيود / القيمة الافتراضية | الوصف والدلالة |
|-------------------------|--------------------------|----------------------------|----------------|
| `id`                    | `INTEGER`                | PRIMARY KEY, AUTO_INC      | المعرف الفريد للمحفظة |
| `providerId`            | `INTEGER`                | UNIQUE, NOT NULL           | معرف المزود مالك المحفظة |
| `balance`               | `DOUBLE PRECISION`       | Default `0.0`              | الرصيد الفعلي المتاح للسحب والتحويل البنكي |
| `pendingBalance`        | `DOUBLE PRECISION`       | Default `0.0`              | الرصيد المعلق لحين اكتمال المناسبات والحجوزات |

---

## 📝 6. تفاصيل وهيكل جدول الرصيد المحتجز والقوة القاهرة (`CustomerHeldBalances`)
* **اسم الجدول الفني:** `CustomerHeldBalances`
* **الموديل المقابل:** `CustomerHeldBalance`
* **الوصف:** إدارة المبالغ المحتجزة المعلقة بانتظار إعادة الجدولة أو حسم القوة القاهرة.

| اسم الحقل (Column Name) | نوع البيانات (Postgres) | القيود / القيمة الافتراضية | الوصف والدلالة |
|-------------------------|--------------------------|----------------------------|----------------|
| `id`                    | `INTEGER`                | PRIMARY KEY, AUTO_INC      | المعرف الفريد للرصيد المحتجز |
| `customerId`            | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف العميل |
| `originalBookingId`     | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف الحجز الملغى بداعي القوة القاهرة |
| `originalProviderId`    | `INTEGER`                | NOT NULL, FOREIGN KEY      | معرف المزود الأصلي |
| `amount`                | `DOUBLE PRECISION`       | NOT NULL                   | المبلغ المحتجز للعميل |
| `status`                | `VARCHAR(50)`            | Default `'held'`           | الحالة: `held`, `converted_to_cash`, `expired` |
| `reason`                | `VARCHAR(255)`           | Default `'force_majeure'`  | سبب الاحتجاز |

---

## 🔒 7. سياسة قواعد العزل الصارم والجداول الأخرى
- تتبع بقية الجداول مثل `Services`, `SupportServiceRequests`, `Employees`, `Roles`, `provider_subscriptions`, `support_tickets`, `service_chats` نفس آليات الربط والمفتاح الأجنبي المباشر لفرض العزل الصارم بنسبة 100%.
- يُطبق التحديث والتزامن التلقائي عبر بروتوكولات REST API و WebSockets المشفرة بـ SSL/TLS عبر الخادم الداعم للجوال.
