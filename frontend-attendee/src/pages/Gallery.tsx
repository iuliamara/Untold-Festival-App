import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

export const Gallery: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t } = useI18n();

  const toggleFaq = (index: number) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <>
      {/* Particle Background */}
      <div className="particle-bg" id="particles">
        <div className="particle" style={{width: '3px', height: '3px', left: '10vw', top: '20vh', animationDuration: '7s', background: '#d1bcff'}}></div>
        <div className="particle" style={{width: '4px', height: '4px', left: '80vw', top: '50vh', animationDuration: '9s', background: '#00dbe9'}}></div>
        <div className="particle" style={{width: '2px', height: '2px', left: '40vw', top: '80vh', animationDuration: '12s', background: '#d1bcff'}}></div>
        <div className="particle" style={{width: '5px', height: '5px', left: '60vw', top: '10vh', animationDuration: '6s', background: '#00dbe9'}}></div>
      </div>

      <main className="pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto relative z-10">
        {/* Hero Title */}
        <header className="mb-xl text-center md:text-left mt-lg relative">
          <h1 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-primary mb-4 drop-shadow-[0_0_20px_rgba(209,188,255,0.4)] animate-pulse">
            {t('magicMemories')}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl md:text-left text-center">
            {t('galleryDesc')}
          </p>
        </header>

        {/* Gallery Section (Masonry) */}
        <section className="mb-xl" id="gallery">
          <div className="masonry-grid">
            {/* Image 1 */}
            <div className="masonry-item rounded-xl overflow-hidden glass-card glowing-border-hover transition-all duration-500 relative group cursor-pointer">
              <img className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" src="/assets/gallery/1.jpg"/>
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">{t('mainstageMidnight')}</span>
              </div>
            </div>

            {/* Image 2 */}
            <div className="masonry-item rounded-xl overflow-hidden glass-card glowing-border-hover transition-all duration-500 relative group cursor-pointer">
              <img className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" src="/assets/gallery/2.png"/>
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-container">{t('theDrop')}</span>
              </div>
            </div>

            {/* Image 3 */}
            <div className="masonry-item rounded-xl overflow-hidden glass-card glowing-border-hover transition-all duration-500 relative group cursor-pointer">
              <img className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" src="/assets/gallery/3.jpg"/>
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">{t('seaOfStars')}</span>
              </div>
            </div>

            {/* Image 4 */}
            <div className="masonry-item rounded-xl overflow-hidden glass-card glowing-border-hover transition-all duration-500 relative group cursor-pointer">
              <img className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" src="/assets/gallery/4.jpg"/>
            </div>

            {/* Image 5 */}
            <div className="masonry-item rounded-xl overflow-hidden glass-card glowing-border-hover transition-all duration-500 relative group cursor-pointer">
              <img className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" src="/assets/gallery/5.jpg"/>
            </div>
          </div>
        </section>

        {/* Info & FAQ Section */}
        <section className="mb-xl pt-lg border-t border-white/5" id="info">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-lg">
            {t('festivalIntel')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
            {/* Location Bento Card */}
            <div className="glass-card rounded-2xl overflow-hidden glowing-border-active flex flex-col">
              <div className="h-64 w-full relative">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDISUGy6dZAS_2NeTmvSNhp1xysMGQm8yKua1V6d8PD-K-3ZoaVgiCBcfu9pl354WKxa-lqIQSn1N5DKtP27g3a83D67mLOjZjaajZng0XYNSLPTtQZVpaK1OKefORGEnqV4p3sBqBz2OzKgXOILAmKcKtKkLxPBNP2Z5y-yn9ez-pN9VXHbNvelg3MiiJbRTDKp3HctxjKANtakHVy3ZCZZs93FTpLqhvxjXWTEqwSP73piwMuNmoWegQ5nzotCBiXvYt5ajBbAVE"/>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">location_on</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface">Cluj-Arena, Romania</span>
                </div>
              </div>
              <div className="p-8 bg-surface-container-low/80 flex-1">
                <h3 className="font-body-lg text-body-lg text-primary mb-4 font-bold">{t('theEpicenter')}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  {t('epicenterDesc')}
                </p>
                <a href="https://www.google.com/maps/dir/?api=1&destination=Cluj+Arena" target="_blank" rel="noopener noreferrer" className="flex w-max items-center gap-2 text-tertiary font-label-sm text-label-sm uppercase tracking-widest hover:text-white transition-colors group">
                  {t('getDirections')}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* FAQ Accordion List */}
            <div className="flex flex-col gap-4">
              <div onClick={() => toggleFaq(0)} className={`glass-card rounded-xl p-6 border-l-4 transition-colors cursor-pointer group ${openFaq === 0 ? 'border-l-tertiary bg-white/5 glowing-border-active' : 'border-l-primary hover:bg-white/5'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className={`font-body-lg text-body-lg font-bold transition-colors ${openFaq === 0 ? 'text-tertiary' : 'text-on-surface group-hover:text-primary'}`}>{t('faq1Q')}</h4>
                  <span className={`material-symbols-outlined transition-colors transform ${openFaq === 0 ? 'text-tertiary rotate-45' : 'text-outline-variant group-hover:text-primary'}`}>add</span>
                </div>
                {openFaq === 0 && (
                  <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">
                    {t('faq1A')}
                  </p>
                )}
              </div>

              <div onClick={() => toggleFaq(1)} className={`glass-card rounded-xl p-6 border-l-4 transition-colors cursor-pointer group ${openFaq === 1 ? 'border-l-tertiary bg-white/5 glowing-border-active' : 'border-l-primary hover:bg-white/5'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className={`font-body-lg text-body-lg font-bold transition-colors ${openFaq === 1 ? 'text-tertiary' : 'text-on-surface group-hover:text-primary'}`}>{t('faq2Q')}</h4>
                  <span className={`material-symbols-outlined transition-colors transform ${openFaq === 1 ? 'text-tertiary rotate-45' : 'text-outline-variant group-hover:text-primary'}`}>add</span>
                </div>
                {openFaq === 1 && (
                  <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">
                    {t('faq2A')}
                  </p>
                )}
              </div>

              <div onClick={() => toggleFaq(2)} className={`glass-card rounded-xl p-6 border-l-4 transition-colors cursor-pointer group ${openFaq === 2 ? 'border-l-tertiary bg-white/5 glowing-border-active' : 'border-l-primary hover:bg-white/5'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className={`font-body-lg text-body-lg font-bold transition-colors ${openFaq === 2 ? 'text-tertiary' : 'text-on-surface group-hover:text-primary'}`}>{t('faq3Q')}</h4>
                  <span className={`material-symbols-outlined transition-colors transform ${openFaq === 2 ? 'text-tertiary rotate-45' : 'text-outline-variant group-hover:text-primary'}`}>add</span>
                </div>
                {openFaq === 2 && (
                  <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">
                    {t('faq3A')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};
