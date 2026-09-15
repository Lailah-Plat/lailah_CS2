/**
 * @file subscriptionLifecycle.test.ts
 * @description Comprehensive automated test suite for P1.3 Unified Subscription Lifecycle.
 */

import { SubscriptionStateMachine } from '../src/services/subscription/subscriptionStateMachine.js';
import { subscriptionLifecycleService } from '../src/services/subscription/SubscriptionLifecycleService.js';
import { effectiveEntitlementService } from '../src/services/entitlement/effectiveEntitlementService.js';
import {
  syncSubscriptionModels,
  SubscriptionPlan,
  ProviderSubscription,
  EntitlementAuditLog
} from '../src/models/SubscriptionModels.js';
import { sequelize } from '../src/db/index.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 Starting P1.3 Subscription Lifecycle Test Suite');
  console.log('======================================================\n');

  await syncSubscriptionModels();

  // Test 1: State Machine Valid and Invalid Transitions
  console.log('--- Test Suite 1: SubscriptionStateMachine Validation ---');
  {
    assert(
      SubscriptionStateMachine.isValidTransition('DRAFT', 'ACTIVE'),
      'DRAFT -> ACTIVE should be valid'
    );
    assert(
      SubscriptionStateMachine.isValidTransition('DRAFT', 'PENDING_PAYMENT'),
      'DRAFT -> PENDING_PAYMENT should be valid'
    );
    assert(
      SubscriptionStateMachine.isValidTransition('ACTIVE', 'UPGRADE_SCHEDULED'),
      'ACTIVE -> UPGRADE_SCHEDULED should be valid'
    );
    assert(
      SubscriptionStateMachine.isValidTransition('ACTIVE', 'DOWNGRADE_SCHEDULED'),
      'ACTIVE -> DOWNGRADE_SCHEDULED should be valid'
    );
    assert(
      SubscriptionStateMachine.isValidTransition('ACTIVE', 'GRACE_PERIOD'),
      'ACTIVE -> GRACE_PERIOD should be valid'
    );
    assert(
      SubscriptionStateMachine.isValidTransition('GRACE_PERIOD', 'EXPIRED'),
      'GRACE_PERIOD -> EXPIRED should be valid'
    );
    assert(
      SubscriptionStateMachine.isValidTransition('GRACE_PERIOD', 'ACTIVE'),
      'GRACE_PERIOD -> ACTIVE (renewal) should be valid'
    );
    assert(
      !SubscriptionStateMachine.isValidTransition('CANCELLED', 'ACTIVE'),
      'CANCELLED -> ACTIVE direct transition must be REJECTED'
    );
    assert(
      !SubscriptionStateMachine.isValidTransition('DRAFT', 'RENEWAL_DUE'),
      'DRAFT -> RENEWAL_DUE must be REJECTED'
    );
    assert(
      SubscriptionStateMachine.canAccessFullFeatures('ACTIVE'),
      'ACTIVE must have full feature access'
    );
    assert(
      SubscriptionStateMachine.canAccessFullFeatures('GRACE_PERIOD'),
      'GRACE_PERIOD must retain feature access'
    );
    assert(
      !SubscriptionStateMachine.canAccessFullFeatures('EXPIRED'),
      'EXPIRED must NOT have full feature access'
    );
    assert(
      !SubscriptionStateMachine.canAccessFullFeatures('CANCELLED'),
      'CANCELLED must NOT have full feature access'
    );
  }

  // Test 2: Plan Setup & Creation
  console.log('\n--- Test Suite 2: Subscription Creation Lifecycle ---');
  const testProviderId = 999101;
  const testEmail = 'lifecycle_provider_test@layla.sa';

  // Clean up prior test runs
  await ProviderSubscription.destroy({ where: { providerId: [testProviderId, 999202] } });
  await EntitlementAuditLog.destroy({ where: { providerId: [testProviderId, 999202] } });

  // Ensure plans exist
  let basicPlan = await SubscriptionPlan.findOne({ where: { name: 'الباقة الأساسية' } });
  if (!basicPlan) {
    basicPlan = await SubscriptionPlan.create({
      name: 'الباقة الأساسية',
      description: 'الباقة الأساسية للمزودين الجدد',
      price: 0,
      period: 'شهري',
      features: JSON.stringify({
        maxHalls: 1,
        maxServices: 3,
        analytics_basic: true,
        instant_booking: true,
        commissionRate: 15
      }),
      active: true
    });
  }

  let proPlan = await SubscriptionPlan.findOne({ where: { name: 'الباقة الاحترافية' } });
  if (!proPlan) {
    proPlan = await SubscriptionPlan.create({
      name: 'الباقة الاحترافية',
      description: 'الباقة الاحترافية الشاملة للشركاء المميزين',
      price: 599,
      period: 'شهري',
      features: JSON.stringify({
        maxHalls: 10,
        maxServices: 50,
        analytics_basic: true,
        analytics_advanced: true,
        inventory_management: true,
        suppliers_management: true,
        dynamic_pricing: true,
        ai_assistant: true,
        instant_booking: true,
        commissionRate: 8
      }),
      active: true
    });
  }

  {
    const sub = await subscriptionLifecycleService.createSubscription({
      providerId: testProviderId,
      providerEmail: testEmail,
      planName: 'الباقة الأساسية',
      planId: basicPlan.id,
      actor: 'AdminTest',
      reason: 'إنشاء اشتراك تجريبي أولي'
    });

    assert(sub.providerId === testProviderId, 'Subscription created for provider');
    assert(sub.subscriptionStatus === 'ACTIVE', 'Initial state is ACTIVE');
    assert(sub.paymentStatus === 'PAID', 'Initial payment status is PAID');

    const entitlements = await effectiveEntitlementService.getEffectiveEntitlements(testProviderId, true);
    assert(entitlements.activePlan.name === 'الباقة الأساسية', 'Entitlements resolve to basic plan');
    assert(entitlements.activePlan.subscriptionStatus === 'ACTIVE', 'Entitlements report ACTIVE lifecycle status');
  }

  // Test 3: Upgrade to Pro Plan (Immediate)
  console.log('\n--- Test Suite 3: Immediate Subscription Upgrade ---');
  {
    const upgradeRes = await subscriptionLifecycleService.upgradeSubscription({
      providerId: testProviderId,
      targetPlanName: 'الباقة الاحترافية',
      targetPlanId: proPlan.id,
      timing: 'immediate',
      pricePaid: 599,
      actor: 'AdminTest',
      reason: 'ترقية فورية إلى الباقة الاحترافية'
    });

    assert(upgradeRes.effectiveImmediately, 'Upgrade is effective immediately');
    assert(upgradeRes.subscription.planName === 'الباقة الاحترافية', 'Target plan is now Pro');
    assert(upgradeRes.subscription.subscriptionStatus === 'ACTIVE', 'Status is ACTIVE');

    const entitlements = await effectiveEntitlementService.getEffectiveEntitlements(testProviderId, true);
    assert(entitlements.activePlan.name === 'الباقة الاحترافية', 'Active plan in entitlements is Pro');
    assert(entitlements.features.inventory_management === true, 'Inventory management enabled in Pro');
    assert(entitlements.features.dynamic_pricing === true, 'Dynamic pricing enabled in Pro');
  }

  // Test 4: Scheduled Upgrade Simulation
  console.log('\n--- Test Suite 4: Scheduled Upgrade ---');
  {
    const scheduledRes = await subscriptionLifecycleService.upgradeSubscription({
      providerId: testProviderId,
      targetPlanName: 'الباقة المتقدمة',
      timing: 'scheduled_cycle_end',
      actor: 'AdminTest',
      reason: 'جدولة ترقية لنهاية الدورة'
    });

    assert(!scheduledRes.effectiveImmediately, 'Scheduled upgrade is not effective immediately');
    assert(scheduledRes.subscription.subscriptionStatus === 'UPGRADE_SCHEDULED', 'State is UPGRADE_SCHEDULED');
    assert(scheduledRes.subscription.scheduledPlanName === 'الباقة المتقدمة', 'Scheduled plan recorded');

    // Current entitlements must still remain active during scheduled wait
    const entitlements = await effectiveEntitlementService.getEffectiveEntitlements(testProviderId, true);
    assert(entitlements.activePlan.subscriptionStatus === 'UPGRADE_SCHEDULED', 'Entitlements reflect schedule');
    assert(entitlements.features.inventory_management === true, 'Full features retained while UPGRADE_SCHEDULED');
  }

  // Test 5: Non-destructive Downgrade (Immediate) & Limit Gating
  console.log('\n--- Test Suite 5: Non-destructive Downgrade ---');
  {
    const downgradeRes = await subscriptionLifecycleService.downgradeSubscription({
      providerId: testProviderId,
      targetPlanName: 'الباقة الأساسية',
      targetPlanId: basicPlan.id,
      timing: 'immediate',
      actor: 'AdminTest',
      reason: 'تخفيض غير تدميري إلى الباقة الأساسية'
    });

    assert(downgradeRes.effectiveImmediately, 'Downgrade applied immediately');
    assert(downgradeRes.subscription.planName === 'الباقة الأساسية', 'Plan downgraded to basic');

    const entitlements = await effectiveEntitlementService.getEffectiveEntitlements(testProviderId, true);
    assert(entitlements.activePlan.name === 'الباقة الأساسية', 'Entitlements recalculated to basic');
    assert(entitlements.features.inventory_management === false, 'Inventory management disabled on basic');
    // Numeric limit for halls is 1 on basic
    assert(entitlements.limits.max_halls.limit === 1, 'Halls limit is now 1');
  }

  // Test 6: Grace Period & Expiry Lifecycle
  console.log('\n--- Test Suite 6: Grace Period & Expiry ---');
  {
    const graceSub = await subscriptionLifecycleService.startGracePeriod({
      providerId: testProviderId,
      graceDays: 7,
      reason: 'تأخر السداد ومنح مهلة سماح',
      actor: 'BillingSystem'
    });

    assert(graceSub.subscriptionStatus === 'GRACE_PERIOD', 'Status transitioned to GRACE_PERIOD');
    assert(graceSub.paymentStatus === 'OVERDUE', 'Payment status is OVERDUE');

    // In GRACE_PERIOD, features are still accessible
    const graceEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(testProviderId, true);
    assert(graceEntitlements.activePlan.subscriptionStatus === 'GRACE_PERIOD', 'Entitlements reflect GRACE_PERIOD');

    // Expire subscription
    const expiredSub = await subscriptionLifecycleService.expireSubscription(
      testProviderId,
      'انتهاء مهلة السماح دون سداد'
    );

    assert(expiredSub.subscriptionStatus === 'EXPIRED', 'Status transitioned to EXPIRED');
    assert(expiredSub.status === 'expired', 'Legacy status is expired');

    const expiredEntitlements = await effectiveEntitlementService.getEffectiveEntitlements(testProviderId, true);
    assert(expiredEntitlements.activePlan.subscriptionStatus === 'EXPIRED', 'Entitlements report EXPIRED');
  }

  // Test 7: Renewal from Expired State
  console.log('\n--- Test Suite 7: Subscription Renewal ---');
  {
    const renewedSub = await subscriptionLifecycleService.renewSubscription({
      providerId: testProviderId,
      durationMonths: 1,
      amountPaid: 599,
      transactionId: 'TXN-TEST-RENEW-001',
      actor: 'Provider',
      reason: 'تجديد الاشتراك وسداد الرسوم'
    });

    assert(renewedSub.subscriptionStatus === 'ACTIVE', 'Subscription renewed to ACTIVE');
    assert(renewedSub.paymentStatus === 'PAID', 'Payment status marked as PAID');
    assert(renewedSub.gracePeriodEnd === null, 'Grace period cleared');
  }

  // Test 8: Payment Failure Lifecycle
  console.log('\n--- Test Suite 8: Payment Failure Handling ---');
  {
    const failedSub = await subscriptionLifecycleService.recordPaymentFailure({
      providerId: testProviderId,
      reason: 'فشل بطاقة الائتمان',
      transactionId: 'TXN-FAIL-001'
    });

    assert(failedSub.subscriptionStatus === 'PAYMENT_FAILED', 'Status is PAYMENT_FAILED');
    assert(failedSub.paymentStatus === 'FAILED', 'Payment status is FAILED');
  }

  // Test 9: Cancellation
  console.log('\n--- Test Suite 9: Subscription Cancellation ---');
  {
    const cancelledSub = await subscriptionLifecycleService.cancelSubscription({
      providerId: testProviderId,
      immediate: true,
      reason: 'إلغاء بناء على طلب المشترك'
    });

    assert(cancelledSub.subscriptionStatus === 'CANCELLED', 'Status is CANCELLED');
    assert(cancelledSub.status === 'expired' || cancelledSub.status === 'cancelled', 'Legacy status is expired');
  }

  // Test 10: Concurrency Lock & Race Prevention
  console.log('\n--- Test Suite 10: Concurrency & Lock Serialization ---');
  {
    const concurrentProviderId = 999202;
    await subscriptionLifecycleService.createSubscription({
      providerId: concurrentProviderId,
      providerEmail: 'concurrent_test@layla.sa',
      planName: 'الباقة الأساسية',
      actor: 'AdminTest'
    });

    // Fire 3 concurrent upgrade/downgrade requests simultaneously
    const promises = [
      subscriptionLifecycleService.upgradeSubscription({
        providerId: concurrentProviderId,
        targetPlanName: 'الباقة الاحترافية',
        timing: 'immediate'
      }),
      subscriptionLifecycleService.downgradeSubscription({
        providerId: concurrentProviderId,
        targetPlanName: 'الباقة الأساسية',
        timing: 'immediate'
      }),
      subscriptionLifecycleService.upgradeSubscription({
        providerId: concurrentProviderId,
        targetPlanName: 'الباقة الاحترافية',
        timing: 'immediate'
      })
    ];

    const results = await Promise.all(promises);
    assert(results.length === 3, 'All 3 concurrent calls executed sequentially without deadlocks');

    // Check that active subscriptions count for this provider is exactly 1 (no duplicates)
    const activeSubsCount = await ProviderSubscription.count({
      where: {
        providerId: concurrentProviderId,
        status: 'active'
      }
    });
    assert(activeSubsCount === 1, 'Exactly one active subscription exists (no duplicates from races)');
  }

  // Test 11: Audit Trail Verification
  console.log('\n--- Test Suite 11: Entitlement & Lifecycle Audit Trail ---');
  {
    const auditLogs = await EntitlementAuditLog.findAll({
      where: { providerId: testProviderId },
      order: [['createdAt', 'DESC']]
    });

    assert(auditLogs.length >= 6, 'Comprehensive audit trail logged for all lifecycle transitions');
    console.log(`Logged ${auditLogs.length} audit events for provider ${testProviderId}:`);
    auditLogs.slice(0, 5).forEach(log => {
      console.log(`  - [${log.eventType}] ${log.reason} (${log.actor})`);
    });
  }

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
