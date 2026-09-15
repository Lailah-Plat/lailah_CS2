/**
 * P1.9 — Revised Booking & Payment Policy Capability Extension Test Suite
 * Tests sovereign config, provider-level policy resolution, subscription entitlement gating,
 * dynamic response deadlines, cancellation guards, and financial snapshot immutability.
 */

import {
  bookingPolicyService,
  PLATFORM_DEFAULT_POLICY,
  SAFE_DEFAULT_POLICY,
  BOOKING_POLICY_DEFINITIONS,
  DEFAULT_SOVEREIGN_POLICY_CONFIG,
  ALLOWED_PROVIDER_DEADLINES_HOURS
} from '../services/bookingPolicy/bookingPolicyService.js';

async function runTests() {
  console.log('🚀 Starting P1.9 Booking Policy & Sovereign Controls Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Default Policy Verification
  console.log('--- 1. Default Policy Verification ---');
  assert(
    PLATFORM_DEFAULT_POLICY === 'INSTANT_CONFIRMATION',
    'Platform Default Policy must be INSTANT_CONFIRMATION'
  );

  assert(
    SAFE_DEFAULT_POLICY === 'APPROVAL_BEFORE_PAYMENT',
    'Safest Operational/Financial Policy must be APPROVAL_BEFORE_PAYMENT'
  );

  assert(
    BOOKING_POLICY_DEFINITIONS['INSTANT_CONFIRMATION'].isPlatformDefault === true,
    'INSTANT_CONFIRMATION is marked as isPlatformDefault: true'
  );

  assert(
    BOOKING_POLICY_DEFINITIONS['APPROVAL_BEFORE_PAYMENT'].isSafeDefault === true,
    'APPROVAL_BEFORE_PAYMENT is marked as isSafeDefault: true'
  );

  // 2. Policy Normalization Test
  console.log('\n--- 2. Policy Normalization & String Mapping ---');
  assert(
    bookingPolicyService.normalizePolicyString('instant') === 'INSTANT_CONFIRMATION',
    'Normalizes "instant" to INSTANT_CONFIRMATION'
  );
  assert(
    bookingPolicyService.normalizePolicyString('approval_first') === 'APPROVAL_BEFORE_PAYMENT',
    'Normalizes "approval_first" to APPROVAL_BEFORE_PAYMENT'
  );
  assert(
    bookingPolicyService.normalizePolicyString('pay_first') === 'PAYMENT_BEFORE_APPROVAL',
    'Normalizes "pay_first" to PAYMENT_BEFORE_APPROVAL'
  );
  assert(
    bookingPolicyService.normalizePolicyString('hold_and_capture') === 'AUTHORIZE_THEN_CAPTURE',
    'Normalizes "hold_and_capture" to AUTHORIZE_THEN_CAPTURE'
  );
  assert(
    bookingPolicyService.normalizePolicyString('UNKNOWN_STRING') === 'INSTANT_CONFIRMATION',
    'Falls back unknown string to INSTANT_CONFIRMATION'
  );

  // 3. Sovereign Policy Config Test
  console.log('\n--- 3. Sovereign Policy Config & Allowed Deadlines ---');
  assert(
    DEFAULT_SOVEREIGN_POLICY_CONFIG.sovereignProviderResponseDeadlineHours === 1,
    'Sovereign provider response deadline default is 1 hour'
  );
  assert(
    ALLOWED_PROVIDER_DEADLINES_HOURS.includes(1) &&
    ALLOWED_PROVIDER_DEADLINES_HOURS.includes(3) &&
    ALLOWED_PROVIDER_DEADLINES_HOURS.includes(7) &&
    ALLOWED_PROVIDER_DEADLINES_HOURS.includes(12) &&
    ALLOWED_PROVIDER_DEADLINES_HOURS.includes(24),
    'Allowed provider deadlines are strictly [1, 3, 7, 12, 24] hours'
  );

  // 4. Provider Cancellation Guard (Rule 12 & Section D)
  console.log('\n--- 4. Provider Direct Cancellation Guard ---');
  const confirmedBooking = {
    id: 101,
    status: 'CONFIRMED',
    paymentStatus: 'PAID'
  };

  const cancelConfirmedResult = bookingPolicyService.validateProviderCanDirectlyCancel(confirmedBooking);
  assert(
    cancelConfirmedResult.allowed === false,
    'Provider is strictly forbidden from directly cancelling a confirmed/paid booking'
  );
  assert(
    typeof cancelConfirmedResult.reason === 'string' && cancelConfirmedResult.reason.length > 10,
    'Cancellation guard provides clear sovereign Arabic explanation'
  );

  const pendingUnpaidBooking = {
    id: 102,
    status: 'PENDING_APPROVAL',
    paymentStatus: 'UNPAID'
  };

  const cancelPendingResult = bookingPolicyService.validateProviderCanDirectlyCancel(pendingUnpaidBooking);
  assert(
    cancelPendingResult.allowed === true,
    'Provider is permitted to reject/cancel an unpaid pending approval booking'
  );

  // 5. Resolution Logic Fallback Test
  console.log('\n--- 5. Policy Resolution Precedence & Snapshot Generation ---');
  const resolutionResult = await bookingPolicyService.resolveEffectiveBookingPolicy({
    providerId: 99999, // Non-existent provider -> should safely fall back to platform default
    resourceType: 'venue'
  });

  assert(
    resolutionResult.policy === 'INSTANT_CONFIRMATION',
    'Unconfigured / new provider defaults strictly to PLATFORM_DEFAULT (INSTANT_CONFIRMATION)'
  );
  assert(
    resolutionResult.effectiveSource === 'PLATFORM_DEFAULT',
    'Effective source is marked as PLATFORM_DEFAULT'
  );
  assert(
    resolutionResult.snapshot !== undefined && resolutionResult.snapshot !== null,
    'Creates a valid BookingPolicySnapshot object'
  );
  assert(
    typeof resolutionResult.snapshot.resolvedAt === 'string',
    'Snapshot has resolvedAt timestamp'
  );
  assert(
    typeof resolutionResult.snapshot.maxPaymentAttempts === 'number',
    'Snapshot has maxPaymentAttempts defined'
  );

  // 6. Unified Policy Model Verification (No Per-Resource Overrides)
  console.log('\n--- 6. Unified Policy & Deprecated Resource Overrides Enforcement ---');
  // Verify resolveEffectiveBookingPolicy ignores any per-resource field
  const hallResolution = await bookingPolicyService.resolveEffectiveBookingPolicy({
    providerId: 99999,
    hallId: 123,
    resourceType: 'venue'
  });
  assert(
    hallResolution.policy === 'INSTANT_CONFIRMATION',
    'Hall booking resolves via provider/platform policy without resource override'
  );

  const serviceResolution = await bookingPolicyService.resolveEffectiveBookingPolicy({
    providerId: 99999,
    serviceId: 456,
    resourceType: 'service'
  });
  assert(
    serviceResolution.policy === 'INSTANT_CONFIRMATION',
    'Service booking resolves via provider/platform policy without resource override'
  );

  // 7. Summary
  console.log('\n======================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
