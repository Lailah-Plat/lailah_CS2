# LPAS Technical Architecture & Growth Engine Documentation
## Lailah Provider Acquisition & Multi-Landing Page System (LPAS)

---

### 1. Landing Page Architecture
The **Lailah Provider Acquisition & Multi-Landing Page System (LPAS)** is built as a dynamic, data-driven Growth Engine. Instead of hardcoding static React pages, LPAS decouples:
- **Page Template Logic** (`LPASPageRenderer`)
- **Page Content & Data Schema** (`LPASLandingPage` in `/src/types/lpas.ts`)
- **Dynamic Resolver & Targeting Engine** (`LPASResolverService.ts`)
- **Growth Studio Admin Management** (`LPASManager.tsx`)
- **Attribution & Context Preservation** (`storeLPASAttribution` & `getLPASAttribution`)

---

### 2. Page Types Supported
1. `ACQUISITION_GENERAL`: General parent acquisition page for all event provider types.
2. `ACQUISITION_VENUES`: Targeted acquisition for halls, wedding palaces, and rest houses (`providerType = VENUE`).
3. `ACQUISITION_SERVICES`: Targeted acquisition for independent event services (`providerType = SERVICE_PROVIDER`).
4. `CATEGORY_TARGETED`: Category-specific landing pages (catering, photography, flowers, decor, sound/light, rentals).
5. `GEOGRAPHIC_TARGETED`: City/Region specific landing pages (Riyadh, Jeddah, Dammam, Khobar, Makkah, Madinah, Qassim).
6. `COMBINED_TARGETED`: City × Category / ProviderType composite targeting (e.g., Catering in Jeddah, Venues in Riyadh).
7. `SEASONAL_CAMPAIGN`: High-converting marketing campaign pages with promo codes and expiration dates.

---

### 3. Data Model (`LPASLandingPage`)
Defined in `/src/types/lpas.ts`:
- `id`: Unique page identifier.
- `slug`: URL slug identifier (e.g. `venues-riyadh`, `catering-hospitality`).
- `pageType`: One of the 7 supported `LPASPageType` values.
- `title` & `subtitle`: Primary banner titles.
- `heroHeadline` & `heroSubheadline`: High-converting display copy.
- `targetCityId`, `targetCategoryId`, `targetProviderType`: Targeting metadata.
- `seoTitle`, `seoDescription`, `keywords`: SEO & Social sharing.
- `benefits`: Array of `LPASValueBenefit` (4-card value grid).
- `processSteps`: Array of `LPASProcessStep` (onboarding steps).
- `keyFeatures`: Array of `LPASFeature` (platform capabilities).
- `testimonials`: Array of `LPASTestimonial` (real success quotes).
- `faqItems`: Array of `LPASFAQItem` (frequently asked questions).
- `primaryCTATtext`, `secondaryCTATtext`: Call-to-action buttons.

---

### 4. Templates & Section Registry
The rendering pipeline (`LPASPageRenderer.tsx`) implements 10 modular visual sections:
1. **Top Campaign Announcement Bar**
2. **Header Navigation with Live Share**
3. **Hero Section with Visual Showcase**
4. **Value Benefits 4-Card Grid**
5. **Simple Onboarding Flow (4 Steps)**
6. **Enterprise Engine Feature Matrix**
7. **Partner Success Testimonials**
8. **Accordion FAQ System**
9. **Conversion Bottom CTA Banner**
10. **Platform Footer**

---

### 5. Routing & URL Resolution
URL parameters are handled seamlessly in `src/App.tsx` and `LPASResolverService.ts`:
- Route: `https://lailah.sa?lpas_page=<slug>`
- Resolution Order:
  1. Stored database/registry match (`getLPASPages()`).
  2. If missing, `LPASResolverService.resolveLPASPage(slug)` dynamically parses City × Category from slug and generates an on-the-fly tailored Arabic landing page.
  3. Fallback: General Provider Acquisition Parent Page.

---

### 6. SEO & Schema.org JSON-LD
Each page includes:
- Unique Arabic page title & meta description.
- `generateSchemaOrgJSONLD(page)` providing Google-compliant `Service` and `Organization` structured data.
- Semantic HTML tags (`<h1>`, `<section>`, `<article>`).

---

### 7. Sitemap Generation
`generateLPASSitemapXML()` dynamically aggregates all static and City × Category combinations into valid XML sitemap output.

---

### 8. Admin Management (Growth Studio)
Accessible via **الإعدادات والتسويق 🎯** or **محرك صفحات الهبوط (LPAS)** in Admin Dashboard (`LPASManager.tsx`):
- View, search, and filter all registered pages.
- Desktop vs. Mobile device preview modes.
- Launch custom pages instantly without writing code.
- Monitor active UTM attribution pipeline.

---

### 9. Registration Handoff & Context Transfer
When clicking any CTA button on an LPAS page:
- Acquisition context is persisted in `sessionStorage` & `localStorage` (`LPAS_ATTRIBUTION_KEY`).
- Context includes: `landingPageId`, `targetProviderType`, `targetCategory`, `targetCity`, `utmSource`, `utmCampaign`.
- Smoothly pre-fills provider registration wizard without forcing re-entry.

---

### 10. Security & Data Isolation
- Strictly adheres to Lailah Multi-Tenancy Data Isolation rules.
- Sanitized input fields preventing XSS.
- Admin RBAC guard protecting LPAS Studio configuration.
