---
name: database-schema-analysis-and-refactoring
description: Standard operating procedure for analyzing, refactoring, and reconnecting database schemas (Cloud SQL / Drizzle ORM / Firestore / React State) cleanly across the full application stack.
---

# Database Schema Analysis & Refactoring Skill

This skill guides the AI assistant in systematically inspecting, normalizing, refactoring, and reconnecting database tables and schemas within the "Layla" (ليلة) platform without causing runtime errors or breaking business constraints.

---

## 🛠️ Step-by-Step Refactoring Workflow

### 1. Discovery & Dependency Mapping (استكشاف وتحليل العلاقات)
- **Inspect Current Schema**: Review all existing schema definitions (e.g., `src/db/schema.ts`, `src/types.ts`, or Firestore interfaces).
- **Map References Across Codebase**: Search for all API routes (`server.ts` or `/api/*`), React custom hooks (`useAppState.ts`), and component logic that query, mutate, or render data from target tables.
- **Identify Flaws**:
  - Unnormalized or redundant fields.
  - Missing primary/foreign keys, unique constraints, or foreign key cascades.
  - Inconsistent naming conventions (e.g., mixing snake_case and camelCase).
  - Violation of serial/ID rules or multi-tenancy data isolation constraints.

---

### 2. Target Schema Design & Isolation Check (تصميم الهيكلية الجديدة والتحقق من العزل)
- **Draft Refactored Schema**: Create clear TypeScript interfaces and Drizzle/SQL table definitions.
- **Enforce AGENTS.md Mandates**:
  - **Serial/ID Generation**:
    - Bookings: `BKG-YY-XXXXXXXXXX`
    - Service Orders: `SRV-YY-XXXXXXXXXX`
    - Invoices: `INV-YYXXXXXXXXXX`
    - Revenue: `REV-YY-XXXXXXXXXX`
    - Expenses: `EXP-YY-XXXXXXXXXX`
  - **Data Isolation**: Ensure all provider-related tables contain `providerId` (and fallback `providerName`) for strict multi-tenancy filtering.
  - **Platform Commission**: Ensure `commissionRate` and `commissionAmount` are calculated dynamically based on subscription tier and included in revenue/invoice tables.

---

### 3. Schema & Type Definition Updates (تحديث التعريفات والـ ORM)
- Update `src/db/schema.ts` or type definitions in `src/types.ts`.
- If Cloud SQL (Drizzle ORM) is active, trigger `cloudsql-update-schema` tool or generate corresponding Drizzle migration statements.

---

### 4. Full Stack Code Reconnection (إعادة ربط جميع أجزاء النظام)
- **API Endpoints**: Update all Express/Node API routes in `server.ts` or backend modules to query updated field names and join foreign keys cleanly.
- **Data Access & State Hooks**: Update state managers (`useAppState.ts` or custom hooks) to map database records into UI state properties seamlessly.
- **React Components & Dashboards**: Update forms, tables, metric cards, and modals across `ProviderDashboard.tsx`, `AdminDashboard`, and Customer Portals to display refactored fields.

---

### 5. Verification & Safety Checks (التحقق واختبار السلامة)
- Run `lint_applet` and `compile_applet` to ensure zero TypeScript errors or broken imports.
- Confirm that data isolation filtering (`filter(n => n.providerId === activeProviderId)`) remains intact across all updated components.
