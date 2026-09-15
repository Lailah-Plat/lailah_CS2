import { AddonStateMachine } from '../src/services/subscription/addonStateMachine.js';
import { addonLifecycleService } from '../src/services/subscription/AddonLifecycleService.js';
import { effectiveEntitlementService } from '../src/services/entitlement/effectiveEntitlementService.js';
import { subscriptionLifecycleService } from '../src/services/subscription/SubscriptionLifecycleService.js';
import { FEATURE_KEYS } from '../src/services/entitlement/featureRegistry.js';
import {
  sequelize,
  SubscriptionPlan,
  ProviderSubscription,
  ProviderAddon,
  ProviderAdminGrant,
  ProviderFeatureOverride,
  EntitlementAuditLog,
  migrateSubscriptionTables
} from '../src/models/SubscriptionModels.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runAddonLifecycleTests() {
  console.log('================================================================');
  console.log('🧪 Starting P1.4 Feature Marketplace Lifecycle Unification Tests');
  console.log('================================================================\n');

  try {
    await migrateSubscriptionTables();

    // Clean tables before starting
    await ProviderSubscription.destroy({ where: {} });
    await ProviderAddon.destroy({ where: {} });
    await ProviderAdminGrant.destroy({ where: {} });
    await ProviderFeatureOverride.destroy({ where: {} });
    await EntitlementAuditLog.destroy({ where: {} });

    // Seed test plans
    const [basicPlan] = await SubscriptionPlan.findOrCreate({
      where: { name: 'باقة الاختبار الأساسية' },
      defaults: {
        name: 'باقة الاختبار الأساسية',
        price: 0,
        description: 'باقة الاختبار الأساسية',
        features: JSON.stringify({
          [FEATURE_KEYS.WEEKEND_PRICING]: false,
          [FEATURE_KEYS.DYNAMIC_SURGE_PRICING]: false,
          [FEATURE_KEYS.PARTIAL_PAYMENT]: false,
          max_halls: 2,
          max_services: 3
        })
      }
    });

    const [proPlan] = await SubscriptionPlan.findOrCreate({
      where: { name: 'باقة الاختبار الاحترافية' },
      defaults: {
        name: 'باقة الاختبار الاحترافية',
        price: 500,
        description: 'باقة الاختبار الاحترافية',
        features: JSON.stringify({
          [FEATURE_KEYS.WEEKEND_PRICING]: true,
          [FEATURE_KEYS.DYNAMIC_SURGE_PRICING]: true,
          [FEATURE_KEYS.PARTIAL_PAYMENT]: true,
          max_halls: 10,
          max_services: 20
        })
      }
    });

    const TEST_PROVIDER_1 = 1001;
    const TEST_PROVIDER_2 = 1002;
    const TEST_PROVIDER_3 = 1003;

    // Create base subscription for Provider 1
    await subscriptionLifecycleService.createSubscription({
      providerId: TEST_PROVIDER_1,
      providerEmail: 'provider1@test.com',
      planId: basicPlan.id,
      billingCycle: 'MONTHLY',
      pricePaid: 0
    });

    // -------------------------------------------------------------
    // Test 1: Addon State Machine Transitions
    // -------------------------------------------------------------
    console.log('\n--- Test Group 1: Addon State Machine Matrix ---');
    assert(AddonStateMachine.isValidTransition('DRAFT', 'PENDING_PAYMENT') === true, 'Valid: DRAFT -> PENDING_PAYMENT');
    assert(AddonStateMachine.isValidTransition('PENDING_PAYMENT', 'ACTIVE') === true, 'Valid: PENDING_PAYMENT -> ACTIVE');
    assert(AddonStateMachine.isValidTransition('ACTIVE', 'EXPIRED') === true, 'Valid: ACTIVE -> EXPIRED');
    assert(AddonStateMachine.isValidTransition('ACTIVE', 'REFUNDED') === true, 'Valid: ACTIVE -> REFUNDED');
    assert(AddonStateMachine.isValidTransition('ACTIVE', 'CANCELLED') === true, 'Valid: ACTIVE -> CANCELLED');
    assert(AddonStateMachine.isValidTransition('CANCELLED', 'ACTIVE') === false, 'Invalid: CANCELLED -> ACTIVE directly');
    assert(AddonStateMachine.hasActiveEntitlement('ACTIVE') === true, 'Active status grants feature');
    assert(AddonStateMachine.hasActiveEntitlement('GRACE_PERIOD') === true, 'Grace period grants feature');
    assert(AddonStateMachine.hasActiveEntitlement('PENDING_PAYMENT') === false, 'Pending payment does not grant feature');
    assert(AddonStateMachine.hasActiveEntitlement('EXPIRED') === false, 'Expired does not grant feature');
    assert(AddonStateMachine.hasActiveEntitlement('REFUNDED') === false, 'Refunded does not grant feature');

    // -------------------------------------------------------------
    // Test 2: Basic Plan + Inventory Add-on Purchase & Payment Gating
    // -------------------------------------------------------------
    console.log('\n--- Test Group 2: Basic Plan + Inventory Add-on & Verified Payment ---');
    const inventoryPurchaseReq = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_1,
      featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
      billingCycle: 'MONTHLY',
      unitPrice: 100
    });

    assert(inventoryPurchaseReq.success === true, 'Inventory add-on purchase request succeeds');
    assert(inventoryPurchaseReq.addon.addonStatus === 'PENDING_PAYMENT', 'Initial inventory addon status is PENDING_PAYMENT');
    assert(inventoryPurchaseReq.addon.paymentStatus === 'PENDING', 'Payment status is PENDING');

    // Check that pending addon does NOT grant feature access yet
    const prePaymentEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(
      prePaymentEntitlements.features[FEATURE_KEYS.INVENTORY_MANAGEMENT] === false,
      'Pending inventory addon does NOT activate feature before verified payment'
    );

    // Try activation without paymentId -> should fail
    let failedWithoutPayment = false;
    try {
      await addonLifecycleService.activateAddonWithPayment({
        providerId: TEST_PROVIDER_1,
        featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
        paymentId: ''
      });
    } catch {
      failedWithoutPayment = true;
    }
    assert(failedWithoutPayment === true, 'Activation without verified paymentId is strictly rejected');

    // Activate with verified payment
    const inventoryActivation = await addonLifecycleService.activateAddonWithPayment({
      providerId: TEST_PROVIDER_1,
      featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
      addonId: inventoryPurchaseReq.addon.id,
      paymentId: 'PAY-TXN-INV-998811',
      transactionId: 'TXN-INV-998811',
      amountPaid: 100
    });

    assert(inventoryActivation.success === true, 'Activation with verified payment succeeds');
    assert(inventoryActivation.addon.addonStatus === 'ACTIVE', 'Addon status transitioned to ACTIVE');
    assert(inventoryActivation.addon.paymentStatus === 'PAID', 'Addon paymentStatus is PAID');

    const postInventoryEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(
      postInventoryEntitlements.features[FEATURE_KEYS.INVENTORY_MANAGEMENT] === true,
      'Active inventory addon grants feature access in effective entitlements'
    );
    assert(
      postInventoryEntitlements.featureDetails[FEATURE_KEYS.INVENTORY_MANAGEMENT].source === 'ADDON',
      'Inventory feature source is correctly attributed to ADDON'
    );

    // -------------------------------------------------------------
    // Test 3: Duplicate Purchase Protection
    // -------------------------------------------------------------
    console.log('\n--- Test Group 3: Duplicate Purchase Prevention ---');
    // Requesting purchase of already active boolean addon should not duplicate active record
    const dupPurchaseReq = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_1,
      featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
      unitPrice: 100
    });
    assert(dupPurchaseReq.addon.id === inventoryActivation.addon.id, 'Duplicate purchase returns existing active addon without duplicating');

    // -------------------------------------------------------------
    // Test 4: Numeric Limit Addon with Quantity (max_halls)
    // -------------------------------------------------------------
    console.log('\n--- Test Group 4: Numeric Limit Addon (max_halls) & Quantity Aggregation ---');
    // Base plan has max_halls: 2
    assert(postInventoryEntitlements.limits.max_halls.limit === 2, 'Initial base max_halls is 2');

    // Purchase + Activate 3 additional halls
    const hallAddon = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_1,
      featureKey: 'max_halls',
      quantity: 3,
      unitPrice: 50
    });
    assert(hallAddon.addon.quantity === 3, 'Numeric addon quantity is 3');
    assert(hallAddon.addon.pricePaid === 150, 'Total price calculated as 3 * 50 = 150 SAR');

    await addonLifecycleService.activateAddonWithPayment({
      providerId: TEST_PROVIDER_1,
      featureKey: 'max_halls',
      addonId: hallAddon.addon.id,
      paymentId: 'PAY-HALLS-332211',
      amountPaid: 150
    });

    const numericEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(
      numericEntitlements.limits.max_halls.limit === 5,
      'Effective max_halls correctly aggregated: 2 (base) + 3 (addon quantity) = 5'
    );

    // -------------------------------------------------------------
    // Test 5: Payment Failure Handling
    // -------------------------------------------------------------
    console.log('\n--- Test Group 5: Payment Failure Handling ---');
    const surgeReq = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_1,
      featureKey: FEATURE_KEYS.DYNAMIC_SURGE_PRICING,
      unitPrice: 150
    });

    await addonLifecycleService.recordPaymentFailure(surgeReq.addon.id, 'Insufficient funds on credit card');
    const failedAddon = await ProviderAddon.findByPk(surgeReq.addon.id);
    assert(failedAddon?.addonStatus === 'PAYMENT_FAILED', 'Addon status recorded as PAYMENT_FAILED');
    assert(failedAddon?.paymentStatus === 'FAILED', 'Payment status is FAILED');

    const failEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(
      failEntitlements.features[FEATURE_KEYS.DYNAMIC_SURGE_PRICING] === false,
      'Feature with PAYMENT_FAILED status is NOT granted'
    );

    // -------------------------------------------------------------
    // Test 6: Renewal of Addon without duplicate rows
    // -------------------------------------------------------------
    console.log('\n--- Test Group 6: Addon Renewal & Period Extension ---');
    const addonCountBefore = await ProviderAddon.count({ where: { providerId: TEST_PROVIDER_1 } });
    
    const renewRes = await addonLifecycleService.renewAddon({
      addonId: inventoryActivation.addon.id,
      paymentId: 'PAY-RENEW-445566',
      durationMonths: 1,
      amountPaid: 100
    });

    const addonCountAfter = await ProviderAddon.count({ where: { providerId: TEST_PROVIDER_1 } });
    assert(renewRes.success === true, 'Addon renewal succeeds');
    assert(addonCountBefore === addonCountAfter, 'Renewal extends existing record without creating duplicate row');
    assert(renewRes.addon.version === 3, 'Addon version increments on renewal');

    // -------------------------------------------------------------
    // Test 7: Grace Period & Non-destructive Expiry
    // -------------------------------------------------------------
    console.log('\n--- Test Group 7: Grace Period & Non-Destructive Expiry ---');
    await addonLifecycleService.startGracePeriod(inventoryActivation.addon.id, 7);
    const graceAddon = await ProviderAddon.findByPk(inventoryActivation.addon.id);
    assert(graceAddon?.addonStatus === 'GRACE_PERIOD', 'Addon status is GRACE_PERIOD');
    assert(graceAddon?.paymentStatus === 'OVERDUE', 'Payment status is OVERDUE');

    const graceEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(
      graceEntitlements.features[FEATURE_KEYS.INVENTORY_MANAGEMENT] === true,
      'Feature remains accessible during GRACE_PERIOD'
    );

    await addonLifecycleService.expireAddon(inventoryActivation.addon.id, 'Cycle ended without renewal');
    const expiredAddon = await ProviderAddon.findByPk(inventoryActivation.addon.id);
    assert(expiredAddon?.addonStatus === 'EXPIRED', 'Addon status is EXPIRED');

    const expiredEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(
      expiredEntitlements.features[FEATURE_KEYS.INVENTORY_MANAGEMENT] === false,
      'Feature is no longer granted once addon is EXPIRED'
    );

    // -------------------------------------------------------------
    // Test 8: Cancellation (Immediate vs Schedule at period end)
    // -------------------------------------------------------------
    console.log('\n--- Test Group 8: Addon Cancellation Policies ---');
    // Re-purchase weekend pricing
    const weekendPurchase = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_1,
      featureKey: FEATURE_KEYS.WEEKEND_PRICING,
      unitPrice: 100
    });
    const weekendActive = await addonLifecycleService.activateAddonWithPayment({
      providerId: TEST_PROVIDER_1,
      featureKey: FEATURE_KEYS.WEEKEND_PRICING,
      addonId: weekendPurchase.addon.id,
      paymentId: 'PAY-WEEKEND-7788'
    });

    // Schedule cancellation at period end
    const cancelSched = await addonLifecycleService.cancelAddon({
      addonId: weekendActive.addon.id,
      immediate: false,
      reason: 'No longer needed next month'
    });
    assert(cancelSched.addon.cancelAtPeriodEnd === true, 'cancelAtPeriodEnd is true');
    assert(cancelSched.addon.autoRenew === false, 'autoRenew disabled');
    
    // Feature remains active during current period
    const schedEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(schedEntitlements.features[FEATURE_KEYS.WEEKEND_PRICING] === true, 'Feature remains active until period ends');

    // Immediate cancellation
    await addonLifecycleService.cancelAddon({
      addonId: weekendActive.addon.id,
      immediate: true,
      reason: 'Cancel immediately'
    });
    const immediateAddon = await ProviderAddon.findByPk(weekendActive.addon.id);
    assert(immediateAddon?.addonStatus === 'CANCELLED', 'Addon status is CANCELLED immediately');
    const cancelledEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_1, true);
    assert(cancelledEntitlements.features[FEATURE_KEYS.WEEKEND_PRICING] === false, 'Feature revoked immediately on cancel');

    // -------------------------------------------------------------
    // Test 9: Refund & Revocation
    // -------------------------------------------------------------
    console.log('\n--- Test Group 9: Refund & Administrative Revocation ---');
    // Provider 2: Partial payment feature
    const p2Addon = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_2,
      featureKey: FEATURE_KEYS.PARTIAL_PAYMENT,
      unitPrice: 120
    });
    const p2Active = await addonLifecycleService.activateAddonWithPayment({
      providerId: TEST_PROVIDER_2,
      featureKey: FEATURE_KEYS.PARTIAL_PAYMENT,
      addonId: p2Addon.addon.id,
      paymentId: 'PAY-P2-9999',
      amountPaid: 120
    });

    const p2EntBefore = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_2, true);
    assert(p2EntBefore.features[FEATURE_KEYS.PARTIAL_PAYMENT] === true, 'Provider 2 has active partial payment');

    // Refund
    const refundRes = await addonLifecycleService.refundAddon({
      addonId: p2Active.addon.id,
      refundAmount: 120,
      reason: 'Customer requested refund within 24h'
    });
    assert(refundRes.addon.addonStatus === 'REFUNDED', 'Addon status is REFUNDED');
    assert(refundRes.addon.paymentStatus === 'REFUNDED', 'Payment status is REFUNDED');

    const p2EntAfter = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_2, true);
    assert(p2EntAfter.features[FEATURE_KEYS.PARTIAL_PAYMENT] === false, 'Feature is revoked immediately on REFUND');

    // -------------------------------------------------------------
    // Test 10: Plan Upgrade Makes Add-on Redundant & Downgrade Keeps Valid Add-on
    // -------------------------------------------------------------
    console.log('\n--- Test Group 10: Plan Upgrade / Downgrade Interactions ---');
    // Provider 3 has Basic Plan and purchases Weekend Pricing Add-on
    await subscriptionLifecycleService.createSubscription({
      providerId: TEST_PROVIDER_3,
      providerEmail: 'provider3@test.com',
      planId: basicPlan.id,
      billingCycle: 'MONTHLY'
    });

    const p3Addon = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_3,
      featureKey: FEATURE_KEYS.WEEKEND_PRICING,
      unitPrice: 100
    });
    const p3ActiveAddon = await addonLifecycleService.activateAddonWithPayment({
      providerId: TEST_PROVIDER_3,
      featureKey: FEATURE_KEYS.WEEKEND_PRICING,
      addonId: p3Addon.addon.id,
      paymentId: 'PAY-P3-1111'
    });
    assert(p3ActiveAddon.addon.autoRenew === true, 'Addon initially has autoRenew = true');

    // Upgrade Provider 3 to Pro Plan (which includes weekend_pricing natively)
    await subscriptionLifecycleService.upgradeSubscription({
      providerId: TEST_PROVIDER_3,
      targetPlanId: proPlan.id,
      timing: 'immediate',
      pricePaid: 500
    });

    const p3AddonAfterUpgrade = await ProviderAddon.findByPk(p3ActiveAddon.addon.id);
    assert(
      p3AddonAfterUpgrade?.autoRenew === false,
      'Plan upgrade disables autoRenew on redundant boolean addon to prevent double charge'
    );

    // Also test: Provider 3 purchases a standalone inventory addon while on Pro plan
    const p3InventoryAddon = await addonLifecycleService.requestPurchase({
      providerId: TEST_PROVIDER_3,
      featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
      unitPrice: 100
    });
    await addonLifecycleService.activateAddonWithPayment({
      providerId: TEST_PROVIDER_3,
      featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
      addonId: p3InventoryAddon.addon.id,
      paymentId: 'PAY-P3-INV-222'
    });

    // Downgrade Provider 3 back to Basic Plan (which does not have inventory)
    await subscriptionLifecycleService.downgradeSubscription({
      providerId: TEST_PROVIDER_3,
      targetPlanId: basicPlan.id,
      timing: 'immediate'
    });

    // Verify that after downgrade, the standalone inventory add-on remains active and grants feature
    const p3EntAfterDowngrade = await effectiveEntitlementService.getEffectiveEntitlements(TEST_PROVIDER_3, true);
    assert(
      p3EntAfterDowngrade.features[FEATURE_KEYS.INVENTORY_MANAGEMENT] === true,
      'Downgrade keeps standalone active add-on valid and granting entitlements'
    );

    // -------------------------------------------------------------
    // Test 10: Audit Log Verification
    // -------------------------------------------------------------
    console.log('\n--- Test Group 10: Audit Log Verification ---');
    const auditEvents = await EntitlementAuditLog.findAll({
      order: [['id', 'ASC']]
    });

    const eventTypes = auditEvents.map(e => e.eventType);
    assert(eventTypes.includes('ADDON_PURCHASE_REQUESTED'), 'Audit log contains ADDON_PURCHASE_REQUESTED');
    assert(eventTypes.includes('ADDON_PAYMENT_VERIFIED'), 'Audit log contains ADDON_PAYMENT_VERIFIED');
    assert(eventTypes.includes('ADDON_ACTIVATED'), 'Audit log contains ADDON_ACTIVATED');
    assert(eventTypes.includes('ADDON_RENEWED'), 'Audit log contains ADDON_RENEWED');
    assert(eventTypes.includes('ADDON_EXPIRED'), 'Audit log contains ADDON_EXPIRED');
    assert(eventTypes.includes('ADDON_CANCELLED'), 'Audit log contains ADDON_CANCELLED');
    assert(eventTypes.includes('ADDON_REFUNDED'), 'Audit log contains ADDON_REFUNDED');
    assert(eventTypes.includes('ADDON_REVOKED'), 'Audit log contains ADDON_REVOKED');

    console.log('\n================================================================');
    console.log(`📊 P1.4 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Test suite crashed with error:', error);
    process.exit(1);
  }
}

runAddonLifecycleTests();
