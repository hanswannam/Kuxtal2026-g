import React from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import WhatsAppWidget from "./components/WhatsAppWidget";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import TripDetailPage from "./pages/TripDetailPage";
import LoginPage from "./pages/LoginPage";
import MemberDashboard from "./pages/MemberDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BenefitsPage from "./pages/BenefitsPage";
import CommerceDetailPage from "./pages/CommerceDetailPage";
import CommercePortal from "./pages/CommercePortal";

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
        <Toaster position="top-right" richColors />
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
                <Route path="/member" element={
                  <ProtectedRoute roles={['member']}>
                    <MemberDashboard />
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
              </Routes>
              <WhatsAppWidget />
            </>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
