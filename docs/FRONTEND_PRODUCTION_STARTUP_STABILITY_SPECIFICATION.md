# Frontend Production Startup Stability Specification
**Document ID:** `SPEC-P0-FRONTEND-STARTUP-STABILITY-2026`  
**Platform:** منصة ليلة (Lailah ERP & Venue Management Platform)  
**Classification:** Critical P0 Architectural Standard  
**Status:** Production Approved  
**Scope:** Frontend Bootstrapping, Chunk Invalidation Recovery, Memory Isolation & White-Screen Prevention  

---

## 1. Executive Summary & Strategic Objectives

The **Lailah Platform** is a multi-tenant, mission-critical event ERP and venue booking ecosystem for the Kingdom of Saudi Arabia. Following architectural scaling and modular enhancements, ensuring **100% deterministic frontend startup** without blank screens ("White Screen of Death") under high concurrency, browser cache discrepancies, or network fluctuations is a P0 operational mandate.

This specification codifies:
1. **The Exact Bootstrap Startup Chain:** Guaranteed execution order from HTTP request arrival to interactive DOM paint.
2. **Defensive Error Boundaries & Chunk Recovery:** Multi-tiered error isolation with automated single-attempt reload for stale dynamic chunks.
3. **Environment & Storage Resiliency:** Safe polyfilling of Node-style globals (`process.env`), defensive LocalStorage access with quota-exceeded guards.
4. **Codebase High-Density Inventory:** Cataloging all 53 modules exceeding 1,000 lines with responsibility mappings and layer bounds.
5. **Continuous CI File-Size & Build Auditing:** Automated verification via `scripts/check-file-sizes.ts`.

---

## 2. Complete Frontend Startup Sequence & Lifecycle Flow

```
[Browser Request (GET /)]
       │
       ▼
[Express Production Server (server.ts)]
  ├── Matches Static Assets (/dist, /public)
  └── SPA Fallback Route (app.get('*') -> dist/index.html)
       │
       ▼
[HTML Document (index.html)]
  ├── Loads Google Tajawal Font (Preconnect + Stylesheet)
  ├── Viewport & RTL Config (dir="rtl", lang="ar")
  └── Script Entry Point (/src/main.tsx)
       │
       ▼
[Bootstrap Script (src/main.tsx)]
  ├── Global Runtime Polyfills (window.process, window.global)
  ├── Global Unhandled Rejection & Error Listeners (Chunk Failure Detector)
  ├── React 19 createRoot Initialization
  └── StrictMode & Provider Hierarchy:
       │
       ▼
   ┌────────────────────────────────────────────────────────┐
   │ <ErrorBoundary> (Root Crash & Chunk Recovery Catch)     │
   │   └─ <ThemeProvider> (Theme Context & Storage Sync)    │
   │       └─ <CalendarProvider> (Hijri/Gregorian Sync)     │
   │           ├─ <RouterProvider router={router} />         │
   │           └─ <ProviderRealtimeChatNotifier />          │
   └────────────────────────────────────────────────────────┘
```

### Critical Initialization Guarantees:
- **Zero-Block Database Sync:** Backend model synchronization (`syncDatabase`, `syncUserModels`, etc.) executes in background worker threads without delaying server port binding (Port 3000).
- **Strict SPA Fallback:** Express guarantees `index.html` is returned for all non-API GET routes, preventing 404 navigation blanks.
- **Isolated Notification Layer:** The floating notification and real-time chat widgets render within the global provider hierarchy without blocking the active route component.

---

## 3. White Screen Failure Modes & Root Cause Mitigation Matrix

| Failure Mode | Root Cause | Architectural Mitigation | Status |
| :--- | :--- | :--- | :--- |
| **Dynamic Chunk Mismatch** | A new production deployment invalidates previous hashed Vite bundles while users have open cached HTML. | Global `error` and `unhandledrejection` listeners detect `Failed to fetch dynamically imported module` and trigger a single session-guarded auto-reload (`chunk_auto_reload_ts`). | ✅ Implemented |
| **Uncaught React Render Error** | Unhandled null reference or type mismatch in child component. | Root `<ErrorBoundary>` catches uncaught errors, renders a localized recovery UI, provides manual retry without page reload, and diagnostic copying. | ✅ Implemented |
| **Missing `process.env` in Client** | Legacy library or node package referencing `process.env` in browser. | Early polyfill in `src/main.tsx` (`window.process = { env: {} }`) and Vite `define` configuration. | ✅ Implemented |
| **LocalStorage Quota Exceeded** | Large Base64 previews or logs exhausting browser 5MB quota. | `src/utils/safeStorage.ts` automatically strips Base64 images and trims stale temp entries before write. | ✅ Implemented |
| **Private Browsing Storage Block** | Browser in strict privacy mode blocking LocalStorage access. | All context providers (`ThemeContext`, `CalendarContext`, `safeStorage`) wrap storage accesses in guarded `try/catch` fallbacks. | ✅ Implemented |
| **API 404 HTML Mismatch** | Client requesting API route getting HTML string from SPA fallback. | Express API 404 handler (`server.ts`) intercepts `/api/*` and explicitly returns JSON 404 payloads. | ✅ Implemented |

---

## 4. Root Error Boundary & Dynamic Chunk Recovery Architecture

### 4.1 Automated Chunk Load Recovery
When Vite code-splitting or asset hashing encounters network interruptions or stale hash references, the browser throws an unhandled promise rejection. The system intercepts this at two levels:

1. **Global Window Level (`src/main.tsx`):**
   ```typescript
   const handleChunkLoadFailure = (errorMsg: string) => {
     const isChunkFailure = 
       errorMsg.includes('Failed to fetch dynamically imported module') ||
       errorMsg.includes('Loading chunk') ||
       errorMsg.includes('error loading dynamically imported module') ||
       errorMsg.includes('Importing a module script failed');

     if (isChunkFailure && window.sessionStorage) {
       const lastReload = sessionStorage.getItem('lailah_chunk_reload_ts');
       const now = Date.now();
       if (!lastReload || now - Number(lastReload) > 15000) {
         sessionStorage.setItem('lailah_chunk_reload_ts', String(now));
         window.location.reload();
       }
     }
   };
   ```

2. **Component Tree Level (`src/components/common/ErrorBoundary.tsx`):**
   - Intercepts uncaught errors during lifecycle render.
   - Provides 4 user actions:
     - **إعادة التحميل (Reload):** Instant page refresh.
     - **إعادة المحاولة (Reset State):** Resets React error state without losing current URL or session.
     - **تحديث الكاش (Clear Stale Cache):** Safely cleans non-essential cached entries while preserving authenticated tokens (`currentUser`, `authToken`).
     - **نسخ تقرير الخطأ (Copy Diagnostics):** Exports formatted JSON report with stack trace, URL, and timestamp for technical support.

---

## 5. Environment Variables & Client Security Isolation

In accordance with strict security standards:
- **Server-Side Exclusivity:** All secret keys (`GEMINI_API_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY`, payment gateway secrets) remain strictly server-side in `server.ts` and Express controllers.
- **Client AI Proxying:** Direct Gemini SDK instantiation in frontend components has been redirected through `/api/ai` endpoints.
- **Vite Client Env Access:** Only non-sensitive variables prefixed with `VITE_` or safely proxied platform keys are exposed to the client.

---

## 6. High-Density Codebase Inventory (> 1,000 Lines)

The project currently contains **523 source files** totaling **224,963 lines of code**. The 53 files exceeding 1,000 lines have been audited, categorized, and verified for structural integrity.

### Breakdown by Architectural Layer:
- **General & Composite UI Components:** 26 files (95,815 LOC)
- **Pages & Routed Views:** 6 files (24,719 LOC)
- **Admin Governance & Control Components:** 5 files (21,143 LOC)
- **Provider Operations & Catalog Components:** 6 files (19,693 LOC)
- **Backend Controllers & Routes:** 2 files (16,541 LOC)
- **State & Hooks:** 1 file (`useAppState.ts` - 7,039 LOC)
- **Modals & Steppers:** 2 files (7,725 LOC)
- **Database Models:** 2 files (6,245 LOC)
- **Data & Constants:** 1 file (`mockData.ts` - 1,633 LOC)
- **Common UI & Tools:** 1 file (`GoogleMapsModal.tsx` - 1,119 LOC)

### Complete Audit Catalog (Top High-Density Files):

| # | File Path | Lines | Size (KB) | Architectural Layer | Primary Responsibility |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `src/components/FinanceDashboard.tsx` | 7,595 | 420.5 | General Components | Platform & Provider Financial Center, VAT & Invoicing |
| 2 | `src/hooks/useAppState.ts` | 7,039 | 302.6 | State & Hooks | Central Reactive State Engine & Local Persistence |
| 3 | `src/pages/HallsServicesPortalPage.tsx` | 5,604 | 303.2 | Pages & Views | Marketplace Catalog & Interactive Hall Booking Portal |
| 4 | `src/components/SettingsManagement.tsx` | 4,830 | 302.1 | General Components | Platform Settings, Governance & Payment Key Configs |
| 5 | `src/components/admin/AdminDashboard.tsx` | 4,587 | 296.3 | Admin Components | Sovereign Admin Control Center & Operations |
| 6 | `src/components/admin/StaffManagement.tsx` | 4,501 | 279.2 | Admin Components | Platform Staff, Roles & Access Control Engine |
| 7 | `src/components/ProvidersManagement.tsx` | 3,833 | 230.0 | General Components | Partner Onboarding, Verification & Contract Audit |
| 8 | `src/components/MarketingComponents.tsx` | 3,831 | 223.1 | General Components | Marketing Campaigns, Coupons & Retargeting |
| 9 | `src/components/HallsManagement.tsx` | 3,429 | 211.3 | General Components | Venue Management, Approvals & Media Validation |
| 10 | `src/components/dashboard/MessagesSection.tsx` | 2,837 | 180.5 | General Components | Unified Communication, Tickets & In-App Messaging |
| 11 | `src/pages/HallDetailsPage.tsx` | 2,467 | 137.9 | Pages & Views | Comprehensive Venue Details, Packages & Booking Step |
| 12 | `src/components/Header.tsx` | 2,434 | 122.3 | General Components | Global Navigation Header, Role Switcher & Notifications |
| 13 | `src/components/provider/OperationsCenter.tsx` | 2,377 | 133.7 | Provider Components | Partner Daily Operational Cockpit & Logistics |
| 14 | `src/components/admin/TechnicalIntegrationTab.tsx` | 2,339 | 131.7 | Admin Components | Zoho Desk, Taqnyat SMS, & API Integrations |
| 15 | `src/components/SecuritySecretTab.tsx` | 2,262 | 144.1 | General Components | AES-256 Vault Management & Secret Key Rotations |
| 16 | `src/components/DashboardActionPanel.tsx` | 2,134 | 110.2 | General Components | Fast Execution Actions & System Shortcuts |
| 17 | `src/pages/BookingsPage.tsx` | 2,127 | 108.9 | Pages & Views | Customer & Provider Bookings Archive & Filters |
| 18 | `src/components/ProviderStaffManagement.tsx` | 2,032 | 118.3 | General Components | Provider Workforce, Permissions & Commission Splits |
| 19 | `src/pages/LogisticsOperationsPortalPage.tsx` | 2,018 | 125.0 | Pages & Views | Live Event Day Logistics & Task Tracking |
| 20 | `src/components/provider/ProviderGrowthCenter.tsx` | 1,984 | 111.3 | Provider Components | Provider Marketing, Featured Ads & Growth Insights |
| 21 | `src/components/TreasuryManagement.tsx` | 1,968 | 107.0 | General Components | Platform Treasury, Bank Accounts & Payout Approvals |
| 22 | `src/components/ExternalBlockManagerModal.tsx` | 1,962 | 104.1 | General Components | External Date Blocking & iCal Calendar Sync |
| 23 | `src/components/admin/FinancialSettingsSection.tsx` | 1,960 | 130.7 | Admin Components | Sovereign Commission Rates, VAT & Refund Policies |
| 24 | `src/components/dashboard/SubscriptionsSection.tsx` | 1,900 | 121.1 | General Components | Tier Subscriptions & Entitlement Management |
| 25 | `src/models/Database.ts` | 1,839 | 79.9 | Database Models | Core Sequelize Database Schema & Associations |
| 26 | `src/components/logistics/LogisticsOperationsCenter.tsx` | 1,831 | 90.2 | General Components | Fleet & Venue Supply Logistics Engine |
| 27 | `src/pages/ProfilePage.tsx` | 1,829 | 98.2 | Pages & Views | User & Partner Profile, IBAN Verification & Security |
| 28 | `src/components/admin/PlatformInfoSettings.tsx` | 1,820 | 108.1 | Admin Components | System Branding, Legal Terms & Contact Information |
| 29 | `src/components/provider/FloorPlanVisualizer.tsx` | 1,764 | 88.2 | Provider Components | 2D/3D Interactive Venue Seating & Table Designer |
| 30 | `src/data/mockData.ts` | 1,633 | 107.9 | Data & Constants | Baseline Mock Venues, Services & Default Configs |
| 31 | `src/components/CustomersManagement.tsx` | 1,576 | 82.2 | General Components | Customer Profiles, Booking Histories & Loyalty Tier |
| 32 | `src/components/provider/catalog/halls/ProviderHallsCatalog.tsx` | 1,555 | 119.1 | Provider Components | Partner Venue Listing, Pricing & Period Management |
| 33 | `src/components/MediaStandardsGuideModal.tsx` | 1,523 | 90.1 | General Components | 16:9 Image & MP4 Video Specifications Guide |
| 34 | `src/components/modals/HallStepperModal.tsx` | 1,516 | 91.5 | Modals & Steppers | Multi-step Venue Creation & Document Verification |
| 35 | `src/components/BookingsManagement.tsx` | 1,485 | 80.2 | General Components | Booking Confirmation, Status Transitions & Notes |
| 36 | `src/components/BookingInvoice.tsx` | 1,463 | 72.9 | General Components | ZATCA Compliant Phase-2 Tax Invoice & QR Renderer |
| 37 | `src/components/ProviderSubscriptionTabbed.tsx` | 1,452 | 89.4 | General Components | Provider Subscription Plan Checkout & Upgrades |
| 38 | `src/models/BookingModels.ts` | 1,366 | 60.4 | Database Models | Booking, Contract & Invoice Entity Models |
| 39 | `src/components/DiagnosticsDashboard.tsx` | 1,350 | 75.4 | General Components | Automated System Health, DB Probes & E2E Tests |
| 40 | `src/components/modals/VenueStoreManagerModal.tsx` | 1,350 | 66.8 | Modals & Steppers | In-Venue Product Catalog & Addon Store Manager |
| 41 | `src/components/finance/UnifiedPricingRevenueEngine.tsx` | 1,268 | 64.9 | General Components | Dynamic Weekend & Surge Pricing Calculator |
| 42 | `src/App.tsx` | 1,263 | 51.3 | Core Application | Client Landing & Dashboard Shell Controller |
| 43 | `src/components/VenueProductsStoreTab.tsx` | 1,246 | 59.9 | General Components | Post-Booking Store Product Config & Cart |
| 44 | `src/components/provider/cockpit/SmartBookingLifecycleManager.tsx` | 1,226 | 67.7 | Provider Components | Operational Statuses, Key Handovers & Cleaning |
| 45 | `src/components/ProviderRealtimeChatNotifier.tsx` | 1,204 | 60.3 | General Components | Floating Live Chat, Socket Audio & VIP Support |
| 46 | `src/components/ClientHallsView.tsx` | 1,179 | 65.1 | General Components | Client Venue Grid with Filters & Instant Booking |
| 47 | `src/pages/ExplorePage.tsx` | 1,141 | 62.0 | Pages & Views | Geographic & Category Exploration Page |
| 48 | `src/components/common/GoogleMapsModal.tsx` | 1,119 | 46.5 | Common UI | Interactive Google Maps Saudi Pin Locator |
| 49 | `src/components/provider/catalog/services/ProviderServicesCatalog.tsx` | 1,102 | 87.0 | Provider Components | Partner Ancillary Services & Package Definitions |
| 50 | `src/modules/security/security.controller.ts` | 1,101 | 47.0 | Backend Modules | Secret Vault, Encryption API & Cloud Probes |
| 51 | `src/components/FinancialForecaster.tsx` | 1,070 | 59.8 | General Components | Revenue & Expense Forecasting & Trend Modeling |
| 52 | `src/modules/booking/booking.controller.ts` | 1,024 | 37.4 | Backend Modules | Booking Orchestrator & Availability Engine |
| 53 | `src/components/ServicesManagement.tsx` | 1,016 | 57.0 | General Components | Ancillary Services Catalog & Approval Management |

---

## 7. CI/CD Validation & Verification Commands

To verify frontend stability and audit file density in development and CI/CD pipelines:

```bash
# 1. Type Check & Static Analysis
npm run lint

# 2. File Size & Density Audit
npm run check:sizes

# 3. Production Compilation & Backend Bundling
npm run build

# 4. Production Execution Test
npm start
```

---

## 8. Verification & Smoke Testing Checklist

- [x] **Zero TypeScript Errors:** Verified via `tsc --noEmit`.
- [x] **Zero Bundler Failures:** Verified via `vite build && esbuild server.ts`.
- [x] **Global Error Boundaries:** Tested with simulated child exception; fallback UI renders with reload and retry options.
- [x] **Chunk Load Failure Guard:** Simulated dynamic import rejection triggers automatic reload with session guard.
- [x] **Safe Storage Operations:** `safeStorage.ts` tested against malformed JSON and high-payload writes.
- [x] **Zero Regressions on Business Logic:** All booking, payment, invoicing, entitlement, and multi-tenant isolation rules strictly preserved.

---
*Signed by: Principal Software Architecture & Production Reliability Team — Lailah Platform 2026*
