import { Bell, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Header = () => {
  const [userName, setUserName] = useState('Alex Rivera');
  const [userRole, setUserRole] = useState('Lead Organizer');

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('untold_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserName(parsed.username || 'Admin');
        setUserRole(parsed.userType || 'ADMIN');
      }
    } catch (err) {
      console.error('Error reading user details', err);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('untold_token');
    sessionStorage.removeItem('untold_user');
    window.location.reload();
  };

  return (
    <header style={styles.header}>
      {/* Right Side Quick Actions & Profile */}
      <div style={styles.actionsContainer}>
        {/* Quick Icon Triggers */}
        <button style={styles.iconBtn} className="pulse-hover">
          <Bell size={20} style={styles.headerIcon} />
          <span style={styles.dotIndicator} />
        </button>

        {/* Vertical Divider */}
        <div style={styles.divider} />

        {/* User Profile Info Card */}
        <div style={styles.profileCard}>
          <div style={styles.profileText}>
            <span style={styles.profileName}>{userName}</span>
            <span style={styles.profileRole}>{userRole}</span>
          </div>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatarIconBox} className="pulse-hover">
              <User size={18} style={{ color: 'var(--purple-primary)' }} />
            </div>
            <span style={styles.statusDot} />
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={styles.divider} />

        {/* Logout Button */}
        <button 
          onClick={handleLogout} 
          title="Deconectare" 
          style={styles.logoutBtn} 
          className="pulse-hover"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '76px',
    borderBottom: '1px solid var(--border-light)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 40px',
    boxSizing: 'border-box',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    width: '40px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'var(--transition-fast)',
  },
  headerIcon: {
    color: 'var(--text-muted)',
  },
  dotIndicator: {
    position: 'absolute',
    top: '11px',
    right: '11px',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--coral-accent)',
    borderRadius: '50%',
    border: '2px solid #FFF',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  profileName: {
    fontSize: '14.5px',
    fontWeight: '600',
    color: 'var(--indigo-dark)',
  },
  profileRole: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: 'var(--purple-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(93, 63, 211, 0.05)',
    cursor: 'pointer',
  },
  statusDot: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '10px',
    height: '10px',
    backgroundColor: 'var(--success)',
    borderRadius: '50%',
    border: '2px solid #FFF',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--danger)',
    backgroundColor: '#FFF2F2',
    transition: 'var(--transition-fast)',
  }
};
export default Header;
