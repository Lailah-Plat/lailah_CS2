import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import HallsPage from './pages/HallsPage';
import NewPage from './pages/NewPage';
import ServicesPage from './pages/ServicesPage';
import CalendarPage from './pages/CalendarPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BookingsPage from './pages/BookingsPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import ServiceRequestsPage from './pages/ServiceRequestsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import FaqPage from './pages/FaqPage';
import HallDetailsPage from './pages/HallDetailsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import RegisterPage from './pages/RegisterPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import SupportPage from './pages/SupportPage';
import HallsServicesPortalPage from './pages/HallsServicesPortalPage';
import LogisticsOperationsPortalPage from './pages/LogisticsOperationsPortalPage';
import ProviderMessagesPage from './pages/ProviderMessagesPage';
import ProviderDashboardPage from './pages/ProviderDashboardPage';
import EventBudgetPlannerPage from './pages/EventBudgetPlannerPage';
import BundledPackagesPage from './pages/BundledPackagesPage';
import MapExplorerPage from './pages/MapExplorerPage';
import ProviderTrustProfilePage from './pages/ProviderTrustProfilePage';
import { RoleRouteGuard } from './components/RoleGuard';
import ProviderRealtimeChatNotifier from './components/ProviderRealtimeChatNotifier';
import './index.css';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const RouteErrorPage = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">عذراً، حدث خطأ في الصفحة</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">
        حدثت مشكلة أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
          <RefreshCw className="w-5 h-5" /> إعادة تحميل
        </button>
        <button onClick={() => window.location.href = '/'} className="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95">
          <Home className="w-5 h-5" /> الرئيسية
        </button>
      </div>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
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
    element: <ExplorePage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/halls",
    element: <HallsPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/hall/:id",
    element: <HallDetailsPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/new",
    element: <NewPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/services",
    element: <ServicesPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/calendar",
    element: <CalendarPage />,
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
    element: <BookingsPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/favorites",
    element: <FavoritesPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/service-requests",
    element: <ServiceRequestsPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/profile",
    element: <ProfilePage />,
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
    element: <SubscriptionPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/dashboard",
    element: <App />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider-dashboard",
    element: (
      <RoleRouteGuard allowedRoles={['provider', 'admin']}>
        <ProviderDashboardPage />
      </RoleRouteGuard>
    ),
    errorElement: <RouteErrorPage />
  },
  {
    path: "/halls-services-portal",
    element: <HallsServicesPortalPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/logistics-portal",
    element: <LogisticsOperationsPortalPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/workspace/operations",
    element: <LogisticsOperationsPortalPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/support",
    element: <SupportPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider-messages",
    element: <ProviderMessagesPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/budget-planner",
    element: <EventBudgetPlannerPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/offers",
    element: <BundledPackagesPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/bundled-packages",
    element: <BundledPackagesPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/map",
    element: <MapExplorerPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/provider-profile/:providerName",
    element: <ProviderTrustProfilePage />,
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <CalendarProvider>
        <RouterProvider router={router} />
        <ProviderRealtimeChatNotifier />
      </CalendarProvider>
    </ThemeProvider>
  </StrictMode>,
);
