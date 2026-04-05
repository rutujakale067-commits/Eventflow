// =============================================
// App.js — Root with Routing
// =============================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Spinner from './components/ui/Spinner';

// Lazy-loaded pages
const Home          = lazy(() => import('./pages/Home'));
const Events        = lazy(() => import('./pages/Events'));
const EventDetail   = lazy(() => import('./pages/EventDetail'));
const Register      = lazy(() => import('./pages/Register'));
const Login         = lazy(() => import('./pages/Login'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const MyTickets     = lazy(() => import('./pages/MyTickets'));
const TicketView    = lazy(() => import('./pages/TicketView'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const PaymentSuccess= lazy(() => import('./pages/PaymentSuccess'));
const Profile       = lazy(() => import('./pages/Profile'));

// Admin pages
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminEvents       = lazy(() => import('./pages/admin/AdminEvents'));
const AdminEventForm    = lazy(() => import('./pages/admin/AdminEventForm'));
const AdminRegistrations= lazy(() => import('./pages/admin/AdminRegistrations'));
const AdminPayments     = lazy(() => import('./pages/admin/AdminPayments'));
const AdminCheckin      = lazy(() => import('./pages/admin/AdminCheckin'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));

// ---- Route Guards ----
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// ---- Layout wrapper ----
const Layout = ({ children, noFooter }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
    <Navbar />
    <main>{children}</main>
    {!noFooter && <Footer />}
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', fontFamily: 'inherit' },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            }}
          />
          <Suspense fallback={<Spinner fullscreen />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/events" element={<Layout><Events /></Layout>} />
              <Route path="/events/:id" element={<Layout><EventDetail /></Layout>} />

              {/* Auth */}
              <Route path="/login" element={<PublicOnlyRoute><Layout noFooter><Login /></Layout></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><Layout noFooter><Register /></Layout></PublicOnlyRoute>} />

              {/* Protected */}
              <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
              <Route path="/my-tickets" element={<PrivateRoute><Layout><MyTickets /></Layout></PrivateRoute>} />
              <Route path="/tickets/:registrationId" element={<PrivateRoute><Layout><TicketView /></Layout></PrivateRoute>} />
              <Route path="/checkout/:registrationId" element={<PrivateRoute><Layout noFooter><Checkout /></Layout></PrivateRoute>} />
              <Route path="/payment-success" element={<PrivateRoute><Layout><PaymentSuccess /></Layout></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
              <Route path="/admin/events/new" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
              <Route path="/admin/events/edit/:id" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
              <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
              <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
              <Route path="/admin/checkin" element={<AdminRoute><AdminCheckin /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
