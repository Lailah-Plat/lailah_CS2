import { initialStaff } from '../data/mockData';

export interface UserProfile {
  id?: number | string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
  isOnline?: boolean;
  permissions?: Record<string, any> | string[];
  canAccessDashboard?: boolean;
  canAccessOperations?: boolean;
  [key: string]: any;
}

/**
 * Safely retrieve the current authenticated user profile from storage
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Check if the user account is suspended or deactivated
 */
export function isUserSuspended(user: UserProfile | null): boolean {
  if (!user) return false;
  const status = (user.status || '').toLowerCase();
  return (
    status === 'موقوف' ||
    status === 'suspended' ||
    status === 'blocked' ||
    status === 'معطل' ||
    user.isSuspended === true
  );
}

/**
 * Strict Authority Guard: Checks if the user is authorized to access the Admin Dashboard (/dashboard)
 * 
 * Rules:
 * 1. Must be authenticated and NOT suspended.
 * 2. Regular customers ('customer', 'عميل') are STRICTLY FORBIDDEN.
 * 3. Providers ('provider', 'مزود') and Marketing Agencies ('agency') are STRICTLY FORBIDDEN (isolated to provider dashboard).
 * 4. Super Admin ('admin', 'المدير العام') has full access.
 * 5. Administration staff/employees MUST have active status and valid administrative permissions.
 *    Any employee without dashboard access permission or whose permissions are empty/revoked is DENIED.
 */
export function canAccessAdminDashboard(user?: UserProfile | null): boolean {
  const activeUser = user !== undefined ? user : getCurrentUser();
  if (!activeUser) return false;

  // Suspended users cannot enter
  if (isUserSuspended(activeUser)) return false;

  const roleLower = (activeUser.role || '').toLowerCase();
  const emailLower = (activeUser.email || '').toLowerCase();

  // Strict Data Isolation: Customers are strictly forbidden
  if (roleLower === 'customer' || roleLower.includes('عميل')) {
    return false;
  }

  // Strict Data Isolation: Providers & Agencies are strictly forbidden
  if (
    roleLower === 'provider' ||
    roleLower.includes('مزود') ||
    roleLower === 'agency' ||
    roleLower.includes('وكالة') ||
    roleLower.includes('تسويق')
  ) {
    // Only allow if this user is also explicitly configured as system admin
    if (!roleLower.includes('admin') && !emailLower.includes('admin@system.local')) {
      return false;
    }
  }

  // Explicit override flag
  if (activeUser.canAccessDashboard === false) return false;
  if (activeUser.canAccessDashboard === true) return true;

  // Super Admin Check
  if (
    roleLower === 'admin' ||
    roleLower.includes('مدير عام') ||
    roleLower.includes('المدير العام') ||
    roleLower.includes('مشرف') ||
    emailLower === 'admin@system.local' ||
    emailLower === 'lailah.plat@gmail.com'
  ) {
    return true;
  }

  // Check Staff / Employee Permissions
  const permissions = activeUser.permissions;
  if (permissions) {
    // 1. Array-based permissions (from mock/initialStaff)
    if (Array.isArray(permissions)) {
      if (permissions.length === 0) return false;
      if (
        permissions.includes('الإدارة الكاملة') ||
        permissions.includes('all') ||
        permissions.includes('*')
      ) {
        return true;
      }
      // If employee has any active administration permission
      const hasAdminPerm = permissions.some((p: any) =>
        typeof p === 'string' &&
        (p.includes('إدارة') ||
         p.includes('حجوزات') ||
         p.includes('قاعات') ||
         p.includes('مالية') ||
         p.includes('دعم') ||
         p.includes('عمليات'))
      );
      if (hasAdminPerm) return true;
    }

    // 2. Object-based permissions (from Role Matrix / StaffManagement)
    if (typeof permissions === 'object' && !Array.isArray(permissions)) {
      if (permissions['*'] === true) return true;
      if (permissions.dashboard === true || permissions.dashboard?.read === true) return true;

      // Check if any operational or management module is granted read/write
      const hasAnyGrantedModule = Object.entries(permissions).some(([key, val]: [string, any]) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'object' && val !== null) {
          return val.read === true || val.create === true || val.update === true;
        }
        return false;
      });

      if (hasAnyGrantedModule) return true;
      return false; // Permissions object exists but all are disabled
    }
  }

  // Cross-reference with initialStaff if user is matched by email or id
  const matchedStaff = initialStaff.find(
    s => (activeUser.id && s.id === activeUser.id) || (activeUser.email && s.email.toLowerCase() === emailLower)
  );
  if (matchedStaff) {
    if (matchedStaff.status === 'موقوف') return false;
    if (matchedStaff.role === 'المدير العام (Admin)') return true;
    if (matchedStaff.permissions && matchedStaff.permissions.length > 0) return true;
  }

  return false;
}

/**
 * Strict Authority Guard: Checks if the user is authorized to access the Contextual Operations Center (/operations)
 * 
 * Rules:
 * 1. Must be authenticated and NOT suspended.
 * 2. Regular customers ('customer', 'عميل') are STRICTLY FORBIDDEN.
 * 3. Providers ('provider', 'مزود') and Agencies ('agency') are STRICTLY FORBIDDEN.
 * 4. Super Admin ('admin', 'المدير العام') has full access.
 * 5. Administration staff/employees MUST have explicit 'operations' permission or related operational role (e.g. Operations, Support, Dispatch, Escalations).
 *    Any employee without operations clearance is DENIED.
 */
export function canAccessOperationsCenter(user?: UserProfile | null): boolean {
  const activeUser = user !== undefined ? user : getCurrentUser();
  if (!activeUser) return false;

  // Suspended users cannot enter
  if (isUserSuspended(activeUser)) return false;

  const roleLower = (activeUser.role || '').toLowerCase();
  const emailLower = (activeUser.email || '').toLowerCase();

  // Strict Data Isolation: Customers are strictly forbidden
  if (roleLower === 'customer' || roleLower.includes('عميل')) {
    return false;
  }

  // Strict Data Isolation: Providers & Agencies are strictly forbidden
  if (
    roleLower === 'provider' ||
    roleLower.includes('مزود') ||
    roleLower === 'agency' ||
    roleLower.includes('وكالة') ||
    roleLower.includes('تسويق')
  ) {
    // Only allow if explicitly system admin
    if (!roleLower.includes('admin') && !emailLower.includes('admin@system.local')) {
      return false;
    }
  }

  // Explicit override flags
  if (activeUser.canAccessOperations === false) return false;
  if (activeUser.canAccessOperations === true) return true;

  // Super Admin Check - Always authorized
  if (
    roleLower === 'admin' ||
    roleLower.includes('مدير عام') ||
    roleLower.includes('المدير العام') ||
    roleLower.includes('مشرف') ||
    emailLower === 'admin@system.local' ||
    emailLower === 'lailah.plat@gmail.com'
  ) {
    return true;
  }

  // Check Staff / Employee Specific Permissions for Operations
  const permissions = activeUser.permissions;
  if (permissions) {
    // 1. Array-based permissions
    if (Array.isArray(permissions)) {
      if (
        permissions.includes('الإدارة الكاملة') ||
        permissions.includes('all') ||
        permissions.includes('*') ||
        permissions.includes('العمليات') ||
        permissions.includes('مركز العمليات') ||
        permissions.includes('الدعم والعمليات') ||
        permissions.includes('إدارة العمليات') ||
        permissions.includes('الدعم الفني') ||
        permissions.includes('إدارة الحجوزات')
      ) {
        return true;
      }
    }

    // 2. Object-based permissions
    if (typeof permissions === 'object' && !Array.isArray(permissions)) {
      if (permissions['*'] === true) return true;
      if (permissions.operations === true) return true;
      if (permissions.operations && typeof permissions.operations === 'object' && permissions.operations.read === true) {
        return true;
      }
      if (permissions['operations.read'] === true) return true;

      // If operations permission is explicitly false, forbid immediately
      if (permissions.operations && typeof permissions.operations === 'object' && permissions.operations.read === false) {
        return false;
      }
    }
  }

  // Operational Roles Check
  if (
    roleLower.includes('عمليات') ||
    roleLower.includes('operations') ||
    roleLower.includes('لوجست') ||
    roleLower.includes('logistics') ||
    roleLower.includes('dispatch') ||
    roleLower.includes('support') ||
    roleLower.includes('خدمة العملاء') ||
    roleLower.includes('hall_manager') ||
    roleLower.includes('مسؤول قاعات')
  ) {
    return true;
  }

  // Cross-reference with initialStaff
  const matchedStaff = initialStaff.find(
    s => (activeUser.id && s.id === activeUser.id) || (activeUser.email && s.email.toLowerCase() === emailLower)
  );
  if (matchedStaff) {
    if (matchedStaff.status === 'موقوف') return false;
    if (matchedStaff.role === 'المدير العام (Admin)') return true;
    if (
      matchedStaff.role.includes('الدعم') ||
      matchedStaff.role.includes('المبيعات') ||
      (matchedStaff.permissions && matchedStaff.permissions.some(p => p.includes('حجوزات') || p.includes('دعم')))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Generate authenticated headers for Operations Center requests.
 * Safely extracts credentials from active user session or sets operational admin defaults.
 */
export function getOperationsAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    const user = getCurrentUser();
    if (user) {
      const roleStr = (user.role || '').toLowerCase();
      let role = 'operations_officer';
      if (
        roleStr.includes('admin') ||
        roleStr.includes('مدير عام') ||
        roleStr.includes('المدير العام') ||
        roleStr === 'superadmin' ||
        roleStr === 'admin'
      ) {
        role = 'admin';
      } else if (roleStr.includes('operations') || roleStr.includes('عمليات')) {
        role = 'operations_officer';
      } else {
        role = user.role || 'operations_officer';
      }

      headers['x-user-id'] = String(user.id || '1');
      headers['x-user-role'] = role;
      headers['x-user-name'] = encodeURIComponent(user.name || 'مشرف العمليات');
      if (user.email) {
        headers['x-user-email'] = user.email;
      }
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    } else {
      // Default to administrator in dev or system operations environment
      headers['x-user-id'] = '1';
      headers['x-user-role'] = 'admin';
      headers['x-user-name'] = encodeURIComponent('إدارة العمليات');
    }
  } catch {
    headers['x-user-id'] = '1';
    headers['x-user-role'] = 'admin';
    headers['x-user-name'] = encodeURIComponent('إدارة العمليات');
  }

  return headers;
}

