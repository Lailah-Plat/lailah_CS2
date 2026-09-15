# 📱 وثيقة المواصفات التقنية وخارطة طريق الربط البرمجي لتطبيقات الجوال
# Technical Specification & API Roadmap for Lailah Mobile Applications (iOS & Android)

**الإصدار:** 1.0.0  
**النطاق:** الربط الكامل والتزامن اللحظي (Full-Stack Real-time Synchronization) بين خادم Node.js / Express، قاعدة بيانات PostgreSQL، وتطبيقات الجوال (React Native / Expo).  
**تاريخ الاعتماد والتوثيق:** سبتمبر 2026  
**التوافق السيادي:** متوافق 100% مع قواعد منصة "ليلة" (`AGENTS.md`) ومعايير هيئة الزكاة والضريبة والجمارك (ZATCA) والعزل الصارم للبيانات.

---

## 📑 الفهرس العام (Table of Contents)

1. [تقرير الملاءمة التقنية وعدم التعارض (Compatibility & Architectural Verification)](#1-تقرير-الملاءمة-التقنية-وعدم-التعارض)
2. [المعايير والقواعد الإلزامية للمنصة (Platform Sovereign Rules)](#2-المعايير-والقواعد-الإلزامية-للمنصة)
3. [البنية التحتية والتزامن اللحظي عبر WebSockets (Socket.io Architecture)](#3-البنية-التحتية-والتزامن-اللحظي-عبر-websockets)
4. [نظام الحسابات والتوثيق الآمن (Auth & OTP API Specification)](#4-نظام-الحسابات-والتوثيق-الآمن)
5. [واجهات جلب البيانات وعرض المحتوى الديناميكي (Catalog & Content APIs)](#5-واجهات-جلب-البيانات-وعرض-المحتوى-الديناميكي)
6. [نظام العمليات: الحجوزات والفواتير (Bookings & Invoices APIs)](#6-نظام-العمليات-الحجوزات-والفواتير)
7. [الدعم الفني والمحادثة الفورية (Support Tickets & Live Chat)](#7-الدعم-الفني-والمحادثة-الفورية)
8. [مخطط Swagger / OpenAPI 3.0 ومجموعة Postman (OpenAPI & Postman Roadmap)](#8-مخطط-swagger--openapi-30-ومجموعة-postman)
9. [استراتيجية الاتصال، التخزين المؤقت، ومعالجة أخطاء الجوال (Mobile Resilience)](#9-استراتيجية-الاتصال-والتخزين-المؤقت)

---

## 1. تقرير الملاءمة التقنية وعدم التعارض

تم فحص ومراجعة كافة المتطلبات التقنية الواردة في طلب الربط ومقارنتها بالبنية التحتية الحالية للمنصة:

| المكون المطلوب | التقنية المستهدفة | الحالة في النظام الحالي | التوافق وعدم التعارض |
|---|---|---|---|
| **الخادم (Backend)** | Node.js + Express (ESM / TS) | جاهز ويعمل على المنفذ `3000` | **متوافق تماماً:** المسارات المهيكلة تدعم استجابات JSON نقية. |
| **قاعدة البيانات** | PostgreSQL (مع دعم SQLite محلياً) | جاهزة وتدار عبر Sequelize ORM | **متوافق تماماً:** نفس المخطط وعلاقات الجداول الموحدة. |
| **التزامن الفوري (Real-Time)** | Socket.io v4 | مثبت في `server.ts` ومربوط بـ `httpServer` | **متوافق تماماً:** الخادم يمتلك `io` جاهزاً للبث الثنائي. |
| **الأمان والتحقق** | JWT + OTP + SMS Gateway | مفعل ومربوط ببوابات الرسائل النصية | **متوافق تماماً:** نظام التوكنات ومعالجة أرقام الهواتف السعودية جاهزة. |
| **وسائط القاعات والخدمات** | تخزين القرص + روابط ثابتة | مهيأ تحت `/uploads/` و `/AvatarCustomers/` | **متوافق تماماً:** روابط مباشرة تدعم العرض في تطبيقات الهواتف. |

> **النتيجة الفنية:** الطلب متطابق 100% مع البنية التحتية لمنصة "ليلة"، ولا يوجد أي تعارض تقني أو برمجي مع أي من مكتبات أو سياسات النظام.

---

## 2. المعايير والقواعد الإلزامية للمنصة (Platform Sovereign Rules)

يجب على مطوري تطبيق الجوال والواجهات الخلفية الالتزام الصارم بالقواعد التالية دون أي تجاوز:

### 1️⃣ تنسيق الأرقام التسلسلية المعتمدة (Serial Number Formats)
تبدأ كافة الأرقام التسلسلية من `0000000001` وتتجدد سنوياً بحسب آخر خانتين من السنة الميلادية (`26` لعام 2026):
- **رقم حجز القاعات:** `BKG-YY-XXXXXXXXXX` (مثال: `BKG-26-0000000001`).
- **رقم طلبات الخدمات المساندة:** `SRV-YY-XXXXXXXXXX` (مثال: `SRV-26-0000000001`).
- **رقم الفاتورة الضريبية:** `INV-YYXXXXXXXXXX` *(بدون واصلة بعد السنة)* (مثال: `INV-260000000001`).
- **رقم الإيرادات المالية:** `REV-YY-XXXXXXXXXX` (مثال: `REV-26-0000000001`).
- **رقم المصروفات المالية:** `EXP-YY-XXXXXXXXXX` (مثال: `EXP-26-0000000001`).

### 2️⃣ العزل الصارم للبيانات والخصوصية (Multi-Tenancy Isolation)
- **بيانات العملاء:** لا يجوز إرجاع أي حجز أو فاتورة أو تذكرة إلا إذا طابق `customerId` معرف المستخدم المستخرج من الـ JWT الخاص بالعميل.
- **بيانات الموفرين:** في واجهات الجوال، لا تظهر بيانات الموفر كاسم رسمي إلا إذا كان خيار `showProviderToCustomers` مفعلاً في إعدادات القاعة/الخدمة.

### 3️⃣ جميع الأسعار شاملة ضريبة القيمة المضافة 15% (VAT-Inclusive Standard)
- كافة الأسعار المعروضة في التطبيق هي **أسعار نهائية شاملة للضريبة (15%)**.
- المعادلة المحاسبية المعتمدة هي:
  $$\text{Taxable Amount} = \frac{\text{Gross Price}}{1.15}$$
  $$\text{VAT (15\%)} = \text{Gross Price} - \text{Taxable Amount}$$
- لا يجوز إضافة الضريبة كبند منفصل فوق السعر المعروض للمستهلك في شاشات الحجز.

### 4️⃣ اعتماد القاعات والخدمات (Admin Approval Gating)
- تقتصر استجابة واجهات عرض القاعات والخدمات في تطبيق الجوال حصرياً على العناصر التي تحمل حالة اعتماد `status: 'نشط'` أو `'معتمد'`. أي قاعة قيد المراجعة (`معلق بانتظار الاعتماد`) تُحجب تماماً عن العرض العام.

### 5️⃣ معايير وسائط الصور والفيديو (Media Constraints)
- **الصور:** JPEG / PNG / WebP، حد أقصى للحجم `500KB`، الأبعاد المعتمدة بين `960x540px` كحد أدنى و `1280x720px` كحد أقصى (نسبة 16:9).
- **الفيديو:** صيغة `MP4` قياسية، حد أقصى للحجم `10MB`، أبعاد قصوى `960x540px`.

---

## 3. البنية التحتية والتزامن اللحظي عبر WebSockets (Socket.io Architecture)

تضمن بنية التزامن عبر `Socket.io` أن يكون تطبيق الجوال ولوحة تحكم المنصة مرآة لحظية لبعضهما البعض.

### 🔌 آلية الاتصال وتفويض المعرف (Handshake & Authentication)
- **نقطة الاتصال:** `wss://[domain]:3000` أو عبر بروتوكول HTTP Upgrade.
- **معاملات المصادقة (Handshake Query / Headers):**
```json
{
  "auth": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "query": {
    "platform": "mobile",
    "appVersion": "1.0.0",
    "clientRole": "عميل"
  }
}
```

### 🏷️ قنوات وغرف التوزيع الآمن (Socket Rooms)
عند نجاح الاتصال، يتم ضم اتصال العميل تلقائياً إلى غرفه المخصصة:
1. `customer_${userId}`: لتلقي إشعارات الحجز وتحديثات الفواتير الموجهة له شخصياً.
2. `booking_${bookingId}`: لتحديثات حجز محدد أثناء متابعة شاشة تفاصيل المناسبة.
3. `chat_${chatId}`: لغرف الدردشة الفورية مع الدعم الفني.
4. `system_broadcast`: للإعلانات والتنبيهات العامة وتحديث الإعدادات.

### 📡 أحداث الإرسال والاستقبال (Socket Event Matrix)

| اسم الحدث (Event Name) | الاتجاه (Direction) | الوصف والحمولة (Payload) | الإجراء المتخذ |
|---|---|---|---|
| `customer_action` | Mobile ➔ Server | `{ action: "create_booking_intent", bookingData: {...} }` | تسجيل النية وبث تنبيه لغرفة `admin_operations`. |
| `booking_created` | Server ➔ Admin Dashboard | `{ bookingId: "BKG-26-...", customerName: "...", total: 25000 }` | تحديث جدول الحجوزات في لوحة الإدارة فوراً بدون Refresh. |
| `booking_status_updated` | Server ➔ Mobile | `{ bookingId: "BKG-26-...", oldStatus: "معلق", newStatus: "مؤكد" }` | تحديث واجهة العميل بالجوال وإطلاق إشعار منبثق (Local Alert). |
| `payment_succeeded` | Server ➔ Mobile & Admin | `{ bookingId: "...", invoiceNumber: "INV-26...", status: "مدفوع" }` | نقل شاشة الجوال فوراً لصفحة الفاتورة وتأكيد الحجز. |
| `system_config_updated` | Server ➔ Mobile | `{ key: "MAINTENANCE_MODE", value: false }` | تحديث إعدادات التطبيق بدون الحاجة لإعادة التشغيل. |
| `chat_message` | ثنائي (Bi-directional) | `{ chatId: "...", senderRole: "عميل", message: "...", time: "..." }` | ظهور الرسالة في لوحة دعم المنصة وشاشة محادثة الجوال فوراً. |

---

## 4. نظام الحسابات والتوثيق الآمن (Auth & OTP API Specification)

### 1️⃣ إرسال رمز التحقق (Send OTP)
- **المسار:** `POST /api/auth/send-otp` أو `POST /api/auth/login-otp`
- **حالة المسار:** عام (Public)
- **الهدف:** استقبال رقم جوال العميل وإرسال رمز تحقق صالح لمدة 5 دقائق عبر بوابة SMS المعتمدة.
- **جسم الطلب (Request Body):**
```json
{
  "phone": "+966501234567",
  "purpose": "login_or_register"
}
```
- **استجابة النجاح (Response 200 OK):**
```json
{
  "success": true,
  "message": "تم إرسال رمز التحقق برسالة نصية إلى جوالك بنجاح",
  "expiresInSeconds": 300,
  "retryAfterSeconds": 60
}
```

### 2️⃣ التحقق من الرمز وتوليد التوكن (Verify OTP & Issue JWT)
- **المسار:** `POST /api/auth/verify-otp`
- **حالة المسار:** عام (Public)
- **الهدف:** التحقق من مطابقة الرمز المدخل، وتسجيل المستخدم إذا كان جديداً، وإصدار توكن JWT وتوكن تجديد (Refresh Token).
- **جسم الطلب (Request Body):**
```json
{
  "phone": "+966501234567",
  "otp": "482910"
}
```
- **استجابة النجاح (Response 200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "e4b9d088e08c094835a2b4c44ae5f8becb...",
  "user": {
    "id": 142,
    "customerId": "CUST-9821",
    "name": "عبدالله التميمي",
    "phone": "+966501234567",
    "email": "customer@example.com",
    "role": "عميل",
    "avatar": "/AvatarCustomers/avatar-142.png",
    "isProfileComplete": true,
    "loyaltyPoints": 1250
  }
}
```

### 3️⃣ الملف الشخصي وتحديث البيانات (User Profile API)
- **جلب البيانات:** `GET /api/users/profile` (يتطلب `Authorization: Bearer <JWT>`)
- **تحديث البيانات:** `PUT /api/users/profile` (يتطلب `Authorization: Bearer <JWT>`)
- **رفع الصورة الشخصية:** `POST /api/users/avatar` (`multipart/form-data`)
- **جسم التحديث (PUT Body):**
```json
{
  "name": "عبدالله التميمي",
  "email": "a.tamimi@example.com",
  "city": "الرياض",
  "preferredTheme": "luxury_dark"
}
```

---

## 5. واجهات جلب البيانات وعرض المحتوى الديناميكي (Catalog & Content APIs)

تدعم جميع هذه المسارات البحث، التصفية المتقدمة، التقسيم المورق (Pagination)، والفرز.

### 1️⃣ جلب قائمة القاعات (Venues / Halls Catalog)
- **المسار:** `GET /api/bookings/halls` (أو المترادف `GET /api/halls`)
- **المعاملات الاختيارية (Query Parameters):**
  - `page` (افتراضي: 1)
  - `limit` (افتراضي: 20، أقصى حد: 50)
  - `search`: بحث نصي في اسم القاعة أو الحي.
  - `city`: تصفية حسب المدينة (مثل: "الرياض"، "جدة").
  - `category`: تصفية حسب نوع المناسبة (أعراس، مؤتمرات، حفلات خاصة).
  - `minCapacity` & `maxCapacity`: تصفية حسب الطاقة الاستيعابية.
  - `minPrice` & `maxPrice`: تصفية حسب السعر الإجمالي شامل الضريبة.
  - `sort`: خيارات الفرز (`price_asc`, `price_desc`, `rating_desc`, `newest`).
- **استجابة النجاح (Response 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "name": "قصر الثريا الملكي للأفراح",
      "city": "الرياض",
      "district": "حي الملقا",
      "capacity": 500,
      "price": 34500.00,
      "taxableAmount": 30000.00,
      "vatAmount": 4500.00,
      "currency": "SAR",
      "isVatInclusive": true,
      "rating": 4.9,
      "reviewsCount": 84,
      "mainImage": "/uploads/halls/hall-12-main.webp",
      "images": [
        "/uploads/halls/hall-12-1.webp",
        "/uploads/halls/hall-12-2.webp"
      ],
      "videoUrl": "/uploads/halls/hall-12-tour.mp4",
      "features": ["جناح خاص للعروس", "شاشات عرض ليد", "أجهزة ليزر وإضاءة"],
      "status": "نشط"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 4,
    "totalItems": 68,
    "hasNextPage": true
  }
}
```

### 2️⃣ تفاصيل القاعة والخدمات الإضافية ونموذج التسعير الهجين (Hall Detail & Addons)
- **المسار:** `GET /api/bookings/halls/:id`
- **القاعدة الإلزامية المنفذة في المسار:**
  - يتم تضمين الخدمات الإضافية التابعة للقاعة (`inVenueAddons`).
  - إذا كانت القاعة توفر خدمة في فئة محددة (مثل: الضيافة)، يتم آلياً حجب أي مزودي خدمات مستقلين من تلك الفئة تطبيقاً لـ **قاعدة حظر تداخل الخدمات الخارجية مع خدمات المكان** (Rule 5).

### 3️⃣ جلب الخدمات المساندة المستقلة (Independent Services API)
- **المسار:** `GET /api/bookings/services` (أو المترادف `GET /api/services`)
- **المعاملات (Query Parameters):**
  - `category`: (ضيافة وبوفيهات، توثيق وتصوير، تجهيزات صوتية وإضاءة، كوش وتنسيق زهور).
  - `city`: تصفية جغرافية.
- **استجابة النجاح:** مصفوفة خدمات معتمدة تتضمن الأسعار الشاملة لضريبة الـ 15% وتفاصيل مقدم الخدمة المصرح بها.

---

## 6. نظام العمليات: الحجوزات والفواتير (Bookings & Invoices APIs)

### 1️⃣ إنشاء حجز مناسبة جديد (Create Booking)
- **المسار:** `POST /api/bookings`
- **التفويض:** مطلوب `Authorization: Bearer <JWT>`
- **جسم الطلب (Request Body):**
```json
{
  "hallId": 12,
  "eventDate": "2026-11-20",
  "eventPeriod": "evening",
  "selectedPackageId": 3,
  "selectedAddons": [
    { "addonId": 45, "quantity": 1 }
  ],
  "customerNotes": "يرجى تجهيز مدخل القاعة في تمام الساعة الخامسة عصراً",
  "paymentMethod": "mada"
}
```
- **استجابة النجاح (Response 201 Created):**
```json
{
  "success": true,
  "message": "تم إنشاء طلب الحجز بنجاح",
  "booking": {
    "id": 892,
    "bookingNumber": "BKG-26-0000000892",
    "status": "معلق",
    "eventDate": "2026-11-20",
    "eventPeriod": "مسائية",
    "pricingSnapshot": {
      "grossTotal": 39675.00,
      "taxableAmount": 34500.00,
      "vatRate": 0.15,
      "vatAmount": 5175.00,
      "currency": "SAR",
      "isImmutable": true
    },
    "invoice": {
      "invoiceNumber": "INV-260000000892",
      "status": "غير مدفوع",
      "dueDate": "2026-11-15T23:59:59Z"
    }
  }
}
```
- **التأثير اللحظي (Real-Time Emit):** يبث الخادم تلقائياً حدث `new_booking_arrived` إلى غرفة الإدارة `admin_operations` ومزود القاعة المعني لتحديث الشاشة فوراً دون إعادة تحميل.

### 2️⃣ جلب حجوزات العميل (Customer Bookings List)
- **المسار:** `GET /api/bookings/my-bookings`
- **المعاملات:** `status=active` (للحجوزات القادمة والحالية) أو `status=past` (للحجوزات المكتملة والملغاة).
- **العزل:** يُفلتر الاستعلام تلقائياً بناءً على `req.user.id` المسجل بالتوكن.

### 3️⃣ استعراض الفواتير والمدفوعات (Invoices & Payments API)
- **المسار:** `GET /api/finance/invoices/my-invoices`
- **استرجاع فاتورة محددة وتفاصيل ZATCA:** `GET /api/finance/invoices/:invoiceNumber`
- **حقول الفاتورة الضريبية:**
  - `invoiceNumber`: بالصيغة الإلزامية `INV-YYXXXXXXXXXX`.
  - `zatcaQrCode`: رمز الاستجابة السريعة المشفر والمطابق لمتطلبات هيئة الزكاة.
  - `lineItems`: قائمة البنود والكميات والأسعار.
  - `paymentStatus`: (`مدفوع`, `معلق`, `مسترد`).

---

## 7. الدعم الفني والمحادثة الفورية (Support Tickets & Live Chat)

### 1️⃣ إدارة تذاكر الدعم الفني (Support Tickets API)
- **إنشاء تذكرة جديدة:** `POST /api/support/tickets`
- **جلب تذاكر العميل:** `GET /api/support/tickets/my-tickets`
- **إضافة رد ومرفقات:** `POST /api/support/tickets/:ticketId/messages`
- **جسم إنشاء التذكرة (Request Body):**
```json
{
  "subject": "استفسار بخصوص موعد معاينة القاعة",
  "category": "استفسار حجز",
  "priority": "متوسطة",
  "bookingNumber": "BKG-26-0000000892",
  "message": "أرغب في زيارة القاعة ومعاينة التجهيزات برفقة المصممة يوم الثلاثاء القادم."
}
```

### 2️⃣ الشات الفوري المباشر (Live Chat WebSocket Protocol)
- **الانضمام لغرفة المحادثة:**
  ```javascript
  socket.emit("join_chat", { chatId: "CHAT-492", ticketId: 104 });
  ```
- **إرسال رسالة فورية:**
  ```javascript
  socket.emit("send_message", {
    chatId: "CHAT-492",
    text: "مرحباً، هل يمكن تعديل موعد الضيافة؟",
    attachments: []
  });
  ```
- **مؤشر الكتابة الحية (Typing Indicator):**
  ```javascript
  socket.emit("typing", { chatId: "CHAT-492", isTyping: true });
  ```
- **استقبال الرسائل اللحظية (Event Listener):**
  ```javascript
  socket.on("receive_message", (data) => {
    // تحديث واجهة الشات بالجوال فوراً
    appendMessageToState(data);
  });
  ```

---

## 8. مخطط Swagger / OpenAPI 3.0 ومجموعة Postman

تم تجميع مواصفة الـ API وفق معيار **OpenAPI 3.0.3** لتسهيل استيرادها في بيئات الاختبار:

```yaml
openapi: 3.0.3
info:
  title: Lailah Event Platform - Mobile Client API
  version: 1.0.0
  description: Official unified RESTful & WebSocket API specification for Lailah Mobile Applications.
servers:
  - url: https://api.lailah.sa
    description: Production Cloud Run Server
  - url: http://localhost:3000
    description: Local Container Development Environment
paths:
  /api/auth/send-otp:
    post:
      summary: Send OTP Code via SMS
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [phone]
              properties:
                phone: { type: string, example: "+966501234567" }
      responses:
        '200':
          description: OTP dispatched successfully
  /api/auth/verify-otp:
    post:
      summary: Verify OTP and Obtain JWT Bearer Token
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [phone, otp]
              properties:
                phone: { type: string, example: "+966501234567" }
                otp: { type: string, example: "482910" }
      responses:
        '200':
          description: User authenticated and token issued
  /api/bookings/halls:
    get:
      summary: Get Approved Venues Catalog
      tags: [Venues]
      parameters:
        - in: query
          name: city
          schema: { type: string }
        - in: query
          name: page
          schema: { type: integer, default: 1 }
        - in: query
          name: limit
          schema: { type: integer, default: 20 }
      responses:
        '200':
          description: List of approved venues with VAT-inclusive pricing
  /api/bookings:
    post:
      summary: Create New Event Booking
      tags: [Bookings]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [hallId, eventDate, eventPeriod]
              properties:
                hallId: { type: integer, example: 12 }
                eventDate: { type: string, format: date, example: "2026-11-20" }
                eventPeriod: { type: string, enum: [morning, evening, full_day] }
      responses:
        '201':
          description: Booking registered and serial number issued
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

> **ملحوظة لمطوري الجوال:** يمكن نسخ الكود أعلاه وتخزينه في ملف `swagger.yaml` أو استيراده كـ `Raw Text` مباشرة في برنامج **Postman** (عبر زر Import ➔ OpenAPI Text) لتوليد مجموعة الطلبات بمتغيراتها البيئية (`{{baseUrl}}`, `{{authToken}}`) بشكل آلي متكامل.

---

## 9. استراتيجية الاتصال، التخزين المؤقت، ومعالجة أخطاء الجوال

لضمان سلاسة التطبيق على شبكات الجوال الضعيفة (3G/4G/5G):
1. **دعم السحب للتحديث (Pull-to-refresh):** تدعم مسارات الـ GET إرسال رأس `Cache-Control: no-cache` لتجاوز أي كاش محلي وجلب أحدث الأسعار والتوافر.
2. **استعادة اتصال السوكت (Reconnection Resiliency):** في حال انقطاع شبكة الهاتف، يُعيد التطبيق الاتصال تلقائياً بخوارزمية تراجع تدريجي (`Exponential Backoff`)، ثم يرسل حدث `re-sync` لمطابقة حالة الحجوزات مع السيرفر.
3. **التخزين الآمن لمفاتيح الدخول:** يتم تخزين الـ JWT في مساحة التخزين المشفرة للهاتف (`Keychain` لنظام iOS و `EncryptedSharedPreferences` لنظام Android).

---

**خاتمة الاعتماد البرمجي:** هذا الملف يمثل المرجع التقني الشامل والمعتمد للبدء الفوري في تطوير وربط شاشات تطبيقات الجوال، مع استقرار تام للبنية التحتية البرمجية لمنصة "ليلة".
