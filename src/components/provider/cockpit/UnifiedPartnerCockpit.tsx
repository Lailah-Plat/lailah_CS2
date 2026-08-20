import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, LayoutGrid, Calendar, Percent, 
  TrendingUp, Building2, ShieldCheck, Award, Sparkles
} from 'lucide-react';

import { DailyOperationsDispatchBar } from './DailyOperationsDispatchBar';
import { LiveKpiCockpit } from './LiveKpiCockpit';
import { SmartBookingLifecycleManager } from './SmartBookingLifecycleManager';
import { FloorPlanBuilder } from './FloorPlanBuilder';
import { DynamicSurgePricingEngine } from './DynamicSurgePricingEngine';
import { CashflowForecastingHub } from './CashflowForecastingHub';

interface UnifiedPartnerCockpitProps {
  currentProviderName: string;
  currentUserName: string;
  myBookings: any[];
  mySupportRequests?: any[];
  halls?: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onOpenChat?: (booking: any) => void;
  onUpdateBookingStage?: (bookingId: string, newStage: number) => void;
}

export const UnifiedPartnerCockpit: React.FC<UnifiedPartnerCockpitProps> = ({
  currentProviderName,
  currentUserName,
  myBookings,
  mySupportRequests = [],
  halls = [],
  showNotification,
  onOpenChat,
  onUpdateBookingStage
}) => {
  const [cockpitSubTab, setCockpitSubTab] = useState<'all' | 'dispatch' | 'kpis' | 'lifecycle' | 'floorplan' | 'pricing' | 'cashflow'>('all');

  // Filter my bookings strictly by provider
  const filteredBookings = myBookings.filter(b => {
    if (!b) return false;
    if (!currentProviderName) return true;
    return b.provider === currentProviderName || b.providerName === currentProviderName || !b.provider;
  });

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-400 text-slate-950 rounded-xl font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Enterprise Venue & Event Operations Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            مركز الأعمال والإجراءات ({currentProviderName})
          </h2>
          <p className="text-xs text-indigo-200 mt-1 font-medium">
            المنظومة التشغيلية المتكاملة لمتابعة مؤشرات الأداء والتحليلات والعمليات التنفيذية الميدانية بالوقت الفعلي
          </p>
        </div>

        {/* Quick Filter Navigation Subtabs */}
        <div className="flex flex-wrap gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10 text-xs font-bold backdrop-blur-md">
          <button
            onClick={() => setCockpitSubTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              cockpitSubTab === 'all' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            🌟 نظرة شاملة
          </button>
          <button
            onClick={() => setCockpitSubTab('kpis')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              cockpitSubTab === 'kpis' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            📊 مؤشرات الأداء والتحليلات
          </button>
          <button
            onClick={() => setCockpitSubTab('dispatch')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              cockpitSubTab === 'dispatch' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            ⚡ العمليات والإجراءات الميدانية
          </button>
          <button
            onClick={() => setCockpitSubTab('lifecycle')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              cockpitSubTab === 'lifecycle' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            🔄 دورات الحياة (المراحل الست)
          </button>
          <button
            onClick={() => setCockpitSubTab('floorplan')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              cockpitSubTab === 'floorplan' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            📐 مخطط القاعة
          </button>
          <button
            onClick={() => setCockpitSubTab('pricing')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              cockpitSubTab === 'pricing' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            🏷️ التسعير الديناميكي
          </button>
          <button
            onClick={() => setCockpitSubTab('cashflow')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              cockpitSubTab === 'cashflow' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            💰 التنبؤ المالي
          </button>
        </div>
      </div>

      {/* Module 1: Daily Operations Dispatch Bar */}
      {(cockpitSubTab === 'all' || cockpitSubTab === 'dispatch') && (
        <DailyOperationsDispatchBar
          myBookings={filteredBookings}
          mySupportRequests={mySupportRequests}
          currentProviderName={currentProviderName}
          showNotification={showNotification}
          onOpenChat={onOpenChat}
        />
      )}

      {/* Module 2: Live KPI Cockpit */}
      {(cockpitSubTab === 'all' || cockpitSubTab === 'kpis') && (
        <LiveKpiCockpit
          myBookings={filteredBookings}
          showNotification={showNotification}
        />
      )}

      {/* Module 3: Smart Booking Lifecycle Manager */}
      {(cockpitSubTab === 'all' || cockpitSubTab === 'lifecycle') && (
        <SmartBookingLifecycleManager
          myBookings={filteredBookings}
          onUpdateBookingStage={onUpdateBookingStage}
          showNotification={showNotification}
          currentProviderName={currentProviderName}
        />
      )}

      {/* Module 4: Floor Plan Builder */}
      {(cockpitSubTab === 'all' || cockpitSubTab === 'floorplan') && (
        <FloorPlanBuilder
          halls={halls}
          showNotification={showNotification}
        />
      )}

      {/* Module 5: Dynamic Surge Pricing Engine */}
      {(cockpitSubTab === 'all' || cockpitSubTab === 'pricing') && (
        <DynamicSurgePricingEngine
          halls={halls}
          showNotification={showNotification}
        />
      )}

      {/* Module 6: Cashflow Forecasting Hub */}
      {(cockpitSubTab === 'all' || cockpitSubTab === 'cashflow') && (
        <CashflowForecastingHub
          myBookings={filteredBookings}
          showNotification={showNotification}
        />
      )}

    </div>
  );
};
