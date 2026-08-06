import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
