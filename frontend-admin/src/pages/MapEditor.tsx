import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  UploadCloud, 
  Trash2, 
  Save,
  Sparkles,
  Utensils, 
  Activity, 
  LogIn, 
  LogOut,
  ShoppingBag, 
  Award, 
  Search, 
  X, 
  Music, 
  HelpCircle,
  Wine,
  CreditCard,
  FerrisWheel,
  Grid,
  Image,
  Users
} from 'lucide-react';
import { GenericTable } from '../components/GenericTable';
import type { Column } from '../components/GenericTable';

interface Pin {
  id?: number;
  type: string;
  name: string;
  description: string;
  xpos: number; // relative to image 0-100
  ypos: number; // relative to image 0-100
}

interface MapLayout {
  id?: number;
  imageUrl: string;
  pins: Pin[];
}

const PIN_CATEGORIES = [
  { type: 'STAGE', label: 'Stages', desc: 'Main, Alchemy, Daydreaming, Fortune, Time Stage', icon: Music, color: '#5D3FD3', bg: '#EBE5FC' },
  { type: 'WELLNESS', label: 'Soul Circle', desc: 'Yoga, meditation, sound healing, astrology', icon: Sparkles, color: '#8A72EB', bg: '#F5EEFA' },
  { type: 'FASHION_CREATOR', label: 'Fashion Corner', desc: 'Designer fairs, photo booths, creation', icon: ShoppingBag, color: '#0D9488', bg: '#E6F4F1' },
  { type: 'VENDOR_ACTIVATION', label: 'Brand Activations', desc: 'Food court mini-contests, gaming zones', icon: Award, color: '#4338CA', bg: '#EEF2FF' },
  { type: 'FOOD_COURT', label: 'Food Courts', desc: 'Food trucks, dining zones, hydration', icon: Utensils, color: '#FF5722', bg: '#FFF3E0' },
  { type: 'BAR', label: 'Bar', desc: 'Băuturi, bere, cocktailuri, băuturi răcoritoare', icon: Wine, color: '#EAB308', bg: '#FEF3C7' },
  { type: 'CREDIT_POINT', label: 'Credit Point', desc: 'Încărcare brățări și restituire cash', icon: CreditCard, color: '#FACC15', bg: '#111111' },
  { type: 'FANTASIA', label: 'Fantasia Ferris Wheel', desc: 'Roata panoramică Ferris Wheel și activități', icon: FerrisWheel, color: '#EC4899', bg: '#FCE7F3' },
  { type: 'FIRST_AID', label: 'First Aid', desc: 'Asistență medicală și corturi de prim ajutor', icon: Activity, color: '#EF4444', bg: '#FFFFFF' },
  { type: 'TOILET', label: 'Toilets', desc: 'Toalete și zone de igienizare', icon: Users, color: '#06B6D4', bg: '#E0F7FA' },
  { type: 'ENTRANCE', label: 'Intrare', desc: 'Porți principale, scanare bilete și acces', icon: LogIn, color: '#10B981', bg: '#D1FAE5' },
  { type: 'EXIT', label: 'Ieșire', desc: 'Zone de ieșire și fluxuri de evacuare', icon: LogOut, color: '#EF4444', bg: '#FFEBEB' }
];

const TABS = [
  { id: 'all', label: 'Toate Punctele', icon: Grid, types: ['STAGE', 'FANTASIA', 'WELLNESS', 'FASHION_CREATOR', 'BAR', 'FOOD_COURT', 'CREDIT_POINT', 'VENDOR_ACTIVATION', 'ENTRANCE', 'EXIT', 'TOILET', 'FIRST_AID'] },
  { id: 'music', label: 'Scene & Divertisment', icon: Music, types: ['STAGE', 'FANTASIA', 'WELLNESS', 'FASHION_CREATOR'] },
  { id: 'food', label: 'Mâncare & Băutură', icon: Utensils, types: ['BAR', 'FOOD_COURT', 'CREDIT_POINT', 'VENDOR_ACTIVATION'] },
  { id: 'utilities', label: 'Utilități & Siguranță', icon: Activity, types: ['ENTRANCE', 'EXIT', 'TOILET', 'FIRST_AID'] }
];

export const MapEditor = () => {
  const [mapLayout, setMapLayout] = useState<MapLayout>({ imageUrl: '', pins: [] });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'music' | 'food' | 'utilities'>('all');

  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PIN_CATEGORIES.forEach(cat => {
      initial[cat.type] = true;
    });
    return initial;
  });

  const isPinVisibleOnMap = (pin: Pin) => {
    return visibleCategories[pin.type] !== false;
  };

  // Modal / Popup state for editing/adding pins
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);
  
  // Form fields for pin definition
  const [pinName, setPinName] = useState('');
  const [pinType, setPinType] = useState('STAGE');
  const [pinDescription, setPinDescription] = useState('');

  const mapImageRef = useRef<HTMLImageElement>(null);

  // Retrieve JWT Auth Token
  const getAuthHeader = () => {
    const token = sessionStorage.getItem('untold_token') || sessionStorage.getItem('token') || '';
    return token ? `Bearer ${token}` : '';
  };

  // Fetch active map on mount
  useEffect(() => {
    fetchActiveMap();
  }, []);

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: null });
    }, 4000);
  };

  const fetchActiveMap = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/map/active', {
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      const resData = await response.json();
      if (resData.type === 'SUCCESS' && resData.data) {
        // Map backend PinDto keys to frontend Pin structure
        const backendPins = resData.data.pins || [];
        const pins = backendPins.map((bp: any) => ({
          id: bp.id,
          type: bp.type,
          name: bp.name,
          description: bp.description,
          xpos: bp.xpos,
          ypos: bp.ypos
        }));
        setMapLayout({
          id: resData.data.id,
          imageUrl: resData.data.imageUrl,
          pins
        });
      }
    } catch (err) {
      console.error('Failed to load active layout', err);
      showToast('Eroare la preluarea hărții active', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle uploading of map photo
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Imaginea depășește limita de 10MB', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/admin/map/upload', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        },
        body: formData
      });

      const resData = await response.json();
      if (resData.type === 'SUCCESS' && resData.data) {
        setMapLayout(prev => ({
          ...prev,
          imageUrl: resData.data.imageUrl
        }));
        showToast('Imaginea hărții a fost încărcată cu succes!', 'success');
      } else {
        showToast(resData.message || 'Eroare la încărcarea imaginii', 'error');
      }
    } catch (err) {
      console.error('Upload failed', err);
      showToast('Eroare de conexiune la încărcarea imaginii', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle clicking on image background (to place a new Pin OR to deselect if one is selected)
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapImageRef.current) return;

    // If there is currently a selected pin, clicking elsewhere on the map should JUST deselect it
    if (selectedPin) {
      setSelectedPin(null);
      return;
    }

    const rect = mapImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clear previous selection
    setSelectedPin(null);

    // Open Modal for creation
    setTempCoords({ x, y });
    setPinName('');
    setPinType('STAGE');
    setPinDescription('');
    setModalMode('CREATE');
    setIsModalOpen(true);
  };

  // Single-click on existing pin (visual pin or table row) to SELECT it and show tooltip
  const handlePinClick = (e: React.MouseEvent | null, pin: Pin) => {
    if (e) e.stopPropagation(); // Avoid triggering map creation click or background deselection
    setSelectedPin(pin);
    setPinName(pin.name);
    setPinType(pin.type);
    setPinDescription(pin.description);

    // Switch active tab to the category of the selected pin ONLY if the current tab doesn't already contain it
    const currentTabObj = TABS.find(t => t.id === activeCategoryTab);
    if (!currentTabObj || !currentTabObj.types.includes(pin.type)) {
      const targetTab = TABS.find(t => t.id !== 'all' && t.types.includes(pin.type));
      if (targetTab) {
        setActiveCategoryTab(targetTab.id as 'all' | 'music' | 'food' | 'utilities');
      }
    }
  };

  // Double-click on existing pin to open the EDIT modal
  const handlePinDoubleClick = (e: React.MouseEvent | null, pin: Pin) => {
    if (e) e.stopPropagation();
    setSelectedPin(pin);
    setPinName(pin.name);
    setPinType(pin.type);
    setPinDescription(pin.description);

    // Switch active tab to the category of the selected pin ONLY if the current tab doesn't already contain it
    const currentTabObj = TABS.find(t => t.id === activeCategoryTab);
    if (!currentTabObj || !currentTabObj.types.includes(pin.type)) {
      const targetTab = TABS.find(t => t.id !== 'all' && t.types.includes(pin.type));
      if (targetTab) {
        setActiveCategoryTab(targetTab.id as 'all' | 'music' | 'food' | 'utilities');
      }
    }

    setModalMode('EDIT');
    setIsModalOpen(true);
  };

  // Confirm creating or editing a pin
  const handleSavePin = () => {
    if (!pinName.trim()) {
      showToast('Numele pin-ului este obligatoriu', 'error');
      return;
    }

    if (modalMode === 'CREATE' && tempCoords) {
      const newPin: Pin = {
        type: pinType,
        name: pinName,
        description: pinDescription,
        xpos: Math.round(tempCoords.x * 100) / 100,
        ypos: Math.round(tempCoords.y * 100) / 100
      };
      setMapLayout(prev => ({
        ...prev,
        pins: [...prev.pins, newPin]
      }));
      showToast(`Pin-ul "${pinName}" a fost plasat local`, 'success');
    } else if (modalMode === 'EDIT' && selectedPin) {
      setMapLayout(prev => ({
        ...prev,
        pins: prev.pins.map(p => 
          (p.xpos === selectedPin.xpos && p.ypos === selectedPin.ypos) 
            ? { ...p, name: pinName, type: pinType, description: pinDescription } 
            : p
        )
      }));
      showToast(`Pin-ul "${pinName}" a fost actualizat local`, 'success');
    }

    setIsModalOpen(false);
    setTempCoords(null);
    setSelectedPin(null);
  };

  // Delete local pin
  const handleDeletePin = (pinToDelete: Pin) => {
    setMapLayout(prev => ({
      ...prev,
      pins: prev.pins.filter(p => !(p.xpos === pinToDelete.xpos && p.ypos === pinToDelete.ypos))
    }));
    setIsModalOpen(false);
    setSelectedPin(null);
    showToast(`Pin-ul "${pinToDelete.name}" a fost șters`, 'success');
  };

  // Send whole layout with pins to database
  const handleSaveFullLayout = async () => {
    if (!mapLayout.imageUrl) {
      showToast('Vă rugăm să încărcați mai întâi o imagine pentru hartă!', 'error');
      return;
    }

    setLoading(true);
    
    // Transform pins coordinates property names back to backend structure (xPos / yPos)
    const backendPins = mapLayout.pins.map(p => ({
      id: p.id,
      type: p.type,
      name: p.name,
      description: p.description,
      xpos: p.xpos,
      ypos: p.ypos
    }));

    const payload = {
      imageUrl: mapLayout.imageUrl,
      isActive: true,
      pins: backendPins
    };

    try {
      const response = await fetch('http://localhost:8080/api/admin/map/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.type === 'SUCCESS') {
        showToast('Planul festivalului și pin-urile au fost salvate cu succes în baza de date!', 'success');
        fetchActiveMap(); // refresh
      } else {
        showToast(resData.message || 'Eroare la salvarea configurației', 'error');
      }
    } catch (err) {
      console.error('Failed to save layout config', err);
      showToast('Eroare de conexiune la salvarea hărții', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get specific category styles/details
  const getCategoryMeta = (type: string) => {
    return PIN_CATEGORIES.find(c => c.type === type) || {
      type: 'INFO',
      label: 'Info',
      desc: 'Information point',
      icon: HelpCircle,
      color: '#9B95A7',
      bg: '#F5EEFA'
    };
  };

  // Grouping & Filtering pins based on active category tab and search term
  const getPinsForActiveTab = () => {
    const activeTabObj = TABS.find(t => t.id === activeCategoryTab);
    if (!activeTabObj) return [];

    return mapLayout.pins.filter(pin => {
      const matchesCategory = activeTabObj.types.includes(pin.type);
      const matchesSearch = searchTerm.trim() === '' || 
        pin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pin.description && pin.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  };

  const columns: Column<Pin>[] = [
    {
      header: 'Icon',
      style: { width: '70px', textAlign: 'center', paddingLeft: '24px' },
      headerStyle: { width: '70px', textAlign: 'center', paddingLeft: '24px' },
      render: (pin) => {
        const meta = getCategoryMeta(pin.type);
        const IconComp = meta.icon;
        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: meta.bg,
            margin: '0 auto'
          }}>
            <IconComp size={16} style={{ color: meta.color }} />
          </div>
        );
      }
    },
    {
      header: 'Nume Punct',
      style: { width: '200px' },
      headerStyle: { width: '200px' },
      render: (pin) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main, #1F2937)', fontSize: '13.5px' }}>{pin.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #6B7280)', marginTop: '2px' }}>{getCategoryMeta(pin.type).label}</div>
        </div>
      )
    },
    {
      header: 'Descriere',
      style: { width: '250px' },
      headerStyle: { width: '250px' },
      render: (pin) => (
        <div style={{ 
          maxWidth: '240px', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          color: 'var(--text-muted, #6B7280)',
          fontSize: '12px'
        }}>
          {pin.description || '-'}
        </div>
      )
    },
    {
      header: 'Poziție',
      style: { width: '160px' },
      headerStyle: { width: '160px' },
      render: (pin) => (
        <div style={{ fontSize: '12.5px', color: 'var(--text-light, #9CA3AF)', fontFamily: 'monospace' }}>
          X: <span style={{ fontWeight: 600 }}>{pin.xpos}%</span>, Y: <span style={{ fontWeight: 600 }}>{pin.ypos}%</span>
        </div>
      )
    },
    {
      header: 'Acțiuni',
      style: { width: '80px', textAlign: 'center', paddingRight: '24px' },
      headerStyle: { width: '80px', textAlign: 'center', paddingRight: '24px' },
      render: (pin) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeletePin(pin);
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-light, #9CA3AF)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="delete-btn-hover"
        >
          <Trash2 size={15} />
        </button>
      )
    }
  ];

  return (
    <div style={styles.container} className="animate-fade-in">
      
      {/* Toast Notification */}
      {message.text && (
        <div style={{
          ...styles.toast,
          backgroundColor: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
        }}>
          {message.text}
        </div>
      )}

      {/* Header section with Premium Buttons */}
      <header style={styles.header}>
        <div>
          <h2 style={styles.title} className="title-heading">Harta Festivalului & Venue Layout</h2>
          <p style={styles.subtitle}>Încarcă schița oficială a festivalului, configurează și plasează punctele de interes (PINs) pentru aplicația mobilă.</p>
        </div>
        <button 
          onClick={handleSaveFullLayout}
          disabled={loading || uploading}
          style={{
            ...styles.primaryButton,
            opacity: loading || uploading ? 0.6 : 1,
            cursor: loading || uploading ? 'not-allowed' : 'pointer',
          }}
          className="pulse-hover"
        >
          <Save size={18} />
          <span>Salvează Configurația Pe Server</span>
        </button>
      </header>

      {/* Main split workarea */}
      <div style={styles.mainLayout}>
        
        {/* Left column: Visual Editor Canvas */}
        {!mapLayout.imageUrl ? (
          // Empty State - Image upload area rendered as a beautiful floating glass card
          <div style={{
            ...styles.uploadArea,
            margin: '40px auto',
            boxShadow: '0 8px 32px rgba(93, 63, 211, 0.08)',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={styles.uploadIconCircle}>
              {uploading ? (
                <div style={styles.spinner} />
              ) : (
                <UploadCloud size={36} style={{ color: 'var(--purple-primary)' }} />
              )}
            </div>
            <h4 style={styles.uploadTitle}>{uploading ? 'Se încarcă schița hărții...' : 'Încarcă Planul Festivalului'}</h4>
            <p style={styles.uploadDesc}>Selectează o imagine de înaltă rezoluție (format PNG, JPG, JPEG sau WEBP, maxim 10MB)</p>
            <label style={styles.uploadButton}>
              Răsfoiește fișierele
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
                disabled={uploading}
              />
            </label>
          </div>
        ) : (
          // Side-by-side Layout: Sidebar and Map Canvas floating freely on the page background!
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '24px',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            width: '100%',
            marginBottom: '10px'
          }}>
            {/* Filters Panel Sidebar (Stationary, outside the map image!) */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 4px 24px rgba(93, 63, 211, 0.05)',
                width: '260px',
                flexShrink: 0,
              }}
            >
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                paddingBottom: '8px'
              }}>
                <div style={{
                  fontSize: '11px', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  color: '#4B5563',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>Filtre Puncte</span>
                  <Sparkles size={12} style={{ color: 'var(--purple-primary)' }} />
                </div>

                {/* Quick Selection Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '2px'
                }}>
                  <button
                    onClick={() => {
                      const allOn: Record<string, boolean> = {};
                      PIN_CATEGORIES.forEach(c => allOn[c.type] = true);
                      setVisibleCategories(allOn);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(93, 63, 211, 0.06)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 0',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--purple-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    Bifează tot
                  </button>
                  <button
                    onClick={() => {
                      const allOff: Record<string, boolean> = {};
                      PIN_CATEGORIES.forEach(c => allOff[c.type] = false);
                      setVisibleCategories(allOff);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 0',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#4B5563',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    Debifează tot
                  </button>
                </div>
              </div>

              {/* Interactive tip */}
              <div style={{
                backgroundColor: 'rgba(93, 63, 211, 0.04)',
                border: '1px solid rgba(93, 63, 211, 0.08)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                color: 'var(--purple-primary)',
                lineHeight: '1.4',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px'
              }}>
                <span>💡</span>
                <span><strong>Ghid rapid:</strong> Click pe hartă pentru pin nou. Dublu-click pe pin pentru editare.</span>
              </div>

              {/* Scrollable list of categories */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                maxHeight: '340px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}>
                {PIN_CATEGORIES.map(cat => {
                  const CatIcon = cat.icon;
                  const isVisible = visibleCategories[cat.type] !== false;
                  const count = mapLayout.pins.filter(p => p.type === cat.type).length;

                  return (
                    <button
                      key={cat.type}
                      onClick={() => setVisibleCategories(prev => ({ ...prev, [cat.type]: !prev[cat.type] }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: isVisible ? 'rgba(93, 63, 211, 0.02)' : 'transparent',
                        border: isVisible ? '1px solid rgba(93, 63, 211, 0.06)' : '1px solid transparent',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        width: '100%',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        opacity: isVisible ? 1 : 0.45
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: cat.bg,
                        border: cat.bg === '#FFFFFF' ? '1px solid rgba(0, 0, 0, 0.15)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CatIcon size={12} style={{ color: cat.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          color: '#1F2937',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{cat.label}</div>
                      </div>
                      
                      {/* Count Badge */}
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#6B7280',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        marginRight: '4px'
                      }}>{count}</span>

                      {/* Toggle Indicator */}
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '4px',
                        border: `1.5px solid ${cat.color}`,
                        backgroundColor: isVisible ? cat.color : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}>
                        {isVisible && <span style={{ color: '#FFF', fontSize: '8px', fontWeight: 'bold' }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Subtle separator line */}
              <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', marginTop: '4px', paddingTop: '10px' }} />

              {/* Replace Image Button inside the Sidebar */}
              <button 
                onClick={() => setMapLayout({ imageUrl: '', pins: [] })}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#EF4444',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
                }}
              >
                <Image size={12} />
                <span>Schimbă imaginea hărții</span>
              </button>
            </div>

            {/* Map Workspace (Takes remaining side-by-side space!) */}
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 0,
              backgroundColor: 'transparent',
            }}>
              <div style={{
                ...styles.canvasWrapper,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' // Soft elegant floating paper shadow
              }} onClick={handleImageClick}>
                {loading && (
                  <div style={styles.loadingOverlay}>
                    <div style={styles.spinner} />
                    <p style={{ marginTop: '12px', color: '#FFF', fontWeight: 600 }}>Se reîncarcă harta...</p>
                  </div>
                )}
                
                <img 
                  ref={mapImageRef}
                  src={`http://localhost:8080${mapLayout.imageUrl}`} 
                  alt="Festival Map Layout" 
                  style={styles.mapImage}
                  onError={(e) => {
                    console.error('Image failed to load, path: ', mapLayout.imageUrl);
                    // fallback to serve path directly or absolute if it's already full
                    if (!e.currentTarget.src.startsWith('http://localhost:8080/uploads')) {
                       e.currentTarget.src = mapLayout.imageUrl;
                    }
                  }}
                />

                {/* Render pins */}
                {mapLayout.pins.filter(isPinVisibleOnMap).map((pin, idx) => {
                  const meta = getCategoryMeta(pin.type);
                  const IconComp = meta.icon;
                  const isHovered = hoveredPin && hoveredPin.xpos === pin.xpos && hoveredPin.ypos === pin.ypos;
                  const isSelected = selectedPin && selectedPin.xpos === pin.xpos && selectedPin.ypos === pin.ypos;
                  const isActive = isHovered || isSelected;
                  
                  return (
                    <div
                      key={idx}
                      onClick={(e) => handlePinClick(e, pin)}
                      onDoubleClick={(e) => handlePinDoubleClick(e, pin)}
                      onMouseEnter={() => setHoveredPin(pin)}
                      onMouseLeave={() => setHoveredPin(null)}
                      style={{
                        ...styles.pinWrapper,
                        left: `${pin.xpos}%`,
                        top: `${pin.ypos}%`,
                        zIndex: isActive ? 1000 : 5
                      }}
                    >
                      {/* Interactive Pin Circle */}
                      <div 
                        style={{
                          ...styles.pinCircle,
                          backgroundColor: pin.type === 'FIRST_AID' 
                            ? '#FFFFFF' 
                            : pin.type === 'CREDIT_POINT' 
                              ? '#111111' 
                              : meta.color,
                          borderColor: pin.type === 'FIRST_AID' 
                            ? '#EF4444' 
                            : pin.type === 'CREDIT_POINT' 
                              ? '#EAB308' 
                              : '#FFFFFF',
                          transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                        }}
                      >
                        <IconComp 
                          size={14} 
                          style={{ 
                            color: pin.type === 'FIRST_AID' 
                              ? '#EF4444' 
                              : pin.type === 'CREDIT_POINT' 
                                ? '#EAB308' 
                                : '#FFFFFF' 
                          }} 
                        />
                      </div>

                      {/* Tooltip on hover */}
                      {(isHovered || (selectedPin && selectedPin.xpos === pin.xpos && selectedPin.ypos === pin.ypos)) && (
                        <div style={styles.pinTooltip}>
                          <h5 style={styles.tooltipTitle}>{pin.name}</h5>
                          <span style={{
                            ...styles.tooltipBadge,
                            backgroundColor: meta.bg,
                            color: meta.color
                          }}>{meta.label}</span>
                          {pin.description && <p style={styles.tooltipDesc}>{pin.description}</p>}
                          <div style={styles.tooltipTip} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right column: Pins list & Config Sidebar */}
        <div style={{...styles.rightCard, maxHeight: 'none'}} className="glass-card">
          <div style={{
            ...styles.cardHeaderBorder,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <h3 style={styles.cardTitle}>Administrare Puncte (PINs)</h3>
            
            <div style={{...styles.searchWrapper, maxWidth: '300px'}}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Caută pin..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Interactive Category Tabs */}
          <div style={styles.tabsContainer}>
            {TABS.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeCategoryTab === tab.id;
              const count = mapLayout.pins.filter(p => tab.types.includes(p.type)).length;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryTab(tab.id as 'all' | 'music' | 'food' | 'utilities')}
                  style={{
                    ...styles.tabButton,
                    borderBottom: isActive ? '3px solid var(--purple-primary)' : '3px solid transparent',
                    color: isActive ? 'var(--purple-primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? '700' : '500'
                  }}
                >
                  <TabIcon size={16} />
                  <span>{tab.label}</span>
                  <span style={{
                    ...styles.tabCountBadge,
                    backgroundColor: isActive ? 'var(--purple-primary)' : 'rgba(93, 63, 211, 0.08)',
                    color: isActive ? '#FFF' : 'var(--purple-primary)',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ padding: '24px', flex: 1 }}>
            <GenericTable
              columns={columns}
              data={getPinsForActiveTab()}
              itemsPerPage={5} // Perfect size for a compact card below the map
              emptyMessage="Niciun pin găsit în această categorie pentru căutarea curentă."
              onRowClick={(pin) => handlePinClick(null, pin)}
              onRowDoubleClick={(pin) => handlePinDoubleClick(null, pin)}
              selectedRowKey={(pin) => selectedPin !== null && selectedPin.xpos === pin.xpos && selectedPin.ypos === pin.ypos}
              onRowMouseEnter={(pin) => setHoveredPin(pin)}
              onRowMouseLeave={() => setHoveredPin(null)}
            />
          </div>
        </div>

      </div>

      {/* Edit/Create Pin popup modal wrapped in React Portal to escape any parent containers */}
      {isModalOpen && createPortal(
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} className="glass-card" onClick={(e) => e.stopPropagation()}>
            
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>
                {modalMode === 'CREATE' ? 'Adaugă Pin Nou' : 'Editează Pin'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeModalBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nume punct de interes</label>
                <input 
                  type="text" 
                  value={pinName} 
                  onChange={(e) => setPinName(e.target.value)}
                  placeholder="Ex: Scena Alchemy, Toalete Zona VIP, Food Court Est..."
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Categorie / Tip punct</label>
                <select 
                  value={pinType} 
                  onChange={(e) => setPinType(e.target.value)}
                  style={styles.formSelect}
                >
                  {PIN_CATEGORIES.map(cat => (
                    <option key={cat.type} value={cat.type}>
                      {cat.label} ({cat.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Scurtă descriere / Detalii</label>
                <textarea 
                  value={pinDescription} 
                  onChange={(e) => setPinDescription(e.target.value)}
                  placeholder="Scrie o scurtă descriere pentru a ajuta participanții la festival..."
                  rows={3}
                  style={styles.formTextarea}
                />
              </div>

              {tempCoords && (
                <div style={styles.formCoordsText}>
                  Coordonate selectate: <strong>X: {Math.round(tempCoords.x)}%, Y: {Math.round(tempCoords.y)}%</strong>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              {modalMode === 'EDIT' && selectedPin && (
                <button 
                  onClick={() => handleDeletePin(selectedPin)}
                  style={styles.modalDeleteBtn}
                >
                  Șterge Pin
                </button>
              )}
              <button 
                onClick={() => setIsModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                Anulează
              </button>
              <button 
                onClick={handleSavePin}
                style={styles.modalSaveBtn}
              >
                {modalMode === 'CREATE' ? 'Plasează Pin' : 'Salvează Modificările'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    height: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '20px'
  },
  title: {
    fontSize: '28px',
    color: 'var(--purple-dark)',
    lineHeight: '1.2'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginTop: '6px',
    maxWidth: '750px'
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'var(--transition-smooth)',
    boxShadow: '0 4px 12px rgba(93, 63, 211, 0.25)',
  },
  mainLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    alignItems: 'stretch',
    width: '100%'
  },
  leftCard: {
    borderRadius: '20px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: '100%'
  },
  rightCard: {
    borderRadius: '20px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '520px', // Balanced compact scrolling card below the map
    overflow: 'hidden',
    width: '100%'
  },
  cardHeaderBorder: {
    borderBottom: '1px solid var(--border-light)',
    padding: '20px 24px',
  },
  cardHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--indigo-dark)'
  },
  canvasTip: {
    fontSize: '12px',
    color: 'var(--purple-primary)',
    backgroundColor: 'var(--purple-light)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: 500
  },
  canvasBody: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1ECFA',
    minHeight: '400px'
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    border: '2px dashed rgba(93, 63, 211, 0.2)',
    borderRadius: '16px',
    padding: '48px 32px',
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: '550px'
  },
  uploadIconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'var(--purple-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  uploadTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--purple-dark)',
    marginBottom: '8px'
  },
  uploadDesc: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    maxWidth: '380px',
    lineHeight: '1.5',
    marginBottom: '24px'
  },
  uploadButton: {
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    padding: '10px 24px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    boxShadow: '0 2px 6px rgba(93, 63, 211, 0.15)',
  },
  canvasWrapper: {
    position: 'relative',
    display: 'inline-block',
    cursor: 'crosshair',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
  },
  mapImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '650px', // Perfect sweet spot height for standard screens
    height: 'auto',
    userSelect: 'none'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(47, 17, 96, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  pinWrapper: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    zIndex: 5
  },
  pinCircle: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid #FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  pinTooltip: {
    position: 'absolute',
    bottom: '34px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(26, 22, 37, 0.96)',
    color: '#FFF',
    padding: '12px',
    borderRadius: '12px',
    width: '180px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    zIndex: 12,
    pointerEvents: 'none',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  tooltipTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFF',
    margin: 0
  },
  tooltipBadge: {
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
    width: 'fit-content',
    textTransform: 'uppercase'
  },
  tooltipDesc: {
    fontSize: '10px',
    color: '#D1CDDA',
    margin: 0,
    lineHeight: '1.4'
  },
  tooltipTip: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: '12px',
    height: '12px',
    backgroundColor: 'rgba(26, 22, 37, 0.96)',
  },
  cardFooter: {
    borderTop: '1px solid var(--border-light)',
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 63, 211, 0.02)'
  },
  mapMetaText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  changeImageButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--danger)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'var(--transition-fast)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    padding: '20px 24px 0 24px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(93, 63, 211, 0.04)',
    borderRadius: '12px',
    padding: '12px 8px',
    border: '1px solid var(--border-light)',
  },
  statNum: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--purple-dark)'
  },
  statLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    textAlign: 'center'
  },
  filtersSection: {
    padding: '16px 24px 12px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderBottom: '1px solid var(--border-light)'
  },
  searchWrapper: {
    position: 'relative',
    width: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-light)'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    border: '1px solid var(--border-light)',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
    transition: 'var(--transition-fast)',
    backgroundColor: '#FFF'
  },
  categorySelectRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '4px',
    width: '100%',
  },
  filterPill: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '700',
    border: '1px solid',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'var(--transition-fast)'
  },
  pinsListContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 24px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyPinsBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    textAlign: 'center'
  },
  pinItemCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
    transition: 'var(--transition-smooth)',
    cursor: 'pointer',
    backgroundColor: '#FFF'
  },
  pinIconSquare: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  pinItemMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0
  },
  pinItemName: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-main)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  pinItemDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  pinItemCoords: {
    fontSize: '10px',
    color: 'var(--text-light)',
    marginTop: '2px'
  },
  deletePinIconBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-light)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    transition: 'var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(93, 63, 211, 0.1)',
    borderTopColor: 'var(--purple-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    color: '#FFF',
    padding: '14px 24px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    zIndex: 1000,
    fontSize: '14px',
    fontWeight: '600',
    animation: 'fadeInUp 0.3s ease-out'
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
    zIndex: 10000,
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--indigo-dark)',
  },
  closeModalBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fast)',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  formGroup: {
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
    fontFamily: 'var(--font-sans)',
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
    fontFamily: 'var(--font-sans)',
    transition: 'var(--transition-fast)',
  },
  formTextarea: {
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#FFF',
    border: '1px solid rgba(93, 63, 211, 0.15)',
    color: 'var(--text-main)',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    resize: 'none',
    transition: 'var(--transition-fast)',
  },
  formCoordsText: {
    fontSize: '11px',
    color: 'var(--text-light)',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
    backgroundColor: 'rgba(93, 63, 211, 0.05)',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(93, 63, 211, 0.06)',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  modalCancelBtn: {
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
  modalSaveBtn: {
    padding: '10px 18px',
    borderRadius: '12px',
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    border: 'none',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(93, 63, 211, 0.15)',
  },
  modalDeleteBtn: {
    padding: '10px 14px',
    borderRadius: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.1)',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    color: 'var(--danger)',
    cursor: 'pointer',
    marginRight: 'auto',
  },
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid var(--border-light)',
    padding: '0 24px',
    backgroundColor: 'rgba(93, 63, 211, 0.02)',
    overflowX: 'auto',
    gap: '24px'
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 8px 13px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  tabCountBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '700',
    marginLeft: '4px',
    transition: 'all 0.2s ease'
  }
};

export default MapEditor;
