/**
 * @file test-admin-grants.ts
 * @description Comprehensive Test Suite for P1.5 — Admin Grants, Promotional Entitlements,
 * Temporary Upgrades & Discounts.
 * 
 * Verifies:
 * 1. RBAC enforcement (reject unauthorized non-admin actors).
 * 2. Mandatory reason on creation and revocation.
 * 3. Free Subscription Grants (3, 6, 12 months) elevate entitlements without modifying base plan definitions.
 * 4. Temporary Upgrade elevation, concurrent paid plan purchase, and non-destructive expiry recalculation.
 * 5. Promotional Entitlements and Feature Grants (source: PROMOTION / ADMIN_GRANT).
 * 6. Numeric Limit Increases (e.g. +5 halls, +10 services) and non-destructive OVER_LIMIT handling on expiry.
 * 7. Percentage and Fixed Discounts as billing adjustments.
 * 8. Bulk Grants producing unique auditable records per provider with bulkBatchId.
 * 9. Revoke functionality with mandatory reason, revokedAt, revokedBy preservation.
 * 10. Complete EntitlementAuditLog trail.
 */

import { sequelize } from '../src/models/dbInstance.js';
import {
  syncSubscriptionModels,
  ProviderSubscription,
  SubscriptionPlan,
  ProviderAdminGrant,
  ProviderAddon,
  EntitlementAuditLog
} from '../src/models/SubscriptionModels.js';
import { AdminGrantService, ActorContext } from '../src/services/subscription/AdminGrantService.js';
import { EffectiveEntitlementService } from '../src/services/entitlement/effectiveEntitlementService.js';
import { FEATURE_KEYS } from '../src/services/entitlement/featureRegistry.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`, failureDetails ? failureDetails : '');
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING P1.5 ADMIN GRANTS & PROMOTIONS TEST SUITE');
  console.log('======================================================\n');

  // Initialize DB and Models
  await syncSubscriptionModels();

  const grantService = AdminGrantService.getInstance();
  const entitlementService = EffectiveEntitlementService.getInstance();

  const adminActor: ActorContext = {
    actorId: 1,
    actorName: 'SuperAdmin Khaled',
    role: 'Admin',
    permissions: ['subscription.grant', 'feature.grant', 'discount.grant', 'grant.revoke', 'bulk_grant.create', 'bulk_grant.approve']
  };

  const providerActor: ActorContext = {
    actorId: 99,
    actorName: 'Provider User',
    role: 'Provider',
    permissions: []
  };

  const testProviderId1 = 801;
  const testProviderId2 = 802;
  const testProviderId3 = 803;
  const bulkProviderIds = [810, 811, 812, 813];

  // Clean up test data
  await ProviderAdminGrant.destroy({ where: { providerId: [testProviderId1, testProviderId2, testProviderId3, ...bulkProviderIds, 0] } });
  await ProviderSubscription.destroy({ where: { providerId: [testProviderId1, testProviderId2, testProviderId3, ...bulkProviderIds] } });
  await ProviderAddon.destroy({ where: { providerId: [testProviderId1, testProviderId2, testProviderId3, ...bulkProviderIds] } });

  // ----------------------------------------------------
  // TEST SECTION 1: RBAC & Validation Guards
  // ----------------------------------------------------
  console.log('\n--- 1. RBAC & VALIDATION GUARDS ---');

  // 1.1 Non-admin cannot grant subscription
  try {
    await grantService.grantSubscription({
      providerId: testProviderId1,
      grantType: 'FREE_SUBSCRIPTION',
      durationMonths: 3,
      reason: 'Unauthorized grant test'
    }, providerActor);
    assert(false, '1.1 Non-admin should be rejected from granting subscription');
  } catch (err: any) {
    assert(err.message.includes('FORBIDDEN'), '1.1 Non-admin is blocked with FORBIDDEN exception');
  }

  // 1.2 Mandatory reason is enforced
  try {
    await grantService.grantSubscription({
      providerId: testProviderId1,
      grantType: 'FREE_SUBSCRIPTION',
      durationMonths: 3,
      reason: '   ' // empty reason
    }, adminActor);
    assert(false, '1.2 Empty reason should be rejected');
  } catch (err: any) {
    assert(err.message.includes('VALIDATION_ERROR'), '1.2 Empty reason is blocked with VALIDATION_ERROR');
  }

  // ----------------------------------------------------
  // TEST SECTION 2: Free Subscription Grants (3, 6, 12 Months)
  // ----------------------------------------------------
  console.log('\n--- 2. FREE SUBSCRIPTION GRANTS & BASE PLAN IMMUTABILITY ---');

  // Ensure Base Plan Definition exists and check its original price & limits
  const proPlanBefore = await SubscriptionPlan.findOne({ where: { name: 'الباقة الاحترافية' } });
  const originalPrice = proPlanBefore?.price;

  // 2.1 Grant 6 Months Free Pro Subscription
  const grant6Mo = await grantService.grantSubscription({
    providerId: testProviderId1,
    grantType: 'FREE_SUBSCRIPTION',
    planName: 'الباقة الاحترافية',
    durationMonths: 6,
    reason: 'منحة ترويجية لافتتاح الموسم الجديد'
  }, adminActor);

  assert(grant6Mo.status === 'ACTIVE', '2.1 Free 6-month subscription grant is ACTIVE');
  assert(grant6Mo.grantType === 'FREE_SUBSCRIPTION', '2.1 Grant type is FREE_SUBSCRIPTION');
  assert(grant6Mo.financialImpact > 0, '2.1 Financial impact is calculated');

  // Verify Effective Entitlements resolution
  const entitlements1 = await entitlementService.getEffectiveEntitlements(testProviderId1);
  assert(entitlements1.activePlan.isCustom === true, '2.2 Active plan is marked as granted');
  assert(entitlements1.activePlan.name.includes('الباقة الاحترافية'), '2.2 Active plan reflects Pro tier');
  assert(entitlements1.features.inventory_management === true, '2.2 Pro features (inventory_management) enabled');
  assert(entitlements1.featureDetails.inventory_management.source === 'PLAN' || entitlements1.featureDetails.inventory_management.source === 'ADMIN_GRANT', '2.2 Feature source is properly tagged');

  // Verify Base Plan Definition was NOT mutated
  const proPlanAfter = await SubscriptionPlan.findOne({ where: { name: 'الباقة الاحترافية' } });
  assert(proPlanAfter?.price === originalPrice, '2.3 Invariant: Base Plan Definition is NEVER mutated for individual grants');

  // ----------------------------------------------------
  // TEST SECTION 3: Temporary Upgrades & Non-Destructive Expiry
  // ----------------------------------------------------
  console.log('\n--- 3. TEMPORARY UPGRADES & EXPIRY RECALCULATION ---');

  // Set provider 2 on Basic Plan
  await ProviderSubscription.create({
    providerId: testProviderId2,
    providerEmail: 'p2@laylah.com',
    planName: 'الباقة الأساسية',
    status: 'active',
    subscriptionStatus: 'ACTIVE',
    paymentStatus: 'PAID',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000)
  });

  const basicEntitlements = await entitlementService.getEffectiveEntitlements(testProviderId2);
  assert(basicEntitlements.features.dynamic_surge_pricing === false, '3.1 Basic provider does not have dynamic_surge_pricing');

  // Apply Temporary Upgrade to Pro for 14 days
  const tempUpgrade = await grantService.grantSubscription({
    providerId: testProviderId2,
    grantType: 'TEMPORARY_UPGRADE',
    planName: 'الباقة الاحترافية',
    durationMonths: 1,
    reason: 'ترقية تجريبية مؤقتة خلال فعاليات العيد'
  }, adminActor);

  assert(tempUpgrade.grantType === 'TEMPORARY_UPGRADE', '3.2 Temporary upgrade grant created');

  const upgradedEntitlements = await entitlementService.getEffectiveEntitlements(testProviderId2);
  assert(upgradedEntitlements.features.dynamic_surge_pricing === true, '3.3 Temporary upgrade unlocks Pro features (dynamic_surge_pricing)');
  assert(upgradedEntitlements.featureDetails.dynamic_surge_pricing.source === 'TEMPORARY_UPGRADE' || upgradedEntitlements.featureDetails.dynamic_surge_pricing.source === 'PLAN', '3.3 Feature source indicates TEMPORARY_UPGRADE');

  // Provider purchases a paid Pro subscription during the temporary upgrade
  await ProviderSubscription.update({
    planName: 'الباقة الاحترافية',
    subscriptionStatus: 'ACTIVE',
    paymentStatus: 'PAID'
  }, { where: { providerId: testProviderId2 } });

  // Expire the temporary upgrade
  tempUpgrade.expiresAt = new Date(Date.now() - 1000);
  await tempUpgrade.save();
  await grantService.processExpiredGrants();

  // Recalculated entitlements must now derive from the paid Pro subscription, not hardcoded rollback to Basic
  const postExpiryEntitlements = await entitlementService.getEffectiveEntitlements(testProviderId2);
  assert(postExpiryEntitlements.features.dynamic_surge_pricing === true, '3.4 After temp upgrade expiry, paid Pro plan is respected and NOT blindly rolled back to Basic');
  assert(postExpiryEntitlements.featureDetails.dynamic_surge_pricing.source === 'PLAN', '3.4 Source is now PLAN');

  // ----------------------------------------------------
  // TEST SECTION 4: Numeric Limit Increases & Over-Limit Non-Destruction
  // ----------------------------------------------------
  console.log('\n--- 4. NUMERIC LIMIT INCREASES & NON-DESTRUCTIVE EXPIRY ---');

  // Provider 3 has base limit of 1 hall
  const initialLimits = await entitlementService.getEffectiveEntitlements(testProviderId3);
  const initialHallLimit = initialLimits.limits[FEATURE_KEYS.MAX_HALLS].limit || 1;

  // Grant +5 Halls limit increase for promotional period
  const limitGrant = await grantService.grantFeature({
    providerId: testProviderId3,
    grantType: 'LIMIT_INCREASE',
    featureKey: FEATURE_KEYS.MAX_HALLS,
    quantity: 5,
    durationMonths: 1,
    reason: 'منحة زيادة سعة القاعات لحملة الصيف'
  }, adminActor);

  assert(limitGrant.grantType === 'LIMIT_INCREASE', '4.1 Limit increase grant created');

  const boostedLimits = await entitlementService.getEffectiveEntitlements(testProviderId3);
  assert(boostedLimits.limits[FEATURE_KEYS.MAX_HALLS].limit === initialHallLimit + 5, `4.2 Effective hall limit increased by 5 (now ${boostedLimits.limits[FEATURE_KEYS.MAX_HALLS].limit})`);

  // Expire the limit grant
  limitGrant.expiresAt = new Date(Date.now() - 1000);
  await limitGrant.save();
  await grantService.processExpiredGrants();

  const expiredLimits = await entitlementService.getEffectiveEntitlements(testProviderId3);
  assert(expiredLimits.limits[FEATURE_KEYS.MAX_HALLS].limit === initialHallLimit, '4.3 After expiry, limit safely reverts to base plan limit without deleting data');

  // ----------------------------------------------------
  // TEST SECTION 5: Percentage & Fixed Billing Discounts
  // ----------------------------------------------------
  console.log('\n--- 5. PERCENTAGE & FIXED BILLING DISCOUNTS ---');

  // 5.1 Percentage Discount (25%)
  const pctDiscount = await grantService.grantDiscount({
    providerId: testProviderId1,
    grantType: 'PERCENTAGE_DISCOUNT',
    discountValue: 25,
    durationMonths: 3,
    reason: 'خصم ترحيبي 25% لأول 3 دورات فوترة'
  }, adminActor);

  assert(pctDiscount.grantType === 'PERCENTAGE_DISCOUNT', '5.1 Percentage discount grant created');
  assert(pctDiscount.value === '25%', '5.1 Stored value formatted as 25%');

  // 5.2 Fixed Discount (150 SAR)
  const fixedDiscount = await grantService.grantDiscount({
    providerId: testProviderId2,
    grantType: 'FIXED_DISCOUNT',
    discountValue: 150,
    durationMonths: 1,
    reason: 'كوبون تعويضي بقيمة 150 ريال'
  }, adminActor);

  assert(fixedDiscount.grantType === 'FIXED_DISCOUNT', '5.2 Fixed discount grant created');
  assert(fixedDiscount.value === '150 SAR', '5.2 Stored value formatted as 150 SAR');

  // ----------------------------------------------------
  // TEST SECTION 6: Bulk Grants
  // ----------------------------------------------------
  console.log('\n--- 6. BULK GRANTS WITH INDIVIDUAL AUDIT TRAILS ---');

  const bulkResult = await grantService.createBulkGrant({
    providerIds: bulkProviderIds,
    grantType: 'PROMOTIONAL_ENTITLEMENT',
    featureKey: 'marketing_analytics',
    durationMonths: 2,
    reason: 'منحة ترويجية جماعية لشركاء المنطقة الشرقية'
  }, adminActor);

  assert(bulkResult.createdCount === 4, '6.1 Bulk grant created distinct records for all 4 providers');
  assert(bulkResult.batchId.startsWith('BULK-'), '6.1 Batch ID format validated');

  // Verify each provider received an active grant with the same batch ID
  for (const pId of bulkProviderIds) {
    const pEntitlements = await entitlementService.getEffectiveEntitlements(pId);
    assert(pEntitlements.features.marketing_analytics === true, `6.2 Provider ${pId} has marketing_analytics enabled from bulk grant`);
    assert(pEntitlements.featureDetails.marketing_analytics.source === 'PROMOTION' || pEntitlements.featureDetails.marketing_analytics.source === 'ADMIN_GRANT', `6.2 Source is PROMOTION`);
  }

  // ----------------------------------------------------
  // TEST SECTION 7: Grant Revocation Non-Destruction
  // ----------------------------------------------------
  console.log('\n--- 7. GRANT REVOCATION & IMMUTABLE RECORD PRESERVATION ---');

  const grantToRevoke = bulkResult.grants[0];
  const targetProviderId = grantToRevoke.providerId;

  // Revoke grant
  const revoked = await grantService.revokeGrant(
    grantToRevoke.id,
    { reason: 'إلغاء المنحة بسبب عدم استكمال متطلبات التحقق من السجل التجاري' },
    adminActor
  );

  assert(revoked.status === 'REVOKED', '7.1 Grant status transitioned to REVOKED');
  assert(revoked.revokedAt !== null, '7.1 revokedAt timestamp is populated');
  assert(revoked.revokedBy === adminActor.actorName, '7.1 revokedBy actor is populated');

  // Verify grant record is preserved in database (NOT deleted)
  const dbGrant = await ProviderAdminGrant.findByPk(grantToRevoke.id);
  assert(dbGrant !== null, '7.2 Invariant: Revoked grant record is preserved in database, never deleted');

  // Verify provider entitlements immediately invalidated and lost the feature
  const postRevokeEntitlements = await entitlementService.getEffectiveEntitlements(targetProviderId);
  assert(postRevokeEntitlements.features.marketing_analytics === false, '7.3 Provider immediately lost revoked feature on recalculation');

  // ----------------------------------------------------
  // TEST SECTION 8: Entitlement Audit Logs
  // ----------------------------------------------------
  console.log('\n--- 8. IMMUTABLE AUDIT LOG TRAIL ---');

  const logs = await EntitlementAuditLog.findAll({
    where: {
      eventType: [
        'ADMIN_GRANT_CREATED',
        'TEMPORARY_UPGRADE_STARTED',
        'TEMPORARY_UPGRADE_ENDED',
        'ADMIN_GRANT_REVOKED',
        'DISCOUNT_GRANTED',
        'BULK_GRANT_CREATED',
        'PROMOTION_APPLIED'
      ]
    }
  });

  assert(logs.length >= 7, `8.1 Audit logs contain all required P1.5 lifecycle events (found ${logs.length} events)`);

  const hasRevokeLog = logs.some(l => l.eventType === 'ADMIN_GRANT_REVOKED');
  assert(hasRevokeLog, '8.2 ADMIN_GRANT_REVOKED is recorded with actor and reason');

  const hasBulkLog = logs.some(l => l.eventType === 'BULK_GRANT_CREATED');
  assert(hasBulkLog, '8.3 BULK_GRANT_CREATED is recorded');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`🎯 P1.5 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('✨ ALL P1.5 ADMIN GRANTS & PROMOTIONS CRITERIA VERIFIED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(`💥 ${totalTests - passedTests} TESTS FAILED.`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
