import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Common Components
import { PrototypeBanner } from './components/common/PrototypeBanner';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { DemoGuideModal } from './components/common/DemoGuideModal';
import { BackendMonitorDrawer } from './components/monitor/BackendMonitorDrawer';

// Public Pages
import { MarketplacePage } from './pages/marketplace/MarketplacePage';
import { ProductDetailPage } from './pages/marketplace/ProductDetailPage';
import { CartPage } from './pages/marketplace/CartPage';
import { CheckoutPage } from './pages/marketplace/CheckoutPage';
import { OrderReceiptPage } from './pages/marketplace/OrderReceiptPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';

// Payment Provider Pages
import { StripePaymentPage } from './pages/pay/StripePaymentPage';
import { PayPalPaymentPage } from './pages/pay/PayPalPaymentPage';
import { FlutterwavePaymentPage } from './pages/pay/FlutterwavePaymentPage';

// Shop Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminDeliveries } from './pages/admin/AdminDeliveries';
import { AdminQuotations } from './pages/admin/AdminQuotations';
import { AdminPurchaseRequests } from './pages/admin/AdminPurchaseRequests';
import { AdminPayouts } from './pages/admin/AdminPayouts';
import { AdminSettings } from './pages/admin/AdminSettings';

// Operator Page
import { OperatorPage } from './pages/operator/OperatorPage';

// API Client
import { api } from './api/client';

// Payment Provider Dispatcher
const PaymentDispatcher: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  if (provider === 'paypal') return <PayPalPaymentPage />;
  if (provider === 'flutterwave') return <FlutterwavePaymentPage />;
  return <StripePaymentPage />;
};

export default function App() {
  const [demoGuideOpen, setDemoGuideOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshCartCount = async () => {
    try {
      const cart = await api.cart.getCart();
      const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshCartCount();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        {/* Banner on every page */}
        <PrototypeBanner />

        {/* Global Live Toasts */}
        <ToastContainer />

        {/* Backend Monitor Developer Tray */}
        <BackendMonitorDrawer />

        {/* Interactive Demo Guide Walkthrough */}
        <DemoGuideModal
          isOpen={demoGuideOpen}
          onClose={() => setDemoGuideOpen(false)}
        />

        <Routes>
          {/* Public Marketplace routes with Navbar */}
          <Route
            path="/"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <MarketplacePage
                  searchQuery={searchQuery}
                  onCartCountChange={refreshCartCount}
                />
              </>
            }
          />

          <Route
            path="/product/:id"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <ProductDetailPage onCartCountChange={refreshCartCount} />
              </>
            }
          />

          <Route
            path="/cart"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <CartPage onCartCountChange={refreshCartCount} />
              </>
            }
          />

          <Route
            path="/checkout"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <CheckoutPage />
              </>
            }
          />

          <Route
            path="/orders/:orderId"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <OrderReceiptPage />
              </>
            }
          />

          {/* Payment Providers */}
          <Route path="/pay/:provider/:orderId" element={<PaymentDispatcher />} />

          {/* Authentication & Onboarding */}
          <Route
            path="/login"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <LoginPage />
              </>
            }
          />

          <Route
            path="/onboarding"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <OnboardingPage />
              </>
            }
          />

          {/* Platform Operator */}
          <Route
            path="/operator"
            element={
              <>
                <Navbar
                  cartCount={cartCount}
                  onOpenDemoGuide={() => setDemoGuideOpen(true)}
                />
                <OperatorPage />
              </>
            }
          />

          {/* Tenant Shop Admin */}
          <Route path="/t/:shopSlug/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="deliveries" element={<AdminDeliveries />} />
            <Route path="quotations" element={<AdminQuotations />} />
            <Route path="purchase-requests" element={<AdminPurchaseRequests />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
