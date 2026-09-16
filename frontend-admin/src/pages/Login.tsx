import React, { useState } from 'react';
import { LogIn, Lock, Mail, Sparkles, Loader } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Te rugăm să completezi toate câmpurile.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();

      if (resData.type === 'SUCCESS' && resData.data) {
        const user = resData.data.user;
        const token = resData.data.token;

        if (user.userType !== 'ADMIN') {
          setError('Acces interzis. Acest portal este exclusiv pentru administratori.');
          setLoading(false);
          return;
        }

        // Store in sessionStorage so it aligns with security and page refreshes
        sessionStorage.setItem('untold_token', token);
        sessionStorage.setItem('untold_user', JSON.stringify(user));
        
        onLoginSuccess(user, token);
      } else {
        setError(resData.message || 'Date de conectare incorecte.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Eroare de rețea. Te rugăm să verifici conexiunea la server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Visual glowing backgrounds behind the card */}
      <div style={styles.glowOrba} />
      <div style={styles.glowOrbb} />

      <div style={styles.card} className="animate-fade-in">
        {/* Logo/Branding Header */}
        <div style={styles.logoHeader}>
          <div style={styles.logoBadge} className="pulse-hover">
            <Sparkles size={24} style={{ color: '#A085FF' }} />
          </div>
          <h2 style={styles.title}>Untold Admin</h2>
          <p style={styles.subtitle}>Conectează-te pentru a administra festivalul și harta evenimentului.</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Administrator</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="admin@untold.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Parolă</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.8 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Se verifică datele...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Autentificare</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(135deg, #F3EEFA 0%, #E3D9F8 100%)',
    fontFamily: 'var(--font-sans)',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrba: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(138, 114, 235, 0.2) 0%, rgba(255,255,255,0) 70%)',
    top: '10%',
    left: '20%',
    zIndex: 1,
  },
  glowOrbb: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(93, 63, 211, 0.15) 0%, rgba(255,255,255,0) 70%)',
    bottom: '10%',
    right: '15%',
    zIndex: 1,
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#1E1435', // Luxurious solid deep dark-velvet purple
    border: '1px solid rgba(138, 114, 235, 0.22)',
    borderRadius: '24px',
    padding: '40px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxShadow: '0 24px 60px rgba(47, 17, 96, 0.35)',
    zIndex: 10,
  },
  logoHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'rgba(138, 114, 235, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(138, 114, 235, 0.25)',
    boxShadow: '0 8px 24px rgba(138, 114, 235, 0.15)',
  },
  title: {
    fontSize: '25px',
    fontWeight: '800',
    color: '#FFFFFF', // High contrast glowing white
    margin: 0,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#D1CDDA', // Elegant silver lavender
    margin: 0,
    lineHeight: '1.5',
    maxWidth: '320px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#F87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '500',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#B2A7D9', // Soft light purple
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#A085FF',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    borderRadius: '12px',
    border: '1px solid rgba(138, 114, 235, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF', // Crystal-clear white text
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
    transition: 'var(--transition-fast)',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, var(--purple-medium) 0%, var(--purple-primary) 100%)', // Brand-aligned royal purple gradient
    color: '#FFF',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'var(--transition-smooth)',
    boxShadow: '0 4px 16px rgba(93, 63, 211, 0.25)',
    marginTop: '6px',
  }
};
