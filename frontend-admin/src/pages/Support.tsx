import { Mail, Phone } from 'lucide-react';

export const Support = () => {
  return (
    <>
      <div>
        <h2 style={styles.title}>System Support</h2>
        <p style={styles.subtitle}>Get help regarding server configurations, dashboard outages, or API endpoints.</p>
      </div>

      <div style={styles.card} className="glass-card">
        <h4 style={styles.cardTitle}>Contact Developer Support</h4>
        <p style={styles.text}>Our engineering team is ready to assist with deployment and backend schema migrations.</p>
        
        <div style={styles.contactItem}>
          <Mail size={16} style={{ color: 'var(--purple-primary)' }} />
          <span>support@antigravity-devs.com</span>
        </div>

        <div style={styles.contactItem}>
          <Phone size={16} style={{ color: 'var(--purple-primary)' }} />
          <span>+40 (700) UNTOLD-HELP</span>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--indigo-dark)',
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    fontWeight: '500',
    marginTop: '4px',
  },
  card: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '500px',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16.5px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
  },
  text: {
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    fontWeight: '500',
    marginBottom: '8px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14.5px',
    fontWeight: '600',
    color: 'var(--indigo-dark)',
    padding: '12px 16px',
    backgroundColor: 'rgba(93, 63, 211, 0.03)',
    border: '1px solid rgba(93, 63, 211, 0.04)',
    borderRadius: '12px',
  },
};
