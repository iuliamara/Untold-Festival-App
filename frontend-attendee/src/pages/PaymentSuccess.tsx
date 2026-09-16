import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

type Status = 'loading' | 'success' | 'error';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const hasConfirmed = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setErrorMsg(t('noSessionId') || 'No session ID found. Your payment may not have completed.');
      return;
    }

    if (hasConfirmed.current) return;
    hasConfirmed.current = true;

    const confirmPayment = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/payment/confirm', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        });

        if (!response.ok) {
          const errText = await response.text();
          let errMsg = 'Confirmation failed with status ' + response.status;
          try {
            const err = JSON.parse(errText);
            if (err.message) errMsg = err.message;
          } catch (e) { /* ignore */ }
          throw new Error(errMsg);
        }

        const data = await response.json();
        // ApiResponse<List<TicketResponse>> - check the type field
        if (data.type !== 'SUCCESS') {
          throw new Error(data.message || 'Payment confirmation failed');
        }

        clearCart();
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || t('confirmOrderError') || 'Something went wrong confirming your order.');
      }
    };

    confirmPayment();
  }, [searchParams, clearCart, token, t]);

  return (
    <main className="flex-grow pt-[100px] pb-xl px-margin-mobile md:px-margin-desktop min-h-screen flex flex-col items-center justify-center">
      {status === 'loading' && (
        <div className="text-center animate-pulse">
          <span className="material-symbols-outlined text-primary text-6xl block mb-md">hourglass_top</span>
          <h1 className="font-display-lg-mobile text-on-surface mb-sm">{t('confirmingPayment')}</h1>
          <p className="font-body-md text-on-surface-variant">{t('confirmWait')}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-lg border border-primary/30 shadow-[0_0_40px_rgba(112,0,255,0.3)]">
            <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
          </div>
          <h1 className="font-display-lg-mobile md:font-display-lg text-primary drop-shadow-[0_0_15px_rgba(209,188,255,0.5)] mb-sm">
            {t('successTitle')}
          </h1>
          <p className="font-body-lg text-on-surface-variant mb-lg max-w-md mx-auto">
            {t('successDesc')}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/my-account')}
              className="bg-primary-container text-on-primary font-label-sm uppercase tracking-widest px-8 py-3 rounded-lg hover:shadow-[0_0_20px_rgba(112,0,255,0.5)] transition-all"
            >
              {t('viewTicketsBtn')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="border border-outline-variant text-on-surface font-label-sm uppercase tracking-widest px-8 py-3 rounded-lg hover:bg-white/5 transition-all"
            >
              {t('backHomeBtn')}
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-lg border border-error/30">
            <span className="material-symbols-outlined text-error text-5xl">error</span>
          </div>
          <h1 className="font-display-lg-mobile text-error mb-sm">{t('cancelTitle')}</h1>
          <p className="font-body-md text-on-surface-variant mb-lg max-w-md mx-auto">{errorMsg}</p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-primary-container text-on-primary font-label-sm uppercase tracking-widest px-8 py-3 rounded-lg"
          >
            {t('returnCartBtn')}
          </button>
        </div>
      )}
    </main>
  );
};
