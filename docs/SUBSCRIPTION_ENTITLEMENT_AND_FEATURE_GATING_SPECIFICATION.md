# SUBSCRIPTION ENTITLEMENT AND FEATURE GATING SPECIFICATION
**Lailah Platform — Effective Entitlement Read Authority & Policy Engine**

---

## 1. Executive Summary & Principles
This specification defines the single authoritative entitlement architecture for the Lailah Platform.
The system guarantees that feature visibility, operational resource limits, addon capabilities, and administrative grants are strictly calculated and enforced on the backend.

### Key Tenets:
1. **Single Source of Truth (Backend Authority):** The backend `EffectiveEntitlementService` is the only source of truth for provider capabilities and resource limits.
2. **Default Policy = DENY:** Unless a feature or capability is explicitly granted via active plan, purchased addon, valid administrative grant, or valid override, access is strictly denied (`false`).
3. **No Client-Side Source of Truth:** `localStorage` is never used as an authority for feature gating or capability evaluation.
4. **Fail-Closed Strategy:** If an entitlement check encounters an error, network failure, or unknown feature, it fails closed (denies access).
5. **Deterministic Precedence Resolution:**
   1. `OVERRIDE` (Explicit temporary/permanent override set by platform admin)
   2. `TEMPORARY_UPGRADE` (Active promotional plan or trial)
   3. `PROMOTION` (Campaign-based grant)
   4. `ADMIN_GRANT` (Custom administrative capability grant)
   5. `ADDON` (Purchased à-la-carte capability)
   6. `PLAN` (Base subscription plan features)
   7. `DEFAULT_DENY` (Standard deny fallback)

---

## 2. Effective Entitlement Read Model

### Endpoint: `GET /api/subscriptions/me/entitlements`
Returns the resolved effective entitlements for the currently authenticated provider session.

#### Request Headers:
- `Authorization: Bearer <token>`
- `x-provider-id: <number>` (Optional/Fallback for session resolution)
- `x-user-id: <number>` (Optional/Fallback for session resolution)

#### Query Parameters:
- `refresh=true` or `nocache=true`: Bypasses the 30-second memory cache and forces fresh database computation.

#### Response Structure:
```json
{
  "success": true,
  "entitlements": {
    "providerId": 1,
    "activePlan": {
      "id": 2,
      "name": "الباقة المتقدمة",
      "status": "active",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2027-01-01T00:00:00.000Z",
      "isCustom": false
    },
    "features": {
      "weekend_pricing": true,
      "dynamic_surge_pricing": false,
      "partial_payment": true,
      "advanced_export": true,
      "interactive_charts": true,
      "cashflow_forecasting": false,
      "full_management": true,
      "floor_plan_360": true,
      "advanced_lifecycle": false,
      "logistics_operations": false,
      "inventory_management": true,
      "suppliers_management": true,
      "calendar_sync": true,
      "dedicated_crm": true,
      "client_messaging_hub": true,
      "live_chat_support": false,
      "dedicated_account_manager": false,
      "marketing_agency": false,
      "mini_products_store": false
    },
    "featureDetails": {
      "weekend_pricing": {
        "key": "weekend_pricing",
        "nameAr": "تسعير عطلة نهاية الأسبوع (الويكند)",
        "enabled": true,
        "source": "PLAN",
        "expiresAt": "2027-01-01T00:00:00.000Z",
        "category": "financial"
      }
    },
    "limits": {
      "max_halls": {
        "key": "max_halls",
        "nameAr": "الحد الأقصى للقاعات",
        "limit": 5,
        "used": 2,
        "remaining": 3,
        "status": "WITHIN_LIMIT",
        "unitAr": "قاعة",
        "source": "PLAN"
      },
      "max_services": {
        "key": "max_services",
        "nameAr": "الحد الأقصى للخدمات",
        "limit": 15,
        "used": 4,
        "remaining": 11,
        "status": "WITHIN_LIMIT",
        "unitAr": "خدمة",
        "source": "PLAN"
      },
      "staff_seats": {
        "key": "staff_seats",
        "nameAr": "مقاعد الموظفين",
        "limit": 5,
        "used": 2,
        "remaining": 3,
        "status": "WITHIN_LIMIT",
        "unitAr": "مقعد",
        "source": "PLAN"
      }
    },
    "activeAddons": [],
    "activeGrants": [],
    "entitlementVersion": 1,
    "generatedAt": "2026-09-02T08:00:00.000Z"
  }
}
```

---

## 3. Precedence & Evaluation Rules

1. **Active Plan:** Provides base boolean flags and baseline numeric capacity.
2. **Add-on Stacking:** Add-ons enable boolean features not included in the plan, or increment numeric limits.
3. **Administrative Grants:** Admins can grant capabilities with specific validity periods (`expiresAt`). If expired (`now > expiresAt`), the grant is ignored.
4. **Overrides:** Platform super admins can force-enable or force-disable specific features. Overrides take immediate precedence over plans and addons.
5. **Non-destructive Downgrades:** If a provider is downgraded to a lower plan where `used > limit`, the resource limit status becomes `OVER_LIMIT`. Existing resources are preserved (read-only), but creating new items is blocked until usage is within limits.

---

## 4. Frontend Integration (`EntitlementContext`)
The frontend `EntitlementContext` initializes with default-safe capabilities and asynchronously loads the authoritative effective entitlements from `/api/subscriptions/me/entitlements`.
- Any attempt to tamper with local storage does not grant backend-gated features or bypass backend middleware checks (`requireEntitlement`, `enforceLimit`).
- Loading states fail closed until verified by the backend.

---

## 5. Backend Entitlement Enforcement & Middleware Guards (P1.2)

### 5.1 Architecture & Enforcement Principles
1. **Zero Trust on Client State:** Backend routes must never trust frontend visibility, flags in `localStorage`, or client-manipulated session objects.
2. **Authoritative Session Resolution:** `providerId` is derived strictly from verified backend JWT tokens (`req.user.providerId` or `req.user.id`). Cross-tenant spoofing attempts (passing alternative IDs in headers or query parameters) are strictly rejected.
3. **Fail-Closed Execution:** If an entitlement check fails or an unknown feature key is queried, access is denied by default.
4. **Non-Destructive Resource Downgrades:** When a provider downgrades their plan and current usage exceeds the new tier limit (`used > limit`), existing resources remain fully readable, editable, and deletable. Only the creation (`POST`) of new resources is intercepted and rejected with `entitlement_limit_exceeded`.

### 5.2 Middleware Guards
1. **`requireEntitlement(featureKey)`**:
   - Intercepts requests for boolean features (e.g. `inventory_management`, `suppliers_management`, `dynamic_pricing`, `marketing_agency`, `mini_products_store`, `advanced_export`, `financial_forecast_ai`).
   - If feature is not entitled:
     - Emits `FEATURE_ACCESS_DENIED` audit log.
     - Returns **HTTP 403 Forbidden**:
       ```json
       {
         "success": false,
         "code": "entitlement_required",
         "featureKey": "inventory_management",
         "featureName": "إدارة المستودع والمخزون",
         "error": "عذراً، هذه الميزة غير مفعلة في باقتك الحالية. يرجى ترقية باقتك أو شراء الميزة من متجر الإضافات.",
         "upgradeRequired": true
       }
       ```
2. **`enforceLimit(limitKey, increment = 1)`**:
   - Intercepts creation requests for numeric capacity (e.g. `max_halls`, `max_services`, `staff_seats`).
   - Uses an atomic in-flight reservation slot (`acquireLimitSlot`) and mutex serialization to prevent race-condition bypasses under concurrent requests.
   - If capacity is exceeded:
     - Emits `LIMIT_EXCEEDED` audit log.
     - Returns **HTTP 409 Conflict**:
       ```json
       {
         "success": false,
         "code": "entitlement_limit_exceeded",
         "limitKey": "max_halls",
         "limitName": "الحد الأقصى للقاعات والمنشآت",
         "limit": 1,
         "used": 1,
         "remaining": 0,
         "status": "OVER_LIMIT",
         "error": "تم بلوغ الحد الأقصى المسموح به (1 قاعة). لديك حالياً 1 مسجلة. يرجى ترقية باقتك لإضافة المزيد.",
         "upgradeRequired": true
       }
       ```

### 5.3 Protected Backend API Matrix
| Resource / Module | Route & Method | Enforced Guard | Key |
| :--- | :--- | :--- | :--- |
| **Halls / Venues** | `POST /api/halls`, `POST /api/bookings/halls` | `enforceLimit` | `max_halls` |
| **Services** | `POST /api/services`, `POST /api/bookings/services` | `enforceLimit` | `max_services` |
| **Staff & HR** | `POST /api/hr/employees` | `enforceLimit` | `staff_seats` |
| **Inventory Management** | `GET/POST/PUT/DELETE /api/inventory*`, `/api/sync-inventory` | `requireEntitlement` | `inventory_management` |
| **Suppliers Management** | `GET/POST/PUT/DELETE /api/suppliers*`, `/api/supplier-invoices*` | `requireEntitlement` | `suppliers_management` |
| **Mini Products Store** | `POST/PUT/PATCH/DELETE /api/store/products*` | `requireEntitlement` | `mini_products_store` |
| **Financial PDF Export** | `POST /api/finance/generate-pdf` | `requireEntitlement` | `can_export_financials` |
| **Financial AI Forecast** | `POST /api/finance/forecast-ai` | `requireEntitlement` | `financial_forecast_ai` |
| **Marketing Agency** | `POST /api/marketing/pay-campaign`, `/api/marketing/retarget-favorites` | `requireEntitlement` | `marketing_agency` |

### 5.4 Audit Logging & Compliance
All authorization checks and mutations generate immutable records in `EntitlementAuditLog` containing:
- `providerId`
- `eventType` (`FEATURE_ACCESS_GRANTED`, `FEATURE_ACCESS_DENIED`, `LIMIT_CHECK_PASSED`, `LIMIT_EXCEEDED`, `PLAN_CHANGED`, `ADDON_ACTIVATED`, `ADMIN_GRANT_CREATED`, `ADMIN_GRANT_EXPIRED`, `FEATURE_OVERRIDE_APPLIED`, `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_ACTIVATED`, `SUBSCRIPTION_UPGRADED`, `SUBSCRIPTION_DOWNGRADED`, `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_GRACE_STARTED`, `SUBSCRIPTION_EXPIRED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_PAYMENT_FAILED`)
- `featureKey`
- `source` (`PLAN`, `ADDON`, `ADMIN_GRANT`, `PROMOTION`, `TEMPORARY_UPGRADE`, `OVERRIDE`, `DEFAULT_DENY`, `SYSTEM`)
- `actor`
- `reason`
- `oldValue` / `newValue`
- `metadata` (`requestId`, `path`, `method`, `timestamp`, `used`, `limit`, `inFlight`, `subscriptionId`, `planName`, `billingCycle`)

---

## 6. Unified Subscription Lifecycle (P1.3 Architecture)

### 6.1 State Machine Core States
The subscription engine implements a strict finite state machine (`SubscriptionStateMachine`):
- `DRAFT`: Initial preparation state prior to billing or activation.
- `PENDING_PAYMENT`: Awaiting transaction confirmation from the payment gateway.
- `ACTIVE`: Fully operational with complete entitlement feature and limit access.
- `RENEWAL_DUE`: Active period nearing expiration (e.g. within 3-7 days of cycle end).
- `GRACE_PERIOD`: Period ended without payment; provider retains full operational access during a 7-day grace period with `paymentStatus = 'OVERDUE'`.
- `EXPIRED`: Subscription ended without renewal; access downgraded to free/denied status.
- `CANCELLED`: Subscription terminated by provider or admin; no further auto-renewals.
- `SUSPENDED`: Temporarily halted by administrative action.
- `PAYMENT_FAILED`: Recurring charge failed; prompts provider for card update.
- `UPGRADE_SCHEDULED`: Higher-tier upgrade queued for activation at the next billing cycle.
- `DOWNGRADE_SCHEDULED`: Lower-tier downgrade queued for end-of-cycle activation.

### 6.2 State Transition Validation Matrix
```
[DRAFT] ──────> [PENDING_PAYMENT] ───> [ACTIVE] ───> [RENEWAL_DUE] ───> [GRACE_PERIOD] ───> [EXPIRED]
  │                    │                 │                 │                 │
  │                    v                 v                 v                 v
  └───> [ACTIVE]   [PAYMENT_FAILED]  [UPGRADE_SCHED]  [DOWNGRADE_SCHED]  [ACTIVE (Renewed)]
                                         │                 │
                                         v                 v
                                    [CANCELLED]       [SUSPENDED]
```

### 6.3 Concurrency & Lock Serialization
- All state transitions and plan changes are wrapped in provider-level mutex locks (`runExclusive(providerId)`) and database transactions (`sequelize.transaction()`).
- Prevents double-billing races, concurrent upgrade/downgrade collisions, and overlapping active subscription records.
- Versioning (`version` column) guarantees optimistic locking and idempotency.

### 6.4 Non-Destructive Downgrades
- Downgrades immediately recalculate effective entitlements to the lower tier.
- **Strict Data Preservation**: Halls, services, and files exceeding the new tier limit are never deleted or truncated. Instead, the resource limit status changes to `OVER_LIMIT`, preventing the creation of new entities while preserving all existing historical and operational data.

### 6.5 Lifecycle API Endpoints
- `POST /api/subscriptions/lifecycle/create`: Initiates a new subscription.
- `POST /api/subscriptions/lifecycle/upgrade`: Performs immediate or scheduled plan upgrade.
- `POST /api/subscriptions/lifecycle/downgrade`: Applies non-destructive plan downgrade.
- `POST /api/subscriptions/lifecycle/renew`: Processes recurring or manual renewal.
- `POST /api/subscriptions/lifecycle/grace`: Initiates grace period for overdue accounts.
- `POST /api/subscriptions/lifecycle/expire`: Transitions overdue subscriptions to expired.
- `POST /api/subscriptions/lifecycle/cancel`: Cancels subscription immediately or at period end.
- `POST /api/subscriptions/lifecycle/payment-failure`: Records payment failure event.

---

## 7. Feature Marketplace Lifecycle (P1.4 Architecture)

### 7.1 Unified Add-on Subscription Entity (`ProviderAddon`)
All à-la-carte capability purchases and numeric expansions are modeled as first-class subscription entities with full lifecycle tracking:
- `id`: Unique numeric primary key.
- `providerId`: Associated venue or service provider.
- `featureKey`: Standard feature identifier from `featureRegistry.ts`.
- `featureName`: Localized feature display name.
- `addonType`: `'boolean'` (standalone capabilities) or `'numeric_limit'` (capacity expansions).
- `quantity`: Quantity multiplier for numeric limit additions (default `1`).
- `pricePaid` & `unitPrice`: Unit price and total charged amount in SAR.
- `currency`: Default `'SAR'`.
- `billingCycle`: `'MONTHLY'` | `'ANNUAL'` | `'ONE_TIME'`.
- `addonStatus`: Current lifecycle state (`AddonLifecycleStatus`).
- `paymentStatus`: Verified payment state (`SubscriptionPaymentStatus`).
- `paymentId` & `transactionId`: Gateway transaction linkage.
- `purchaseDate`, `startsAt`, `expiresAt`, `currentPeriodStart`, `currentPeriodEnd`: Time boundaries.
- `gracePeriodEnd`, `nextBillingDate`: Renewal and grace tracking.
- `cancelledAt`, `cancellationReason`, `cancelAtPeriodEnd`: Cancellation parameters.
- `refundedAt`, `refundReason`, `refundAmount`: Financial refund records.
- `autoRenew`: Automatic recurring renewal flag.
- `source`: `'MARKETPLACE'` | `'ADMIN_ADDON'` | `'BUNDLE'` | `'SYSTEM'`.
- `version`: Optimistic locking version integer.

### 7.2 Add-on Lifecycle State Machine
The add-on lifecycle strictly follows the state machine defined in `AddonStateMachine`:
- `DRAFT`: Initial creation before checkout.
- `PENDING_PAYMENT`: Awaiting gateway payment confirmation.
- `PAYMENT_PROCESSING`: Asynchronous webhook verification in flight.
- `ACTIVE`: Verified paid add-on actively granting entitlement.
- `RENEWAL_DUE`: Active cycle nearing end (within 3-7 days).
- `GRACE_PERIOD`: Period elapsed without renewal; 7-day grace window with active feature retention (`paymentStatus = 'OVERDUE'`).
- `EXPIRED`: Grace period ended without payment; feature de-activated.
- `PAYMENT_FAILED`: Payment transaction declined.
- `CANCELLED`: Cancelled immediately or scheduled at period end.
- `SUSPENDED`: Administratively paused.
- `REFUNDED`: Payment refunded and capability immediately revoked.
- `REVOKED`: Administratively terminated for policy violation or fraud.

```
[DRAFT] ──────> [PENDING_PAYMENT] ───> [ACTIVE] ───> [RENEWAL_DUE] ───> [GRACE_PERIOD] ───> [EXPIRED]
  │                    │                 │                 │                 │
  │                    v                 v                 v                 v
  └───> [ACTIVE]   [PAYMENT_FAILED]  [CANCELLED]      [SUSPENDED]       [ACTIVE (Renewed)]
                                         │                 │
                                         v                 v
                                    [REFUNDED]        [REVOKED]
```

### 7.3 Verified Payment Gating & Frontend Independence
1. **Zero Client Trust**: Feature activation NEVER depends on frontend callback states (`success: true`).
2. **Mandatory Payment Linkage**: `activateAddonWithPayment` requires a verified `paymentId` and validated transaction confirmation from the backend payment gateway.
3. **Gatekeeper Validation**: If `paymentId` is missing, empty, or unverified, activation is rejected immediately with `400 / 402` errors.

### 7.4 Numeric Limit Add-ons & Quantity Aggregation
- Numeric expansions (e.g. `max_halls`, `max_services`, `staff_seats`) support dynamic `quantity` values.
- `EffectiveEntitlementService` computes total allowable capacity by summing the active base subscription plan limit and all active numeric addon quantities:
  $$\text{Effective Limit} = \text{Plan Base Limit} + \sum (\text{Active Addon Quantity})$$

### 7.5 Expiry & Non-Destructive Recalculation
- When an add-on expires, `EffectiveEntitlementService` recalculates effective capabilities without deleting any user data.
- Existing halls, inventory items, or configurations remain completely intact in the database, with operational creation controls gated based on the new effective limit.

### 7.6 Cancellation Policies
- **At Period End (`cancelAtPeriodEnd = true`)**: The add-on remains `ACTIVE` with feature access until `currentPeriodEnd`, while `autoRenew` is set to `false`.
- **Immediate Cancellation (`immediate = true`)**: Addon transitions directly to `CANCELLED`, feature is immediately revoked, and cache is invalidated.

### 7.7 Refund & Revocation Policy
- When a refund is issued via `refundAddon`, the entity transitions to `REFUNDED`, `paymentStatus = 'REFUNDED'`, and the granted capability or limit is revoked in real-time.

### 7.8 Plan Upgrade & Downgrade Interactions
- **Upgrade Redundancy Protection**: If a provider upgrades to a plan that already natively includes a boolean capability (e.g. upgrading to Pro which includes `weekend_pricing`), any active boolean add-on for that feature has its `autoRenew` flag automatically set to `false` to prevent duplicate charges.
- **Downgrade Add-on Retention**: When a provider downgrades to a lower-tier plan, any active purchased standalone add-ons remain active and continue to grant access until their individual `expiresAt` dates.

### 7.9 Concurrency, Mutex Locking & Invalidation
- All add-on operations execute under provider mutex locks (`runExclusive(providerId)`) within ACID database transactions.
- Prevents double purchases, race condition activations, and duplicate renewal records.
- Every state change bumps the provider's `entitlement_version` and evicts in-memory entitlement caches.

### 7.10 Add-on Lifecycle Audit Trail
Every lifecycle state mutation creates an immutable audit log entry in `EntitlementAuditLog` with one of the following event types:
- `ADDON_PURCHASE_REQUESTED`: Purchase initiated.
- `ADDON_PAYMENT_VERIFIED`: Gateway transaction verified.
- `ADDON_ACTIVATED`: Feature activated and added to effective entitlements.
- `ADDON_RENEWED`: Period extended without duplicating records.
- `ADDON_EXPIRED`: Feature access ended.
- `ADDON_CANCELLED`: Cancellation recorded.
- `ADDON_REFUNDED`: Refund processed and entitlement revoked.
- `ADDON_REVOKED`: Administrative revocation executed.

### 7.11 Marketplace Lifecycle Endpoints
- `POST /api/addons/lifecycle/purchase-request`: Requests purchase of an add-on.
- `POST /api/addons/lifecycle/verify-payment`: Verifies payment and activates add-on.
- `POST /api/addons/lifecycle/renew`: Extends active add-on cycle.
- `POST /api/addons/lifecycle/cancel`: Cancels add-on immediately or at period end.
- `POST /api/addons/lifecycle/refund`: Issues refund and revokes access.
- `POST /api/addons/lifecycle/revoke`: Administratively revokes access.
- `POST /api/addons/lifecycle/payment-failure`: Records payment failure.
- `POST /api/addons/lifecycle/grace`: Initiates grace period.
- `POST /api/addons/lifecycle/expire`: Expires overdue add-on.

---

## 8. Admin Grants, Promotional Entitlements, Temporary Upgrades & Discounts (P1.5 Architecture)

### 8.1 Core Architectural Principles
1. **Single Entitlement Engine**: All administrative and promotional grants feed directly into `EffectiveEntitlementService`. No parallel entitlement or grant engines exist.
2. **Base Plan Definition Immutability**: Granting a free subscription, temporary upgrade, or extra feature to a specific provider NEVER modifies the underlying `SubscriptionPlan` catalog definitions.
3. **Billing vs. Feature Separation**: Billing discounts (`PERCENTAGE_DISCOUNT`, `FIXED_DISCOUNT`) are processed as financial adjustments (`grantValue`, `discountAmount`, `chargedAmount`) and do not pollute feature gating resolution maps.
4. **Mandatory Auditing & Non-Destructive Lifecycle**: Every grant creation, revocation, and expiration requires a mandatory `reason`, records the granting/revoking actor, and preserves database records permanently (`status = 'REVOKED'` / `'EXPIRED'`).
5. **Dynamic Recalculation on Expiry**: When a temporary upgrade expires, provider entitlements dynamically recalculate based on their current active paid subscription rather than blindly rolling back to a hardcoded default.

### 8.2 Entity Schema (`ProviderAdminGrant`)
- `id`: Auto-incrementing primary key.
- `providerId`: Target provider identifier.
- `grantType`: `'FREE_SUBSCRIPTION'` | `'TEMPORARY_UPGRADE'` | `'FEATURE'` | `'LIMIT_INCREASE'` | `'PROMOTIONAL_ENTITLEMENT'` | `'PERCENTAGE_DISCOUNT'` | `'FIXED_DISCOUNT'`.
- `planId` & `planName`: Linked tier for plan-level grants.
- `featureKey` & `featureName`: Linked capability for feature/limit grants.
- `quantity`: Multiplier for limit increases (e.g. +5 halls).
- `value`: Stored representation (e.g. `'true'`, `'5'`, `'25%'`, `'150 SAR'`).
- `status`: `'ACTIVE'` | `'EXPIRED'` | `'REVOKED'` | `'SUSPENDED'`.
- `startsAt` & `expiresAt`: Temporal grant validity window.
- `reason` & `internalNotes`: Mandatory justification and internal audit notes.
- `grantedBy` & `approvedBy`: Administrative actors responsible for issuance.
- `revokedBy` & `revokedAt`: Revocation audit metadata.
- `campaignId` & `bulkBatchId`: Marketing campaign and bulk issuance linkage.
- `financialImpact`, `listPrice`, `chargedAmount`, `discountAmount`, `grantValue`: Full accounting breakdown.
- `targetScope`: `'SINGLE'` | `'BULK'` | `'SEGMENT'`.
- `version`: Optimistic concurrency lock counter.

### 8.3 RBAC Permissions
Administrative operations enforce granular role-based access control:
- `subscription.grant`: Permission to issue free subscription tiers or temporary plan upgrades.
- `feature.grant`: Permission to grant individual features or numeric limit increases.
- `discount.grant`: Permission to issue percentage or fixed billing adjustments.
- `grant.revoke`: Permission to cancel or revoke an active grant early with a mandatory reason.
- `bulk_grant.create`: Permission to initiate batch grants across provider cohorts.
- `bulk_grant.approve`: Permission to formally approve high-impact or executive-level campaigns.

### 8.4 Bulk Grants Architecture
- Bulk operations create distinct, individual `ProviderAdminGrant` records for every targeted provider in the batch.
- Each record shares a unique traceable `bulkBatchId` (format: `BULK-YY-XXXXXX`) and individual audit trail.
- Changes immediately invalidate cached entitlements across all recipients without shared side-effects.

### 8.5 Admin Grants API Endpoints
- `GET /api/subscriptions/grants`: Lists all admin grants with filtering by provider, status, or type.
- `POST /api/subscriptions/grants/subscription`: Grants a free subscription tier or temporary plan upgrade.
- `POST /api/subscriptions/grants/feature`: Grants a standalone feature, promotion, or limit increase.
- `POST /api/subscriptions/grants/discount`: Grants percentage or fixed billing adjustments.
- `POST /api/subscriptions/grants/bulk`: Creates batched grants across multiple providers.
- `POST /api/subscriptions/grants/:id/revoke`: Non-destructively revokes an active grant with mandatory audit reason.
- `POST /api/subscriptions/grants/process-expired`: Background cron processor transitioning elapsed grants to `EXPIRED`.

---

## 9. Booking & Payment Policy Capability Extension (P1.9 Architecture)

### 9.1 Overview, Platform Default & Safe Baseline
The platform decouples payment and approval sequencing from hardcoded system-wide constraints:
- **Platform Official Default:** `INSTANT_CONFIRMATION` is the official default policy for the Lailah platform.
- **Safest Operational Baseline:** `APPROVAL_BEFORE_PAYMENT` is the safest operational and financial baseline for providers, but NOT the platform default.
- **Unified Provider Policies (No Per-Resource Overrides):** Per-resource customization for individual halls or services is deprecated and removed. Providers have:
  - ONE unified policy for all their venues/halls (`venueBookingPolicy`).
  - ONE unified policy for all their independent services (`independentServiceBookingPolicy`).
- `booking_payment_policy_control`: Master capability for booking policy custom configuration.
- Supported Policies:
  - `INSTANT_CONFIRMATION` (Official Platform Default — Immediate booking & capture)
  - `APPROVAL_BEFORE_PAYMENT` (Safest Baseline — Provider reviews request prior to payment)
  - `PAYMENT_BEFORE_APPROVAL` (Pre-payment with official refund cycle on rejection or timeout)
  - `AUTHORIZE_THEN_CAPTURE` (Pre-authorization hold released and captured upon provider approval)

### 9.2 Resolution Hierarchy & Fallback
Resolution precedence: `Provider Unified Policy (Venue / Service)` $\succ$ `Platform Default Policy (INSTANT_CONFIRMATION)` $\succ$ `Safe Baseline (APPROVAL_BEFORE_PAYMENT)`.
If a provider configures a policy without active entitlement, creation operations fail-safe to `INSTANT_CONFIRMATION` (if entitled) or the safe baseline `APPROVAL_BEFORE_PAYMENT`, while administrative configuration endpoints return HTTP `403` with `booking_policy_not_entitled`.

### 9.3 Immutable Snapshotting
Every booking stores a frozen `BookingPolicySnapshot` documenting the exact policy, source, resolver timestamp, provider ID, and entitlement version at execution time. Historical records remain unaffected by subsequent plan or setting modifications.

See `docs/P1_9_BOOKING_PAYMENT_POLICY_CAPABILITY_EXTENSION.md` for complete technical documentation.


