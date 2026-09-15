import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { enforceLimit, requireEntitlement } from '../../middleware/entitlement.middleware.js';

const router = Router();
const controller = new BookingController();

// 1. Get Services for a specific Hall
router.get('/halls/:id/services', controller.getServicesForHall);

// 2. Get Halls & Services Config
router.get('/config', controller.getConfig);

// 3. Check Availability
router.get('/availability', controller.getAvailability);

// 4. Create Booking
router.post('/create', controller.createBooking);

// Dedicated my-bookings endpoint
router.get('/my-bookings', controller.getMyBookings);

// 5. Get All Bookings (Admin Dashboard)
router.get('/', controller.getAllBookings);

// 6. Add/Update Service for Hall (Admin)
router.post('/halls/:id/services', controller.addServiceForHall);

// === REST Endpoints for Halls (Marafek/Halls) ===
router.get('/halls', controller.getHalls);
router.post('/halls', enforceLimit('max_halls'), controller.createHall);
router.put('/halls/:id', controller.updateHall);
router.delete('/halls/:id', controller.deleteHall);

// === REST Endpoints for HallExtraServices ===
router.get('/halls/:hallId/extra-services', controller.getHallExtraServices);
router.post('/halls/:hallId/extra-services', controller.createHallExtraService);
router.put('/halls/extra-services/:id', controller.updateHallExtraService);
router.delete('/halls/extra-services/:id', controller.deleteHallExtraService);

// === REST Endpoints for Service ===
router.get('/services', controller.getServices);
router.post('/services', enforceLimit('max_services'), controller.createService);
router.put('/services/:id', controller.updateService);
router.delete('/services/:id', controller.deleteService);

// === Cancel Booking ===
router.post('/:id/cancel', controller.cancelBooking);

// === P2 Lifecycle Endpoints for Booking Decision, Payment & Timeline ===
router.post('/:id/accept', controller.acceptBooking);
router.post('/:id/reject', controller.rejectBooking);
router.post('/:id/pay', controller.payBooking);
router.get('/:id/timeline', controller.getBookingTimeline);

// === P2.2 Booking Hold, Locks & Blocked Dates Routes ===
router.post('/holds/acquire', controller.acquireHold);
router.get('/holds/verify', controller.verifyHold);
router.post('/holds/release', controller.releaseHold);

router.get('/blocked-dates', controller.getBlockedDates);
router.post('/blocked-dates', controller.createBlockedDate);
router.delete('/blocked-dates/:id', controller.deleteBlockedDate);

// === P1.9 Booking & Payment Policy Endpoints ===
router.get('/policies/allowed', controller.getProviderAllowedPolicies);
router.get('/policy-settings', controller.getProviderPolicySettings);
router.put('/policy-settings', controller.updateProviderPolicySettings);

// === P2.3-P2.4 Sovereign Regulatory Periods & Deadlines Endpoints ===
router.get('/regulatory-periods', controller.getRegulatoryPeriodsConfig);
router.put('/regulatory-periods', controller.updateRegulatoryPeriodsConfig);
router.get('/regulatory-periods/audit-history', controller.getRegulatoryAuditHistory);

// Deprecated per-item routes safely forward to unified policy settings
router.put('/halls/:id/policy', (req, res, next) => {
  console.warn('⚠️ [DEPRECATED] PUT /halls/:id/policy is deprecated in P1.9/P2.2. Forwarding to unified provider policy settings.');
  controller.updateProviderPolicySettings(req, res);
});
router.put('/services/:id/policy', (req, res, next) => {
  console.warn('⚠️ [DEPRECATED] PUT /services/:id/policy is deprecated in P1.9/P2.2. Forwarding to unified provider policy settings.');
  controller.updateProviderPolicySettings(req, res);
});

// === Update/Delete Booking ===
router.put('/:id', controller.updateBooking);
router.delete('/:id', controller.deleteBooking);

// === REST Endpoints for SupportServiceRequest ===
router.get('/support-requests', controller.getSupportRequests);
router.post('/support-requests', controller.createSupportRequest);
router.post('/support-requests/:id/accept', controller.acceptSupportRequest);
router.post('/support-requests/:id/reject', controller.rejectSupportRequest);
router.post('/support-requests/:id/cancel', controller.cancelSupportRequest);
router.post('/support-requests/:id/pay', controller.paySupportRequest);
router.get('/support-requests/:id/timeline', controller.getSupportRequestTimeline);
router.put('/support-requests/:id', controller.updateSupportRequest);
router.delete('/support-requests/:id', controller.deleteSupportRequest);

// === Deadline & Expiry Checker (P2.5) ===
router.post('/deadlines/check', controller.checkDeadlines);
router.get('/deadlines/check', controller.checkDeadlines);

// === REST Endpoints for InventoryItem ===
router.get('/inventory', requireEntitlement('inventory_management'), controller.getInventory);
router.post('/inventory', requireEntitlement('inventory_management'), controller.createInventoryItem);
router.put('/inventory/:id', requireEntitlement('inventory_management'), controller.updateInventoryItem);
router.delete('/inventory/:id', requireEntitlement('inventory_management'), controller.deleteInventoryItem);

// === Inventory Logs & Damage Audit ===
router.get('/inventory/logs', requireEntitlement('inventory_management'), controller.getInventoryLogs);
router.post('/inventory/logs', requireEntitlement('inventory_management'), controller.createInventoryLog);

// === Sync Inventory ===
router.post('/sync-inventory', requireEntitlement('inventory_management'), controller.syncInventory);

// === REST Endpoints for Supplier ===
router.get('/suppliers', requireEntitlement('suppliers_management'), controller.getSuppliers);
router.post('/suppliers', requireEntitlement('suppliers_management'), controller.createSupplier);
router.put('/suppliers/:id', requireEntitlement('suppliers_management'), controller.updateSupplier);
router.delete('/suppliers/:id', requireEntitlement('suppliers_management'), controller.deleteSupplier);

// === Supplier Invoices & 3-Way Matching ===
router.get('/supplier-invoices', requireEntitlement('suppliers_management'), controller.getSupplierInvoices);
router.post('/supplier-invoices', requireEntitlement('suppliers_management'), controller.createSupplierInvoice);

// === Force Majeure Requests ===
router.get('/force-majeure', controller.getForceMajeure);
router.post('/force-majeure', controller.createForceMajeure);
router.post('/force-majeure/:id/resolve', controller.resolveForceMajeure);

// === Migration & Sync Route ===
router.post('/migration/sync', controller.syncMigration);

// === Sanitization & Cleanup ===
router.post('/system/clean-activation-status', controller.cleanActivationStatus);

// === Background SLA & Deadline Worker (P2.5) ===
export function startBookingDeadlineWorker(io?: any) {
  const intervalMs = 60 * 1000; // Run every 60 seconds
  console.log('⏰ [Scheduler] Booking & Order Lifecycle Deadline Worker started (Interval: 60s)');
  
  setInterval(async () => {
    try {
      // Mock request and response to invoke checkDeadlines
      const mockReq: any = { app: { get: () => io } };
      let resultData: any = null;
      const mockRes: any = {
        json: (data: any) => { resultData = data; return mockRes; },
        status: () => mockRes
      };
      await controller.checkDeadlines(mockReq, mockRes);
      if (resultData && (resultData.expiredBookings > 0 || resultData.expiredSupportRequests > 0)) {
        console.log(`⏱️ [Scheduler] Cleaned up expired requests: ${resultData.expiredBookings} bookings, ${resultData.expiredSupportRequests} support requests.`);
      }
    } catch (err: any) {
      console.warn('⚠️ [Scheduler] Error in booking deadline worker cycle:', err?.message || err);
    }
  }, intervalMs);
}

export default router;
export const bookingRouter = router; // maintain dual export for flex compatibility
