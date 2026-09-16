import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();

  // Background Slideshow State
  const [bgIndex, setBgIndex] = useState(0);
  const images = [
    '/assets/background-images/background1.jpg',
    '/assets/background-images/background2.jpg',
    '/assets/background-images/background3.jpg',
    '/assets/background-images/background4.jpg',
    '/assets/background-images/background5.jpg',
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Redirect to where we came from, else My Account
  const from = location.state?.from?.pathname || '/my-account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? 'http://localhost:8080/api/auth/login' : 'http://localhost:8080/api/auth/register';
    
    const payload = isLogin 
      ? { email, password }
      : { username, email, password, userType: 'ATTENDEE' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (isLogin ? 'Authentication failed.' : 'Registration failed.'));
      }

      // Success - response is now wrapped in ApiResponse<AuthResponse>
      login(data.data.user, data.data.token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center pt-[100px] pb-xl px-margin-mobile relative min-h-screen">
      {/* Background Slideshow */}
      {images.map((src, index) => (
        <div
          key={src}
          className={`fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 will-change-opacity ${
            index === bgIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${src}')` }}
        />
      ))}
      <div className="fixed inset-0 z-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* Background elements for aesthetic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-tertiary/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          
          <div className="text-center mb-8">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary drop-shadow-[0_0_10px_rgba(209,188,255,0.5)] mb-2 uppercase">
              {isLogin ? t('loginTitle') : t('registerTitle')}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isLogin ? t('welcomeBack') : t('joinMagic')}
            </p>
          </div>

          {error && (
            <div className="bg-error/20 border border-error text-error px-4 py-2 rounded mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface ml-1">
                  {t('usernameLabel')}
                </label>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-surface-container-highest/50 border border-outline-variant rounded-lg px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface ml-1">
                {t('emailLabel')}
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dreamer@untold.com"
                className="w-full bg-surface-container-highest/50 border border-outline-variant rounded-lg px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface ml-1 flex justify-between">
                {t('passwordLabel')}
                {isLogin && <a href="#" className="text-tertiary hover:text-white transition-colors">Forgot?</a>}
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-highest/50 border border-outline-variant rounded-lg px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-widest py-4 rounded-lg glow-effect active:scale-95 transition-all duration-300 hover:bg-inverse-primary border border-primary-fixed-dim/30 mt-4 disabled:opacity-50"
            >
              {loading ? t('processing') : (isLogin ? t('loginBtn') : t('registerBtn'))}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isLogin ? t('donthaveAccount') : t('haveAccount')}
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-2 text-tertiary font-label-sm text-label-sm uppercase tracking-widest hover:text-white transition-colors"
              >
                {isLogin ? t('registerBtn') : t('loginBtn')}
              </button>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
};
