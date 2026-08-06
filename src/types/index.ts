export interface Review {
  id: number | string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ExtraService {
  name: string;
  price: number;
  icon?: any;
}

export interface Provider {
  id: number | string;
  providerId?: number | string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  region: string;
  city: string;
  logo?: string;
  rating?: number;
  status?: string;
  partnerLevel?: string;
  subscriptionTier?: 'basic' | 'advanced' | 'professional' | string;
  commissionRate?: number;
  crNumber?: string;
  taxNumber?: string;
  iban?: string;
}

export interface Hall {
  id: number | string;
  name: string;
  nightPrice: number;
  features?: string[];
  capacity: number;
  city: string;
  region: string;
  provider: string;
  providerId?: number | string;
  category?: string;
  crNumber?: string;
  address?: string;
  nationalAddress?: string;
  morningPrice?: number;
  fullDayPrice?: number;
  bookingStatus?: string;
  adminApprovalStatus?: 'pending' | 'approved' | 'rejected' | string;
  rating?: number;
  reviewsCount?: number;
  paymentMethods?: string[];
  cancellationPeriod?: number;
  lastPriceUpdate?: string;
  contractTerms?: string;
  facilities?: string;
  status?: string;
  activationStatus?: string;
  bookingType?: 'packages' | 'alacarte' | 'venueonly';
  packagesList?: any[];
  images?: string[];
  videoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  approved?: boolean;
  hasPendingEdits?: boolean;
  pendingChanges?: any;
  pendingPayload?: any;
}

export interface Booking {
  id: number | string;
  bookingNumber?: string; // BKG-YY-XXXXXXXXXX format
  hall: string;
  hallId?: number | string;
  providerId?: number | string;
  providerName?: string;
  customerId?: number | string;
  date: string;
  timeSlot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  amount: number;
  subTotal?: number;
  taxAmount?: number;
  depositAmount?: number;
  commissionRate?: number; // Platform commission percentage based on tier
  commissionAmount?: number; // Calculated commission revenue for Layla platform
  netProviderAmount?: number; // Amount disbursed to partner after commission
  paymentStatus: string;
  status: string;
  notes?: string;
  addons?: any[];
  bookingType?: string;
  packageName?: string;
  selectedAddons?: any[];
  externalServices?: any[];
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: number | string;
  invoiceNumber: string; // INV-YYXXXXXXXXXX format (no hyphen after YY)
  bookingId?: number | string;
  bookingNumber?: string;
  serviceRequestId?: number | string;
  serviceOrderNumber?: string;
  providerId: number | string;
  providerName: string;
  customerId: number | string;
  customerName: string;
  customerTaxNumber?: string;
  subtotal: number;
  taxRate: number; // e.g. 0.15 for 15% VAT
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netProviderAmount: number;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'cancelled' | string;
  paymentMethod: string;
  issuedAt: string;
  dueDate: string;
}

export interface FinancialRevenue {
  id: number | string;
  revenueNumber: string; // REV-YY-XXXXXXXXXX format
  providerId: number | string;
  providerName: string;
  bookingId?: number | string;
  bookingNumber?: string;
  invoiceNumber?: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netRevenue: number;
  source: 'booking' | 'service_order' | 'subscription' | 'ad_campaign' | 'add_on' | string;
  status: 'collected' | 'pending' | 'transferred' | string;
  createdAt: string;
}

export interface FinancialExpense {
  id: number | string;
  expenseNumber: string; // EXP-YY-XXXXXXXXXX format
  providerId?: number | string;
  providerName?: string;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paidTo: string;
  status: 'paid' | 'pending' | 'approved' | string;
  createdAt: string;
}

export interface Campaign {
  id: number | string;
  title: string;
  type: string;
  targetAudience: string;
  budget: number;
  spent: number;
  reach: number;
  clicks: number;
  conversions: number;
  status: string;
  startDate: string;
  endDate: string;
  content?: string;
  providerName: string;
  providerId?: number | string;
  adBudget?: number;
  agencyFee?: number;
  agencyNetProfit?: number;
  workflowStatus?: string;
}

export interface User {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isPending: boolean;
  otp_code?: string;
  region?: string;
  providerId?: number | string;
}

export interface Promotion {
  id: number | string;
  name: string;
  type: 'percentage' | 'fixed' | 'free_service';
  value: number;
  freeServiceId?: number;
  maxFreeServiceValue?: number;
  applyTo: 'halls' | 'services';
  targetIds: (number | string)[]; // empty means "Apply to all"
  status: 'active' | 'expired' | 'pending' | 'rejected';
  startDate: string;
  endDate: string;
  providerName: string; // vendor name
  providerId?: number | string;
  conditions: {
    earlyBird?: number; // days before
    seasonal?: { start: string; end: string };
    bundleCount?: number;
  };
  hasAdCampaign?: boolean;
  adCampaignId?: number | string;
  createdAt: string;
}

export interface Service {
  id: number | string;
  serviceOrderNumber?: string; // SRV-YY-XXXXXXXXXX format
  name: string;
  description: string;
  provider: string;
  providerId: string | number;
  price: number;
  serviceStatus: string;
  adminApprovalStatus?: 'pending' | 'approved' | 'rejected' | string;
  adminStatus: string;
  category?: string;
  regions?: string;
  cities?: string;
  terms?: string;
  cancellationPeriod?: number | string | null;
  images?: string[];
  hostName?: string;
  unit?: string;
  unitPrice?: number;
  showProviderToCustomers?: boolean;
  quantity?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AmortizationInstallment {
  installmentNo: number;
  dueDate: string;
  principalPart: number;
  profitPart: number;
  totalPart: number;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
  paymentReference?: string;
}

export interface CorporateLiability {
  id: string | number;
  facilityNumber: string; // EXP-YY-XXXXXXXXXX or FAC-YY-XXXXXXXXXX
  type: 'bank_facility' | 'murabaha' | 'end_of_service' | 'operational_debt' | 'external_loan';
  creditorName: string;
  principalAmount: number;
  profitRate: number; // e.g. 4.5
  profitAmount: number;
  totalRepaymentAmount: number;
  repaidAmount: number;
  remainingAmount: number;
  termMonths: number;
  startDate: string;
  dueDate: string;
  monthlyPayment: number;
  status: 'active' | 'settled' | 'defaulted' | 'grace_period' | 'early_settled';
  installments: AmortizationInstallment[];
  earlySettlementDetails?: {
    settlementDate: string;
    waivedProfit: number;
    compensationFee: number;
    thirdPartyFees: number;
    netSettledAmount: number;
    savingsAmount: number;
    settlementInvoiceNo: string; // INV-YYXXXXXXXXXX format
    revenueNo: string; // REV-YY-XXXXXXXXXX format
    expenseNo: string; // EXP-YY-XXXXXXXXXX format
    notes?: string;
  };
  isRealEstate?: boolean;
  notes?: string;
  createdAt: string;
}

export interface ProviderReceivable {
  id: string | number;
  receivableNumber: string; // REV-YY-XXXXXXXXXX
  providerId: number | string;
  providerName: string;
  amount: number;
  reason: 'unpaid_subscription' | 'offline_booking_commission' | 'penalty' | 'other';
  status: 'outstanding' | 'partially_paid' | 'collected' | 'written_off';
  dueDate: string;
  ageingDays: number;
  notes?: string;
  createdAt: string;
}

export interface ClientReceivable {
  id: string | number;
  receivableNumber: string; // REV-YY-XXXXXXXXXX
  bookingId?: string | number;
  customerId: number | string;
  customerName: string;
  amount: number;
  paymentType: 'pay_on_arrival' | 'deferred_installments';
  status: 'outstanding' | 'collected' | 'overdue';
  dueDate: string;
  ageingDays: number;
  notes?: string;
  createdAt: string;
}



