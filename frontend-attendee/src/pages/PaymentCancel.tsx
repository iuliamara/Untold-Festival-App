import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

export const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <main className="flex-grow pt-[100px] pb-xl px-margin-mobile md:px-margin-desktop min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-lg border border-error/30">
          <span className="material-symbols-outlined text-error text-5xl">cancel</span>
        </div>
        <h1 className="font-display-lg-mobile md:font-display-lg text-on-surface mb-sm">
          {t('paymentCancelled')}
        </h1>
        <p className="font-body-lg text-on-surface-variant mb-lg max-w-md mx-auto">
          {t('paymentCancelledDesc')}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/cart')}
            className="bg-primary-container text-on-primary font-label-sm uppercase tracking-widest px-8 py-3 rounded-lg hover:shadow-[0_0_20px_rgba(112,0,255,0.6)] transition-all"
          >
            {t('returnCartBtn')}
          </button>
          <button
            onClick={() => navigate('/tickets')}
            className="border border-outline-variant text-on-surface font-label-sm uppercase tracking-widest px-8 py-3 rounded-lg hover:bg-white/5 transition-all"
          >
            {t('browseTicketsBtn')}
          </button>
        </div>
      </div>
    </main>
  );
};
