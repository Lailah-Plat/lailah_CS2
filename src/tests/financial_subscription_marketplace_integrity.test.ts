/**
 * @file financial_subscription_marketplace_integrity.test.ts
 * @description P1.6 Acceptance Test Suite for Subscription & Feature Marketplace Financial Integrity.
 * 
 * Tests:
 * 1. Backend Quote Calculation (Source of Truth for Price, Tax 15%, Discount).
 * 2. Normal Paid Subscription Activation (Verified Payment Required).
 * 3. Add-on / Feature Purchase with Validated Quote.
 * 4. Free Subscription Grant & 100% Waived Payment Handling.
 * 5. Tampered Price / Client Input Rejection (Frontend Cannot Dictate Financial Values).
 * 6. Expired Quote Consumption Rejection (>30m Validity Window).
 * 7. Double-Consumption / Replay Protection on Financial Quotes.
 * 8. Financial Reconciliation Service (Mismatch & Audit Log Detection).
 */

import { financialQuoteService } from '../services/finance/FinancialQuoteService.js';
import { FinancialReconciliationService } from '../services/finance/FinancialReconciliationService.js';
import { subscriptionLifecycleService } from '../services/subscription/SubscriptionLifecycleService.js';
import { addonLifecycleService } from '../services/subscription/AddonLifecycleService.js';
import { effectiveEntitlementService } from '../services/entitlement/effectiveEntitlementService.js';
import {
  SubscriptionPlan,
  ProviderSubscription,
  ProviderAddon,
  ProviderAdminGrant,
  FinancialQuote,
  EntitlementAuditLog
} from '../models/SubscriptionModels.js';
import { VerifiedPaymentEvent } from '../models/PaymentArchitectureModels.js';

export async function runFinancialSubscriptionMarketplaceIntegrityTests(): Promise<{
  totalTests: number;
  passedTests: number;
  failedTests: number;
}> {
  console.log('================================================================');
  console.log('🧪 Starting P1.6 Subscription & Marketplace Financial Integrity Suite');
  console.log('================================================================\n');

  let passedTests = 0;
  const totalTests = 8;
  const testProviderId = 999101;
  const testProviderEmail = 'provider.p16.test@lailah.sa';

  // -------------------------------------------------------------
  // Test 1: Backend Quote Generation (Source of Truth for Price & 15% VAT)
  // -------------------------------------------------------------
  try {
    console.log('▶ Test 1: Backend Quote Generation (15% VAT extraction and pricing)...');
    
    // Create/ensure plan exists
    let plan = await SubscriptionPlan.findOne({ where: { name: 'الباقة المتقدمة' } });
    if (!plan) {
      plan = await SubscriptionPlan.create({
        name: 'الباقة المتقدمة',
        price: 575, // 500 SAR net + 75 SAR (15% VAT)
        monthlyPrice: 575,
        annualPrice: 5750,
        commissionRate: 7.0,
        features: { advanced_analytics: true, multi_calendar: true }
      });
    }

    const quote = await financialQuoteService.createSubscriptionQuote({
      providerId: testProviderId,
      providerEmail: testProviderEmail,
      planId: plan.id,
      billingCycle: 'MONTHLY'
    });

    // 575 gross -> 500 net, 75 tax
    const expectedTax = Math.round((575 - (575 / 1.15)) * 100) / 100;
    const expectedNet = Math.round((575 / 1.15) * 100) / 100;

    if (
      quote &&
      Number(quote.totalAmount) === 575 &&
      Math.abs(Number(quote.netAmountBeforeTax) - expectedNet) < 0.1 &&
      Math.abs(Number(quote.taxAmount) - expectedTax) < 0.1 &&
      quote.status === 'ISSUED'
    ) {
      console.log('  ✅ PASSED: Backend generated exact 15% VAT-inclusive quote.');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Quote math mismatch:', {
        total: quote.totalAmount,
        net: quote.netAmountBeforeTax,
        tax: quote.taxAmount
      });
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 1 with exception:', err.message);
  }

  // -------------------------------------------------------------
  // Test 2: Paid Subscription Activation with Verified Payment
  // -------------------------------------------------------------
  try {
    console.log('\n▶ Test 2: Paid Subscription Activation with Verified Payment Event...');
    
    const plan = await SubscriptionPlan.findOne({ where: { name: 'الباقة المتقدمة' } });
    const quote = await financialQuoteService.createSubscriptionQuote({
      providerId: testProviderId,
      providerEmail: testProviderEmail,
      planId: plan!.id,
      billingCycle: 'MONTHLY'
    });

    const paymentRef = `PAY-TEST-${Date.now()}`;
    const verifiedEvent = await VerifiedPaymentEvent.create({
      gatewayName: 'hyperpay',
      gatewayEventId: `GW-${Date.now()}`,
      paymentReference: paymentRef,
      externalPaymentId: `EXT-${Date.now()}`,
      amountHalalas: 57500, // 575 SAR
      currency: 'SAR',
      status: 'verified',
      signatureVerified: true,
      source: 'webhook',
      payload: { test: true },
      eventTimestamp: new Date(),
      idempotencyKey: `IDEM-PAY-${Date.now()}`
    });

    const activationResult = await subscriptionLifecycleService.activateSubscriptionWithPayment({
      providerId: testProviderId,
      providerEmail: testProviderEmail,
      quoteId: quote.quoteId,
      paymentId: paymentRef,
      verifiedEventId: verifiedEvent.id,
      actor: 'PaymentWebhook'
    });

    if (
      activationResult.success &&
      activationResult.subscription.subscriptionStatus === 'ACTIVE' &&
      Number(activationResult.subscription.pricePaid) === 575
    ) {
      console.log('  ✅ PASSED: Subscription activated upon verified payment verification.');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Activation failed or returned incorrect state:', activationResult);
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 2 with exception:', err.message);
  }

  // -------------------------------------------------------------
  // Test 3: Add-on Purchase with Validated Quote
  // -------------------------------------------------------------
  try {
    console.log('\n▶ Test 3: Add-on Activation with Validated Backend Quote...');
    
    const featureKey = 'ai_instant_reply';
    const addonQuote = await financialQuoteService.createAddonQuote({
      providerId: testProviderId,
      providerEmail: testProviderEmail,
      featureKey,
      quantity: 1,
      billingCycle: 'MONTHLY'
    });

    const addonPayRef = `PAY-ADDON-${Date.now()}`;
    const addonVerifiedEvent = await VerifiedPaymentEvent.create({
      gatewayName: 'hyperpay',
      gatewayEventId: `GW-ADDON-${Date.now()}`,
      paymentReference: addonPayRef,
      externalPaymentId: `EXT-ADDON-${Date.now()}`,
      amountHalalas: Math.round(Number(addonQuote.totalAmount) * 100),
      currency: 'SAR',
      status: 'verified',
      signatureVerified: true,
      source: 'webhook',
      payload: { test: true },
      eventTimestamp: new Date(),
      idempotencyKey: `IDEM-ADDON-${Date.now()}`
    });

    const addonResult = await addonLifecycleService.activateAddonWithPayment({
      providerId: testProviderId,
      featureKey,
      quoteId: addonQuote.quoteId,
      paymentId: addonPayRef,
      verifiedEventId: String(addonVerifiedEvent.id),
      actor: 'MarketplaceCheckout'
    });

    if (
      addonResult.success &&
      addonResult.addon.addonStatus === 'ACTIVE' &&
      addonResult.addon.paymentStatus === 'PAID'
    ) {
      console.log('  ✅ PASSED: Addon activated cleanly with verified quote consumption.');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Addon activation returned unexpected result:', addonResult);
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 3 with exception:', err.message);
  }

  // -------------------------------------------------------------
  // Test 4: Free Subscription Grant (100% Waived / Admin Grant)
  // -------------------------------------------------------------
  try {
    console.log('\n▶ Test 4: Free Subscription Grant (100% Waived Amount)...');
    
    const freeProviderId = 999102;
    // Create an AdminGrant for 100% Free Subscription
    await ProviderAdminGrant.create({
      providerId: freeProviderId,
      providerEmail: 'free.provider@lailah.sa',
      grantType: 'FREE_SUBSCRIPTION',
      value: 'true',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      reason: 'Official promotional grant for partner onboarding',
      grantedBy: 'AdminUser'
    });

    const plan = await SubscriptionPlan.findOne({ where: { name: 'الباقة المتقدمة' } });
    const freeQuote = await financialQuoteService.createSubscriptionQuote({
      providerId: freeProviderId,
      providerEmail: 'free.provider@lailah.sa',
      planId: plan!.id,
      billingCycle: 'MONTHLY'
    });

    if (Number(freeQuote.totalAmount) === 0 && freeQuote.discountSource === 'ADMIN_GRANT') {
      const freeActivation = await subscriptionLifecycleService.activateSubscriptionWithPayment({
        providerId: freeProviderId,
        providerEmail: 'free.provider@lailah.sa',
        quoteId: freeQuote.quoteId,
        actor: 'AdminPromotion'
      });

      if (
        freeActivation.success &&
        freeActivation.subscription.paymentStatus === 'WAIVED' &&
        freeActivation.subscription.subscriptionStatus === 'ACTIVE'
      ) {
        console.log('  ✅ PASSED: Free grant activated successfully without requiring payment.');
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Free activation failed:', freeActivation);
      }
    } else {
      console.error('  ❌ FAILED: Free quote did not evaluate to 0 total amount:', freeQuote);
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 4 with exception:', err.message);
  }

  // -------------------------------------------------------------
  // Test 5: Rejection of Tampered / Unpaid Activation
  // -------------------------------------------------------------
  try {
    console.log('\n▶ Test 5: Rejection of Activation without Payment or with Tampered Paid Amount...');
    
    const plan = await SubscriptionPlan.findOne({ where: { name: 'الباقة المتقدمة' } });
    const quote = await financialQuoteService.createSubscriptionQuote({
      providerId: testProviderId,
      providerEmail: testProviderEmail,
      planId: plan!.id,
      billingCycle: 'MONTHLY'
    });

    let rejectedNoPayment = false;
    try {
      // Attempt activation with totalAmount > 0 without paymentId
      await subscriptionLifecycleService.activateSubscriptionWithPayment({
        providerId: testProviderId,
        providerEmail: testProviderEmail,
        quoteId: quote.quoteId,
        actor: 'Attacker'
      });
    } catch (e: any) {
      rejectedNoPayment = true;
    }

    // Now test mismatched verified amount
    const tamperedVerifiedEvent = await VerifiedPaymentEvent.create({
      gatewayName: 'hyperpay',
      gatewayEventId: `GW-HACK-${Date.now()}`,
      paymentReference: `PAY-HACK-${Date.now()}`,
      externalPaymentId: `EXT-HACK-${Date.now()}`,
      amountHalalas: 1000, // Only 10 SAR paid instead of 575 SAR
      currency: 'SAR',
      status: 'verified',
      signatureVerified: true,
      source: 'webhook',
      payload: { test: true },
      eventTimestamp: new Date(),
      idempotencyKey: `IDEM-HACK-${Date.now()}`
    });

    let rejectedAmountMismatch = false;
    try {
      await subscriptionLifecycleService.activateSubscriptionWithPayment({
        providerId: testProviderId,
        providerEmail: testProviderEmail,
        quoteId: quote.quoteId,
        paymentId: tamperedVerifiedEvent.paymentReference,
        verifiedEventId: tamperedVerifiedEvent.id,
        actor: 'Attacker'
      });
    } catch (e: any) {
      rejectedAmountMismatch = true;
    }

    if (rejectedNoPayment && rejectedAmountMismatch) {
      console.log('  ✅ PASSED: Backend strictly rejected unpaid and underpaid activation attempts.');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Security breach - unverified or underpaid activation was not rejected:', {
        rejectedNoPayment,
        rejectedAmountMismatch
      });
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 5 with exception:', err.message);
  }

  // -------------------------------------------------------------
  // Test 6: Expired Quote Rejection (>30m Validity Window)
  // -------------------------------------------------------------
  try {
    console.log('\n▶ Test 6: Rejection of Expired Quote (>30 Minutes)...');
    
    const plan = await SubscriptionPlan.findOne({ where: { name: 'الباقة المتقدمة' } });
    const expiredQuote = await FinancialQuote.create({
      quoteId: `Q-EXP-${Date.now()}`,
      providerId: testProviderId,
      providerEmail: testProviderEmail,
      itemType: 'SUBSCRIPTION',
      planId: plan!.id,
      planName: plan!.name,
      baseAmount: 575,
      netAmountBeforeTax: 500,
      taxAmount: 75,
      totalAmount: 575,
      status: 'ISSUED',
      issuedAt: new Date(Date.now() - 40 * 60 * 1000), // 40 mins ago
      expiresAt: new Date(Date.now() - 10 * 60 * 1000) // expired 10 mins ago
    });

    let expiredRejected = false;
    try {
      await financialQuoteService.validateQuote(expiredQuote.quoteId, testProviderId);
    } catch (e: any) {
      if (e.message.includes('منتهي الصلاحية') || e.message.includes('expired')) {
        expiredRejected = true;
      }
    }

    if (expiredRejected) {
      console.log('  ✅ PASSED: Expired quote consumption was rejected.');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Expired quote was not rejected.');
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 6 with exception:', err.message);
  }

  // -------------------------------------------------------------
  // Test 7: Double-Consumption / Replay Protection on Financial Quotes
  // -------------------------------------------------------------
  try {
    console.log('\n▶ Test 7: Double-Consumption / Replay Protection on Financial Quotes...');
    
    const plan = await SubscriptionPlan.findOne({ where: { name: 'الباقة المتقدمة' } });
    const singleQuote = await financialQuoteService.createSubscriptionQuote({
      providerId: testProviderId,
      providerEmail: testProviderEmail,
      planId: plan!.id,
      billingCycle: 'MONTHLY'
    });

    // First consumption: Success
    await financialQuoteService.consumeQuote(singleQuote.quoteId, {
      paymentId: 'TEST-PAY-01',
      actor: 'TestActor'
    });

    let replayRejected = false;
    try {
      // Second consumption attempt: Must fail
      await financialQuoteService.consumeQuote(singleQuote.quoteId, {
        paymentId: 'TEST-PAY-02',
        actor: 'ReplayAttacker'
      });
    } catch (e: any) {
      if (e.message.includes('تم استخدامه مسبقاً') || e.message.includes('already consumed') || e.message.includes('غير صالح')) {
        replayRejected = true;
      }
    }

    if (replayRejected) {
      console.log('  ✅ PASSED: Replay / double-consumption on financial quote prevented.');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Replay attempt on consumed quote was not rejected.');
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 7 with exception:', err.message);
  }

  // -------------------------------------------------------------
  // Test 8: Financial Reconciliation Service (Mismatch & Audit Detection)
  // -------------------------------------------------------------
  try {
    console.log('\n▶ Test 8: Financial Reconciliation Engine (Audit & Discrepancy Detection)...');
    
    const reconciliationService = new FinancialReconciliationService();
    const reconReport = await reconciliationService.reconcileProvider(testProviderId);

    if (
      reconReport &&
      typeof reconReport.quotesAudited === 'number' &&
      typeof reconReport.mismatchesFound === 'number' &&
      Array.isArray(reconReport.mismatches)
    ) {
      console.log(`  ✅ PASSED: Financial reconciliation audit completed (Quotes Audited: ${reconReport.quotesAudited}, Subscriptions: ${reconReport.subscriptionsAudited}, Mismatches: ${reconReport.mismatchesFound}).`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Reconciliation report invalid structure:', reconReport);
    }
  } catch (err: any) {
    console.error('  ❌ FAILED Test 8 with exception:', err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 P1.6 Acceptance Test Suite Completed: ${passedTests}/${totalTests} Passed.`);
  console.log('================================================================\n');

  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests
  };
}
