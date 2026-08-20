# 🛠️ الشرح الهندسي لربط منصة ليلة مع نظام مكتب المساعدة Zoho Desk عبر REST API & OAuth 2.0

هذا المستند يقدم دليلاً هندسياً شاملاً ومفصلاً لمعماريي النظام ومديري المنصة ومطوري الخلفية (Senior Backend Developers) لشرح كيفية ربط ومزامنة بلاغات وشكاوى منصة ليلة تلقائياً مع نظام تذاكر Zoho Desk.

---

## 📐 1. المعمارية الفنية وآلية العمل (Architecture & Data Flow)

```
[ العميل / منصة ليلة ]
        │
        ▼ (تقديم شكوى / تعثر حجز)
┌────────────────────────────────────────────────────────┐
│  Layla Express Backend Server                           │
│  - Endpoint: POST /api/integrations/zoho-desk/webhook │
│  - Route: POST /api/integrations/zoho-desk/create-tkt │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼ (التحقق من حالة التفعيل ZOHO_DESK_ENABLED)
┌────────────────────────────────────────────────────────┐
│  Zoho Desk Service Engine (zohoDesk.service.ts)        │
│  - Auto Refresh Access Token (OAuth 2.0)               │
│  - Data Mapping (Name, Email, Subject, Booking ID)    │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼ (REST API HTTP Header: Zoho-oauthtoken)
┌────────────────────────────────────────────────────────┐
│  Zoho Desk REST API v1 Endpoint                        │
│  https://desk.zoho.com/api/v1/tickets                  │
└────────────────────────────────────────────────────────┘
```

---

## 🔑 2. دليل خطوة بخطوة للحصول على بيانات الاعتماد من Zoho Developer Console

لضمان الاتصال الآمن واستخراج `Client ID`, `Client Secret`, `Refresh Token`, `Org ID`, و `Department ID` اتباع الخطوات التالية:

### 🔹 الخطوة الأولى: إنشاء تطبيق في بوابة مطوري زوهو
1. اذهب إلى **Zoho Developer Console**: [https://api-console.zoho.com](https://api-console.zoho.com)
2. انقر على **"Add Client"** واختر نوع التطبيق: **"Server-based Applications"**.
3. أدخل البيانات التالية:
   - **Client Name:** `منصة ليلة - Layla Platform`
   - **Homepage URL:** `https://layla.sa` (أو رابط المنصة الخاص بك)
   - **Authorized Redirect URIs:** `https://api-console.zoho.com/oauth/callback`
4. انقر **"Create"**.
5. سيظهر لك مباشرة **Client ID** و **Client Secret**. قم بنسخهما وحفظهما في مكان آمن.

---

### 🔹 الخطوة الثانية: استخراج رمز التحديث الدائم (Refresh Token)
1. في نفس صفحة التطبيق في Zoho Developer Console، انتقل إلى تبويب **"Self Client"**.
2. في حقل **Scope**، أدخل الصلاحيات التالية:
   `ZohoDesk.tickets.ALL,ZohoDesk.contacts.ALL,ZohoDesk.settings.ALL`
3. اختر مدة الصلاحية **"10 minutes"** وكتابة أي وصف (مثل: `Layla Support Integration`)، ثم انقر **"Generate Token"**.
4. انسخ كود التفويض المؤقت (Grant Code).
5. افتح أداة cURL أو Postman أو Terminal وقم بإرسال الطلب التالي لاستبدال الكود بـ **Refresh Token** دائم:

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "code=YOUR_GRANT_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code"
```
*(ملاحظة: إذا كان حسابك في نطاق أوروبا استخدم accounts.zoho.eu وفي السعودية accounts.zoho.sa).*

6. سيحتوي الرد على JSON يتضمن `refresh_token` (مثل `1000.xxxx...xxxx`). هذا الرمز دائم ولا ينتهي أبداً ويُستخدم لتوليد `access_token` تلقائياً.

---

### 🔹 الخطوة الثالثة: استخراج معرف المنظمة (Org ID) والقسم (Department ID)
1. سجل الدخول إلى لوحة **Zoho Desk**: [https://desk.zoho.com](https://desk.zoho.com)
2. **استخراج Org ID**:
   - انقر على أيقونة الإعدادات ⚙️ **(Setup)** في أعلى اليسار.
   - من قسم **Developer Space**، اختر **API**.
   - انسخ **Org ID** الموجود أعلى الصفحة (رقم مكون من 9 إلى 11 خانة).
3. **استخراج Department ID**:
   - من قائمة الإعدادات ⚙️ **(Setup)**، اذهب إلى **Organization** -> **Departments**.
   - اختر القسم المخصص لتلقي بلاغات منصة ليلة (مثل Support أو Customer Care).
   - ستجد **Department ID** في تفاصيل القسم أو في رابط الصفحة (URL).

---

## 🧪 3. مطابقة البيانات (Data Mapping Table)

| حقل منصة ليلة (Layla Payload) | حقل Zoho Desk API | النوع / الوصف |
| :--- | :--- | :--- |
| `contactName` / `customerName` | `contact.lastName` | اسم العميل كاملاً |
| `email` | `contact.email` | البريد الإلكتروني المعتمد للعميل |
| `subject` | `subject` | عنوان المشكلة أو الشكوى |
| `description` + `bookingId` | `description` | تفاصيل المشكلة + رقم الحجز المُنسّق بصيغة markdown |
| `departmentId` | `departmentId` | معرف القسم في زوهو |
| `priority` | `priority` | درجة الأهمية (`High`, `Medium`, `Low`) |

---

## ⚙️ 4. المتغيرات البيئية البيئية (Environment Variables)

تضاف المتغيرات التالية في ملف `.env`:

```env
ZOHO_DESK_ENABLED=true
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_REFRESH_TOKEN=1000.XXXXXXXXXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_ORG_ID=60012345678
ZOHO_DEPARTMENT_ID=7189000000012345
ZOHO_DOMAIN=com
```

---

## ⚡ 5. نقاط النهاية المتاحة (API Endpoints)

- **استقبال Webhook تلقائي:** `POST /api/integrations/zoho-desk/webhook`
- **إنشاء تذكرة مباشرة:** `POST /api/integrations/zoho-desk/create-ticket`
- **تشغيل / تعطيل الربط:** `POST /api/integrations/zoho-desk/toggle`
- **فحص صحة اتصال OAuth:** `POST /api/integrations/zoho-desk/test-auth`
- **استعلام حالة الربط:** `GET /api/integrations/zoho-desk/status`
