/**
 * @file apiService.ts
 * @description طبقة الخدمات والتواصل مع واجهات البرمجة الخلفية REST API المركزية لمنصة "ليلة".
 * توفر استدعاءات آمنة مع دعم إعادة المحاولة التلقائية (Retries)، المعالجة المرنة، وحفظ الهيدرات الأمنية ورتب المستخدمين.
 */

/**
 * دالة استدعاء واجهات البرمجة مع محاولات إعادة الاتصال التلقائية ومعالجة الاستجابات
 * @param url رابط النقطة النهائية (Endpoint)
 * @param retries عدد محاولات إعادة الاتصال عند الفشل (افتراضياً 3)
 * @param delay وقت الانتظار الأساسي بالملي ثانية بين المحاولات
 * @param options خيارات Fetch المخصصة
 * @returns البيانات المعالجة المرجعة من السيرفر
 */
export const fetchWithRetry = async (url: string, retries = 3, delay = 1000, options?: RequestInit): Promise<any> => {
  try {
    const finalOptions = { ...options };
    const customHeaders = { ...(finalOptions.headers || {}) } as Record<string, string>;
    
    // إرفاق هيدرات رتبة واسم المستخدم النشط من التخزين المحلي
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const roleStr = (parsedUser.role || '').toLowerCase();
          const role = roleStr.includes('admin') || roleStr.includes('مدير') || roleStr.includes('مشرف') ? 'admin' : 'provider';
          
          if (!customHeaders['x-user-role']) {
            customHeaders['x-user-role'] = role;
          }
          if (!customHeaders['x-user-name']) {
            customHeaders['x-user-name'] = encodeURIComponent(parsedUser.name || '');
          }
        }
      } catch (e) {}
    }
    
    finalOptions.headers = customHeaders;

    const res = await fetch(url, finalOptions);
    if (!res.ok) {
      const err = new Error(`رمز الحالة: ${res.status}`) as any;
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        err.noRetry = true;
      }
      throw err;
    }
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      // If we received an HTML document (e.g. server starting up or transitional response), allow retry
      throw new Error('تم استلام استجابة HTML بدلاً من تنسيق JSON.');
    }
    return text ? JSON.parse(text) : { success: true };
  } catch (err: any) {
    if (retries > 0 && !err?.noRetry) {
      console.warn(`فشل الطلب إلى ${url}. جاري إعادة المحاولة خلال ${delay} ملي ثانية...`, err);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay * 1.5, options);
    }
    throw err;
  }
};

/**
 * الكائن المركزي لجميع خدمات واستدعاءات واجهة البرمجة (API Service)
 */
export const apiService = {
  // --- خدمات إدارة المستخدمين والحسابات ---
  /** جلب قائمة المستخدمين */
  async getUsers() {
    return fetchWithRetry('/api/users');
  },

  /** حفظ أو تحديث بيانات مستخدم */
  async saveUser(userForm: any, editingUserId?: string | number) {
    const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
    const method = editingUserId ? 'PUT' : 'POST';
    return fetchWithRetry(url, 3, 1000, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userForm,
        isPending: userForm.isPending
      })
    });
  },

  /** حذف حساب مستخدم */
  async deleteUser(id: string | number, isPending: boolean) {
    return fetchWithRetry(`/api/users/${id}?isPending=${isPending ? 'true' : 'false'}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  /** تزامن الملف الشخصي وإعدادات المزود/العميل مع قاعدة البيانات السحابية */
  async syncProfile(profileData: any) {
    return fetchWithRetry('/api/users/profile-sync', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
  },

  // --- خدمات إدارة الموظفين والموارد البشرية (HR) ---
  /** جلب قائمة الموظفين */
  async getEmployees() {
    return fetchWithRetry('/api/hr/employees', 3, 1000, {
      headers: { 'x-user-id': '1' }
    });
  },

  /** جلب تفاصيل موظف محدد */
  async getEmployee(id: string | number) {
    return fetchWithRetry(`/api/hr/employees/${id}`, 3, 1000, {
      headers: { 'x-user-id': '1' }
    });
  },

  /** تحديث بيانات موظف */
  async updateEmployee(id: string | number, data: any) {
    return fetchWithRetry(`/api/hr/employees/${id}`, 3, 1000, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
      body: JSON.stringify(data)
    });
  },

  /** حذف موظف */
  async deleteEmployee(id: string | number) {
    return fetchWithRetry(`/api/hr/employees/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  // --- خدمات الحجوزات والظروف القاهرة والتذاكر ---
  /** جلب جميع الحجوزات */
  async getBookings() {
    return fetchWithRetry('/api/bookings');
  },

  /** حذف حجز */
  async deleteBooking(id: string | number) {
    return fetchWithRetry(`/api/bookings/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  /** جلب طلبات إعادة الجدولة وإلغاء الظروف القاهرة */
  async getForceMajeureRequests() {
    return fetchWithRetry('/api/bookings/force-majeure');
  },

  /** جلب طلبات الدعم */
  async getSupportRequests() {
    return fetchWithRetry('/api/bookings/support-requests');
  },

  /** إنشاء طلب دعم جديد */
  async saveSupportRequest(payload: any) {
    return fetchWithRetry('/api/bookings/support-requests', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  /** حذف طلب دعم */
  async deleteSupportRequest(id: string | number) {
    return fetchWithRetry(`/api/bookings/support-requests/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  // --- خدمات القاعات والخدمات المساندة ---
  /** جلب قائمة القاعات */
  async getHalls() {
    return fetchWithRetry('/api/bookings/halls');
  },

  /** تحديث بيانات قاعة */
  async updateHall(id: string | number, data: any) {
    return fetchWithRetry(`/api/bookings/halls/${id}`, 3, 1000, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /** حذف قاعة */
  async deleteHall(id: string | number) {
    return fetchWithRetry(`/api/bookings/halls/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  /** جلب قائمة الخدمات المساندة */
  async getServices() {
    return fetchWithRetry('/api/bookings/services');
  },

  /** المزامنة الشاملة للقاعات والخدمات والحجوزات */
  async syncHallsAndServices(
    halls?: any[],
    services?: any[],
    bookings?: any[],
    supportTickets?: any[],
    supportRequests?: any[],
    regions?: any[]
  ) {
    return fetchWithRetry('/api/bookings/migration/sync', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ halls, services, bookings, supportTickets, supportRequests, regions })
    });
  },

  /** حذف خدمة مساندة */
  async deleteService(id: string | number) {
    return fetchWithRetry(`/api/bookings/services/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  // --- خدمات إدارة المخزون والمستودعات ---
  /** جلب عناصر المخزون */
  async getInventory() {
    return fetchWithRetry('/api/bookings/inventory');
  },

  /** إضافة أو تحديث عنصر مخزون */
  async saveInventoryItem(item: any) {
    const url = item.id ? `/api/bookings/inventory/${item.id}` : '/api/bookings/inventory';
    const method = item.id ? 'PUT' : 'POST';
    return fetchWithRetry(url, 3, 1000, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  },

  /** حفظ قائمة المخزون */
  async saveInventory(inventory: any) {
    return fetchWithRetry('/api/bookings/inventory', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventory)
    });
  },

  /** حذف عنصر مخزون */
  async deleteInventoryItem(id: string | number) {
    return fetchWithRetry(`/api/bookings/inventory/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  /** جلب سجلات حركة المخزون */
  async getInventoryLogs() {
    return fetchWithRetry('/api/bookings/inventory/logs');
  },

  /** إنشاء سجل حركة مخزون */
  async createInventoryLog(logData: any) {
    return fetchWithRetry('/api/bookings/inventory/logs', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  },

  // --- خدمات الموردين الخارجيين والفواتير ---
  /** جلب قائمة الموردين */
  async getSuppliers() {
    return fetchWithRetry('/api/bookings/suppliers');
  },

  /** إضافة أو تحديث مورد */
  async saveSupplier(supplier: any) {
    const url = supplier.id ? `/api/bookings/suppliers/${supplier.id}` : '/api/bookings/suppliers';
    const method = supplier.id ? 'PUT' : 'POST';
    return fetchWithRetry(url, 3, 1000, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier)
    });
  },

  /** حذف مورد */
  async deleteSupplier(id: string | number) {
    return fetchWithRetry(`/api/bookings/suppliers/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  /** جلب فواتير الموردين */
  async getSupplierInvoices() {
    return fetchWithRetry('/api/bookings/supplier-invoices');
  },

  /** إنشاء فاتورة مورد جديد */
  async createSupplierInvoice(invoiceData: any) {
    return fetchWithRetry('/api/bookings/supplier-invoices', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
  },

  // --- خدمات الأمان وإعدادات الدفع ---
  /** جلب إعدادات الأمان */
  async getSecuritySettings() {
    return fetchWithRetry('/api/auth/settings/security');
  },

  /** حفظ إعدادات الأمان */
  async saveSecuritySettings(settings: any) {
    return fetchWithRetry('/api/auth/settings/security', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  },

  /** جلب تكوينات بوابات الدفع */
  async getPaymentConfig() {
    return fetchWithRetry('/api/security/config/payment');
  },

  /** حفظ تكوينات بوابات الدفع */
  async savePaymentConfig(config: any) {
    return fetchWithRetry('/api/security/config/payment', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },

  // --- خدمات التقييمات والآراء ---
  /** جلب تقييمات العملاء */
  async getReviews() {
    return fetchWithRetry('/api/feedback/reviews');
  },

  /** مزامنة التقييمات */
  async syncReviews(reviews: any[]) {
    return fetchWithRetry('/api/feedback/migration/sync', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews })
    });
  },

  /** حفظ تقييم جديد */
  async saveReview(review: any) {
    return fetchWithRetry('/api/feedback/reviews', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
  },

  /** حذف تقييم */
  async deleteReview(id: string | number) {
    return fetchWithRetry(`/api/feedback/reviews/${id}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  // --- خدمات الحملات التسويقية ---
  /** جلب الحملات التسويقية */
  async getCampaigns(userRole: string, userId?: string) {
    return fetchWithRetry('/api/marketing/campaigns', 3, 1000, {
      headers: { 'x-user-role': userRole, 'x-user-id': userId || '1' }
    });
  },

  // --- خدمات إعدادات النظام وتكويناته ---
  /** جلب إعدادات النظام */
  async getSystemConfigs() {
    return fetchWithRetry(`/api/system/configs?_t=${Date.now()}`);
  },

  /** حفظ إعدادات النظام */
  async saveSystemConfigs(configs: any) {
    return fetchWithRetry('/api/system/configs', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configs)
    });
  },

  // --- خدمات تذاكر الدعم والرسائل ---
  /** جلب تذاكر الدعم الفني */
  async getSupportTickets() {
    return fetchWithRetry('/api/support/tickets');
  },

  /** جلب رسائل تذكرة دعم محددة */
  async getTicketMessages(ticketId: string | number) {
    return fetchWithRetry(`/api/support/tickets/${ticketId}/messages`);
  },

  /** الرد على تذكرة دعم */
  async replyToTicket(ticketId: string | number, payload: any) {
    return fetchWithRetry(`/api/support/tickets/${ticketId}/reply`, 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // --- خدمات باقات الاشتراكات ---
  /** جلب كافة خطط الاشتراكات */
  async getAllSubscriptions() {
    return fetchWithRetry('/api/subscriptions/all');
  },

  /** حذف خطة اشتراك */
  async deleteSubscriptionPlan(idOrName: string | number) {
    return fetchWithRetry(`/api/subscriptions/plans/${idOrName}`, 3, 1000, {
      method: 'DELETE'
    });
  },

  // --- رفع الملفات وبوابات الدفع ---
  /** رفع ملف إلى السيرفر */
  async uploadFile(formData: FormData) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('فشل رفع الملف');
    return res.json();
  },

  /** رفع ملف خارجي */
  async uploadExternal(payload: any) {
    const res = await fetch('/api/upload-external', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('فشل رفع الملف الخارجي');
    return res.json();
  },

  /** الدفع الخارجي */
  async checkoutPayment(payload: any) {
    const res = await fetch('/api/payment/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('فشل عملية الدفع الإلكتروني');
    return res.json();
  },

  /** تنقية أساليب تفعيل النظام */
  async cleanActivationStatus() {
    return fetchWithRetry('/api/bookings/system/clean-activation-status', 3, 1000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

