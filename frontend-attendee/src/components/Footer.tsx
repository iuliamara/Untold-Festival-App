import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

export const Footer: React.FC = () => {
  const { t } = useI18n();

  return (
    <footer className="w-full py-lg bg-surface-container-lowest border-t border-outline-variant flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-md z-40 relative">
      <Link to="/" className="text-headline-lg-mobile font-headline-lg-mobile text-primary">
        UNTOLD
      </Link>
      <div className="flex flex-wrap justify-center gap-md font-body-md text-body-md">
        <Link to="/privacy-policy" className="text-on-surface-variant hover:text-primary transition-colors">{t('privacyPolicy')}</Link>
        <Link to="/terms" className="text-on-surface-variant hover:text-primary transition-colors">{t('termsConditions')}</Link>
        <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">{t('press')}</a>
      </div>
      <div className="font-body-md text-body-md text-on-surface-variant text-center md:text-right uppercase">
        {t('copyright')}
      </div>
    </footer>
  );
};
