import React, { lazy, Suspense } from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import WhatsAppWidget from "./components/WhatsAppWidget";
import { Loader2 } from "lucide-react";

// Eager: critical path pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

// Lazy: secondary pages
const SearchPage = lazy(() => import("./pages/SearchPage"));
const TripDetailPage = lazy(() => import("./pages/TripDetailPage"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BenefitsPage = lazy(() => import("./pages/BenefitsPage"));
const CommerceDetailPage = lazy(() => import("./pages/CommerceDetailPage"));
const CommercePortal = lazy(() => import("./pages/CommercePortal"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const CommerceWizard = lazy(() => import("./pages/CommerceWizard"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster position="top-right" richColors />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/trip/:id" element={<TripDetailPage />} />
                    <Route path="/benefits" element={<BenefitsPage />} />
                    <Route path="/commerce/:id" element={<CommerceDetailPage />} />
                    <Route path="/referral/:code" element={<ReferralPage />} />
                    <Route path="/member" element={
                      <ProtectedRoute roles={['member']}>
                        <MemberDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/chat" element={
                      <ProtectedRoute roles={['member', 'super_admin', 'admin']}>
                        <ChatPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/commerce-portal" element={
                      <ProtectedRoute roles={['commerce']}>
                        <CommercePortal />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute roles={['super_admin', 'admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/new-commerce" element={<CommerceWizard />} />
                  </Routes>
                  <WhatsAppWidget />
                </>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
