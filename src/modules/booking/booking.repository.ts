import { Hall, Service, Booking, BookingService, SupportServiceRequest, InventoryItem, Supplier, InventoryLog, SupplierInvoice, ForceMajeureRequest, HallExtraServices } from '../../models/BookingModels.js';
import { Wallet, WalletTransaction, CustomerWallet, CustomerHeldBalance, Expense } from '../../models/Database.js';
import { User, PlatformConfig } from '../../models/UserModels.js';

export class BookingRepository {
  async findHalls(options: any = {}): Promise<Hall[]> {
    return Hall.findAll(options);
  }

  async findHallByPk(id: any, options: any = {}): Promise<Hall | null> {
    return Hall.findByPk(id, options);
  }

  async createHall(data: any): Promise<Hall> {
    return Hall.create(data);
  }

  async findServices(options: any = {}): Promise<Service[]> {
    return Service.findAll(options);
  }

  async findServiceByPk(id: any, options: any = {}): Promise<Service | null> {
    return Service.findByPk(id, options);
  }

  async createService(data: any): Promise<Service> {
    return Service.create(data);
  }

  async findBookings(options: any = {}): Promise<Booking[]> {
    return Booking.findAll(options);
  }

  async findBookingByPk(id: any, options: any = {}): Promise<Booking | null> {
    return Booking.findByPk(id, options);
  }

  async createBooking(data: any): Promise<Booking> {
    return Booking.create(data);
  }

  async createBookingService(data: any): Promise<BookingService> {
    return BookingService.create(data);
  }

  async findSupportRequests(options: any = {}): Promise<SupportServiceRequest[]> {
    return SupportServiceRequest.findAll(options);
  }

  async findSupportRequestByPk(id: any, options: any = {}): Promise<SupportServiceRequest | null> {
    return SupportServiceRequest.findByPk(id, options);
  }

  async createSupportRequest(data: any): Promise<SupportServiceRequest> {
    return SupportServiceRequest.create(data);
  }

  async findInventoryItems(options: any = {}): Promise<InventoryItem[]> {
    return InventoryItem.findAll(options);
  }

  async findInventoryItemByPk(id: any, options: any = {}): Promise<InventoryItem | null> {
    return InventoryItem.findByPk(id, options);
  }

  async createInventoryItem(data: any): Promise<InventoryItem> {
    return InventoryItem.create(data);
  }

  async findInventoryLogs(options: any = {}): Promise<InventoryLog[]> {
    return InventoryLog.findAll(options);
  }

  async createInventoryLog(data: any): Promise<InventoryLog> {
    return InventoryLog.create(data);
  }

  async findSuppliers(options: any = {}): Promise<Supplier[]> {
    return Supplier.findAll(options);
  }

  async findSupplierByPk(id: any, options: any = {}): Promise<Supplier | null> {
    return Supplier.findByPk(id, options);
  }

  async createSupplier(data: any): Promise<Supplier> {
    return Supplier.create(data);
  }

  async findSupplierInvoices(options: any = {}): Promise<SupplierInvoice[]> {
    return SupplierInvoice.findAll(options);
  }

  async findSupplierInvoiceByPk(id: any, options: any = {}): Promise<SupplierInvoice | null> {
    return SupplierInvoice.findByPk(id, options);
  }

  async createSupplierInvoice(data: any): Promise<SupplierInvoice> {
    return SupplierInvoice.create(data);
  }

  async findForceMajeureRequests(options: any = {}): Promise<ForceMajeureRequest[]> {
    return ForceMajeureRequest.findAll(options);
  }

  async findForceMajeureRequestByPk(id: any, options: any = {}): Promise<ForceMajeureRequest | null> {
    return ForceMajeureRequest.findByPk(id, options);
  }

  async createForceMajeureRequest(data: any): Promise<ForceMajeureRequest> {
    return ForceMajeureRequest.create(data);
  }

  async findHallExtraServices(options: any = {}): Promise<HallExtraServices[]> {
    return HallExtraServices.findAll(options);
  }

  async findHallExtraServiceByPk(id: any, options: any = {}): Promise<HallExtraServices | null> {
    return HallExtraServices.findByPk(id, options);
  }

  async createHallExtraService(data: any): Promise<HallExtraServices> {
    return HallExtraServices.create(data);
  }

  async destroyHallExtraServices(options: any = {}): Promise<number> {
    return HallExtraServices.destroy(options);
  }
}
