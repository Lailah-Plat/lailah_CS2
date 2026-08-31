import React from 'react';
import { ProviderSidebar } from './ProviderSidebar';
import { ProviderMobileNav } from './ProviderMobileNav';
import { ProviderHeader } from './ProviderHeader';

interface ProviderWorkspaceShellProps {
  osTab: string;
  setOsTab: (tab: any) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentProviderName: string;
  profileBusinessName?: string;
  profileLogo?: string;
  providerPlan?: string;
  liveNotifications?: any[];
  onOpenWizard?: () => void;
  children: React.ReactNode;
}

export const ProviderWorkspaceShell: React.FC<ProviderWorkspaceShellProps> = ({
  osTab,
  setOsTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentProviderName,
  profileBusinessName,
  profileLogo,
  providerPlan,
  liveNotifications = [],
  onOpenWizard,
  children,
}) => {
  return (
    <div className="space-y-4 font-sans text-right pb-16 lg:pb-0" dir="rtl">
      {/* Mobile Top Navigation */}
      <ProviderMobileNav
        osTab={osTab}
        setOsTab={setOsTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        profileBusinessName={profileBusinessName || currentProviderName}
      />

      {/* Main Workspace Header */}
      <ProviderHeader
        currentProviderName={currentProviderName}
        profileBusinessName={profileBusinessName}
        profileLogo={profileLogo}
        providerPlan={providerPlan}
        liveNotificationsCount={liveNotifications.filter(n => n.unread).length}
        onOpenNotifications={() => setOsTab('notifications')}
        onOpenWizard={onOpenWizard}
      />

      {/* 2-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Right Sidebar: Domains Navigation */}
        <ProviderSidebar
          osTab={osTab}
          setOsTab={setOsTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          liveNotifications={liveNotifications}
        />

        {/* Left Area: Active Functional Domain */}
        <main className="lg:col-span-3 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
