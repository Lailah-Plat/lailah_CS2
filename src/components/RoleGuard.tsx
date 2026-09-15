import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, canAccessAdminDashboard, canAccessOperationsCenter } from '../utils/permissionUtils';
import { AccessRestrictedScreen } from './common/AccessRestrictedScreen';

interface RoleGuardProps {
  userRole: 'admin' | 'provider' | 'agency';
  allowedRoles: ('admin' | 'provider' | 'agency')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ userRole, allowedRoles, children, fallback = null }) => {
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

interface RoleRouteGuardProps {
  allowedRoles: ('admin' | 'provider' | 'agency')[];
  children: React.ReactNode;
}

export const RoleRouteGuard: React.FC<RoleRouteGuardProps> = ({ allowedRoles, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let currentUserRole: 'admin' | 'provider' | 'agency' = 'provider';
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role) {
          const roleLower = parsed.role.toLowerCase();
          if (roleLower.includes('admin') || roleLower.includes('مدير') || roleLower.includes('مشرف')) {
            currentUserRole = 'admin';
          } else if (roleLower.includes('agency') || roleLower.includes('وكالة')) {
            currentUserRole = 'agency';
          } else {
            currentUserRole = 'provider';
          }
        }
      }
    } catch (e) {
      console.error('Error parsing currentUser for guard', e);
    }

    if (!allowedRoles.includes(currentUserRole)) {
      navigate('/', { replace: true });
    }
  }, [allowedRoles, navigate]);

  return <>{children}</>;
};

/**
 * Strict Sovereign Route Guard for the Admin Dashboard (/dashboard)
 * Prevents unauthorized employees, clients, and providers from accessing or viewing the dashboard.
 */
export const AdminDashboardRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    const authorized = canAccessAdminDashboard(user);
    setIsAuthorized(authorized);
  }, []);

  if (isAuthorized === null) {
    return null; // checking
  }

  if (!isAuthorized) {
    return <AccessRestrictedScreen type="dashboard" />;
  }

  return <>{children}</>;
};

/**
 * Strict Sovereign Route Guard for the Operations Center (/operations, /workspace/operations, etc.)
 * Prevents non-admin and employees without operations permissions from viewing or accessing the operations center.
 */
export const OperationsRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    const authorized = canAccessOperationsCenter(user);
    setIsAuthorized(authorized);
  }, []);

  if (isAuthorized === null) {
    return null; // checking
  }

  if (!isAuthorized) {
    return <AccessRestrictedScreen type="operations" />;
  }

  return <>{children}</>;
};

