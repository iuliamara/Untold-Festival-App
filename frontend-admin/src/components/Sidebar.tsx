import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Users,
  Ticket,
  MapPin,
  Settings,
  HelpCircle,
  UserRound,
  Gauge
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Lineup', path: '/lineup', icon: Music },
    { name: 'Ticket Types', path: '/tickets', icon: Ticket },
    { name: 'Venue Map', path: '/venue-map', icon: MapPin },
    { name: 'Attendee Records', path: '/persons', icon: UserRound },
    { name: 'Crowd Reports', path: '/crowd-reports', icon: Gauge },
    { name: 'Staff', path: '/staff', icon: Users },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Branding Header */}
      <div style={styles.brandContainer}>
        <h1 style={styles.brandTitle}>Untold Festival</h1>
        <p style={styles.brandSubtitle}>Event Management</p>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Main Navigation Links */}
      <nav style={styles.navContainer}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} style={isActive ? styles.iconActive : styles.icon} />
                <span style={isActive ? styles.textActive : styles.text}>{item.name}</span>
                {isActive && <div style={styles.activeIndicator} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Links */}
      <div style={styles.footerContainer}>
        <div style={styles.bottomLinks}>
          <NavLink 
            to="/settings" 
            style={({ isActive }) => ({ ...styles.bottomLink, ...(isActive ? styles.bottomLinkActive : {}) })}
          >
            <Settings size={18} style={styles.bottomIcon} />
            <span>Settings</span>
          </NavLink>
          <NavLink 
            to="/support" 
            style={({ isActive }) => ({ ...styles.bottomLink, ...(isActive ? styles.bottomLinkActive : {}) })}
          >
            <HelpCircle size={18} style={styles.bottomIcon} />
            <span>Support</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '230px',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    padding: '32px 16px 24px 20px',
    boxSizing: 'border-box',
    zIndex: 100,
  },
  brandContainer: {
    marginBottom: '20px',
  },
  brandTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--purple-dark)',
    letterSpacing: '-0.5px',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
    marginBottom: '24px',
    width: '100%',
  },
  navContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '12px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    position: 'relative',
    transition: 'var(--transition-fast)',
    gap: '12px',
  },
  navLinkActive: {
    backgroundColor: 'var(--bg-sidebar-active)',
    color: 'var(--purple-primary)',
  },
  icon: {
    color: 'var(--text-muted)',
    transition: 'var(--transition-fast)',
  },
  iconActive: {
    color: 'var(--purple-primary)',
  },
  text: {
    transition: 'var(--transition-fast)',
  },
  textActive: {
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '12px',
    bottom: '12px',
    width: '4px',
    backgroundColor: 'var(--purple-primary)',
    borderRadius: '4px 0 0 4px',
  },
  footerContainer: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  bottomLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bottomLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '10px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'var(--transition-fast)',
    gap: '10px',
  },
  bottomLinkActive: {
    backgroundColor: 'var(--bg-sidebar-active)',
    color: 'var(--purple-primary)',
  },
  bottomIcon: {
    color: 'var(--text-muted)',
  },
};
export default Sidebar;
