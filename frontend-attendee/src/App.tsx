import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MusicPlayer } from './components/MusicPlayer';
import { Home } from './pages/Home';
import { Lineup } from './pages/Lineup';
import { Tickets } from './pages/Tickets';
import { Gallery } from './pages/Gallery';
import { Auth } from './pages/Auth';
import { MyAccount } from './pages/MyAccount';
import { MySchedule } from './pages/MySchedule';
import { Cart } from './pages/Cart';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentCancel } from './pages/PaymentCancel';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsConditions } from './pages/TermsConditions';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { I18nProvider } from './context/I18nContext';
import { ScheduleProvider } from './context/ScheduleContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <ScheduleProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <MusicPlayer />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/lineup" element={<Lineup />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/info" element={<Gallery />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/my-account" element={<MyAccount />} />
                  <Route path="/my-schedule" element={<MySchedule />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/cancel" element={<PaymentCancel />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                </Routes>
                <Footer />
              </div>
            </Router>
          </CartProvider>
        </ScheduleProvider>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
