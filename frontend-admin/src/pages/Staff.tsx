import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  MapPin, 
  UserCheck, 
  Radio, 
  RefreshCw,
  Users,
  AlertCircle
} from 'lucide-react';
import { Announcements } from './Announcements';

interface StaffMember {
  id: number;
  name: string;
  role: string;
  dept: 'Operations' | 'Production' | 'Security & Access' | 'Infrastructure' | 'Medical';
  zone: string;
  status: 'Active' | 'On Break' | 'Standby';
  avatar: string;
}

export const Staff = () => {
  const [activeSubTab, setActiveSubTab] = useState('Allocation');

  const subTabs = [
    { id: 'Allocation', label: 'Staff Allocation & Deployment' },
    { id: 'Announcements', label: 'Announcements Broadcaster' },
  ];

  const [staffList, setStaffList] = useState<StaffMember[]>([
    { 
      id: 1, 
      name: 'Alex Rivera', 
      role: 'Lead Organizer', 
      dept: 'Operations', 
      zone: 'Main Control Room', 
      status: 'Active', 
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop' 
    },
    { 
      id: 2, 
      name: 'Marcus Vance', 
      role: 'Stage Coordinator', 
      dept: 'Production', 
      zone: 'Main Stage Backstage', 
      status: 'Active', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop' 
    },
    { 
      id: 3, 
      name: 'Sarah Jenkins', 
      role: 'Security Manager', 
      dept: 'Security & Access', 
      zone: 'Cluj Arena Gate 1', 
      status: 'Active', 
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop' 
    },
    { 
      id: 4, 
      name: 'Daniel Kim', 
      role: 'IT Support Director', 
      dept: 'Infrastructure', 
      zone: 'Techno Room B', 
      status: 'On Break', 
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop' 
    },
  ]);

  const zonesList = [
    'Main Control Room',
    'Main Stage Backstage',
    'Cluj Arena Gate 1',
    'Central Park East Entrance',
    'Techno Room B',
    'First Aid Hub 3'
  ];

  // Reallocation States
  const [selectedStaffId, setSelectedStaffId] = useState<number>(1);
  const [targetZone, setTargetZone] = useState<string>('Main Stage Backstage');
  const [reallocateSuccess, setReallocateSuccess] = useState<string | null>(null);

  const handleReallocate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = staffList.find(s => s.id === selectedStaffId);
    if (!targetStaff) return;

    setStaffList(prevList => 
      prevList.map(s => 
        s.id === selectedStaffId 
          ? { ...s, zone: targetZone, status: 'Active' } 
          : s
      )
    );

    setReallocateSuccess(`Successfully deployed ${targetStaff.name} to ${targetZone}!`);
  };

  useEffect(() => {
    if (reallocateSuccess) {
      const timer = setTimeout(() => setReallocateSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [reallocateSuccess]);

  return (
    <div style={styles.container}>
      {/* Horizontal Sub-tab bar */}
      <div style={styles.subTabBar}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              ...styles.subTabButton,
              ...(activeSubTab === tab.id ? styles.subTabActive : {}),
            }}
          >
            {tab.label}
            {activeSubTab === tab.id && <div style={styles.subTabIndicator} />}
          </button>
        ))}
      </div>

      {activeSubTab === 'Announcements' ? (
        <div style={styles.contentBody}>
          <Announcements />
        </div>
      ) : (
        <>
          {/* 1. Header and Quick Metrics Row */}
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>Staff Allocation & Deployment Hub</h2>
              <p style={styles.subtitle}>Coordinate real-time zone placements, departments, and communication matrices across Cluj Central Park.</p>
            </div>
          </div>

          <div style={styles.metricsGrid}>
            <div style={styles.metricCard} className="glass-card">
              <div style={styles.metricHeader}>
                <div>
                  <p style={styles.metricLabel}>Total On-Duty</p>
                  <h4 style={styles.metricVal}>148 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>personnel</span></h4>
                </div>
                <div style={{ ...styles.iconCircle, backgroundColor: 'rgba(93, 63, 211, 0.08)' }}>
                  <Users size={18} style={{ color: 'var(--purple-primary)' }} />
                </div>
              </div>
            </div>

            <div style={styles.metricCard} className="glass-card">
              <div style={styles.metricHeader}>
                <div>
                  <p style={styles.metricLabel}>Active Zones</p>
                  <h4 style={styles.metricVal}>6 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>monitored</span></h4>
                </div>
                <div style={{ ...styles.iconCircle, backgroundColor: 'rgba(255, 111, 97, 0.08)' }}>
                  <MapPin size={18} style={{ color: 'var(--coral-accent)' }} />
                </div>
              </div>
            </div>

            <div style={styles.metricCard} className="glass-card">
              <div style={styles.metricHeader}>
                <div>
                  <p style={styles.metricLabel}>Radio System</p>
                  <h4 style={{ ...styles.metricVal, color: 'var(--success)' }}>Optimal</h4>
                </div>
                <div style={{ ...styles.iconCircle, backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
                  <Radio size={18} style={{ color: 'var(--success)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Split Workspace Layout */}
          <div style={styles.splitLayout}>
            
            {/* Left Column: Command Roster */}
            <div style={styles.leftCol} className="glass-card">
              <div style={styles.sectionTitleRow}>
                <h3 style={styles.sectionTitle}>Key Command Roster</h3>
                <span style={styles.statusPill}>Live Status Tracker</span>
              </div>

              <div style={styles.rosterList}>
                {staffList.map((person) => (
                  <div key={person.id} style={styles.rosterCard}>
                    <div style={styles.rosterHeader}>
                      <img src={person.avatar} alt={person.name} style={styles.avatar} />
                      <div style={{ flex: 1 }}>
                        <h4 style={styles.name}>{person.name}</h4>
                        <p style={styles.role}>{person.role}</p>
                      </div>
                      <span style={{ 
                        ...styles.statusBadge, 
                        backgroundColor: person.status === 'Active' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                        color: person.status === 'Active' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {person.status}
                      </span>
                    </div>

                    <div style={styles.rosterMeta}>
                      <div style={styles.metaRow}>
                        <ShieldCheck size={14} style={{ color: 'var(--purple-primary)' }} />
                        <span style={styles.metaText}>Department: <strong>{person.dept}</strong></span>
                      </div>
                      <div style={styles.metaRow}>
                        <MapPin size={14} style={{ color: 'var(--coral-accent)' }} />
                        <span style={styles.metaText}>Zone: <strong>{person.zone}</strong></span>
                      </div>
                      <div style={styles.metaRow}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={styles.metaText}>{person.name.toLowerCase().replace(' ', '.')}@untold.com</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Deployment Control Deck */}
            <div style={styles.rightCol} className="glass-card">
              <h3 style={styles.sectionTitle}>Zone Allocation Control</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Reallocate resources and dispatch command personnel instantly to clear bottlenecks.</p>

              <form onSubmit={handleReallocate} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Select Commander</label>
                  <select 
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                    style={styles.selectField}
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Deployment Zone Target</label>
                  <select 
                    value={targetZone}
                    onChange={(e) => setTargetZone(e.target.value)}
                    style={styles.selectField}
                  >
                    {zonesList.map((z, idx) => (
                      <option key={idx} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" style={styles.btnPrimary} className="pulse-hover">
                  <RefreshCw size={15} />
                  <span>Deploy & Sync Radio</span>
                </button>
              </form>

              {reallocateSuccess && (
                <div style={styles.successBanner}>
                  <UserCheck size={16} style={{ marginRight: '8px' }} />
                  <span>{reallocateSuccess}</span>
                </div>
              )}

              {/* Active crowds bottlenecks warning list */}
              <div style={styles.alertPanel}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <AlertCircle size={16} style={{ color: 'var(--coral-accent)' }} />
                  <h4 style={styles.alertTitle}>Resource Warnings</h4>
                </div>
                <p style={styles.alertDesc}>High check-in latency detected at <strong>Cluj Arena Gate 1</strong>. Standard response suggests reallocating Security or Operations officers to support local terminals.</p>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    animation: 'fadeIn 0.3s ease-in-out',
    width: '100%',
  },
  subTabBar: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '2px',
    marginBottom: '8px',
  },
  subTabButton: {
    background: 'none',
    border: 'none',
    padding: '12px 4px 16px 4px',
    fontSize: '14.5px',
    fontWeight: '600',
    color: 'var(--text-light)',
    cursor: 'pointer',
    position: 'relative',
    fontFamily: 'var(--font-sans)',
    transition: 'var(--transition-fast)',
  },
  subTabActive: {
    color: 'var(--purple-primary)',
    fontWeight: '700',
  },
  subTabIndicator: {
    position: 'absolute',
    bottom: '-1px',
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'var(--purple-primary)',
    borderRadius: '3px 3px 0 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--indigo-dark)',
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    fontWeight: '500',
    marginTop: '4px',
    lineHeight: '1.4',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  metricCard: {
    padding: '20px',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  metricVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--indigo-dark)',
    fontFamily: 'var(--font-heading)',
    marginTop: '4px',
  },
  iconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitLayout: {
    display: 'flex',
    gap: '24px',
    width: '100%',
  },
  leftCol: {
    flex: 1.4,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightCol: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    fontFamily: 'var(--font-heading)',
  },
  statusPill: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
    backgroundColor: 'rgba(93, 63, 211, 0.06)',
    padding: '4px 10px',
    borderRadius: '100px',
  },
  rosterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rosterCard: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '1px solid rgba(93, 63, 211, 0.03)',
  },
  rosterHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    objectFit: 'cover',
  },
  name: {
    fontFamily: 'var(--font-heading)',
    fontSize: '14.5px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
  },
  role: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    fontWeight: '500',
  },
  statusBadge: {
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  rosterMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '12px',
    borderTop: '1px solid rgba(93, 63, 211, 0.04)',
    paddingTop: '12px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: 'var(--text-light)',
  },
  metaText: {
    fontSize: '12.5px',
  },

  // Form styles
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  selectField: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    fontFamily: 'var(--font-sans)',
    fontSize: '13.5px',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    backgroundColor: '#FFF',
    cursor: 'pointer',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '13.5px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(93, 63, 211, 0.15)',
    transition: 'var(--transition-fast)',
    marginTop: '8px',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#15803D',
    fontSize: '12.5px',
    fontWeight: '600',
    marginTop: '16px',
  },
  alertPanel: {
    marginTop: 'auto',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 111, 97, 0.04)',
    border: '1px solid rgba(255, 111, 97, 0.15)',
  },
  alertTitle: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: 'var(--coral-accent)',
    fontFamily: 'var(--font-heading)',
  },
  alertDesc: {
    fontSize: '12px',
    color: 'var(--text-light)',
    lineHeight: '1.5',
    marginTop: '2px',
  },
  contentBody: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
};

export default Staff;
