import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, RefreshCw, Users, Gauge } from 'lucide-react';
import { GenericTable } from '../components/GenericTable';
import type { Column } from '../components/GenericTable';

type DensityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

interface Pin {
  id: number;
  type: string;
  name: string;
}

interface CrowdReport {
  id: number;
  mapPinId: number;
  mapPinName: string;
  mapPinType: string;
  densityLevel: DensityLevel;
  reportedBy: string;
  notes: string | null;
  reportedAt: string;
}

interface ZoneDensity {
  mapPinId: number;
  mapPinName: string;
  mapPinType: string;
  currentLevel: DensityLevel;
  averageScore: number;
  reportCount: number;
  lastReportedAt: string;
  lastReportedBy: string;
}

const emptyForm = {
  mapPinId: '',
  densityLevel: 'LOW' as DensityLevel,
  reportedBy: '',
  notes: '',
};

const LEVEL_META: Record<DensityLevel, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: '#1E9E6B', bg: 'rgba(30, 158, 107, 0.12)' },
  MODERATE: { label: 'Moderate', color: '#C79A1B', bg: 'rgba(199, 154, 27, 0.12)' },
  HIGH: { label: 'High', color: '#E07A2C', bg: 'rgba(224, 122, 44, 0.12)' },
  CRITICAL: { label: 'Critical', color: '#D64545', bg: 'rgba(214, 69, 69, 0.12)' },
};

export const CrowdReports = () => {
  const [reports, setReports] = useState<CrowdReport[]>([]);
  const [density, setDensity] = useState<ZoneDensity[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchReports(), fetchDensity(), fetchPins()]);
    setLoading(false);
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/crowd-reports');
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        setReports(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch crowd reports', err);
    }
  };

  const fetchDensity = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/crowd-reports/aggregation?windowMinutes=60');
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        setDensity(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch density aggregation', err);
    }
  };

  const fetchPins = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/map/active');
      const data = await res.json();
      if (data && data.type === 'SUCCESS' && data.data) {
        setPins(data.data.pins || []);
      }
    } catch (err) {
      console.error('Failed to fetch venue map pins', err);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (report: CrowdReport) => {
    setEditingId(report.id);
    setForm({
      mapPinId: String(report.mapPinId),
      densityLevel: report.densityLevel,
      reportedBy: report.reportedBy || '',
      notes: report.notes || '',
    });
    setShowModal(true);
  };

  const handleFieldChange = (field: keyof typeof emptyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mapPinId || !form.reportedBy.trim()) return;

    setSaving(true);
    try {
      const url = editingId
        ? `http://localhost:8080/api/crowd-reports/${editingId}`
        : 'http://localhost:8080/api/crowd-reports';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapPinId: Number(form.mapPinId),
          densityLevel: form.densityLevel,
          reportedBy: form.reportedBy,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        setShowModal(false);
        fetchAll();
      } else {
        alert('Failed to save crowd report: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error saving crowd report: ' + err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this crowd report?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/crowd-reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        fetchAll();
      } else {
        alert('Failed to delete crowd report: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting crowd report: ' + err);
    }
  };

  const columns: Column<CrowdReport>[] = [
    {
      header: 'Zone',
      render: (r) => (
        <div>
          <div style={styles.nameText}>{r.mapPinName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{r.mapPinType}</div>
        </div>
      ),
      style: { width: '22%' },
    },
    {
      header: 'Density',
      render: (r) => <DensityBadge level={r.densityLevel} />,
      style: { width: '15%' },
    },
    {
      header: 'Reported By',
      render: (r) => <span style={styles.cellText}>{r.reportedBy}</span>,
      style: { width: '18%' },
    },
    {
      header: 'Notes',
      render: (r) => <span style={styles.cellText}>{r.notes || '-'}</span>,
      style: { width: '25%' },
    },
    {
      header: 'Reported At',
      render: (r) => <span style={styles.cellText}>{new Date(r.reportedAt).toLocaleString()}</span>,
      style: { width: '15%' },
    },
    {
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(r); }}
            style={styles.iconBtn}
            title="Edit report"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
            style={styles.iconBtn}
            className="text-danger-hover"
            title="Delete report"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      style: { textAlign: 'right', width: '5%' },
      headerStyle: { textAlign: 'right' },
    },
  ];

  return (
    <>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.title}>Crowd Reports</h2>
          <p style={styles.subtitle}>Track and log crowd density across venue zones, aggregated in real time.</p>
        </div>
        <button style={styles.btnPrimary} className="pulse-hover" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Add Report</span>
        </button>
      </div>

      <div style={styles.card} className="glass-card">
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>
            <Gauge size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Density by Zone <span style={{ fontWeight: 500, color: 'var(--text-light)' }}>(last 60 min)</span>
          </h4>
          <button style={styles.filterBtn} onClick={fetchAll}>Refresh</button>
        </div>

        {density.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-light)', padding: '8px 0' }}>
            No recent reports in the last 60 minutes.
          </p>
        ) : (
          <div style={styles.densityGrid}>
            {density.map(z => (
              <div key={z.mapPinId} style={{ ...styles.densityCard, borderColor: LEVEL_META[z.currentLevel].color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={styles.nameText}>{z.mapPinName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{z.mapPinType}</div>
                  </div>
                  <DensityBadge level={z.currentLevel} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Users size={13} />
                  <span>{z.reportCount} report{z.reportCount === 1 ? '' : 's'} · avg {z.averageScore.toFixed(1)}/4</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                  Last by {z.lastReportedBy} · {new Date(z.lastReportedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: '24px' }} className="glass-card">
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>All Reports</h4>
        </div>

        {loading ? (
          <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--purple-primary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: 600 }}>Loading crowd reports...</span>
          </div>
        ) : (
          <GenericTable
            columns={columns}
            data={reports}
            itemsPerPage={8}
            emptyMessage="Nu există rapoarte de aglomerație. Apasă pe 'Add Report' pentru a adăuga primul raport!"
            flat={true}
          />
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card zoom-in-animation">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Crowd Report' : 'Add Crowd Report'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.modalBody}>
              <div>
                <label style={styles.fieldLabel}>Zone *</label>
                <select
                  required
                  value={form.mapPinId}
                  onChange={(e) => handleFieldChange('mapPinId', e.target.value)}
                  style={styles.modalInputFull}
                >
                  <option value="">Select a zone</option>
                  {pins.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
                {pins.length === 0 && (
                  <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                    No venue map zones found — add pins in Venue Map first.
                  </p>
                )}
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Density Level *</label>
                <select
                  value={form.densityLevel}
                  onChange={(e) => handleFieldChange('densityLevel', e.target.value)}
                  style={styles.modalInputFull}
                >
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Reported By *</label>
                <input
                  type="text" required value={form.reportedBy}
                  onChange={(e) => handleFieldChange('reportedBy', e.target.value)}
                  style={styles.modalInputFull}
                  placeholder="Staff name"
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  style={{ ...styles.modalInputFull, minHeight: '70px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.btnCancel}
                  className="pulse-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btnSubmit, flex: 1 }}
                  disabled={saving || !form.mapPinId || !form.reportedBy.trim()}
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const DensityBadge = ({ level }: { level: DensityLevel }) => {
  const meta = LEVEL_META[level];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '11.5px',
      fontWeight: 700,
      color: meta.color,
      backgroundColor: meta.bg,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    }}>
      {meta.label}
    </span>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
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
  card: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    display: 'flex',
    alignItems: 'center',
  },
  filterBtn: {
    backgroundColor: '#FFF',
    border: '1px solid rgba(93, 63, 211, 0.1)',
    borderRadius: '10px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  densityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '14px',
  },
  densityCard: {
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1.5px solid',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  nameText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--indigo-dark)',
  },
  cellText: {
    fontSize: '13px',
    color: 'var(--text-main)',
    fontWeight: '500',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-light)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 12, 38, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: '20px',
    width: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(15, 12, 38, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255, 255, 255, 0.6)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 16px 24px',
    borderBottom: '1px solid var(--border-light)',
  },
  modalTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--indigo-dark)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '50%',
    transition: 'var(--transition-fast)',
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },
  modalInputFull: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border-light)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
  },
  btnCancel: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#FFF',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-light)',
    borderRadius: '12px',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  btnSubmit: {
    padding: '11px',
    backgroundColor: 'var(--coral-accent)',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 111, 97, 0.15)',
  },
};

export default CrowdReports;
