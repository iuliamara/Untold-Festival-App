import { 
  Download, 
  Plus, 
  MapPin, 
  MoreVertical, 
  BarChart2 
} from 'lucide-react';

export const Events = () => {
  const stages = [
    {
      id: 1,
      title: 'Celestial Echoes: Opening Ceremony',
      stageName: 'Main Stage',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
      date: 'August 6, 2026 • 20:00',
      location: 'Central Arena, Cluj-Napoca',
      badgeColor: 'var(--coral-accent)',
    },
    {
      id: 2,
      title: 'Neon Pulse: Industrial Sessions',
      stageName: 'Warehouse',
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
      date: 'August 7, 2026 • 23:00',
      location: 'Sector 4 Factory, East Gate',
      badgeColor: 'var(--purple-primary)',
    },
    {
      id: 3,
      title: 'Dark Matter: Techno Night',
      stageName: 'Underground',
      image: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?q=80&w=600&auto=format&fit=crop',
      date: 'August 8, 2026 • 01:00',
      location: 'Basement 2, Arena Plaza',
      badgeColor: 'var(--indigo-dark)',
    },
  ];

  return (
    <>
      {/* Main header row */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.title}>Untold Festival 2026</h2>
          <div style={styles.subtitleRow}>
             <span style={styles.statusPill}>Master Dashboard</span>
             <span style={styles.dateRangeText}>August 6 - 9, 2026</span>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.btnSecondary} className="pulse-hover">
            <Download size={16} />
            <span>Export Stats</span>
          </button>
          <button style={styles.btnPrimary} className="pulse-hover">
            <Plus size={16} />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Render Dynamic View Core */}
      <div style={styles.contentBody}>
        {/* Section: Major Stages */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Major Stages & Experiences</h3>
          <div style={styles.stagesGrid}>
            {stages.map((stage) => (
              <div key={stage.id} style={styles.stageCard} className="glass-card">
                {/* Stage Image and Floating Badge */}
                <div style={styles.imageContainer}>
                  <img src={stage.image} alt={stage.title} style={styles.stageImage} />
                  <span style={{ ...styles.stageBadge, backgroundColor: stage.badgeColor }}>
                    {stage.stageName}
                  </span>
                  <button style={styles.cardMenuBtn}>
                    <MoreVertical size={16} style={{ color: '#FFF' }} />
                  </button>
                </div>

                {/* Stage Info Card Content */}
                <div style={styles.cardBody}>
                  <h4 style={styles.cardTitle}>{stage.title}</h4>
                  
                  <div style={styles.metaCol}>
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabelIcon}>📅</span>
                      <span>{stage.date}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <MapPin size={14} style={styles.metaIcon} />
                      <span>{stage.location}</span>
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    <button style={styles.manageBtn} className="pulse-hover">
                      Manage Event
                    </button>
                    <button style={styles.analyticsBtn} className="pulse-hover">
                      <BarChart2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--indigo-dark)',
  },
  subtitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '6px',
  },
  statusPill: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
    backgroundColor: 'var(--purple-light)',
    padding: '3px 10px',
    borderRadius: '100px',
    textTransform: 'uppercase',
  },
  dateRangeText: {
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  btnPrimary: {
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
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#FFF',
    color: 'var(--purple-primary)',
    border: '1px solid rgba(93, 63, 211, 0.1)',
    borderRadius: '12px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    letterSpacing: '-0.2px',
  },
  stagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  stageCard: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  imageContainer: {
    height: '180px',
    position: 'relative',
    overflow: 'hidden',
  },
  stageImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  stageBadge: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    color: '#FFF',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '100px',
    letterSpacing: '0.2px',
  },
  cardMenuBtn: {
    position: 'absolute',
    top: '12px',
    left: '14px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(30, 27, 75, 0.4)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  cardBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    lineHeight: '1.3',
  },
  metaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  metaLabelIcon: {
    fontSize: '14px',
  },
  metaIcon: {
    color: 'var(--text-light)',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '6px',
  },
  manageBtn: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  analyticsBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid rgba(93, 63, 211, 0.1)',
    backgroundColor: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  contentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
};
