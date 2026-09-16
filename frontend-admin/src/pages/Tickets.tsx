import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Star, 
  QrCode, 
  Users, 
  TrendingUp, 
  Search
} from 'lucide-react';
import { Sales } from './Sales';
import { useTicketStats } from '../hooks/useTicketStats';
import { useTicketTiers } from '../hooks/useTicketTiers';
import type { TicketTier } from '../hooks/useTicketTiers';

export const Tickets = () => {
  const [activeSubTab, setActiveSubTab] = useState('Tiers');
  const { stats } = useTicketStats();
  const { tiers, loading, saveTier, deleteTier, refetch } = useTicketTiers();

  // Search & Filters States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Compute filtered ticket tiers based on current filter/search states
  const filteredTiers = tiers.filter((tier: TicketTier) => {
    const matchesSearch = tier.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tier.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || tier.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'ACTIVE' && tier.active) || 
                          (statusFilter === 'INACTIVE' && !tier.active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const subTabs = [
    { id: 'Tiers', label: 'Ticket Tiers' },
    { id: 'Sales', label: 'Sales Ledger' },
  ];

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<TicketTier | null>(null);
  const [tierId, setTierId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState<'GA' | 'VIP' | 'BACKSTAGE'>('GA');
  const [price, setPrice] = useState(99.0);
  const [capacity, setCapacity] = useState(15000);
  const [active, setActive] = useState(true);

  const handleCreateTier = () => {
    setEditingTier(null);
    setTierId('');
    setDisplayName('');
    setCategory('GA');
    setPrice(99.0);
    setCapacity(15000);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleEditTier = (tier: TicketTier) => {
    setEditingTier(tier);
    setTierId(tier.id);
    setDisplayName(tier.displayName);
    setCategory(tier.category);
    setPrice(tier.price);
    setCapacity(tier.capacity);
    setActive(tier.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierId || !displayName) {
      alert('Please fill out all fields.');
      return;
    }
    const success = await saveTier({
      id: tierId,
      displayName,
      category,
      price,
      capacity,
      sold: editingTier ? editingTier.sold : 0,
      active
    });
    if (success) {
      setIsModalOpen(false);
      refetch();
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (confirm('Are you sure you want to delete this ticket tier?')) {
      const success = await deleteTier(id);
      if (success) {
        refetch();
      }
    }
  };

  const renderContent = () => {
    switch (activeSubTab) {
      case 'Sales':
        return <Sales />;
      case 'Tiers':
      default:
        return (
          <div style={styles.tiersContainer}>
            {/* Top Control Panel Row: Buttons, Search, Filters & Velocity Card aligned side-by-side */}
            <div style={styles.topControlSection}>
              {/* Left Column: Title, Subtitle, Create Button, and Search/Filters stacked */}
              <div style={styles.leftControlsColumn}>
                <div style={styles.leftHeaderWrapper}>
                  <h2 style={styles.title}>Ticket Tiers</h2>
                  <p style={styles.subtitle}>
                    Manage your event's zone structure and pricing architecture. Monitor real-time capacity and sales velocity across all tiers.
                  </p>
                  <div style={styles.createButtonRow}>
                    <button onClick={handleCreateTier} style={styles.btnPrimary} className="pulse-hover">
                      <Plus size={16} /> Create Ticket Type
                    </button>
                  </div>
                </div>
                
                <div style={styles.filtersBar} className="glass-card">
                  <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search tiers by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={styles.searchInput}
                    />
                  </div>
                  <div style={styles.filterGroup}>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="ALL">All Categories</option>
                      <option value="GA">GA Access</option>
                      <option value="VIP">VIP Access</option>
                      <option value="BACKSTAGE">Backstage</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Revenue Velocity Card aligned with Search bar & Create button */}
              <div style={styles.rightControlsColumn}>
                <div style={styles.velocityCard}>
                  <div style={styles.velocityHeader}>
                    <span style={styles.velocityLabel}>REVENUE VELOCITY</span>
                    <p style={styles.velocityDesc}>Real-time performance across all tiers in the last 24 hours.</p>
                  </div>
                  
                  <div style={styles.velocityValRow}>
                    <h2 style={styles.velocityVal}>
                      {stats?.totalRevenue 
                        ? `${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} RON` 
                        : '142,800 RON'}
                    </h2>
                    <div style={styles.velocityBadge}>
                      <TrendingUp size={14} />
                      <span>+12.4% vs yesterday</span>
                    </div>
                  </div>

                  <button style={styles.reportBtn} className="pulse-hover">
                    VIEW DETAILED REPORT
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Content Area: Spacious 3-per-line Grid of Ticket Tier Cards */}
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', marginTop: '16px' }}>Loading live ticket tiers...</p>
            ) : filteredTiers.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', marginTop: '16px', width: '100%' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '600' }}>No matching ticket tiers found.</p>
              </div>
            ) : (
              <div style={styles.tiersGrid}>
                {filteredTiers.map((tier) => {
                  const percentage = tier.capacity > 0 ? (tier.sold / tier.capacity) * 100 : 0;
                  const isSoldOut = tier.sold >= tier.capacity;
                  const remaining = tier.capacity - tier.sold;

                  return (
                    <div key={tier.id} style={styles.gridTierCard} className="glass-card">
                      <div style={{
                        ...styles.gridCardCoverImg,
                        backgroundImage: tier.category === 'VIP'
                          ? `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop')`
                          : tier.category === 'BACKSTAGE'
                          ? `url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop')`
                          : `url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&auto=format&fit=crop')`
                      }} />
                      
                      <div style={styles.gridCardContent}>
                        <div style={styles.cardHeaderRow}>
                          <div style={styles.badgeRow}>
                            <span style={{
                              ...styles.badgeBaseAccess,
                              backgroundColor: tier.category === 'VIP' ? 'var(--purple-primary)' : tier.category === 'BACKSTAGE' ? 'var(--purple-dark)' : 'rgba(93,63,211,0.15)',
                              color: tier.category === 'VIP' || tier.category === 'BACKSTAGE' ? '#FFF' : 'var(--purple-primary)'
                            }}>
                              {tier.category}
                            </span>
                            {tier.active ? (
                              <span style={styles.badgeLive}>
                                <span style={styles.liveDot} /> {isSoldOut ? 'SOLD OUT' : 'LIVE'}
                              </span>
                            ) : (
                              <span style={{ ...styles.badgeLive, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                                <span style={{ ...styles.liveDot, backgroundColor: '#EF4444' }} /> INACTIVE
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditTier(tier)} style={styles.btnOutlineSmall} className="pulse-hover">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteTier(tier.id)} style={styles.btnDeleteSmall}>
                              Delete
                            </button>
                          </div>
                        </div>

                        <div style={styles.infoWrapper}>
                          <h3 style={styles.tierTitle}>{tier.displayName}</h3>
                          <p style={styles.idCodeLine}>
                            ID: <code style={styles.idCode}>{tier.id}</code>
                          </p>
                        </div>

                        <div style={styles.statsRow}>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>Price</span>
                            <span style={styles.statVal}>{tier.price.toFixed(2)} RON</span>
                          </div>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>Sold</span>
                            <span style={styles.statVal}>{tier.sold.toLocaleString()}</span>
                          </div>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>Total Cap</span>
                            <span style={styles.statVal}>{tier.capacity.toLocaleString()}</span>
                          </div>
                        </div>

                        <div style={styles.progressSection}>
                          <div style={styles.progressBarTrack}>
                            <div style={{ 
                              ...styles.progressBarFill, 
                              width: `${percentage}%`,
                              backgroundColor: tier.category === 'VIP' ? 'var(--purple-primary)' : tier.category === 'BACKSTAGE' ? 'var(--purple-dark)' : 'var(--coral-accent)'
                            }} />
                          </div>
                          <div style={styles.progressLabels}>
                            <span>
                              {percentage > 0 && percentage < 1 
                                ? `${percentage.toFixed(2)}%` 
                                : `${percentage.toFixed(0)}%`
                              } Sold
                            </span>
                            <span>{isSoldOut ? 'Closed' : `${remaining.toLocaleString()} Rem.`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <>
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



      {/* Render Dynamic View Core */}
      <div style={styles.contentBody}>
        {renderContent()}
      </div>

      {/* Key Performance Indicators Row (only on Tiers page) */}
      {activeSubTab === 'Tiers' && (
        <div style={styles.kpisRow}>
          {/* KPI 1 */}
          <div style={styles.kpiCard} className="glass-card">
            <div style={styles.kpiIconCircle}>
              <QrCode size={18} style={{ color: 'var(--purple-primary)' }} />
            </div>
            <div>
              <p style={styles.kpiSub}>Average Scan Rate</p>
              <h4 style={styles.kpiMain}>4.2s / user</h4>
            </div>
          </div>

          {/* KPI 2 */}
          <div style={styles.kpiCard} className="glass-card">
            <div style={styles.kpiIconCircle}>
              <Users size={18} style={{ color: 'var(--purple-primary)' }} />
            </div>
            <div>
              <p style={styles.kpiSub}>Unique Buyers</p>
              <h4 style={styles.kpiMain}>11,204</h4>
            </div>
          </div>

          {/* KPI 3 */}
          <div style={styles.kpiCard} className="glass-card">
            <div style={styles.kpiIconCircle}>
              <Star size={18} style={{ color: 'var(--purple-primary)' }} />
            </div>
            <div>
              <p style={styles.kpiSub}>Group Bookings</p>
              <h4 style={styles.kpiMain}>34% of total</h4>
            </div>
          </div>
        </div>
      )}

      {/* Center Glassmorphic Modal overlay wrapped in React Portal to escape parent scroll containers */}
      {isModalOpen && createPortal(
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalHeader}>
              {editingTier ? 'Edit Ticket Tier' : 'Create Ticket Type'}
            </h3>

            <form onSubmit={handleSave}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Technical ID / Code</label>
                <input 
                  type="text" 
                  value={tierId} 
                  onChange={(e) => setTierId(e.target.value)} 
                  disabled={editingTier !== null}
                  placeholder="e.g. GA_DAY_1_PHASE_2"
                  style={styles.formInput} 
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Display Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="e.g. General Admission - Day 1"
                  style={styles.formInput} 
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>High-Level Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)} 
                  style={styles.formSelect}
                >
                  <option value="GA">GA (General Access)</option>
                  <option value="VIP">VIP Platform</option>
                  <option value="BACKSTAGE">BACKSTAGE Access</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Price Point (RON)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={price} 
                  onChange={(e) => setPrice(parseFloat(e.target.value))} 
                  style={styles.formInput} 
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Allocated Capacity</label>
                <input 
                  type="number" 
                  value={capacity} 
                  onChange={(e) => setCapacity(parseInt(e.target.value))} 
                  style={styles.formInput} 
                  required
                />
              </div>

              <div style={styles.checkboxGroup}>
                <input 
                  type="checkbox" 
                  id="activeCheck"
                  checked={active} 
                  onChange={(e) => setActive(e.target.checked)} 
                  style={styles.checkboxInput}
                />
                <label htmlFor="activeCheck" style={styles.checkboxLabel}>Active & Purchaseable</label>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnSave} className="pulse-hover">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  subTabBar: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '2px',
    marginBottom: '20px',
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
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
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
    lineHeight: '1.4',
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
    flexShrink: 0,
  },
  tiersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  topControlSection: {
    display: 'flex',
    gap: '24px',
    alignItems: 'stretch', // Forces left column and right velocity card column to have the exact same height
  },
  leftControlsColumn: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between', // Aligns header/button block to top and search bar to bottom, ending exactly at the same length as the velocity card on the right
    gap: '24px',
  },
  leftHeaderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px', // sitting tightly together to eliminate any wide blank gaps
  },
  rightControlsColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  createButtonRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: '4px', // Sit snugly under description
  },
  filtersBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: '16px',
    backgroundColor: 'var(--glass-bg)',
    border: '1px solid var(--border-light)',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FFF',
    border: '1px solid rgba(93, 63, 211, 0.1)',
    borderRadius: '12px',
    padding: '8px 14px',
    flex: 1,
    minWidth: '220px',
  },
  searchIcon: {
    color: 'var(--text-light)',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-main)',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
    fontFamily: 'var(--font-sans)',
  },
  filterGroup: {
    display: 'flex',
    gap: '12px',
  },
  filterSelect: {
    padding: '10px 14px',
    borderRadius: '12px',
    backgroundColor: '#FFF',
    border: '1px solid rgba(93, 63, 211, 0.1)',
    color: 'var(--text-muted)',
    fontSize: '13.5px',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  tiersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)', // Strict 3 columns layout across the full width
    gap: '32px', // Luxurious breathing room between cards
  },
  gridTierCard: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '24px',
    backgroundColor: 'var(--glass-bg)',
    border: '1px solid var(--border-light)',
    transition: 'var(--transition-smooth)',
    boxShadow: 'var(--shadow-sm)',
  },
  gridCardCoverImg: {
    height: '140px',
    width: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
  },
  gridCardContent: {
    padding: '24px', // Increased card content padding for a very premium feel
    display: 'flex',
    flexDirection: 'column',
    gap: '24px', // Expanded spacing between block elements inside the card
    flex: 1,
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
  },
  badgeBaseAccess: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  badgeLive: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'var(--success-bg)',
    color: 'var(--success)',
    padding: '4px 8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    letterSpacing: '0.5px',
  },
  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
  },
  infoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tierTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    lineHeight: '1.3',
  },
  idCodeLine: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: 'var(--text-light)',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
  },
  idCode: {
    color: 'var(--purple-primary)',
    fontWeight: '700',
    backgroundColor: 'rgba(93, 63, 211, 0.05)',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(93, 63, 211, 0.06)',
    letterSpacing: '0.2px',
  },
  statsRow: {
    display: 'flex',
    gap: '24px', // More spacing between statistics columns
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(93, 63, 211, 0.06)',
    borderBottom: '1px solid rgba(93, 63, 211, 0.06)',
    padding: '16px 0', // Enhanced vertical padding to make statistics breathe
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  statLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--text-light)',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px', // Spacious vertical gap in the utilization meter
  },
  progressBarTrack: {
    height: '7px', // Slightly thicker tracking bar for high-end contrast
    backgroundColor: 'rgba(93, 63, 211, 0.05)',
    borderRadius: '100px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  btnOutlineSmall: {
    padding: '5px 10px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-light)',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-main)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  btnDeleteSmall: {
    padding: '5px 10px',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#EF4444',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  sidebarPane: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  velocityCard: {
    background: 'linear-gradient(135deg, var(--indigo-dark), var(--purple-dark))',
    padding: '24px 28px',
    borderRadius: '24px',
    color: '#FFF',
    boxShadow: '0 12px 30px rgba(93, 63, 211, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1, // Let card auto scale in stretch container
  },
  velocityHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  velocityLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  velocityDesc: {
    fontSize: '12px',
    lineHeight: '1.4',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  velocityValRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    margin: '12px 0',
  },
  velocityVal: {
    fontFamily: 'var(--font-heading)',
    fontSize: '24px', // Proportional text size for elegant balancing
    fontWeight: '800',
  },
  velocityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '4px 8px',
    borderRadius: '6px',
    color: '#FFF',
  },
  reportBtn: {
    padding: '11px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#FFF',
    fontSize: '12.5px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  kpisRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    marginTop: '32px',
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
  },
  kpiIconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(93, 63, 211, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiSub: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiMain: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    marginTop: '2px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 27, 75, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    width: '460px',
    padding: '32px',
    borderRadius: '24px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    boxShadow: '0 20px 48px rgba(30, 27, 75, 0.15), 0 0 32px rgba(93, 63, 211, 0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--indigo-dark)',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  formInput: {
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#FFF',
    border: '1px solid rgba(93, 63, 211, 0.15)',
    color: 'var(--text-main)',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    transition: 'var(--transition-fast)',
  },
  formSelect: {
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#FFF',
    border: '1px solid rgba(93, 63, 211, 0.15)',
    color: 'var(--text-main)',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    transition: 'var(--transition-fast)',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
    marginBottom: '16px',
  },
  checkboxLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-main)',
    cursor: 'pointer',
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: 'var(--purple-primary)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  btnCancel: {
    padding: '10px 18px',
    borderRadius: '12px',
    backgroundColor: '#F3F4F6',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-light)',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  btnSave: {
    padding: '10px 18px',
    borderRadius: '12px',
    backgroundColor: 'var(--coral-accent)',
    color: '#FFF',
    border: 'none',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 111, 97, 0.2)',
  },
};
