import { EffectiveEntitlementService } from '../src/services/entitlement/effectiveEntitlementService.js';
import { FEATURE_KEYS, normalizeFeatureKey } from '../src/services/entitlement/featureRegistry.js';
import {
  sequelize,
  SubscriptionPlan,
  ProviderSubscription,
  ProviderAddon,
  ProviderAdminGrant,
  ProviderFeatureOverride,
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

async function runTests() {
  console.log('--- Starting P1.1 Effective Entitlement Authority Unit & Integration Tests ---');

  try {
    // 1. Initialize DB models
    await migrateSubscriptionTables();
    const service = EffectiveEntitlementService.getInstance();

    // Clean test tables
    await SubscriptionPlan.destroy({ where: {} });
    await ProviderSubscription.destroy({ where: {} });
    await ProviderAddon.destroy({ where: {} });
    await ProviderAdminGrant.destroy({ where: {} });
    await ProviderFeatureOverride.destroy({ where: {} });

    // Ensure Plans exist
    const basicFeatures = {
      [FEATURE_KEYS.WEEKEND_PRICING]: false,
      [FEATURE_KEYS.DYNAMIC_SURGE_PRICING]: false,
      [FEATURE_KEYS.PARTIAL_PAYMENT]: false,
      [FEATURE_KEYS.FULL_MANAGEMENT]: false,
      max_halls: 2,
      max_services: 5,
      staff_seats: 0
    };
    await SubscriptionPlan.findOrCreate({
      where: { name: 'الباقة الأساسية' },
      defaults: {
        name: 'الباقة الأساسية',
        price: 0,
        description: 'الباقة الأساسية',
        features: JSON.stringify(basicFeatures)
      }
    });

    const advFeatures = {
      [FEATURE_KEYS.WEEKEND_PRICING]: true,
      [FEATURE_KEYS.DYNAMIC_SURGE_PRICING]: false,
      [FEATURE_KEYS.PARTIAL_PAYMENT]: true,
      [FEATURE_KEYS.FULL_MANAGEMENT]: true,
      max_halls: 5,
      max_services: 15,
      staff_seats: 5
    };
    await SubscriptionPlan.findOrCreate({
      where: { name: 'الباقة المتقدمة' },
      defaults: {
        name: 'الباقة المتقدمة',
        price: 4999,
        description: 'الباقة المتقدمة',
        features: JSON.stringify(advFeatures)
      }
    });

    const proFeatures = {
      [FEATURE_KEYS.WEEKEND_PRICING]: true,
      [FEATURE_KEYS.DYNAMIC_SURGE_PRICING]: true,
      [FEATURE_KEYS.PARTIAL_PAYMENT]: true,
      [FEATURE_KEYS.FULL_MANAGEMENT]: true,
      [FEATURE_KEYS.INVENTORY_MANAGEMENT]: true,
      max_halls: 'unlimited',
      max_services: 'unlimited',
      staff_seats: 'unlimited'
    };
    await SubscriptionPlan.findOrCreate({
      where: { name: 'الباقة الاحترافية' },
      defaults: {
        name: 'الباقة الاحترافية',
        price: 11999,
        description: 'الباقة الاحترافية',
        features: JSON.stringify(proFeatures)
      }
    });

    // Test 1: Basic Plan (Default Deny on Advanced Features)
    const provider1Id = 101;
    await ProviderSubscription.create({
      providerId: provider1Id,
      providerEmail: 'provider1@lailah.sa',
      planName: 'الباقة الأساسية',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000)
    });
    service.invalidateProviderCache(provider1Id);

    const basicEnt = await service.getEffectiveEntitlements(provider1Id, true);
    assert(basicEnt.features[FEATURE_KEYS.WEEKEND_PRICING] === false, 'Test 1.1: Basic Plan has weekend_pricing = false');
    assert(basicEnt.features[FEATURE_KEYS.DYNAMIC_SURGE_PRICING] === false, 'Test 1.2: Basic Plan has dynamic_surge_pricing = false');
    assert(basicEnt.limits[FEATURE_KEYS.MAX_HALLS]?.limit === 2, 'Test 1.3: Basic Plan max halls = 2');

    // Test 2: Business / Advanced Plan
    const provider2Id = 102;
    await ProviderSubscription.create({
      providerId: provider2Id,
      providerEmail: 'provider2@lailah.sa',
      planName: 'الباقة المتقدمة',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000)
    });
    service.invalidateProviderCache(provider2Id);

    const advEnt = await service.getEffectiveEntitlements(provider2Id, true);
    assert(advEnt.features[FEATURE_KEYS.WEEKEND_PRICING] === true, 'Test 2.1: Business Plan has weekend_pricing = true');
    assert(advEnt.features[FEATURE_KEYS.DYNAMIC_SURGE_PRICING] === false, 'Test 2.2: Business Plan has dynamic_surge_pricing = false');
    assert(advEnt.limits[FEATURE_KEYS.MAX_HALLS]?.limit === 5, 'Test 2.3: Business Plan max halls = 5');

    // Test 3: Pro Plan (Unlimited and all features)
    const provider3Id = 103;
    await ProviderSubscription.create({
      providerId: provider3Id,
      providerEmail: 'provider3@lailah.sa',
      planName: 'الباقة الاحترافية',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000)
    });
    service.invalidateProviderCache(provider3Id);

    const proEnt = await service.getEffectiveEntitlements(provider3Id, true);
    assert(proEnt.features[FEATURE_KEYS.WEEKEND_PRICING] === true, 'Test 3.1: Pro Plan has weekend_pricing = true');
    assert(proEnt.features[FEATURE_KEYS.DYNAMIC_SURGE_PRICING] === true, 'Test 3.2: Pro Plan has dynamic_surge_pricing = true');
    assert(proEnt.limits[FEATURE_KEYS.MAX_HALLS]?.status === 'UNLIMITED', 'Test 3.3: Pro Plan max halls is unlimited');

    // Test 4: Base Plan + Purchased Add-on
    const provider4Id = 104;
    await ProviderSubscription.create({
      providerId: provider4Id,
      providerEmail: 'provider4@lailah.sa',
      planName: 'الباقة الأساسية',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000)
    });
    await ProviderAddon.create({
      providerId: provider4Id,
      featureKey: FEATURE_KEYS.DYNAMIC_SURGE_PRICING,
      pricePaid: 299,
      status: 'active',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000)
    });
    service.invalidateProviderCache(provider4Id);

    const addonEnt = await service.getEffectiveEntitlements(provider4Id, true);
    assert(addonEnt.features[FEATURE_KEYS.DYNAMIC_SURGE_PRICING] === true, 'Test 4.1: Basic + Addon grants dynamic_surge_pricing = true');
    assert(addonEnt.featureDetails[FEATURE_KEYS.DYNAMIC_SURGE_PRICING]?.source === 'ADDON', 'Test 4.2: Feature source is ADDON');

    // Test 5: Valid Admin Grant
    const provider5Id = 105;
    await ProviderSubscription.create({
      providerId: provider5Id,
      providerEmail: 'provider5@lailah.sa',
      planName: 'الباقة الأساسية',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000)
    });
    await ProviderAdminGrant.create({
      providerId: provider5Id,
      featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
      grantType: 'boolean',
      value: 'true',
      reason: 'VIP Special Trial',
      grantedBy: 'SuperAdmin',
      status: 'active',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000)
    });
    service.invalidateProviderCache(provider5Id);

    const grantEnt = await service.getEffectiveEntitlements(provider5Id, true);
    assert(grantEnt.features[FEATURE_KEYS.INVENTORY_MANAGEMENT] === true, 'Test 5.1: Admin Grant enables inventory_management = true');
    assert(grantEnt.featureDetails[FEATURE_KEYS.INVENTORY_MANAGEMENT]?.source === 'ADMIN_GRANT', 'Test 5.2: Feature source is ADMIN_GRANT');

    // Test 6: Expired Admin Grant (Must fail closed/revert to default deny)
    const provider6Id = 106;
    await ProviderSubscription.create({
      providerId: provider6Id,
      providerEmail: 'provider6@lailah.sa',
      planName: 'الباقة الأساسية',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 86400000)
    });
    await ProviderAdminGrant.create({
      providerId: provider6Id,
      featureKey: FEATURE_KEYS.INVENTORY_MANAGEMENT,
      grantType: 'boolean',
      value: 'true',
      reason: 'Expired Trial',
      grantedBy: 'SuperAdmin',
      status: 'active',
      startsAt: new Date(Date.now() - 60 * 86400000),
      expiresAt: new Date(Date.now() - 5 * 86400000) // Expired 5 days ago
    });
    service.invalidateProviderCache(provider6Id);

    const expiredEnt = await service.getEffectiveEntitlements(provider6Id, true);
    assert(expiredEnt.features[FEATURE_KEYS.INVENTORY_MANAGEMENT] === false, 'Test 6.1: Expired Admin Grant does NOT grant access (remains false)');
    assert(expiredEnt.featureDetails[FEATURE_KEYS.INVENTORY_MANAGEMENT]?.source === 'DEFAULT_DENY', 'Test 6.2: Expired Grant resolves to DEFAULT_DENY');

    // Test 7: Unknown Feature (Default Deny)
    const unknownRes = await service.checkFeature(provider1Id, 'completely_unknown_feature_xyz');
    assert(unknownRes.allowed === false, 'Test 7.1: Unknown feature strictly resolves to allowed = false');
    assert(unknownRes.source === 'DEFAULT_DENY', 'Test 7.2: Unknown feature source is DEFAULT_DENY');

    // Test 8: Tampering Resistance / Backend Authority Verification
    // A client claiming pro features locally cannot alter backend effective resolution
    const checkTamper = await service.checkFeature(provider1Id, FEATURE_KEYS.DYNAMIC_SURGE_PRICING);
    assert(checkTamper.allowed === false, 'Test 8.1: Provider 1 without backend grant is denied dynamic pricing');

    console.log(`\n--- Test Results: ${passed} Passed, ${failed} Failed ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runTests();
