# 📘 وثيقة المعمارية الهندسية والبنية التقنية الشاملة - منصة ليلة
**Lailah Unified Platform - Engineering Architecture & Technical Specifications**

---

## 1. المقدمة والرؤية الهندسية (System Architecture Overview)
تُعد منصة **ليلة** المنظومة الرقمية السيادية الشاملة لإدارة وحجز القاعات والمناسبة والخدمات المساندة للفعاليات في المملكة العربية السعودية. تم بناء المنظومة وفق معمارية برمجية حديثة هجينة تجمع بين:
1. **تطبيقات الصفحة الواحدة التفاعلية (Single Page Application - SPA):** باستخدام React 18+ و TypeScript و Vite لتوفير واجهات مستخدم فائقة الاستجابة والسرعة للعملاء والمزودين والإدارة.
2. **خادم الخدمات الخلفية الموحد (Unified Express RESTful API Engine):** المكتوب بلغة TypeScript والمصمم للعمل في بيئات الحاويات السحابية (Cloud Run Containers) على الميناء الموحد `3000`.
3. **طبقة البيانات المزدوجة والتزامن الفوري (Dual Data & Sync Layer):** الربط بين Sequelize ORM وقواعد البيانات السحابية (PostgreSQL / SQLite) مع نظام التخزين المحلي ثنائي الاتجاه (Bi-directional LocalStorage Engine) والذاكرة السريعة (Redis Caching).

---

## 2. الهيكل التقني والمكدس البرمجي (Full Technology Stack)

| الطبقة الهندسية | التقنية / المكتبة | الغرض الوظيفي والاستخدام |
| :--- | :--- | :--- |
| **Frontend Runtime** | React 18, TypeScript 5+, Vite 5+ | بناء مكونات الواجهة التفاعلية وإدارة الحالة البرمجية. |
| **Styling & UI Effects** | Tailwind CSS 3.4+, Lucide Icons, Motion (Framer) | تصميم عصري متجاوب، أيقونات موحدة، وتأثيرات حركية انسيابية. |
| **Backend Server** | Node.js 20+, Express 4/5, TypeScript | معالجة الطلبات، منطق الأعمال، مسارات RESTful API، والتكامل. |
| **Server Bundler** | esbuild | تحزيم خادم TypeScript إلى `dist/server.cjs` بأسلوب CommonJS لمنع تضارب ESM. |
| **Database & ORM** | Sequelize ORM, PostgreSQL / SQLite | نمذجة الجداول، القيود، والاستعلامات المتطورة مع الترقية الديناميكية للهيكل. |
| **Caching & In-Memory** | Redis Storage Adapter | تسريع استعلامات الإحصائيات، تخزين الجلسات المؤقتة، ومراقبة أداء API. |
| **Security & Auth** | JWT, bcrypt, Express Middleware | التوثيق الآمن، تشفير كلمات المرور، وإدارة الصلاحيات والأدوار. |
| **PDF & Reports** | jsPDF, html2canvas | إصدار الفواتير الضريبية وتصدير العقود والتقارير المطبوعة. |

---

## 3. المعمارية الهيكلية وتدفق البيانات (System Topology)

```
                     ┌─────────────────────────────────────────┐
                     │          مستخدمي منصة ليلة               │
                     │  (عملاء، مزودي خدمات، إدارة المنصة)     │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │     Nginx Reverse Proxy (Port 3000)      │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │    Node.js Express Server (server.ts)    │
                     │    • Vite Middleware (Development)      │
                     │    • Dist Static Assets (Production)    │
                     └────────────────────┬────────────────────┘
                                          │
             ┌────────────────────────────┼────────────────────────────┐
             ▼                            ▼                            ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│   User & Auth Modules    │ │ Hall & Booking Modules   │ │ Finance & Admin Modules  │
│  /api/users/*            │ │ /api/halls/*, /api/bkg/* │ │ /api/finance/*           │
└────────────┬─────────────┘ └────────────┬─────────────┘ └────────────┬─────────────┘
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │    Sequelize ORM & Dynamic Migration    │
                     └────────────────────┬────────────────────┘
                                          │
             ┌────────────────────────────┴────────────────────────────┐
             ▼                                                         ▼
┌──────────────────────────┐                             ┌──────────────────────────┐
│  PostgreSQL / Cloud DB   │                             │   Redis Cache Storage    │
└──────────────────────────┘                             └──────────────────────────┘
```

---

## 4. مسارات ودليل المجلدات بالمشروع (Project File Directory Structure)

```
/
├── src/
│   ├── components/            # مكونات الواجهات الأمامية واللوحات
│   │   ├── admin/             # لوحة تحكم الإدارة العامة (Admin Master Dashboard)
│   │   ├── provider/          # لوحة تحكم المزود ونظام تشغيل الأعمال (Provider Workspace ERP)
│   │   ├── ClientHallsView.tsx# واجهة استعراض وتصفية القاعات للعملاء
│   │   ├── ClientServicesView.tsx # واجهة الخدمات المساندة للعملاء
│   │   ├── BookingModal.tsx   # معالج الحجز المباشر والخدمات المضافة
│   │   └── ChatSupport.tsx    # محرك المحادثات والدعم الفني المباشر
│   ├── modules/               # وحدات الخلفية الموديلارية (Backend Modules)
│   │   ├── user/              # مسارات، متحكمات، وخدمات المستخدمين
│   │   ├── hall/              # وحدة القاعات والأماكن
│   │   ├── service/           # وحدة الخدمات المساندة
│   │   ├── booking/           # وحدة الحجوزات والفواتير
│   │   └── finance/           # وحدة المالية، العمولات، والاشتراكات
│   ├── models/                # نماذج قاعدة البيانات (Sequelize Models)
│   │   ├── UserModels.ts      # نموذج المستخدمين والشركاء
│   │   ├── HallModels.ts      # نموذج القاعات والأماكن
│   │   ├── ServiceModels.ts   # نموذج الخدمات المضافة والمستقلة
│   │   └── BookingModels.ts   # نموذج الحجوزات والمالية
│   ├── hooks/                 # خطافات الحالة والمزامنة (React Hooks)
│   │   └── useAppState.ts     # إدارة الحالة المحلية وحزمة التزامن السحابي
│   ├── services/              # خدمات الاتصال بالخلفية (API Services)
│   │   └── apiService.ts      # الاتصال بنقاط النهاية ونظام إعادة المحاولة
│   └── data/                  # البيانات الأساسية والقوالب الافتراضية
│       └── mockData.ts        # البيانات الأولية الشاملة للمنصة
├── docs/                      # مجلد الوثائق الفنية والإدارية الشاملة
├── server.ts                  # نقطة الانطلاق الرئيسية لخادم Express
├── package.json               # إعدادات الحزم والنصوص التنفيذية
└── vite.config.ts             # إعدادات مجمع Vite
```

---

## 5. قواعد تشغيل البيئة والحاويات (Environment & Deployment Rules)
1. **المنفذ المقيد (Port Constraint):** يُحظر تعديل منفذ التشغيل عن `3000` أو تغيير متغير `PORT` نظراً لربطه المباشر ببركسي Nginx الخارجي بالحاويات.
2. **أمر البناء والتشغيل (Build & Start Flow):**
   - **أمر التطوير (`npm run dev`):** تشغيل `tsx server.ts` للعمل المباشر بدعم محرك Vite middleware.
   - **أمر البناء (`npm run build`):** تنفيذ `vite build` للواجهات + `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs` لبناء الخادم بملف واحد CommonJS.
   - **أمر التشغيل الانتاجي (`npm run start`):** تنفيذ `node dist/server.cjs`.
