import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProviderChatModal from '../components/ProviderChatModal';
import ViewToggle from '../components/ViewToggle';
import ServiceRequestInvoice from '../components/ServiceRequestInvoice';
import { 
  MapPin, Calendar, Clock, Receipt, CheckCircle2, 
  AlertCircle, XCircle, ChevronDown, Mail, 
  MessageSquare, MessageCircle, Search, Filter, 
  LayoutGrid, List, Table, ArrowUpDown, X, PackageSearch,
  User, Sparkles
} from 'lucide-react';
import { formatDateWithHijri } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import { formatServiceRequestId, formatInvoiceId } from '../utils/idUtils';

type ViewMode = 'grid' | 'list' | 'table';

// Helper for invoice request
const handleRequestServiceInvoice = (requestId: string | number) => {
  const requests = JSON.parse(localStorage.getItem('INVOICE_REQUESTS') || '[]');
  const newRequest = {
    id: Date.now(),
    type: 'service',
    targetId: requestId,
    customerName: JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'عميل',
    customerId: 'CUST-' + Math.floor(Math.random() * 1000),
    date: new Date().toISOString(),
    status: 'pending',
    requestCount: 1
  };
  
  const existing = requests.find((r: any) => r.targetId === requestId && r.type === 'service');
  if (existing) {
    existing.requestCount += 1;
    localStorage.setItem('INVOICE_REQUESTS', JSON.stringify(requests));
  } else {
    localStorage.setItem('INVOICE_REQUESTS', JSON.stringify([...requests, newRequest]));
  }
  
  toast.success('تم إرسال طلب فاتورة الخدمة بنجاح');
  window.dispatchEvent(new Event('invoice_requested'));
};

export default function ServiceRequestsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [isProviderChatOpen, setIsProviderChatOpen] = useState(false);
  const [chatData, setChatData] = useState({ providerName: '', hallName: '' });
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [viewingRequestForInvoice, setViewingRequestForInvoice] = useState<any>(null);
  
  // Tabs & real-time sync
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'cancelled_or_rejected'>('all');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [serviceRequests, setServiceRequests] = useState<any[]>([]);

  useEffect(() => {
    const loadRequests = () => {
      const saved = localStorage.getItem('SUPPORT_SERVICE_REQUESTS');
      const userStr = localStorage.getItem('currentUser');
      if (saved) {
        let filtered = JSON.parse(saved);
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const userId = user.id || user.uid || 'USER-123';
            filtered = filtered.filter((req: any) => req.userId === userId);
          } catch (e) {}
        }
        setServiceRequests(filtered);
      }
    };

    loadRequests();

    window.addEventListener('storage', loadRequests);
    window.addEventListener('service-requests-updated', loadRequests);

    return () => {
      window.removeEventListener('storage', loadRequests);
      window.removeEventListener('service-requests-updated', loadRequests);
    };
  }, []);

  const confirmedStatuses = ['جاري التنفيذ', 'قيد التنفيذ', 'مؤكد', 'مكتمل', 'مجدول', 'تم القبول', 'تمت الموافقة', 'موافق', 'مقبول'];
  const pendingStatuses = ['قيد الانتظار', 'جديد', 'انتظار', 'قيد المراجعة', 'بانتظار الموافقة', 'جاري المراجعة'];
  const cancelledStatuses = ['ملغى', 'مرفوض', 'ملغي', 'مسترجع'];

  const confirmedCount = useMemo(() => {
    return serviceRequests.filter(req => confirmedStatuses.includes(req.status)).length;
  }, [serviceRequests]);

  const pendingCount = useMemo(() => {
    return serviceRequests.filter(req => pendingStatuses.includes(req.status)).length;
  }, [serviceRequests]);

  const cancelledCount = useMemo(() => {
    return serviceRequests.filter(req => cancelledStatuses.includes(req.status)).length;
  }, [serviceRequests]);

  const allCount = serviceRequests.length;

  const openProviderChat = (e: React.MouseEvent, providerName: string, serviceName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatData({ providerName, hallName: serviceName });
    setIsProviderChatOpen(true);
  };

  const getStatusInfo = (status: string) => {
    if (['مكتمل'].includes(status)) {
      return { text: 'مؤكد/مكتمل', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> };
    }
    if (['جاري التنفيذ', 'قيد التنفيذ'].includes(status)) {
      return { text: 'مؤكد / جاري العمل', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Clock className="w-5 h-5 text-blue-500" /> };
    }
    if (confirmedStatuses.includes(status)) {
      return { text: 'مقبول / مؤكد', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', icon: <CheckCircle2 className="w-5 h-5 text-teal-500" /> };
    }
    if (pendingStatuses.includes(status)) {
      return { text: 'قيد الانتظار / المراجعة', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertCircle className="w-5 h-5 text-amber-500" /> };
    }
    if (cancelledStatuses.includes(status)) {
      return { text: 'ملغى أو مرفوض', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle className="w-5 h-5 text-red-500" /> };
    }
    return { text: status, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: null };
  };

  const filteredRequests = useMemo(() => {
    let result = [...serviceRequests];

    // Tab filter
    if (activeTab === 'confirmed') {
      result = result.filter(req => confirmedStatuses.includes(req.status));
    } else if (activeTab === 'pending') {
      result = result.filter(req => pendingStatuses.includes(req.status));
    } else if (activeTab === 'cancelled_or_rejected') {
      result = result.filter(req => cancelledStatuses.includes(req.status));
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(req => 
        req.serviceName.toLowerCase().includes(q) || 
        req.providerName.toLowerCase().includes(q) ||
        (req.bookingId && req.bookingId.toString().includes(q))
      );
    }

    // Status Filter
    if (statusFilter.length > 0) {
      result = result.filter(req => statusFilter.includes(req.status));
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === 'newest') return b.id - a.id;
      if (sortOrder === 'oldest') return a.id - b.id;
      if (sortOrder === 'price-high') return b.price - a.price;
      if (sortOrder === 'price-low') return a.price - b.price;
      return 0;
    });

    return result;
  }, [serviceRequests, searchQuery, statusFilter, sortOrder, activeTab]);

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const renderExpandedDetails = (request: any) => (
    <div className="border-t border-slate-100 bg-slate-50 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h4 className="font-bold text-blue-950 mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-500" /> معلومات الخدمة والطلب
        </h4>
        <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-3 text-sm shadow-sm">
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-bold">رقم الطلب:</span>
              <span className="font-bold text-slate-800 font-mono tracking-tight">{formatServiceRequestId(request.id)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-bold">رقم الفاتورة:</span>
              <span className="font-bold text-indigo-600 font-mono tracking-tight">{formatInvoiceId(request.id)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">مزود الخدمة:</span>
              <span className="font-bold text-slate-800 flex items-center gap-2">
                 {request.providerName}
                 <button onClick={(e) => openProviderChat(e, request.providerName, request.serviceName)} className="text-blue-600 hover:text-blue-700 transition-colors p-1">
                    <MessageCircle className="w-5 h-5" />
                 </button>
              </span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">اسم الخدمة:</span>
              <span className="font-bold text-slate-800">{request.serviceName}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">التاريخ المجدول:</span>
              <span className="font-bold text-slate-800">{formatDateWithHijri(request.date)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">الكمية/العدد:</span>
              <span className="font-bold text-slate-800">{request.quantity || 1}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-slate-500">طريقة الدفع:</span>
              <span className="font-bold text-slate-800">{request.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'بطاقة / Apple Pay'}</span>
           </div>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-blue-950 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" /> الحالة والمتابعة
        </h4>
        <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-4 shadow-sm">
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusInfo(request.status).bg}`}>
                 {getStatusInfo(request.status).icon}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">حالة الطلب الحالية:</p>
                <p className={`font-bold ${getStatusInfo(request.status).color}`}>{getStatusInfo(request.status).text}</p>
              </div>
           </div>
           
           <div className="pt-4 border-t border-slate-50 space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                * يمكنك التواصل المباشر مع مزود الخدمة لأي استفسارات إضافية حول طلبك.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                 <button 
                  onClick={() => {
                    setViewingRequestForInvoice(request);
                    setIsInvoiceOpen(true);
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                 >
                    عرض الفاتورة
                 </button>
                 {request.status === 'مكتمل' && (
                   <button 
                    onClick={() => handleRequestServiceInvoice(request.id)}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                   >
                      طلب فاتورة
                   </button>
                 )}
                 {request.status === 'قيد الانتظار' && (
                    <button className="flex-1 border border-red-100 text-red-500 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                       إلغاء الطلب
                    </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-950 border-r-4 border-amber-500 pr-4">طلبات الخدمات</h1>
            <p className="text-slate-500 pr-5 mt-1">تتبع حالة طلبات الخدمات المساندة الخاصة بك</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className={`p-2.5 rounded-xl border transition-all ${isFilterMenuOpen || statusFilter.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
                {isFilterMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-blue-950">تصفية النتائج</h3>
                      <button onClick={() => { setStatusFilter([]); setSearchQuery(''); }} className="text-xs text-blue-600 hover:underline">إعادة ضبط</button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">حالة الطلب</p>
                        <div className="flex flex-wrap gap-2">
                          {['قيد الانتظار', 'قيد التنفيذ', 'مكتمل', 'ملغى'].map(status => (
                            <button 
                              key={status}
                              onClick={() => toggleStatusFilter(status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter.includes(status) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الترتيب</p>
                        <select 
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-500"
                        >
                          <option value="newest">الأحدث أولاً</option>
                          <option value="oldest">الأقدم أولاً</option>
                          <option value="price-high">السعر: من الأعلى</option>
                          <option value="price-low">السعر: من الأقل</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
             </div>
             <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {/* التبويبات الفلترة لطلبات الخدمات */}
        <div className="bg-white rounded-2xl border border-slate-150 p-1.5 mb-8 shadow-sm flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-[120px] md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>الكل</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {allCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex-1 min-w-[150px] md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${activeTab === 'confirmed' ? 'text-white' : 'text-emerald-500'}`} />
            <span>الطلبات المؤكدة</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'confirmed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {confirmedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 min-w-[150px] md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50/50'
            }`}
          >
            <AlertCircle className={`w-4 h-4 ${activeTab === 'pending' ? 'text-white' : 'text-amber-500'}`} />
            <span>الطلبات قيد الانتظار</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cancelled_or_rejected')}
            className={`flex-1 min-w-[155px] md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'cancelled_or_rejected'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-slate-600 hover:text-red-650 hover:bg-red-50/50'
            }`}
          >
            <XCircle className={`w-4 h-4 ${activeTab === 'cancelled_or_rejected' ? 'text-white' : 'text-red-500'}`} />
            <span>الملغاة أو المرفوضة</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'cancelled_or_rejected' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'
            }`}>
              {cancelledCount}
            </span>
          </button>
        </div>

        {/* Realtime Search Input - Directly Below the Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm mb-6">
          <div className="relative w-full">
            <span className="absolute right-4 top-3 text-slate-400 text-base">🔍</span>
            <input
              type="text"
              placeholder="ابحث برقم الطلب الخاص بالمنصة، اسم الخدمة، اسم مزود الخدمة، أو البنود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-11 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all bg-slate-50 text-slate-700 font-sans text-xs md:text-sm shadow-inner"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-sans transition-all"
              >
                مسح البحث
              </button>
            )}
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          viewMode === 'table' ? (
            <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
              <table className="w-full text-right text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-800 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold">رقم الطلب</th>
                    <th className="px-6 py-4 font-bold">الخدمة</th>
                    <th className="px-6 py-4 font-bold">المزود</th>
                    <th className="px-6 py-4 font-bold">التاريخ</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold">إجمالي المبلغ</th>
                    <th className="px-6 py-4 font-bold text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRequests.map(request => {
                    const statusInfo = getStatusInfo(request.status);
                    const isExpanded = expandedRequest === request.id;
                    return (
                      <React.Fragment key={request.id}>
                        <tr 
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                          onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                        >
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{formatServiceRequestId(request.id)}</td>
                          <td className="px-6 py-4 font-bold text-blue-950">{request.serviceName}</td>
                          <td className="px-6 py-4">{request.providerName}</td>
                          <td className="px-6 py-4">{formatDateWithHijri(request.date)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-amber-500">{request.price} ر.س</td>
                          <td className="px-6 py-4 text-center">
                            <ChevronDown className={`w-5 h-5 mx-auto text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 border-b border-slate-100">
                              {renderExpandedDetails(request)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredRequests.map(request => {
                  const statusInfo = getStatusInfo(request.status);
                  const isExpanded = expandedRequest === request.id;
                  return (
                    <div key={request.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                       <div className="p-5 flex-grow">
                          <div className="flex justify-between items-start mb-4">
                             <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                {statusInfo.text}
                             </div>
                             <span className="text-[10px] font-mono text-slate-400">{formatServiceRequestId(request.id)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-blue-950 mb-1">{request.serviceName}</h3>
                          <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                             <User className="w-3 h-3" /> بواسطة: {request.providerName}
                          </p>
                          <div className="space-y-2 text-sm text-slate-600 mb-4">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" /> 
                                <span className="text-xs">{formatDateWithHijri(request.date)}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-slate-400" /> 
                                <span className="font-bold text-amber-500">{request.price} ر.س</span>
                             </div>
                          </div>
                       </div>
                       <button 
                        onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                        className="w-full bg-slate-50 border-t border-slate-100 py-3 text-sm font-bold text-blue-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                       >
                          عرض التفاصيل
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                       </button>
                       {isExpanded && renderExpandedDetails(request)}
                    </div>
                  );
               })}
            </div>
          ) : (
            <div className="space-y-4">
               {filteredRequests.map(request => {
                  const statusInfo = getStatusInfo(request.status);
                  const isExpanded = expandedRequest === request.id;
                  return (
                    <div key={request.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                       <div 
                        className="p-5 flex flex-col md:flex-row justify-between items-center gap-6 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                       >
                          <div className="flex items-center gap-4 w-full md:w-auto">
                             <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                <PackageSearch className="w-6 h-6 text-blue-600" />
                             </div>
                             <div>
                                <h3 className="font-bold text-blue-950">{request.serviceName}</h3>
                                <p className="text-xs text-slate-500">من: {request.providerName}</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 w-full md:w-auto flex-grow px-0 md:px-8">
                             <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">التاريخ</p>
                                <p className="text-xs font-bold text-slate-700">{request.date}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">الحالة</p>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                   {statusInfo.text}
                                </div>
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">المبلغ</p>
                                <p className="text-xs font-bold text-amber-500">{request.price} ر.س</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">رقم الطلب</p>
                                <p className="text-xs font-mono text-slate-500">{formatServiceRequestId(request.id)}</p>
                             </div>
                          </div>

                          <button className="p-2 text-slate-300 hover:text-amber-500 transition-colors md:block hidden">
                             <ChevronDown className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                       </div>
                       {isExpanded && renderExpandedDetails(request)}
                    </div>
                  );
               })}
            </div>
          )
        ) : (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageSearch className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-blue-950 mb-2">لا توجد طلبات خدمات حالية</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">لم تقم بطلب أي خدمات مساندة حتى الآن. استكشف خدماتنا المميزة لتبدأ!</p>
            <Link to="/services" className="inline-flex items-center gap-2 bg-blue-950 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg hover:shadow-blue-900/20 active:scale-95">
               استكشف الخدمات
            </Link>
          </div>
        )}
      </main>

      <ProviderChatModal isOpen={isProviderChatOpen} onClose={() => setIsProviderChatOpen(false)} providerName={chatData.providerName} hallName={chatData.hallName} />
      <ServiceRequestInvoice isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} request={viewingRequestForInvoice} />
      <Footer />
    </div>
  );
}
