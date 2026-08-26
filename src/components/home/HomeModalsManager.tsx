import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import ProviderChatModal from '../ProviderChatModal';
import ServiceDetailsModal from '../ServiceDetailsModal';
import RequestServiceModal from '../RequestServiceModal';
import { EventService } from '../../data/mockData';

interface HomeModalsManagerProps {
  providerModal: { isOpen: boolean; type: 'login' | 'upgrade' | null };
  setProviderModal: (val: { isOpen: boolean; type: 'login' | 'upgrade' | null }) => void;
  isProviderChatOpen: boolean;
  setIsProviderChatOpen: (open: boolean) => void;
  chatData: { providerName: string; hallName: string };
  selectedServiceForDetails: EventService | null;
  isServiceDetailsOpen: boolean;
  setIsServiceDetailsOpen: (open: boolean) => void;
  setSelectedServiceForDetails: (svc: EventService | null) => void;
  selectedServiceForRequest: EventService | null;
  isServiceRequestOpen: boolean;
  setIsServiceRequestOpen: (open: boolean) => void;
  setSelectedServiceForRequest: (svc: EventService | null) => void;
  currentUserData: any;
  userBookings: any[];
}

export const HomeModalsManager: React.FC<HomeModalsManagerProps> = ({
  providerModal,
  setProviderModal,
  isProviderChatOpen,
  setIsProviderChatOpen,
  chatData,
  selectedServiceForDetails,
  isServiceDetailsOpen,
  setIsServiceDetailsOpen,
  setSelectedServiceForDetails,
  selectedServiceForRequest,
  isServiceRequestOpen,
  setIsServiceRequestOpen,
  setSelectedServiceForRequest,
  currentUserData,
  userBookings
}) => {
  return (
    <>
      {/* Provider Modal */}
      {providerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold flex items-center gap-2 text-blue-950">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                تنبيه
              </h3>
              <button onClick={() => setProviderModal({isOpen: false, type: null})} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {providerModal.type === 'login' ? (
                <div>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    يجب عليك تسجيل الدخول بحساب مزود خدمة أولاً لتتمكن من إضافة قاعتك أو استراحتك والبدء في استقبال الحجوزات.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      to="/login"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-center text-sm transition-all"
                      onClick={() => setProviderModal({isOpen: false, type: null})}
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-center text-sm transition-all"
                      onClick={() => setProviderModal({isOpen: false, type: null})}
                    >
                      حساب جديد
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    حسابك الحالي مسجل كـ "عميل". لإضافة قاعات وإدارتها، يرجى الترقية إلى حساب "مزود خدمة" أو تسجيل الدخول بحساب المزود الخاص بك.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      to="/pricing"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-center text-sm transition-all"
                      onClick={() => setProviderModal({isOpen: false, type: null})}
                    >
                      ترقية الحساب الآن
                    </Link>
                    <button
                      onClick={() => setProviderModal({isOpen: false, type: null})}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-center text-sm transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provider Direct Chat Modal */}
      <ProviderChatModal
        isOpen={isProviderChatOpen}
        onClose={() => setIsProviderChatOpen(false)}
        providerName={chatData.providerName}
        hallName={chatData.hallName}
      />

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={isServiceDetailsOpen}
        onClose={() => {
          setIsServiceDetailsOpen(false);
          setSelectedServiceForDetails(null);
        }}
        service={selectedServiceForDetails}
        onRequest={(svc) => {
          setIsServiceDetailsOpen(false);
          setSelectedServiceForDetails(null);
          setSelectedServiceForRequest(svc);
          setIsServiceRequestOpen(true);
        }}
      />

      {/* Request Service Modal */}
      <RequestServiceModal
        isOpen={isServiceRequestOpen}
        onClose={() => {
          setIsServiceRequestOpen(false);
          setSelectedServiceForRequest(null);
        }}
        service={selectedServiceForRequest}
        currentUserData={currentUserData}
        userBookings={userBookings}
        onSuccess={() => {
          setIsServiceRequestOpen(false);
          setSelectedServiceForRequest(null);
        }}
      />
    </>
  );
};
