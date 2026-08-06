import { Router } from 'express';
import { BookingController } from './booking.controller.js';

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
router.post('/halls', controller.createHall);
router.put('/halls/:id', controller.updateHall);
router.delete('/halls/:id', controller.deleteHall);

// === REST Endpoints for HallExtraServices ===
router.get('/halls/:hallId/extra-services', controller.getHallExtraServices);
router.post('/halls/:hallId/extra-services', controller.createHallExtraService);
router.put('/halls/extra-services/:id', controller.updateHallExtraService);
router.delete('/halls/extra-services/:id', controller.deleteHallExtraService);

// === REST Endpoints for Service ===
router.get('/services', controller.getServices);
router.post('/services', controller.createService);
router.put('/services/:id', controller.updateService);
router.delete('/services/:id', controller.deleteService);

// === Cancel Booking ===
router.post('/:id/cancel', controller.cancelBooking);

// === Update/Delete Booking ===
router.put('/:id', controller.updateBooking);
router.delete('/:id', controller.deleteBooking);

// === REST Endpoints for SupportServiceRequest ===
router.get('/support-requests', controller.getSupportRequests);
router.post('/support-requests', controller.createSupportRequest);
router.put('/support-requests/:id', controller.updateSupportRequest);
router.delete('/support-requests/:id', controller.deleteSupportRequest);

// === REST Endpoints for InventoryItem ===
router.get('/inventory', controller.getInventory);
router.post('/inventory', controller.createInventoryItem);
router.put('/inventory/:id', controller.updateInventoryItem);
router.delete('/inventory/:id', controller.deleteInventoryItem);

// === Inventory Logs & Damage Audit ===
router.get('/inventory/logs', controller.getInventoryLogs);
router.post('/inventory/logs', controller.createInventoryLog);

// === Sync Inventory ===
router.post('/sync-inventory', controller.syncInventory);

// === REST Endpoints for Supplier ===
router.get('/suppliers', controller.getSuppliers);
router.post('/suppliers', controller.createSupplier);
router.put('/suppliers/:id', controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);

// === Supplier Invoices & 3-Way Matching ===
router.get('/supplier-invoices', controller.getSupplierInvoices);
router.post('/supplier-invoices', controller.createSupplierInvoice);

// === Force Majeure Requests ===
router.get('/force-majeure', controller.getForceMajeure);
router.post('/force-majeure', controller.createForceMajeure);
router.post('/force-majeure/:id/resolve', controller.resolveForceMajeure);

// === Migration & Sync Route ===
router.post('/migration/sync', controller.syncMigration);

// === Sanitization & Cleanup ===
router.post('/system/clean-activation-status', controller.cleanActivationStatus);

export default router;
export const bookingRouter = router; // maintain dual export for flex compatibility
