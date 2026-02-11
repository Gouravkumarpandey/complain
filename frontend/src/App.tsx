import React from 'react';
// i18n removed

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PageLoadingSkeleton, DashboardSkeleton } from './components/common/SkeletonLoader';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { ComplaintProvider } from './contexts/ComplaintContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { HomePage } from './components/home/HomePage';
import { LoginForm } from './components/auth/LoginForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import FacebookCallback from './components/auth/FacebookCallback';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AgentDashboard } from './components/dashboard/AgentDashboard';
import { AnalyticsReportsDashboard } from './components/dashboard/AnalyticsReportsDashboard';
import { AdminLogin } from './components/auth/AdminLogin';
import { ChatBot } from './components/chatbot/ChatBot';
import { useAuth } from './hooks/useAuth';
import { Notifications } from './components/notifications/Notifications';
import { useNotificationPermission } from './hooks/useSocket';
import { PricingPlans } from './components/subscription/PricingPlans';
import { PaymentSuccess } from './components/subscription/PaymentSuccess';
import { PaymentCancel } from './components/subscription/PaymentCancel';
import { CookieConsent } from './components/common/CookieConsent';
// import { LanguageSwitchInstructions } from './components/common/LanguageSwitchInstructions'; (removed)

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

// Dashboard Route Component
function DashboardRoute() {
  const { user } = useAuth();
  useNotificationPermission();

  // If user data isn't available, check localStorage as fallback
  const [fallbackUser, setFallbackUser] = React.useState(null);
  const [hasAttemptedRecovery, setHasAttemptedRecovery] = React.useState(false);

  React.useEffect(() => {
    // Only attempt recovery once per component lifecycle
    if (hasAttemptedRecovery) return;

    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setFallbackUser(parsedUser);

          // Track that we've attempted recovery
          setHasAttemptedRecovery(true);

          // Force reload once to properly initialize auth context if needed
          // But only if we haven't tried before in this session
          if (!sessionStorage.getItem('dashboard_loaded')) {
            sessionStorage.setItem('dashboard_loaded', 'true');
            // Use a small timeout to prevent immediate reload loops
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch {
          // Error parsing user from localStorage
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const activeUser = user || fallbackUser;

  return (
    <div className="min-h-screen bg-gray-900">
      <Notifications />
      {activeUser?.role === 'admin' && <AdminDashboard />}
      {activeUser?.role === 'agent' && <AgentDashboard />}
      {activeUser?.role === 'user' && <UserDashboard />}
      {activeUser?.role === 'analytics' && <AnalyticsReportsDashboard />}
      {!activeUser?.role && (
        <DashboardSkeleton />
      )}
      <ChatBot />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state when auth is initializing
  if (isLoading) {
    return <PageLoadingSkeleton message="Initializing your session..." />;
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <HomePage />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginForm />
            )
          }
        />

        <Route path="/auth/facebook/callback" element={<FacebookCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin Route - Direct access only */}
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AdminLogin />
            )
          }
        />

        {/* Pricing and Payment Routes */}
        <Route path="/pricing" element={<PricingPlans />} />
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/cancel"
          element={
            <ProtectedRoute>
              <PaymentCancel />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRoute />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsent />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <ComplaintProvider>
            <NotificationProvider>
              <Router>
                <AppContent />
              </Router>
            </NotificationProvider>
          </ComplaintProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;