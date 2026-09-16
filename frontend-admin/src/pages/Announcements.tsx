import { Megaphone, Plus, Bell } from 'lucide-react';

export const Announcements = () => {
  return (
    <>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Announcements Broadcaster</h2>
          <p style={styles.subtitle}>Send updates directly to all attendee mobile applications or staff channels.</p>
        </div>
        <button style={styles.btn} className="pulse-hover">
          <Plus size={16} />
          <span>New Broadcast</span>
        </button>
      </div>

      <div style={styles.card} className="glass-card">
        <h4 style={styles.cardTitle}>Recent Broadcast History</h4>
        <div style={styles.item}>
          <Megaphone size={18} style={{ color: 'var(--purple-primary)' }} />
          <div>
            <h5 style={styles.itemTitle}>Phase 2 Line-up Revealed</h5>
            <p style={styles.itemDesc}>Broadcasted to: All Festival Attendees • 2 hours ago</p>
          </div>
        </div>
        <div style={styles.item}>
          <Bell size={18} style={{ color: 'var(--coral-accent)' }} />
          <div>
            <h5 style={styles.itemTitle}>VIP Parking Logistics Update</h5>
            <p style={styles.itemDesc}>Broadcasted to: Staff, VIP ticket holders • Yesterday</p>
          </div>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: 'var(--coral-accent)',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 111, 97, 0.2)',
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16.5px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    marginBottom: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    border: '1px solid rgba(93, 63, 211, 0.04)',
  },
  itemTitle: {
    fontSize: '14.5px',
    fontWeight: '600',
    color: 'var(--indigo-dark)',
  },
  itemDesc: {
    fontSize: '12px',
    color: 'var(--text-light)',
    fontWeight: '500',
    marginTop: '2px',
  },
};
