import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, RefreshCw, UserRound } from 'lucide-react';
import { GenericTable } from '../components/GenericTable';
import type { Column } from '../components/GenericTable';

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  city: string;
  documentType: string;
  documentId: string;
  phoneNumber: string;
  ownerEmail?: string | null;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  country: '',
  city: '',
  documentType: 'NATIONAL_ID',
  documentId: '',
  phoneNumber: '',
};

export const Persons = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/api/persons');
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        setPersons(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch persons from backend', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (person: Person) => {
    setEditingId(person.id);
    setForm({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      dateOfBirth: person.dateOfBirth || '',
      gender: person.gender || '',
      country: person.country || '',
      city: person.city || '',
      documentType: person.documentType || 'NATIONAL_ID',
      documentId: person.documentId || '',
      phoneNumber: person.phoneNumber || '',
    });
    setShowModal(true);
  };

  const handleFieldChange = (field: keyof typeof emptyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;

    setSaving(true);
    try {
      const url = editingId
        ? `http://localhost:8080/api/persons/${editingId}`
        : 'http://localhost:8080/api/persons';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        setShowModal(false);
        fetchPersons();
      } else {
        alert('Failed to save person: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error saving person: ' + err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this person record?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/persons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        fetchPersons();
      } else {
        alert('Failed to delete person: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting person: ' + err);
    }
  };

  const columns: Column<Person>[] = [
    {
      header: 'Name',
      render: (p) => {
        const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.avatarLabel}>{initials || <UserRound size={14} />}</div>
            <span style={styles.nameText}>{p.firstName} {p.lastName}</span>
          </div>
        );
      },
      style: { width: '18%' },
    },
    {
      header: 'Date of Birth',
      render: (p) => <span style={styles.cellText}>{p.dateOfBirth || '-'}</span>,
      style: { width: '11%' },
    },
    {
      header: 'Gender',
      render: (p) => <span style={styles.cellText}>{p.gender || '-'}</span>,
      style: { width: '8%' },
    },
    {
      header: 'Location',
      render: (p) => <span style={styles.cellText}>{[p.city, p.country].filter(Boolean).join(', ') || '-'}</span>,
      style: { width: '14%' },
    },
    {
      header: 'User',
      render: (p) => <span style={styles.cellText}>{p.ownerEmail || '-'}</span>,
      style: { width: '15%' },
    },
    {
      header: 'Document',
      render: (p) => (
        <span style={styles.cellText}>
          {p.documentType ? `${p.documentType.replace(/_/g, ' ')} - ${p.documentId || ''}` : '-'}
        </span>
      ),
      style: { width: '17%' },
    },
    {
      header: 'Phone',
      render: (p) => <span style={styles.cellText}>{p.phoneNumber || '-'}</span>,
      style: { width: '12%' },
    },
    {
      header: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
            style={styles.iconBtn}
            title="Edit person"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
            style={styles.iconBtn}
            className="text-danger-hover"
            title="Delete person"
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
          <h2 style={styles.title}>Attendee Records</h2>
          <p style={styles.subtitle}>Manage the personal / identification records collected for ticket check-in.</p>
        </div>
        <button style={styles.btnPrimary} className="pulse-hover" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Add Person</span>
        </button>
      </div>

      <div style={styles.card} className="glass-card">
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>All Records</h4>
          <button style={styles.filterBtn} onClick={fetchPersons}>Refresh</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--purple-primary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: 600 }}>Loading records from database...</span>
          </div>
        ) : (
          <GenericTable
            columns={columns}
            data={persons}
            itemsPerPage={8}
            emptyMessage="Nu există înregistrări. Apasă pe 'Add Person' pentru a adăuga prima înregistrare!"
            flat={true}
          />
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card zoom-in-animation">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Person' : 'Add New Person'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.fieldLabel}>First Name *</label>
                  <input
                    type="text" required value={form.firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    style={styles.modalInputFull}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Last Name *</label>
                  <input
                    type="text" required value={form.lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    style={styles.modalInputFull}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={styles.fieldLabel}>Date of Birth</label>
                  <input
                    type="date" value={form.dateOfBirth}
                    onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                    style={styles.modalInputFull}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                    style={styles.modalInputFull}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={styles.fieldLabel}>Country</label>
                  <input
                    type="text" value={form.country}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    style={styles.modalInputFull}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>City</label>
                  <input
                    type="text" value={form.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    style={styles.modalInputFull}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={styles.fieldLabel}>Document Type</label>
                  <select
                    value={form.documentType}
                    onChange={(e) => handleFieldChange('documentType', e.target.value)}
                    style={styles.modalInputFull}
                  >
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label style={styles.fieldLabel}>Document ID</label>
                  <input
                    type="text" value={form.documentId}
                    onChange={(e) => handleFieldChange('documentId', e.target.value)}
                    style={styles.modalInputFull}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Phone Number</label>
                <input
                  type="tel" value={form.phoneNumber}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  style={styles.modalInputFull}
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
                  disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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
  avatarLabel: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12.5px',
    fontWeight: '700',
    backgroundColor: 'rgba(93, 63, 211, 0.08)',
    color: 'var(--purple-primary)',
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
    width: '520px',
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

export default Persons;
