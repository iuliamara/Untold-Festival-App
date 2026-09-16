import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';

export const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { user, token } = useAuth();
  const { t, formatPrice, currency } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const getLocalizedTicketName = (ticketType?: string) => {
    if (!ticketType) return 'Untold Ticket';
    if (ticketType.startsWith('GA_DAY_')) {
      const day = ticketType.split('_')[2];
      return `${t('generalAccess')} - ${t('dayTicket')} ${day}`;
    }
    if (ticketType.startsWith('VIP_MAINSTAGE_DAY_')) {
      const day = ticketType.split('_')[3];
      return `${t('vipAccess')} - ${t('dayTicket')} ${day}`;
    }
    if (ticketType.startsWith('GA_4_DAYS')) {
      return `${t('generalAccess')} - ${t('daysOfMagic')}`;
    }
    if (ticketType.startsWith('VIP_MAINSTAGE_4_DAYS')) {
      return `${t('vipAccess')} - ${t('daysOfMagic')}`;
    }
    if (ticketType.startsWith('GALAXY_BACKSTAGE')) {
      return `Backstage Ultra Access - ${t('daysOfMagic')}`;
    }
    return ticketType.replace(/_/g, ' ');
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth', { state: { from: location } });
      return;
    }

    if (cartItems.length === 0) return;

    setIsProcessing(true);
    try {
      // Expand each cart item into individual ticket entries (one per quantity)
      const payloadTickets = cartItems.flatMap(item => 
        Array(item.quantity).fill({ ticketType: item.ticketType, price: item.price })
      );

      const response = await fetch('http://localhost:8080/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, tickets: payloadTickets, currency })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      // Redirect to Stripe Checkout page - URL is in data.data.url (ApiResponse wrapper)
      window.location.href = data.data.url;
    } catch (error) {
      console.error(error);
      alert('Checkout failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex-grow pt-[100px] pb-xl px-margin-mobile md:px-margin-desktop min-h-screen flex flex-col">
      <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary drop-shadow-[0_0_15px_rgba(209,188,255,0.4)] mb-lg text-center">
        {t('yourCart')}
      </h1>

      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col md:flex-row gap-lg">
        {/* Cart Items List */}
        <div className="flex-grow bg-surface-container/50 backdrop-blur-md rounded-xl p-md md:p-lg border border-outline-variant">
          {cartItems.length === 0 ? (
            <div className="text-center py-xl text-on-surface-variant font-body-lg">
              {t('emptyCart')}
              <button 
                onClick={() => navigate('/tickets')}
                className="block mx-auto mt-base text-primary hover:text-white transition-colors"
              >
                {t('goTickets')}
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cartItems.map(item => (
                <li key={item.id} className="flex flex-col md:flex-row justify-between items-center bg-surface-container-high p-4 rounded-lg border border-outline-variant/30 gap-4">
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="font-headline-md text-on-surface">{getLocalizedTicketName(item.ticketType)}</h3>
                    <p className="font-body-md text-tertiary-fixed-dim">{formatPrice(item.price)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-full text-on-surface hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="font-body-lg min-w-[2ch] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-full text-on-surface hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className="font-headline-md text-primary w-24 text-right">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-error hover:text-error-container p-2"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Order Summary */}
        <div className="w-full md:w-80 bg-surface-container-high rounded-xl p-md border border-outline-variant h-fit sticky top-24 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <h2 className="font-headline-md text-on-surface mb-md">{t('orderSummary')}</h2>
          <div className="flex justify-between mb-sm text-on-surface-variant font-body-md">
            <span>{t('subtotal')}</span>
            <span>{formatPrice(getTotalPrice())}</span>
          </div>
          <div className="flex justify-between mb-base text-on-surface-variant font-body-md">
            <span>{t('tickets')}</span>
            <span>{t('taxesInc')}</span>
          </div>
          <hr className="border-outline-variant/30 mb-base" />
          <div className="flex justify-between mb-lg font-headline-md text-on-surface">
            <span>{t('total')}</span>
            <span className="text-primary glow-text">{formatPrice(getTotalPrice())}</span>
          </div>
          
          <button 
            disabled={cartItems.length === 0 || isProcessing}
            onClick={handleCheckout}
            className="w-full bg-primary-container text-on-primary font-label-lg uppercase tracking-widest py-md rounded-lg hover:shadow-[0_0_20px_rgba(112,0,255,0.6)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isProcessing ? t('processing') : t('checkout')}
            {!isProcessing && <span className="material-symbols-outlined">arrow_forward</span>}
          </button>
        </div>
      </div>
    </main>
  );
};
