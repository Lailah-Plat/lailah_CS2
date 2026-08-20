# وثيقة النماذج البرمجية وصيغ المعرفات الموحدة - منصة ليلة

## 1. التنسيق القياسي للأرقام التسلسلية والمعرفات (Serial Number Standards)
وفقاً للرقابة الصارمة والتنظيم المالي لمنصة "ليلة"، يتم توليد جميع الأرقام التسلسلية والمعرفات آلياً وفق الأنماط التالية، حيث تبدأ الأجزاء التسلسلية من `0000000001` مع بداية كل سنة ميلادية جديدة (`YY` يمثل أحدث رقمين من السنة مثل `26` لعام 2026):

| نوع المعرف (Identifier Type) | الصيغ الرسمية المعتمدة (Format) | مثال توضيحي (Example) | الوصف والدلالة |
| :--- | :--- | :--- | :--- |
| **رقم حجز القاعات** | `BKG-YY-XXXXXXXXXX` | `BKG-26-0000000001` | يبدأ بـ BKG- ثم سنة الحجز متبوعة بـ 10 خانات تسلسلية. |
| **رقم طلبات الخدمات** | `SRV-YY-XXXXXXXXXX` | `SRV-26-0000000001` | يبدأ بـ SRV- ثم سنة الطلب متبوعة بـ 10 خانات تسلسلية. |
| **رقم الفاتورة الصادرة** | `INV-YYXXXXXXXXXX` | `INV-260000000001` | يبدأ بـ INV- ثم السنة مباشرة بدون واصلة تليها 10 خانات. |
| **رقم الإيرادات المالية** | `REV-YY-XXXXXXXXXX` | `REV-26-0000000001` | يبدأ بـ REV- ثم السنة متبوعة بـ 10 خانات تسلسلية. |
| **رقم المصروفات المالية** | `EXP-YY-XXXXXXXXXX` | `EXP-26-0000000001` | يبدأ بـ EXP- ثم السنة متبوعة بـ 10 خانات تسلسلية. |

---

## 2. النماذج الرئيسية وهيكلية البيانات (Core Models & Schema)

### 2.1 نموذج المستخدمين (User Model)
- **الحقول:** `id`, `name`, `email`, `role` (`admin` | `provider` | `customer`), `phone`, `password_hash`, `commercialRecord`, `vatNumber`, `bankName`, `iban`, `username`, `showProviderToCustomers`, `status`.
- **العلاقات:**
  - المستخدم (Provider) يمتلك عدة قاعات (`Halls`) وخدمات مساندة (`Services`).
  - المستخدم (Customer) يمتلك عدة حجوزات (`Bookings`) وطلبات خدمات (`ServiceRequests`).

### 2.2 نموذج القاعات والأماكن (Hall / Venue Model)
- **الحقول:** `id`, `providerId`, `providerName`, `name`, `city`, `district`, `capacity`, `price`, `images` (JSON array), `videoUrl`, `status` (`pending` | `approved` | `rejected`), `approvalStatus`, `features` (JSON), `addons` (JSON).

### 2.3 نموذج الخدمات المساندة (Service Model)
- **الحقول:** `id`, `providerId`, `providerName`, `title`, `category` (ضيافة، توثيق وتصوير، إضاءة، إلخ), `price`, `description`, `images` (JSON array), `status` (`pending` | `approved`).

### 2.4 نموذج الحجوزات (Booking Model)
- **الحقول:** `id` (BKG format), `customerId`, `providerId`, `hallId`, `eventDate`, `totalPrice`, `commissionAmount`, `status`, `invoiceNumber` (INV format), `paymentStatus`.

### 2.5 نموذج المرفقات والوسائط (Media Standards)
- **الصور:** الصيغ (`JPG`, `JPEG`, `PNG`, `WebP`) - الحجم الأقصى `500KB` - الأبعاد (`960x540` إلى `1280x720` بكسل).
- **الفيديو:** الصيغة (`MP4`) - الحجم الأقصى `10MB` - الأبعاد القصوى (`960x540` بكسل).
