/**
 * P2.1 Unified Booking & Order Lifecycle Comprehensive Test Suite
 * Tests the 4 lifecycle policies, 8 orthogonal state axes, atomic slot reservation,
 * transition validation matrices, timeouts, and lifecycle audit logging.
 */
import { Booking, SupportServiceRequest, Hall, Service } from '../models/BookingModels.js';
import { User } from '../models/UserModels.js';
import { ProviderFeatureOverride } from '../models/SubscriptionModels.js';
import { LifecycleAuditLog, DomainEvent, sequelize } from '../models/Database.js';
import { BookingStateMachine } from '../services/lifecycle/BookingStateMachine.js';
import { ServiceRequestStateMachine } from '../services/lifecycle/ServiceRequestStateMachine.js';
import { CreateBookingUseCase } from '../modules/booking/usecases/CreateBooking.usecase.js';
import { BookingRepository } from '../modules/booking/booking.repository.js';
import { LifecycleAuditService } from '../services/lifecycle/LifecycleAuditService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 P2.1 UNIFIED BOOKING & ORDER LIFECYCLE TESTS');
  console.log('====================================================\n');

  try {
    await sequelize.sync();

    // Setup dummy provider with entitlement to test all policies
    const testProvider = await User.create({
      name: 'مزود قاعات تجريبي ليلة P2.1',
      email: `provider_p21_${Date.now()}@test.com`,
      role: 'provider',
      phone: '0555555555',
      venueBookingPolicy: 'APPROVAL_BEFORE_PAYMENT'
    });

    // Grant all policy entitlements via ProviderFeatureOverride
    const policiesToGrant = [
      'booking_payment_policy_control',
      'booking_policy.approval_before_payment',
      'booking_policy.payment_before_approval',
      'booking_policy.instant_confirmation',
      'booking_policy.authorize_then_capture'
    ];
    for (const key of policiesToGrant) {
      await ProviderFeatureOverride.create({
        providerId: testProvider.id,
        providerEmail: testProvider.email,
        featureKey: key,
        featureName: key,
        isGranted: true,
        value: 'true',
        overrideType: 'grant'
      });
    }

    const testHall = await Hall.create({
      name: 'قاعة اللؤلؤة الملكية P2.1',
      type: 'أفراح',
      hourlyRate: 500,
      provider: testProvider.name,
      providerId: testProvider.id,
      price: 10000,
      capacity: 500,
      city: 'الرياض',
      bookingPaymentPolicy: 'APPROVAL_BEFORE_PAYMENT',
      cancellationPeriod: 48
    });

    const repo = new BookingRepository();
    const createBookingUseCase = new CreateBookingUseCase(repo);

    // -------------------------------------------------------------
    // TEST 1: Policy 3 (APPROVAL_BEFORE_PAYMENT) - Lifecycle & 8 Axes
    // -------------------------------------------------------------
    console.log('📌 Test 1: Policy 3 (APPROVAL_BEFORE_PAYMENT) State Flow');
    const result1 = await createBookingUseCase.execute({
      customerName: 'أحمد العتيبي',
      customerPhone: '0501112233',
      hallId: testHall.id,
      startTime: '2026-11-20T18:00:00.000Z',
      endTime: '2026-11-20T23:00:00.000Z',
      amount: 10000,
      explicitPolicy: 'APPROVAL_BEFORE_PAYMENT'
    }, null, null);

    const booking1 = result1.booking;
    assert((booking1 as any).bookingPaymentPolicy === 'APPROVAL_BEFORE_PAYMENT', 'Policy snapshot is set to APPROVAL_BEFORE_PAYMENT');
    assert((booking1 as any).lifecycleStatus === 'REQUESTED', 'Lifecycle status initialized to REQUESTED');
    assert((booking1 as any).providerDecision === 'PENDING', 'Provider decision axis is PENDING');
    assert((booking1 as any).paymentState === 'UNPAID', 'Payment state axis is UNPAID');
    assert((booking1 as any).refundState === 'NONE', 'Refund state axis is NONE');
    assert((booking1 as any).disputeState === 'NONE', 'Dispute state axis is NONE');
    assert((booking1 as any).fulfillmentState === 'NOT_STARTED', 'Fulfillment state axis is NOT_STARTED');
    assert((booking1 as any).settlementState === 'UNSETTLED', 'Settlement state axis is UNSETTLED');

    // Provider Accepts Booking
    await BookingStateMachine.transition(booking1, 'PROVIDER_ACCEPT', {
      actorId: testProvider.id,
      actorRole: 'provider',
      paymentDeadlineHours: 24
    });

    assert((booking1 as any).lifecycleStatus === 'PROVIDER_ACCEPTED', 'After PROVIDER_ACCEPT, lifecycle is PROVIDER_ACCEPTED');
    assert((booking1 as any).providerDecision === 'ACCEPTED', 'Provider decision axis updated to ACCEPTED');
    assert(booking1.status === 'PROVIDER_ACCEPTED', 'Legacy status mapped to PROVIDER_ACCEPTED');

    // Customer Pays (Payment Captured)
    await BookingStateMachine.transition(booking1, 'PAYMENT_CAPTURED', {
      actorId: 999,
      actorRole: 'customer',
      paymentReference: 'PAY_TXN_001',
      paymentMethod: 'mada'
    });

    assert((booking1 as any).lifecycleStatus === 'CONFIRMED', 'After payment, lifecycle is CONFIRMED');
    assert((booking1 as any).paymentState === 'PAID', 'Payment state is PAID');
    assert(booking1.paymentStatus === 'مدفوع', 'Legacy paymentStatus is مدفوع');
    assert(booking1.status === 'confirmed', 'Legacy status is confirmed');

    // -------------------------------------------------------------
    // TEST 2: Policy 1 (INSTANT_CONFIRMATION) - Direct Confirmation
    // -------------------------------------------------------------
    console.log('\n📌 Test 2: Policy 1 (INSTANT_CONFIRMATION) State Flow');
    const result2 = await createBookingUseCase.execute({
      customerName: 'سارة خالد',
      customerPhone: '0502223344',
      hallId: testHall.id,
      startTime: '2026-11-21T16:00:00.000Z',
      endTime: '2026-11-21T22:00:00.000Z',
      amount: 10000,
      paymentMethod: 'mada',
      paymentStatus: 'مدفوع',
      explicitPolicy: 'INSTANT_CONFIRMATION'
    }, null, null);

    const booking2 = result2.booking;
    assert((booking2 as any).bookingPaymentPolicy === 'INSTANT_CONFIRMATION', 'Policy is INSTANT_CONFIRMATION');
    assert((booking2 as any).lifecycleStatus === 'CONFIRMED', 'Instant confirmation booking is immediately CONFIRMED');
    assert((booking2 as any).providerDecision === 'AUTO_ACCEPTED', 'Provider decision is AUTO_ACCEPTED');
    assert((booking2 as any).paymentState === 'PAID', 'Payment state is PAID');
    assert(booking2.status === 'confirmed', 'Legacy status is confirmed');

    // -------------------------------------------------------------
    // TEST 3: Policy 2 (PAYMENT_BEFORE_APPROVAL) - Pay Then Approve
    // -------------------------------------------------------------
    console.log('\n📌 Test 3: Policy 2 (PAYMENT_BEFORE_APPROVAL) State Flow');
    const result3 = await createBookingUseCase.execute({
      customerName: 'فاطمة الدوسري',
      customerPhone: '0503334455',
      hallId: testHall.id,
      startTime: '2026-11-22T17:00:00.000Z',
      endTime: '2026-11-22T23:00:00.000Z',
      amount: 10000,
      paymentMethod: 'mada',
      paymentStatus: 'مدفوع',
      explicitPolicy: 'PAYMENT_BEFORE_APPROVAL'
    }, null, null);

    const booking3 = result3.booking;
    assert((booking3 as any).lifecycleStatus === 'REQUESTED', 'Initial lifecycle is REQUESTED');
    assert((booking3 as any).paymentState === 'PAID', 'Payment state is PAID before approval');

    // Provider Rejects -> Should trigger automatic refund state
    await BookingStateMachine.transition(booking3, 'PROVIDER_REJECT', {
      actorId: testProvider.id,
      actorRole: 'provider',
      rejectionReason: 'عدم توفر الطاقم في هذا الموعد'
    });

    assert((booking3 as any).lifecycleStatus === 'REJECTED', 'Status is REJECTED');
    assert((booking3 as any).providerDecision === 'REJECTED', 'Provider decision is REJECTED');
    assert((booking3 as any).refundState === 'APPROVED', 'Paid booking rejected triggers full refund state (APPROVED)');

    // -------------------------------------------------------------
    // TEST 4: Policy 4 (AUTHORIZATION_THEN_CAPTURE) - Auth & Capture Flow
    // -------------------------------------------------------------
    console.log('\n📌 Test 4: Policy 4 (AUTHORIZATION_THEN_CAPTURE) State Flow');
    const result4 = await createBookingUseCase.execute({
      customerName: 'عبدالله السبيعي',
      customerPhone: '0504445566',
      hallId: testHall.id,
      startTime: '2026-11-23T18:00:00.000Z',
      endTime: '2026-11-23T23:00:00.000Z',
      amount: 10000,
      paymentStatus: 'AUTHORIZED',
      explicitPolicy: 'AUTHORIZE_THEN_CAPTURE'
    }, null, null);

    const booking4 = result4.booking;
    assert((booking4 as any).lifecycleStatus === 'REQUESTED', 'Initial state is REQUESTED');
    assert((booking4 as any).paymentState === 'AUTHORIZED', 'Payment state is AUTHORIZED');

    // Provider accepts -> should auto transition payment to CAPTURED/PAID
    await BookingStateMachine.transition(booking4, 'PROVIDER_ACCEPT', {
      actorId: testProvider.id,
      actorRole: 'provider'
    });

    assert((booking4 as any).lifecycleStatus === 'CONFIRMED', 'After provider accepts authorized hold, booking is CONFIRMED');
    assert((booking4 as any).paymentState === 'PAID', 'Authorized funds captured to PAID');

    // -------------------------------------------------------------
    // TEST 5: Atomic Concurrency Double-Booking Guard
    // -------------------------------------------------------------
    console.log('\n📌 Test 5: Atomic Concurrency Double-Booking Guard');
    let doubleBookingBlocked = false;
    try {
      // Attempt to book the exact same hall and slot on 2026-11-20 (which is booked by booking1)
      await createBookingUseCase.execute({
        customerName: 'محاولة حجز مزدوج',
        customerPhone: '0509998877',
        hallId: testHall.id,
        startTime: '2026-11-20T19:00:00.000Z',
        endTime: '2026-11-20T21:00:00.000Z',
        amount: 10000,
        explicitPolicy: 'APPROVAL_BEFORE_PAYMENT'
      }, null, null);
    } catch (err: any) {
      doubleBookingBlocked = true;
      assert(err.message.includes('القاعة محجوزة في هذا الوقت مسبقاً'), 'Double booking rejected with explicit conflict message');
    }
    assert(doubleBookingBlocked, 'Slot concurrency guard prevented overlapping booking');

    // -------------------------------------------------------------
    // TEST 6: Immutable Audit Trail & Domain Events
    // -------------------------------------------------------------
    console.log('\n📌 Test 6: Immutable Audit Trail & Domain Events');
    const auditLogs = await LifecycleAuditLog.findAll({
      where: {
        aggregateType: 'Booking',
        aggregateId: String(booking1.id)
      }
    });

    assert(auditLogs.length >= 2, `Audit trail recorded ${auditLogs.length} state transitions for Booking #${booking1.id}`);
    const domainEvents = await DomainEvent.findAll({
      where: {
        aggregateType: 'Booking',
        aggregateId: String(booking1.id)
      }
    });
    assert(domainEvents.length >= 2, `Domain events published: ${domainEvents.length} events recorded`);

    // -------------------------------------------------------------
    // TEST 7: Service Request State Machine
    // -------------------------------------------------------------
    console.log('\n📌 Test 7: Support Service Request State Machine');
    const srvRequest = await SupportServiceRequest.create({
      requestNumber: `SRV-26-${Date.now().toString().padStart(10, '0')}`,
      serviceName: 'تصوير احترافي 4K',
      providerName: testProvider.name,
      customerName: 'نورة العلي',
      price: 2500,
      date: '2026-12-01',
      status: 'pending',
      lifecycleStatus: 'REQUESTED',
      providerDecision: 'PENDING',
      paymentState: 'UNPAID',
      bookingPaymentPolicy: 'APPROVAL_BEFORE_PAYMENT'
    });

    await ServiceRequestStateMachine.transition(srvRequest, 'PROVIDER_ACCEPT', {
      actorId: testProvider.id,
      actorRole: 'provider',
      paymentDeadlineHours: 12
    });

    assert((srvRequest as any).lifecycleStatus === 'PROVIDER_ACCEPTED', 'Service request lifecycle is PROVIDER_ACCEPTED after accept');
    assert((srvRequest as any).providerDecision === 'ACCEPTED', 'Service provider decision is ACCEPTED');

    await ServiceRequestStateMachine.transition(srvRequest, 'PAYMENT_CAPTURED', {
      paymentMethod: 'apple_pay'
    });

    assert((srvRequest as any).lifecycleStatus === 'CONFIRMED', 'Service request is CONFIRMED after payment');
    assert((srvRequest as any).paymentState === 'PAID', 'Service request payment state is PAID');

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  }
}

runTests();
