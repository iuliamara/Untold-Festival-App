import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const { language, currency, setLanguage, setCurrency, t } = useI18n();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full transition-colors duration-300 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-50 ${scrolled ? 'bg-surface/90' : 'bg-surface/70'}`}>
      <div className="flex justify-between items-center pl-margin-mobile md:pl-margin-desktop pr-margin-mobile md:pr-margin-desktop h-[72px] w-full">
        <Link to="/" className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary drop-shadow-[0_0_10px_rgba(209,188,255,0.5)] cursor-pointer">
          UNTOLD
        </Link>
        
        <div className="flex items-center gap-6 h-full">
          <div className="hidden md:flex items-stretch h-full">
            <Link to="/lineup" className="flex items-center font-label-sm text-label-sm uppercase tracking-widest text-primary hover:text-white transition-colors hover:bg-white/5 duration-300 px-6 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
              {t('lineup')}
            </Link>
            <Link to="/tickets" className="flex items-center font-label-sm text-label-sm uppercase tracking-widest text-primary hover:text-white transition-colors hover:bg-white/5 duration-300 px-6 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
              {t('tickets')}
            </Link>
            <Link to="/gallery" className="flex items-center font-label-sm text-label-sm uppercase tracking-widest text-primary hover:text-white transition-colors hover:bg-white/5 duration-300 px-6 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
              {t('gallery')}
            </Link>
          </div>

          <div className="flex items-center gap-4 h-full">
            {/* i18n Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 text-white font-label-sm text-label-sm transition-all duration-300 active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
              >
                <span className="font-mono">{language === 'en' ? '🇬🇧 EN' : '🇷🇴 RO'}</span>
                <span className="text-white/20">|</span>
                <span className="text-tertiary font-bold">{currency}</span>
                <span className="material-symbols-outlined text-[16px] text-white/50 transition-transform duration-300" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', fontVariationSettings: "'FILL' 0" }}>keyboard_arrow_down</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-surface-container-high/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(112,0,255,0.1)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="mb-3">
                      <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-2 px-1">Language</p>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => { setLanguage('en'); setDropdownOpen(false); }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold w-full transition-colors ${language === 'en' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/80 hover:bg-white/5 border border-transparent'}`}
                        >
                          <span>🇬🇧</span> English
                        </button>
                        <button
                          onClick={() => { setLanguage('ro'); setDropdownOpen(false); }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold w-full transition-colors ${language === 'ro' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/80 hover:bg-white/5 border border-transparent'}`}
                        >
                          <span>🇷🇴</span> Română
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-px bg-white/10 my-2" />
                    
                    <div>
                      <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-2 px-1">Currency</p>
                      <div className="flex flex-col gap-1">
                        {[
                          { code: 'RON', label: 'RON (lei)' },
                          { code: 'EUR', label: 'EUR (€)' },
                          { code: 'USD', label: 'USD ($)' }
                        ].map(curr => (
                          <button
                            key={curr.code}
                            onClick={() => { setCurrency(curr.code as any); setDropdownOpen(false); }}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold w-full transition-colors ${currency === curr.code ? 'bg-tertiary/20 text-tertiary border border-tertiary/20' : 'text-white/80 hover:bg-white/5 border border-transparent'}`}
                          >
                            <span>{curr.label}</span>
                            {currency === curr.code && <span className="material-symbols-outlined text-[16px] text-tertiary">check</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {user ? (
              <>
                <Link to="/my-account" className="hidden md:flex items-center font-label-sm text-label-sm uppercase tracking-widest bg-tertiary text-surface hover:brightness-110 transition-all px-6 h-[40px] rounded drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                  {t('myAccount')}
                </Link>
                <Link to="/my-schedule" className="hidden md:flex items-center font-label-sm text-label-sm uppercase tracking-widest text-primary hover:text-white transition-colors hover:bg-white/5 px-6 h-[40px] rounded">
                  {t('mySchedule')}
                </Link>
                <Link to="/cart" className="relative text-on-surface hover:text-primary transition-colors p-2 flex items-center">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>shopping_cart</span>
                  {getTotalItems() > 0 && (
                    <span className="absolute top-0 -right-2 bg-primary text-on-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
                <button onClick={logout} className="hidden md:flex items-center font-label-sm text-label-sm uppercase tracking-widest text-error bg-transparent hover:bg-white/5 transition-all px-6 h-[40px] rounded border border-error/20 hover:border-error/50">
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link to="/auth" className="hidden md:flex items-center font-label-sm text-label-sm uppercase tracking-widest bg-primary text-surface hover:bg-inverse-primary transition-colors h-[40px] px-6 rounded drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                {t('login')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center text-white p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-surface-container-high/95 backdrop-blur-xl border-b border-white/10 md:hidden flex flex-col p-4 gap-4 shadow-xl animate-in slide-in-from-top-2 duration-300 z-40">
          <Link to="/lineup" onClick={() => setMobileMenuOpen(false)} className="text-white font-label-lg uppercase tracking-widest p-3 hover:bg-white/5 rounded flex items-center gap-3">
            <span className="material-symbols-outlined text-white/50">queue_music</span>
            {t('lineup')}
          </Link>
          <Link to="/tickets" onClick={() => setMobileMenuOpen(false)} className="text-white font-label-lg uppercase tracking-widest p-3 hover:bg-white/5 rounded flex items-center gap-3">
            <span className="material-symbols-outlined text-white/50">local_activity</span>
            {t('tickets')}
          </Link>
          <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="text-white font-label-lg uppercase tracking-widest p-3 hover:bg-white/5 rounded flex items-center gap-3">
            <span className="material-symbols-outlined text-white/50">photo_library</span>
            {t('gallery')}
          </Link>
          
          <div className="h-px bg-white/10 my-2" />
          
          {user ? (
            <>
              <Link to="/my-account" onClick={() => setMobileMenuOpen(false)} className="text-tertiary font-label-lg uppercase tracking-widest p-3 hover:bg-white/5 rounded flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary/50">account_circle</span>
                {t('myAccount')}
              </Link>
              <Link to="/my-schedule" onClick={() => setMobileMenuOpen(false)} className="text-primary font-label-lg uppercase tracking-widest p-3 hover:bg-white/5 rounded flex items-center gap-3">
                <span className="material-symbols-outlined text-primary/50">event</span>
                {t('mySchedule')}
              </Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-error font-label-lg uppercase tracking-widest p-3 hover:bg-white/5 rounded flex items-center gap-3 text-left w-full">
                <span className="material-symbols-outlined text-error/50">logout</span>
                {t('logout')}
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="text-primary font-label-lg uppercase tracking-widest p-3 hover:bg-white/5 rounded flex items-center gap-3">
              <span className="material-symbols-outlined text-primary/50">login</span>
              {t('login')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
