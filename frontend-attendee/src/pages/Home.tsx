import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

export const Home: React.FC = () => {
  const { t } = useI18n();

  const calculateTimeLeft = () => {
    const targetDate = new Date('2026-12-06T16:00:00');
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000); // Change every second
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="flex-grow flex flex-col relative pt-[80px]">
      {/* Hero Section with Background Imagery */}
      <section className="relative min-h-[921px] flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop overflow-hidden">
        {/* Background Image/Video */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <iframe
            className="w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src="https://www.youtube.com/embed/bLyb7XRwTb4?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=bLyb7XRwTb4"
            allow="autoplay; encrypted-media"
            frameBorder="0"
          ></iframe>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-surface/50 via-transparent to-background"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center flex flex-col items-center max-w-5xl mx-auto gap-md mt-xl">
          {/* Floating Chip */}
          <div className="glass-panel px-4 py-2 rounded-full inline-flex items-center gap-2 border border-tertiary/30 shadow-[0_0_15px_rgba(0,219,233,0.2)] animate-pulse mb-4">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary">{t('phase1Alert')}</span>
          </div>
          
          {/* Headline */}
          <h1 className="font-display-xl-mobile text-display-xl-mobile md:font-display-xl md:text-display-xl text-primary drop-shadow-[0_0_20px_rgba(209,188,255,0.4)] uppercase m-0 leading-tight">
            {t('enterTheMagic')} <br/><span className="text-white">{t('magic')}</span>
          </h1>
          
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-4 text-center">
            {t('experienceText')}
          </p>
          
          {/* Countdown */}
          <div className="flex gap-4 md:gap-gutter mt-lg glass-panel p-4 md:p-6 rounded-xl border-t border-primary/20 backdrop-blur-md">
            <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
              <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-secondary">{timeLeft.days}</span>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">{t('days')}</span>
            </div>
            <div className="text-outline text-2xl font-light self-start mt-2 md:mt-4">:</div>
            <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
              <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-secondary">{timeLeft.hours}</span>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">{t('hours')}</span>
            </div>
            <div className="text-outline text-2xl font-light self-start mt-2 md:mt-4">:</div>
            <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
              <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-secondary">{timeLeft.minutes}</span>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">{t('mins')}</span>
            </div>
            <div className="text-outline text-2xl font-light self-start mt-2 md:mt-4">:</div>
            <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
              <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-secondary">{timeLeft.seconds}</span>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">{t('secs')}</span>
            </div>
          </div>
          
          {/* Primary CTA */}
          <Link to="/tickets" className="mt-lg bg-primary-container text-on-primary-container px-10 py-5 font-label-sm text-label-sm uppercase tracking-widest glow-effect active:scale-95 transition-all duration-300 rounded hover:bg-inverse-primary border border-primary-fixed-dim/30 shadow-[0_0_30px_rgba(112,0,255,0.4)] flex items-center gap-3 group">
            {t('secureYourPass')}
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{fontVariationSettings: "'FILL' 0"}}>arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Flash Sale Banner */}
      <FlashSaleBanner />

      {/* Featured Artists Bento Grid */}
      <section className="py-xl px-margin-mobile md:px-margin-desktop relative z-10 bg-background">
        <div className="flex justify-between items-end mb-lg">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-secondary uppercase">{t('headliners')}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('architectsText')}</p>
          </div>
          <Link to="/lineup" className="hidden md:flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest text-tertiary hover:text-white transition-colors">
            {t('viewFullLineup')}
            <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 0"}}>chevron_right</span>
          </Link>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-gutter auto-rows-[250px] md:auto-rows-[300px]">
          {/* Large Item (Span 8) */}
          <div className="md:col-span-8 relative group rounded-xl overflow-hidden glass-panel cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80" src="/assets/artists/Martin_Garrix.png"/>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
            {/* Inner Glow Border on Hover */}
            <div className="absolute inset-0 border border-transparent group-hover:border-tertiary/50 transition-colors duration-300 rounded-xl z-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-6 z-10 w-full flex justify-between items-end">
              <div>
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest mb-2 block">{t('liveAct')}</span>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-white uppercase group-hover:text-glow transition-all">Martin Garrix</h3>
              </div>
              <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-primary-container group-hover:text-on-primary-container transition-all duration-300">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
              </button>
            </div>
          </div>

          {/* Small Item (Span 4) */}
          <div className="md:col-span-4 relative group rounded-xl overflow-hidden glass-panel cursor-pointer border border-tertiary/30 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-70" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiObdcfBVRsyeUL53jXWFdkfCkkuht3hWERV7reH36aLLnxqK2Up7m4NO6etSEfVAH5RV3TGb8DnevZJtXqFlDGMIHFMryd331Sj63wIL3GeCYgpairMZVfRiVYW7WOMugfV0NAuwDFQNaB9nACzHzhd01ezJ8-4MmcAHm3NtYXZo7ZoxRENi0lL6CdUNHcnPLVQh7RTf-vmdOFpmQI9CRDAw0Hz-qM6N5WOqV0HbyvrQkWDm8dhHsK1x7SnUfF133ayHYTC991dE"/>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-error-container/80 text-on-error-container font-label-sm text-[10px] px-2 py-1 rounded border border-error/50 flex items-center gap-1 backdrop-blur-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span> LIVE NOW
              </div>
            </div>
            <div className="absolute bottom-0 left-0 p-6 z-10">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-white uppercase group-hover:text-glow transition-all">Armin Van Buuren</h3>
              <p className="font-label-sm text-label-sm text-outline mt-1 uppercase tracking-wider">Mainstage</p>
            </div>
          </div>

          {/* Small Item (Span 4) */}
          <div className="md:col-span-4 relative group rounded-xl overflow-hidden glass-panel cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <div className="absolute inset-0 bg-surface-container-high group-hover:bg-surface-container-highest transition-colors duration-300"></div>
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: "radial-gradient(circle at center, #7000ff 0%, transparent 70%)"}}></div>
            <div className="absolute inset-0 p-6 z-10 flex flex-col justify-center items-center text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-4" style={{fontVariationSettings: "'FILL' 0"}}>album</span>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-white uppercase mb-2">David Guetta</h3>
              <Link to="/lineup" className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest border-b border-tertiary/50 pb-1 hover:border-tertiary transition-colors mt-auto">{t('discover')}</Link>
            </div>
          </div>

          {/* Medium Item (Span 8) */}
          <div className="md:col-span-8 relative group rounded-xl overflow-hidden glass-panel cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80 grayscale group-hover:grayscale-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcin0AniKlfrFjszY0BxJsInkhu9WybQtkhvXo9_TdfdJgq--KiDgmrvb_Bu2gImR1KUlwvyAIvDf_KHEpIRHJvf-QI88sHUxPu51B8V1BqhsQG_wWG3NcBwO3UBhInuYMYCJgY06vzYyF3pNjwRGKCpyFf4KF6VXJzH85NZqMoDs69sCn6D5tdElGV627b8TBgplPzUieG0I2CCpcF3G8CuVi_6HAeAgElY08kNi6xEQ2YcaQ5147-NioP2alGRMaylWgsnLJ0kM"/>
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"></div>
            <div className="absolute top-0 left-0 h-full p-6 md:p-8 z-10 flex flex-col justify-center w-2/3">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mb-2">{t('immersiveExperience')}</span>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-white uppercase group-hover:text-glow transition-all leading-none mb-4">{t('feelTheEnergy')}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant hidden md:block max-w-sm">{t('feelEnergyDesc')}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/lineup" className="inline-flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest text-tertiary hover:text-white transition-colors border border-tertiary/30 px-6 py-3 rounded glass-panel">
            {t('viewFullLineup')}
          </Link>
        </div>
      </section>
    </main>
  );
};

// ---------------------------------------------------------------------------
// Flash Sale Banner Component
// ---------------------------------------------------------------------------

const FlashSaleBanner: React.FC = () => {
  const [flashSaleOpenDate, setFlashSaleOpenDate] = useState<Date | null>(null);
  const [totalFlashTickets, setTotalFlashTickets] = useState<number>(1);

  useEffect(() => {
    fetch('http://localhost:8080/api/flash-sale/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.originalDatetime) {
          setFlashSaleOpenDate(new Date(data.data.originalDatetime));
          if (data.data.totalTickets) {
            setTotalFlashTickets(data.data.totalTickets);
          }
        }
      })
      .catch(console.error);
  }, []);

  const calcFlashTimeLeft = React.useCallback(() => {
    if (!flashSaleOpenDate) return undefined;
    const now = new Date();
    const diff = flashSaleOpenDate.getTime() - now.getTime();
    if (diff <= 0) return null; // sale is open
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [flashSaleOpenDate]);

  const [flashTimeLeft, setFlashTimeLeft] = useState(calcFlashTimeLeft());

  useEffect(() => {
    setFlashTimeLeft(calcFlashTimeLeft());
    const id = setInterval(() => setFlashTimeLeft(calcFlashTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [calcFlashTimeLeft]);

  const isSaleOpen = flashTimeLeft === null;

  if (!flashSaleOpenDate) {
    return null; // or a loading placeholder
  }

  return (
    <section className="relative z-10 py-xl px-margin-mobile md:px-margin-desktop bg-background overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,170,0,0.08) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border"
        style={{
          borderColor: isSaleOpen ? 'rgba(255,170,0,0.5)' : 'rgba(255,170,0,0.2)',
          background: isSaleOpen
            ? 'linear-gradient(135deg, rgba(255,170,0,0.12) 0%, rgba(30,10,0,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255,120,0,0.06) 0%, rgba(10,5,0,0.95) 100%)',
          boxShadow: isSaleOpen
            ? '0 0 60px rgba(255,170,0,0.3), 0 20px 60px rgba(0,0,0,0.8)'
            : '0 0 30px rgba(255,120,0,0.1), 0 20px 60px rgba(0,0,0,0.8)',
          transition: 'all 0.8s ease',
        }}
      >
        {/* Decorative top stripe */}
        <div
          className="h-1 w-full"
          style={{
            background: isSaleOpen
              ? 'linear-gradient(90deg, transparent, #ffaa00, #ff6600, #ffaa00, transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,120,0,0.4), transparent)',
          }}
        />

        <div className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
          {/* Left: Labels + Timer */}
          <div className="flex-1 text-center md:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span
                className="font-label-sm text-label-sm uppercase tracking-widest px-3 py-1 rounded-full border"
                style={{
                  color: isSaleOpen ? '#ffaa00' : '#ff9933',
                  borderColor: isSaleOpen ? 'rgba(255,170,0,0.5)' : 'rgba(255,153,51,0.3)',
                  background: isSaleOpen ? 'rgba(255,170,0,0.15)' : 'rgba(255,120,0,0.08)',
                  animation: isSaleOpen ? 'pulse 1.5s infinite' : 'none',
                }}
              >
                {isSaleOpen ? '⚡ Flash Sale — LIVE NOW' : '⏳ Flash Sale — Coming Soon'}
              </span>
            </div>

            <h2
              className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase mb-2"
              style={{ color: isSaleOpen ? '#ffcc44' : '#ff9933' }}
            >
              50% OFF — GA 4-Day Pass
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-1">
              {totalFlashTickets} tickets · Limited availability · Opens{' '}
              <span style={{ color: '#ffaa00' }}>
                {flashSaleOpenDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </p>
            <p className="font-body-md text-body-md" style={{ color: '#ff9933' }}>
              Original: <span className="line-through opacity-60">1,155.31 RON</span>{' '}
              <span className="font-bold text-white">→ 577.66 RON</span>
            </p>
          </div>

          {/* Right: Countdown OR Live button */}
          <div className="flex flex-col items-center gap-6 min-w-[260px]">
            {isSaleOpen ? (
              /* Sale is open */
              <div className="flex flex-col items-center gap-4 w-full">
                <div
                  className="text-4xl font-bold tracking-widest animate-pulse"
                  style={{ color: '#ffaa00', textShadow: '0 0 30px rgba(255,170,0,0.8)' }}
                >
                  LIVE NOW ⚡
                </div>
                <Link
                  to="/tickets?tab=flash-sale"
                  id="flash-sale-home-btn"
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-label-sm text-label-sm uppercase tracking-widest transition-all duration-300 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #ffaa00, #ff6600)',
                    color: '#000',
                    boxShadow: '0 0 40px rgba(255,170,0,0.5), 0 8px 30px rgba(0,0,0,0.5)',
                    fontWeight: 700,
                  }}
                >
                  Go to Flash Sale
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                    arrow_forward
                  </span>
                </Link>
              </div>
            ) : (
              /* Countdown */
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex gap-3 items-center">
                    {[
                      { v: flashTimeLeft?.days ?? 0, l: 'Days' },
                      { v: flashTimeLeft?.hours ?? 0, l: 'Hrs' },
                      { v: flashTimeLeft?.minutes ?? 0, l: 'Min' },
                      { v: flashTimeLeft?.seconds ?? 0, l: 'Sec' },
                    ].map((item, i, arr) => (
                      <React.Fragment key={item.l}>
                        <div className="flex flex-col items-center">
                        <span
                          className="text-3xl md:text-4xl font-bold tabular-nums w-14 text-center"
                          style={{ color: '#ff9933', textShadow: '0 0 15px rgba(255,153,51,0.4)' }}
                        >
                          {String(item.v).padStart(2, '0')}
                        </span>
                        <span
                          className="font-label-sm text-label-sm uppercase tracking-widest mt-1"
                          style={{ color: 'rgba(255,153,51,0.6)', fontSize: '9px' }}
                        >
                          {item.l}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <span
                          className="text-2xl font-light self-start mt-1"
                          style={{ color: 'rgba(255,153,51,0.4)' }}
                        >
                          :
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Disabled button */}
                <button
                  disabled
                  id="flash-sale-home-btn-disabled"
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-label-sm text-label-sm uppercase tracking-widest cursor-not-allowed opacity-40 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #ffaa00, #ff6600)',
                    color: '#000',
                    fontWeight: 700,
                  }}
                >
                  Go to Flash Sale
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                    lock
                  </span>
                </button>
                <p
                  className="font-label-sm text-label-sm text-center"
                  style={{ color: 'rgba(255,153,51,0.5)', fontSize: '10px' }}
                >
                  Button unlocks when the sale opens
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom accent */}
        <div
          className="h-[2px] w-full"
          style={{
            background: isSaleOpen
              ? 'linear-gradient(90deg, transparent, rgba(255,170,0,0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,120,0,0.1), transparent)',
          }}
        />
      </div>
    </section>
  );
};
