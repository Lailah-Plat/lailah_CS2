import React, { useState } from 'react';
import { ShieldAlert, Activity, Cpu, Server, CheckCircle2 } from 'lucide-react';
import { DiagnosticsDashboard } from './DiagnosticsDashboard';
import { SystemDiagnosticsHealth } from './SystemDiagnosticsHealth';

interface TechnicalDiagnosticsHubProps {
  halls?: any[];
  bookings?: any[];
  services?: any[];
  supportServiceRequests?: any[];
  setBookings?: React.Dispatch<React.SetStateAction<any[]>>;
  setSupportServiceRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  initialTab?: 'self_diagnostics' | 'system_health';
}

export function TechnicalDiagnosticsHub({
  halls = [],
  bookings = [],
  services = [],
  supportServiceRequests = [],
  setBookings,
  setSupportServiceRequests,
  showNotification = () => {},
  initialTab = 'self_diagnostics'
}: TechnicalDiagnosticsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'self_diagnostics' | 'system_health'>(initialTab);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Banner & Tab Navigation */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Cpu className="w-4 h-4 text-indigo-400" />
              مركز التشخيصات والاختبارات الفنية الموحد (Technical Diagnostics & System Health)
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              التشخيصات والاختبارات الفنية الشاملة 🛡️
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              منصة مركزية لمراقبة جودة الخوادم، فحص دورة حياة الحجوزات والأنظمة الذاتية (E2E Tester)، ومتابعة بوابات الدفع الإلكترونية، الـ Webhooks، وحالة الاتصال اللحظي.
            </p>
          </div>
        </div>

        {/* Main 2 Sub-Tabs */}
        <div className="flex flex-col sm:flex-row bg-slate-900/90 p-1.5 rounded-2xl gap-2 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('self_diagnostics')}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'self_diagnostics'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg font-black scale-[1.01]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>الفحص والاختبارات الذاتية (E2E Tester)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('system_health')}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'system_health'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg font-black scale-[1.01]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>التشخيصات الفنية والأنظمة (System Health & Pings)</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-Tab View */}
      <div>
        {activeSubTab === 'self_diagnostics' && (
          <DiagnosticsDashboard
            halls={halls}
            bookings={bookings}
            services={services}
            supportServiceRequests={supportServiceRequests}
            setBookings={setBookings}
            setSupportServiceRequests={setSupportServiceRequests}
            showNotification={showNotification}
          />
        )}

        {activeSubTab === 'system_health' && (
          <SystemDiagnosticsHealth showNotification={showNotification} />
        )}
      </div>

    </div>
  );
}
