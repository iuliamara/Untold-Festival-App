import { Save } from 'lucide-react';

export const Settings = () => {
  return (
    <>
      <div>
        <h2 style={styles.title}>System Settings</h2>
        <p style={styles.subtitle}>Configure main portal layouts, general organization credentials, and notification templates.</p>
      </div>

      <div style={styles.card} className="glass-card">
        <h4 style={styles.cardTitle}>Global Festival Configurations</h4>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Festival Cycle Title</label>
          <input type="text" defaultValue="Untold Festival 2026" style={styles.input} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Organizer Support Email</label>
          <input type="email" defaultValue="alex.rivera@untold.com" style={styles.input} />
        </div>

        <button style={styles.saveBtn} className="pulse-hover">
          <Save size={16} />
          <span>Save Configuration</span>
        </button>
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
    gap: '20px',
    maxWidth: '500px',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16.5px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    marginBottom: '8px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFF',
    border: '1px solid rgba(93, 63, 211, 0.08)',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
    color: 'var(--text-main)',
    outline: 'none',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 12px rgba(93, 63, 211, 0.15)',
  },
};
