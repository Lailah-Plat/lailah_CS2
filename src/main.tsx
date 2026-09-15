import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Safe environment guard to prevent runtime ReferenceError: process is not defined in any library
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  (window as any).global = (window as any).global || window;

  // Global chunk reload handler for dynamic imports / Vite production asset mismatches
  const handleChunkLoadFailure = (errorMsg: string) => {
    const isChunkFailure = 
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Loading chunk') ||
      errorMsg.includes('error loading dynamically imported module') ||
      errorMsg.includes('Importing a module script failed');

    if (isChunkFailure && window.sessionStorage) {
      const lastReload = sessionStorage.getItem('lailah_chunk_reload_ts');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 15000) {
        sessionStorage.setItem('lailah_chunk_reload_ts', String(now));
        console.warn('🔄 [Main Startup] Dynamic chunk load failure detected. Performing recovery reload...');
        window.location.reload();
      }
    }
  };

  window.addEventListener('error', (event) => {
    if (event && event.message) {
      handleChunkLoadFailure(event.message);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event?.reason?.message || String(event?.reason || '');
    if (reasonMsg) {
      handleChunkLoadFailure(reasonMsg);
    }
  });
}

// Light / Entry Eager Routes
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import FaqPage from './pages/FaqPage';

// Safe Resilient Lazy Loader with auto-retry on dynamic chunk import failure
function safeLazy<T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T } | any>) {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module.default ? { default: module.default } : { default: module };
    } catch (err) {
      console.warn('⚠️ [Router] Dynamic import retry attempt:', err);
      await new Promise((resolve) => setTimeout(resolve, 350));
      try {
        const module = await importFn();
        return module.default ? { default: module.default } : { default: module };
      } catch (retryErr) {
        console.error('❌ [Router] Dynamic import failed after retry:', retryErr);
        throw retryErr;
      }
    }
  });
}

// Lazy Loaded Modules & Heavy Views (Reduces initial startup graph & prevents white screen)
const App = safeLazy(() => import('./App'));
const ExplorePage = safeLazy(() => import('./pages/ExplorePage'));
const HallsPage = safeLazy(() => import('./pages/HallsPage'));
const NewPage = safeLazy(() => import('./pages/NewPage'));
const ServicesPage = safeLazy(() => import('./pages/ServicesPage'));
const CalendarPage = safeLazy(() => import('./pages/CalendarPage'));
const BookingsPage = safeLazy(() => import('./pages/BookingsPage'));
const FavoritesPage = safeLazy(() => import('./pages/FavoritesPage'));
const ProfilePage = safeLazy(() => import('./pages/ProfilePage'));
const HallDetailsPage = safeLazy(() => import('./pages/HallDetailsPage'));
const SubscriptionPage = safeLazy(() => import('./pages/SubscriptionPage'));
const SupportPage = safeLazy(() => import('./pages/SupportPage'));
const HallsServicesPortalPage = safeLazy(() => import('./pages/HallsServicesPortalPage'));
const LogisticsOperationsPortalPage = safeLazy(() => import('./pages/LogisticsOperationsPortalPage'));
const ProviderMessagesPage = safeLazy(() => import('./pages/ProviderMessagesPage'));
const ProviderDashboardPage = safeLazy(() => import('./pages/ProviderDashboardPage'));
const EventBudgetPlannerPage = safeLazy(() => import('./pages/EventBudgetPlannerPage'));
const BundledPackagesPage = safeLazy(() => import('./pages/BundledPackagesPage'));
const MapExplorerPage = safeLazy(() => import('./pages/MapExplorerPage'));
const ProviderTrustProfilePage = safeLazy(() => import('./pages/ProviderTrustProfilePage'));
const LPASPublicPage = safeLazy(() => import('./pages/LPASPublicPage'));
const OperationsCenterPage = safeLazy(() => import('./pages/OperationsCenterPage'));

import { RoleRouteGuard, AdminDashboardRouteGuard, OperationsRouteGuard } from './components/RoleGuard';
import ProviderRealtimeChatNotifier from './components/ProviderRealtimeChatNotifier';
import PageLoadingFallback from './components/common/PageLoadingFallback';
import './index.css';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const RouteErrorPage = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-10 h-10 text-rose-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">عذراً، حدث خطأ في الصفحة</h1>
      <p className="text-slate-500 mb-8 leading-relaxed text-sm">
        حدثت مشكلة أثناء تحميل هذه الصفحة أو انتهت صلاحية الجلسة. يمكنك إعادة التحميل أو العودة للرئيسية.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => window.location.reload()} 
          className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> إعادة تحميل
        </button>
        <button 
          onClick={() => window.location.href = '/'} 
          className="flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 text-sm"
        >
          <Home className="w-4 h-4" /> الرئيسية
        </button>
      </div>
    </div>
  </div>
);

// Suspense Helper for clean route isolation
const withSuspense = (Component: React.ComponentType<any>, message?: string) => (
  <Suspense fallback={<PageLoadingFallback message={message} />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/landing/:slug",
    element: withSuspense(LPASPublicPage, 'جاري تحميل صفحة الهبوط...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/landing",
    element: withSuspense(LPASPublicPage, 'جاري تحميل صفحة الهبوط...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/lp/:slug",
    element: withSuspense(LPASPublicPage, 'جاري تحميل صفحة الهبوط...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/lp",
    element: withSuspense(LPASPublicPage, 'جاري تحميل صفحة الهبوط...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/lpas/:slug",
    element: withSuspense(LPASPublicPage, 'جاري تحميل صفحة الهبوط...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/lpas",
    element: withSuspense(LPASPublicPage, 'جاري تحميل صفحة الهبوط...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/register",
    element: <RegisterPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/complete-profile",
    element: <CompleteProfilePage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/explore",
    element: withSuspense(ExplorePage, 'جاري استكشاف القاعات والخدمات...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/halls",
    element: withSuspense(HallsPage, 'جاري تحميل دليل القاعات...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/hall/:id",
    element: withSuspense(HallDetailsPage, 'جاري تحميل تفاصيل القاعة...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/new",
    element: withSuspense(NewPage, 'جاري تحميل الإضافات الحديثة...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/services",
    element: withSuspense(ServicesPage, 'جاري تحميل دليل الخدمات المساندة...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/calendar",
    element: withSuspense(CalendarPage, 'جاري تحميل التقويم والمواعيد...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/about",
    element: <AboutPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/contact",
    element: <ContactPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/bookings",
    element: withSuspense(BookingsPage, 'جاري تحميل سجل الحجوزات والطلبات...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/favorites",
    element: withSuspense(FavoritesPage, 'جاري تحميل قائمة المفضلة...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/service-requests",
    element: <Navigate to="/bookings?tab=services" replace />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/profile",
    element: withSuspense(ProfilePage, 'جاري تحميل الملف الشخصي...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/privacy",
    element: <PrivacyPolicyPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/terms",
    element: <TermsPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/faq",
    element: <FaqPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/subscription",
    element: withSuspense(SubscriptionPage, 'جاري تحميل باقات الاشتراك...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/dashboard",
    element: (
      <AdminDashboardRouteGuard>
        {withSuspense(App, 'جاري تحميل لوحة التحكم المركزية...')}
      </AdminDashboardRouteGuard>
    ),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider-dashboard",
    element: (
      <RoleRouteGuard allowedRoles={['provider', 'admin']}>
        {withSuspense(ProviderDashboardPage, 'جاري تشغيل مساحة عمل مزود الخدمة...')}
      </RoleRouteGuard>
    ),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider/bos/*",
    element: <Navigate to="/provider-dashboard" replace />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider/bos",
    element: <Navigate to="/provider-dashboard" replace />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider/lite/*",
    element: <Navigate to="/provider-dashboard" replace />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider/lite",
    element: <Navigate to="/provider-dashboard" replace />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider/dashboard",
    element: <Navigate to="/provider-dashboard" replace />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/halls-services-portal",
    element: withSuspense(HallsServicesPortalPage, 'جاري تحميل بوابة القاعات والخدمات...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/logistics-portal",
    element: (
      <OperationsRouteGuard>
        {withSuspense(OperationsCenterPage, 'جاري تشغيل مركز العمليات التشغيلية واللوجستية...')}
      </OperationsRouteGuard>
    ),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/workspace/operations",
    element: (
      <OperationsRouteGuard>
        {withSuspense(OperationsCenterPage, 'جاري تشغيل مركز العمليات...')}
      </OperationsRouteGuard>
    ),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/operations",
    element: (
      <OperationsRouteGuard>
        {withSuspense(OperationsCenterPage, 'جاري تشغيل المنظومة التشغيلية الموحدة...')}
      </OperationsRouteGuard>
    ),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/operations/*",
    element: (
      <OperationsRouteGuard>
        {withSuspense(OperationsCenterPage, 'جاري تشغيل المنظومة التشغيلية الموحدة...')}
      </OperationsRouteGuard>
    ),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/support",
    element: withSuspense(SupportPage, 'جاري تحميل مركز الدعم والمساعدة...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider-messages",
    element: withSuspense(ProviderMessagesPage, 'جاري تحميل الرسائل والمحادثات...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/budget-planner",
    element: withSuspense(EventBudgetPlannerPage, 'جاري إعداد مخطط الميزانية التفاعلي...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/offers",
    element: withSuspense(BundledPackagesPage, 'جاري تحميل الباقات والعروض الترويجية...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/bundled-packages",
    element: withSuspense(BundledPackagesPage, 'جاري تحميل الباقات والعروض الترويجية...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/map",
    element: withSuspense(MapExplorerPage, 'جاري تحميل الخريطة التفاعلية...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider-profile/:providerName",
    element: withSuspense(ProviderTrustProfilePage, 'جاري تحميل ملف الشريك المعتمد...'),
    errorElement: <RouteErrorPage />
  },
  {
    path: "*",
    element: <HomePage />,
    errorElement: <RouteErrorPage />
  }
]);

import {ThemeProvider} from './context/ThemeContext';
import {CalendarProvider} from './context/CalendarContext';
import ErrorBoundary from './components/common/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <CalendarProvider>
          <RouterProvider router={router} />
          <ProviderRealtimeChatNotifier />
        </CalendarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
