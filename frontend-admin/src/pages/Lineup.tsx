import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  AlertTriangle, 
  Info, 
  Trash2, 
  RefreshCw,
  X,
  Music
} from 'lucide-react';
import { GenericTable } from '../components/GenericTable';
import type { Column } from '../components/GenericTable';

interface Performance {
  id: number;
  artistId: number;
  artistName: string;
  artistImageUrl: string | null;
  stageId: number;
  stageName: string;
  startTime: string; // ISO OffsetDateTime
  endTime: string;   // ISO OffsetDateTime
  status: 'SCHEDULED' | 'LIVE' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
  hasConflict: boolean;
}

interface StagePin {
  id: number;
  type: string;
  name: string;
  description: string | null;
  xpos: number;
  ypos: number;
}

export const Lineup = () => {
  const [selectedDay, setSelectedDay] = useState('Day 2');
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Performances & Stages state
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [stages, setStages] = useState<StagePin[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Modal State for Schedule Performance
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPerf, setSelectedPerf] = useState<Performance | null>(null);

  // Performance Form State
  const [formArtistId, setFormArtistId] = useState('');
  const [formStageId, setFormStageId] = useState('');
  const [formDay, setFormDay] = useState('Day 1');
  const [formStartHour, setFormStartHour] = useState('18:00');
  const [formEndHour, setFormEndHour] = useState('19:30');
  const [formStatus, setFormStatus] = useState<'SCHEDULED' | 'LIVE' | 'DELAYED' | 'CANCELLED' | 'COMPLETED'>('SCHEDULED');

  // Modal State for Artist Add/Sync
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncAppleId, setSyncAppleId] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Manual Artist Form State
  const [manualName, setManualName] = useState('');
  const [manualGenre, setManualGenre] = useState('');
  const [manualBio, setManualBio] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualAppleId, setManualAppleId] = useState('');

  const days = [
    { id: 'Day 1', label: 'Day 1', desc: 'Thursday, Aug 6' },
    { id: 'Day 2', label: 'Day 2', desc: 'Friday, Aug 7' },
    { id: 'Day 3', label: 'Day 3', desc: 'Saturday, Aug 8' },
    { id: 'Day 4', label: 'Day 4', desc: 'Sunday, Aug 9' },
  ];

  // Map Logical Dates to absolute Bucharest Times
  const baseDates: Record<string, string> = {
    'Day 1': '2026-08-06',
    'Day 2': '2026-08-07',
    'Day 3': '2026-08-08',
    'Day 4': '2026-08-09',
  };

  const logicalStartHour = 16;
  const logicalEndHour = 30; // 06:00 the next morning (6 + 24)
  const totalHoursRange = logicalEndHour - logicalStartHour; // 14 hours total

  // Convert offset string back to logical UI parameters
  const getLogicalTimeDetails = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      // Format specifically in Bucharest local timezone
      const bucarestFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Bucharest",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      const parts = bucarestFormatter.formatToParts(date);
      const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
      
      const year = partMap.year;
      const month = partMap.month;
      const day = partMap.day;
      const h = parseInt(partMap.hour, 10);
      const m = parseInt(partMap.minute, 10);

      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      // Adjust for sets passing midnight (00:00 to 06:00 is part of the previous logical festival day)
      let logicalDate = new Date(`${year}-${month}-${day}T00:00:00`);
      if (h < 12) {
        logicalDate.setDate(logicalDate.getDate() - 1);
      }

      const lYear = logicalDate.getFullYear();
      const lMonth = String(logicalDate.getMonth() + 1).padStart(2, '0');
      const lDay = String(logicalDate.getDate()).padStart(2, '0');
      const ymd = `${lYear}-${lMonth}-${lDay}`;

      const dateMapping: Record<string, string> = {
        '2026-08-06': 'Day 1',
        '2026-08-07': 'Day 2',
        '2026-08-08': 'Day 3',
        '2026-08-09': 'Day 4',
      };

      return {
        dayId: dateMapping[ymd] || 'Day 1',
        timeStr,
        hour: h < 12 ? h + 24 : h,
        minutes: m
      };
    } catch (e) {
      console.error("Failed to parse time details for string: " + isoStr, e);
      return { dayId: 'Day 1', timeStr: '18:00', hour: 18, minutes: 0 };
    }
  };

  // Convert Form fields into correct ISO offset strings
  const parseTimeToOffsetDateTime = (dayId: string, hourStr: string): string => {
    const baseDate = baseDates[dayId] || '2026-08-06';
    const [hStr, mStr] = hourStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);

    let dateObj = new Date(`${baseDate}T00:00:00`);
    if (h < 12) {
      dateObj.setDate(dateObj.getDate() + 1);
    }

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(h).padStart(2, '0');
    const min = String(m).padStart(2, '0');

    // Romanian time is UTC+3 in August (Daylight Saving Time)
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00+03:00`;
  };

  const getGanttPosition = (startTimeStr: string, endTimeStr: string) => {
    const startDetails = getLogicalTimeDetails(startTimeStr);
    const endDetails = getLogicalTimeDetails(endTimeStr);

    const startDecimal = startDetails.hour + (startDetails.minutes / 60);
    const endDecimal = endDetails.hour + (endDetails.minutes / 60);

    const relativeStart = Math.max(logicalStartHour, Math.min(logicalEndHour, startDecimal));
    const relativeEnd = Math.max(logicalStartHour, Math.min(logicalEndHour, endDecimal));

    const left = ((relativeStart - logicalStartHour) / totalHoursRange) * 100;
    const width = ((relativeEnd - relativeStart) / totalHoursRange) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  const columns: Column<any>[] = [
    {
      header: 'Artist Name',
      render: (artist) => {
        const initials = artist.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        const colorId = artist.id || 0;
        const color = colorId % 4 === 0 ? '#EBE5FC' : colorId % 4 === 1 ? '#FFEBE9' : colorId % 4 === 2 ? 'rgba(93, 63, 211, 0.08)' : '#E0F2FE';
        const textColor = colorId % 4 === 0 ? 'var(--purple-primary)' : colorId % 4 === 1 ? 'var(--coral-accent)' : colorId % 4 === 2 ? 'var(--indigo-dark)' : '#0284C7';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...styles.avatarLabel, backgroundColor: color, color: textColor, margin: 0 }}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.artistNameText}>{artist.name}</span>
              {artist.spotifyId && (
                <span style={{ fontSize: '10px', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                  Apple Music ID: {artist.spotifyId}
                </span>
              )}
            </div>
          </div>
        );
      },
      style: { width: '30%' }
    },
    {
      header: 'Genre',
      render: (artist) => {
        const colorId = artist.id || 0;
        const color = colorId % 4 === 0 ? '#EBE5FC' : colorId % 4 === 1 ? '#FFEBE9' : colorId % 4 === 2 ? 'rgba(93, 63, 211, 0.08)' : '#E0F2FE';
        const textColor = colorId % 4 === 0 ? 'var(--purple-primary)' : colorId % 4 === 1 ? 'var(--coral-accent)' : colorId % 4 === 2 ? 'var(--indigo-dark)' : '#0284C7';
        return (
          <span style={{ ...styles.genreBadge, color: textColor, backgroundColor: color, whiteSpace: 'nowrap' }}>
            {artist.genre || 'ELECTRONIC'}
          </span>
        );
      },
      style: { width: '20%' }
    },
    {
      header: 'Stage',
      render: (artist) => {
        const perf = performances.find(p => p.artistId === artist.id);
        if (!perf) {
          return <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '12px' }}>Not Scheduled</span>;
        }
        const startDetails = getLogicalTimeDetails(perf.startTime);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontWeight: '700', color: 'var(--purple-primary)' }}>{perf.stageName}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '4px',
              width: 'fit-content',
              backgroundColor: 'rgba(93, 63, 211, 0.08)',
              color: 'var(--purple-primary)'
            }}>
              {startDetails.dayId}
            </span>
          </div>
        );
      },
      style: { width: '15%' }
    },
    {
      header: 'Time Slot',
      render: (artist) => {
        const perf = performances.find(p => p.artistId === artist.id);
        if (!perf) return <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '12px' }}>-</span>;
        const startDetails = getLogicalTimeDetails(perf.startTime);
        const endDetails = getLogicalTimeDetails(perf.endTime);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
              {startDetails.timeStr} - {endDetails.timeStr}
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '4px',
              width: 'fit-content',
              backgroundColor: perf.status === 'SCHEDULED' ? 'rgba(93, 63, 211, 0.08)' :
                               perf.status === 'LIVE' ? 'rgba(16, 185, 129, 0.08)' :
                               perf.status === 'DELAYED' ? 'rgba(245, 158, 11, 0.08)' :
                               perf.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(107, 114, 128, 0.08)',
              color: perf.status === 'SCHEDULED' ? 'var(--purple-primary)' :
                     perf.status === 'LIVE' ? '#10B981' :
                     perf.status === 'DELAYED' ? '#F59E0B' :
                     perf.status === 'CANCELLED' ? '#EF4444' : '#6B7280',
            }}>
              {perf.status}
            </span>
          </div>
        );
      },
      style: { width: '15%' }
    },
    {
      header: 'Actions',
      render: (artist) => {
        const perf = performances.find(p => p.artistId === artist.id);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            {perf ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPerformance(perf);
                }}
                style={{ ...styles.filterBtn, color: 'var(--purple-primary)', borderColor: 'rgba(93, 63, 211, 0.2)' }}
                title="Edit set scheduling"
              >
                Edit Set
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreatePerformanceForArtist(artist);
                }}
                style={{ ...styles.filterBtn, color: 'var(--text-muted)' }}
                title="Schedule this artist"
              >
                Schedule
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteArtist(artist.id);
              }} 
              style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              className="text-danger-hover"
              title="Delete artist"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
      style: { textAlign: 'right', width: '20%' },
      headerStyle: { textAlign: 'right' }
    }
  ];

  useEffect(() => {
    fetchArtists();
    fetchStagesAndPerformances();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/api/artists');
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        setArtists(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch artists from database", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStagesAndPerformances = async () => {
    try {
      setLoadingSchedule(true);
      // Fetch active map pins (for STAGES rows)
      const mapRes = await fetch('http://localhost:8080/api/map/active');
      const mapData = await mapRes.json();
      let stagePins: StagePin[] = [];
      if (mapData && mapData.type === 'SUCCESS' && mapData.data && mapData.data.pins) {
        // Map pins might have lowercase or uppercase keys
        stagePins = mapData.data.pins.filter((pin: any) => pin.type.toUpperCase() === 'STAGE');
      }
      setStages(stagePins);

      // Fetch scheduled performances
      const perfRes = await fetch('http://localhost:8080/api/performances');
      const perfData = await perfRes.json();
      if (perfData && perfData.type === 'SUCCESS') {
        setPerformances(perfData.data);
      }
    } catch (err) {
      console.error("Failed to fetch schedule data", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Performance CRUD triggers
  const handleCreatePerformanceForArtist = (artist: any) => {
    setSelectedPerf(null);
    setFormArtistId(artist.id.toString());
    setFormStageId(stages[0]?.id.toString() || '');
    setFormDay(selectedDay);
    setFormStartHour('18:00');
    setFormEndHour('19:30');
    setFormStatus('SCHEDULED');
    setShowScheduleModal(true);
  };

  const handleAddPerformanceForStage = (stage: StagePin) => {
    setSelectedPerf(null);
    setFormArtistId(artists[0]?.id.toString() || '');
    setFormStageId(stage.id.toString());
    setFormDay(selectedDay);
    setFormStartHour('18:00');
    setFormEndHour('19:30');
    setFormStatus('SCHEDULED');
    setShowScheduleModal(true);
  };

  const handleEditPerformance = (perf: Performance) => {
    const details = getLogicalTimeDetails(perf.startTime);
    const endDetails = getLogicalTimeDetails(perf.endTime);

    setSelectedPerf(perf);
    setFormArtistId(perf.artistId.toString());
    setFormStageId(perf.stageId.toString());
    setFormDay(details.dayId);
    setFormStartHour(details.timeStr);
    setFormEndHour(endDetails.timeStr);
    setFormStatus(perf.status);
    setShowScheduleModal(true);
  };

  const handleSavePerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formArtistId || !formStageId || !formStartHour || !formEndHour) {
      alert("All fields marked with * are required.");
      return;
    }

    try {
      const startTimeISO = parseTimeToOffsetDateTime(formDay, formStartHour);
      const endTimeISO = parseTimeToOffsetDateTime(formDay, formEndHour);

      const payload = {
        artistId: parseInt(formArtistId, 10),
        stageId: parseInt(formStageId, 10),
        startTime: startTimeISO,
        endTime: endTimeISO,
        status: formStatus
      };

      const token = sessionStorage.getItem('untold_token') || sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = selectedPerf 
        ? `http://localhost:8080/api/performances/${selectedPerf.id}`
        : 'http://localhost:8080/api/performances';
      
      const method = selectedPerf ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      let data: any = null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok) {
        if (data && data.type === 'SUCCESS') {
          setShowScheduleModal(false);
          fetchStagesAndPerformances(); // refresh schedule and conflicts list
        } else {
          alert("Scheduling Error: " + (data?.message || "An unexpected error occurred."));
        }
      } else {
        const errMsg = data?.message || `HTTP error ${res.status}`;
        alert("Scheduling Error: " + errMsg);
      }
    } catch (err) {
      alert("Error saving performance: " + err);
    }
  };

  const handleDeletePerformance = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scheduled performance slot?")) return;
    try {
      const token = sessionStorage.getItem('untold_token') || sessionStorage.getItem('token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`http://localhost:8080/api/performances/${id}`, {
        method: 'DELETE',
        headers
      });

      let data: any = null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok) {
        if (data && data.type === 'SUCCESS') {
          setShowScheduleModal(false);
          fetchStagesAndPerformances();
        } else {
          alert("Failed to delete performance from database.");
        }
      } else {
        const errMsg = data?.message || `HTTP error ${res.status}`;
        alert("Failed to delete: " + errMsg);
      }
    } catch (err) {
      alert("Error deleting performance: " + err);
    }
  };

  const handleAppleSync = async () => {
    if (!syncAppleId.trim()) {
      alert("Please enter an Apple Music Artist ID first.");
      return;
    }
    try {
      setSyncing(true);
      const res = await fetch(`http://localhost:8080/api/artists/sync/${syncAppleId.trim()}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        alert("Artist successfully synced from Apple Music and saved to database!");
        setSyncAppleId('');
        setShowAddModal(false);
        fetchArtists(); // refresh list
      } else {
        alert("Apple Music sync failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error contacting sync backend: " + err);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    try {
      setSyncing(true);
      const res = await fetch('http://localhost:8080/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName,
          genre: manualGenre || 'ELECTRONIC',
          biography: manualBio,
          imageUrl: manualImageUrl.trim() || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
          spotifyId: manualAppleId.trim() || null
        })
      });
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        setManualName('');
        setManualGenre('');
        setManualBio('');
        setManualImageUrl('');
        setManualAppleId('');
        setShowAddModal(false);
        fetchArtists(); // refresh list
      } else {
        alert("Failed to create artist: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error creating artist: " + err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteArtist = async (id: number) => {
    if (!confirm("Are you sure you want to delete this artist and their track playlist from the database? Scheduled performances will be locked if restrict constraint applies.")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/artists/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data && data.type === 'SUCCESS') {
        fetchArtists(); // refresh list
        fetchStagesAndPerformances();
      } else {
        alert("Failed to delete artist: " + (data.message || "Verify artist has no scheduled sets."));
      }
    } catch (err) {
      alert("Error deleting artist: " + err);
    }
  };

  // Extract dynamic conflict alerts
  const conflictedPerformances = performances.filter(p => p.hasConflict && getLogicalTimeDetails(p.startTime).dayId === selectedDay);

  // Compute stats
  const totalArtistCount = artists.length;
  const totalStagesCount = stages.length;
  const scheduledPercent = totalArtistCount > 0 ? Math.round((performances.length / totalArtistCount) * 100) : 100;

  return (
    <>
      {/* 2. Main Title Row */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.title}>Festival Programming</h2>
          <p style={styles.subtitle}>Master schedule for all {totalStagesCount} stages across the 4-day festival duration.</p>
        </div>

        <div style={styles.actions}>
          <button 
            style={styles.btnSecondary} 
            className="pulse-hover"
            onClick={() => {
              setSelectedPerf(null);
              setFormArtistId(artists[0]?.id.toString() || '');
              setFormStageId(stages[0]?.id.toString() || '');
              setFormDay(selectedDay);
              setFormStartHour('18:00');
              setFormEndHour('19:30');
              setFormStatus('SCHEDULED');
              setShowScheduleModal(true);
            }}
          >
            <Plus size={16} />
            <span>Schedule Set</span>
          </button>
          <button style={styles.btnPrimary} className="pulse-hover" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Add / Sync Artist</span>
          </button>
        </div>
      </div>

      {/* 3. Columns: Left Table & Right Side Panel */}
      <div style={styles.splitLayout}>
        {/* Left Side: Active Lineup Card */}
        <div style={{ ...styles.lineupCard, ...styles.leftColumn }} className="glass-card">
          <div style={styles.lineupHeader}>
            <h4 style={styles.lineupTitle}>Active Line-up ({totalArtistCount})</h4>
            <div style={styles.lineupFilters}>
              <span style={styles.filterPillActive}>All Stages</span>
              <button style={styles.filterBtn} onClick={() => { fetchArtists(); fetchStagesAndPerformances(); }}>Refresh</button>
            </div>
          </div>

          {loading ? (
            <div style={{ ...styles.tableWrapper, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--purple-primary)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: 600 }}>Loading artists from database...</span>
            </div>
          ) : (
            <GenericTable
              columns={columns}
              data={artists}
              itemsPerPage={4}
              emptyMessage="Nu există artiști în baza de date. Apasă pe 'Add / Sync Artist' pentru a adăuga primul tău artist!"
              flat={true}
            />
          )}
        </div>

        {/* Right Side Stack: Progress Card & Warning Card */}
        <div style={{ ...styles.rightColumn, ...styles.stackLayout }}>
          {/* Progress Card */}
          <div style={styles.progressCard}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>LINE-UP PROGRAMMED</span>
              <h3 style={styles.progressVal}>{scheduledPercent}%</h3>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${scheduledPercent}%` }} />
            </div>
            <p style={styles.progressDesc}>
              {performances.length} of {totalArtistCount} artists have been scheduled across the {totalStagesCount} configured stages.
            </p>
          </div>

          {/* Scheduling Conflicts Warnings Stack */}
          <div style={styles.conflictsCard} className="glass-card">
            <h4 style={styles.conflictTitle}>Scheduling Conflicts ({selectedDay})</h4>
            
            <div style={styles.conflictList}>
              {conflictedPerformances.length === 0 ? (
                <div style={styles.conflictInfo}>
                  <Info size={18} style={styles.infoIcon} />
                  <div>
                    <h5 style={styles.infoHeader}>Double-booking Check</h5>
                    <p style={styles.infoDesc}>
                      No overlapping artist clashes or stage double-bookings detected on {selectedDay}.
                    </p>
                  </div>
                </div>
              ) : (
                conflictedPerformances.map((perf) => (
                  <div key={perf.id} style={styles.conflictAlert}>
                    <AlertTriangle size={18} style={styles.warningIcon} />
                    <div>
                      <h5 style={styles.alertHeader}>{perf.artistName} Overlap</h5>
                      <p style={styles.alertDesc}>
                        The artist is double-booked on {selectedDay}! Simultaneously playing on {perf.stageName}.
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Timeline Gantt schedule chart */}
      <div style={styles.timelineSection} className="glass-card">
        <div style={styles.timelineHeader}>
          <div>
            <h4 style={styles.timelineTitle}>Timeline Overview ({selectedDay})</h4>
          </div>

          {/* Day Navigation Selector */}
          <div style={styles.daySelector}>
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                style={{
                  ...styles.dayTab,
                  ...(selectedDay === day.id ? styles.dayTabActive : {}),
                }}
              >
                <span style={styles.dayLabel}>{day.label}</span>
                <span style={styles.dayDesc}>{day.desc}</span>
              </button>
            ))}
          </div>

          {/* Zoom and Grid Controls */}
          <div style={styles.timelineControls}>
            <button style={styles.ctrlBtn} onClick={fetchStagesAndPerformances} title="Refresh Timelines"><RefreshCw size={14} /></button>
          </div>
        </div>

        {/* Visual Timetable Grid */}
        <div style={styles.ganttScrollWrapper}>
          <div style={styles.ganttGrid}>
            {/* Header Timeline Hours (16:00 to 06:00) */}
            <div style={styles.ganttHoursRow}>
              <div style={styles.stageLabelHeader} />
              <div style={{ flex: 1, position: 'relative', height: '18px' }}>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '0%', transform: 'none', flex: 'none', paddingLeft: 0 }}>16:00</span>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '14.28%', transform: 'translateX(-50%)', flex: 'none', paddingLeft: 0 }}>18:00</span>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '28.57%', transform: 'translateX(-50%)', flex: 'none', paddingLeft: 0 }}>20:00</span>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '42.85%', transform: 'translateX(-50%)', flex: 'none', paddingLeft: 0 }}>22:00</span>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '57.14%', transform: 'translateX(-50%)', flex: 'none', paddingLeft: 0 }}>00:00</span>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '71.42%', transform: 'translateX(-50%)', flex: 'none', paddingLeft: 0 }}>02:00</span>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '85.71%', transform: 'translateX(-50%)', flex: 'none', paddingLeft: 0 }}>04:00</span>
                <span style={{ ...styles.hourCell, position: 'absolute', left: '100%', transform: 'translateX(-100%)', flex: 'none', paddingLeft: 0 }}>06:00</span>
              </div>
            </div>

            {loadingSchedule ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                Synchronizing schedules...
              </div>
            ) : stages.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Music size={24} style={{ display: 'block', margin: '0 auto 12px auto', opacity: 0.5 }} />
                <strong>No STAGE Pins added to Map Layout</strong>
                <p style={{ fontSize: '12.5px', marginTop: '4px', color: 'var(--text-light)' }}>
                  Stages are mapped directly from your layout pins. Head to the Map Editor to add "STAGE" pins!
                </p>
              </div>
            ) : (
              stages.map((stage) => {
                const stagePerfs = performances.filter(p => 
                  p.stageId === stage.id && 
                  getLogicalTimeDetails(p.startTime).dayId === selectedDay
                );

                return (
                  <div key={stage.id} style={styles.ganttRow}>
                    <div style={styles.stageLabel}>{stage.name}</div>
                    <div style={styles.slotsArea}>
                      {stagePerfs.map((perf) => {
                        const pos = getGanttPosition(perf.startTime, perf.endTime);
                        let bg = 'var(--purple-primary)';
                        if (perf.status === 'CANCELLED') bg = '#EF4444';
                        else if (perf.status === 'DELAYED') bg = '#F59E0B';
                        else if (perf.status === 'LIVE') bg = '#10B981';
                        else if (stage.name.toLowerCase().includes('techno')) bg = '#2F1160';
                        else if (stage.name.toLowerCase().includes('forest')) bg = 'var(--coral-accent)';
                        else if (stage.name.toLowerCase().includes('alchemy')) bg = '#8B5CF6';

                        return (
                          <div 
                            key={perf.id} 
                            onClick={() => handleEditPerformance(perf)}
                            style={{ 
                              ...styles.timelineBlock, 
                              left: pos.left, 
                              width: pos.width, 
                              backgroundColor: bg, 
                              color: '#FFF',
                              border: perf.hasConflict ? '2px solid #EF4444' : 'none',
                              zIndex: 10
                            }}
                            title={perf.hasConflict ? "Double Booked Warning!" : `${perf.artistName}: ${perf.status}`}
                          >
                            <span style={styles.slotArtist}>
                              {perf.artistName} {perf.hasConflict && <AlertTriangle size={10} style={{ display: 'inline', color: '#FFF' }} />}
                            </span>
                            <span style={styles.slotTime}>
                              {getLogicalTimeDetails(perf.startTime).timeStr} - {getLogicalTimeDetails(perf.endTime).timeStr}
                            </span>
                          </div>
                        );
                      })}
                      
                      <div 
                        onClick={() => handleAddPerformanceForStage(stage)}
                        style={{ ...styles.dottedAddSlot, left: 'calc(100% + 12px)', width: '96px', zIndex: 1 }}
                      >
                        <Plus size={12} />
                        <span>ADD SLOT</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={styles.timelineFooter}>
          <div style={styles.legendRow}>
            <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: 'var(--purple-primary)' }} /><span>Scheduled</span></div>
            <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#10B981' }} /><span>Live Set</span></div>
            <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#F59E0B' }} /><span>Delayed</span></div>
            <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#EF4444' }} /><span>Cancelled</span></div>
          </div>
          <span style={styles.tipText}>Tip: Click any timeline set block to reschedule, update its status, or delete the slot.</span>
        </div>
      </div>

      {/* Dynamic Add / Sync Artist Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card zoom-in-animation">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add or Sync Festival Artist</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalTabs}>
              <span style={styles.modalTabActive}>Configure Artist</span>
            </div>

            <div style={styles.modalBody}>
              {/* Option A: Apple Music Auto Sync */}
              <div style={styles.syncSection}>
                <div style={styles.syncHeader}>
                  <Music size={18} style={{ color: 'var(--purple-primary)' }} />
                  <h4 style={styles.syncTitle}>Option A: Sync with Apple Music API</h4>
                </div>
                <p style={styles.syncDesc}>
                  Enter the Apple Music Artist ID to automatically import high-resolution profile imagery, genres, and authentic 30-second audio track previews directly from Apple's database.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="e.g. 430932944"
                    value={syncAppleId}
                    onChange={(e) => setSyncAppleId(e.target.value)}
                    style={styles.modalInput}
                  />
                  <button 
                    onClick={handleAppleSync} 
                    style={styles.btnSync} 
                    disabled={syncing}
                  >
                    {syncing ? 'Syncing...' : 'Sync & Save'}
                  </button>
                </div>
                <div style={styles.examplesBox}>
                  <strong style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>Popular DJs Apple Music IDs for Testing:</strong>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                    <li><strong>Martin Garrix:</strong> <code style={styles.code}>430932944</code></li>
                    <li><strong>Armin van Buuren:</strong> <code style={styles.code}>26016252</code></li>
                    <li><strong>David Guetta:</strong> <code style={styles.code}>126667</code></li>
                  </ul>
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
              </div>

              {/* Option B: Manual Local Entry */}
              <form onSubmit={handleManualAdd} style={styles.manualForm}>
                <h4 style={styles.syncTitle}>Option B: Create Manually</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={styles.fieldLabel}>Artist Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Charlotte de Witte"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        style={styles.modalInputFull}
                      />
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>Primary Genre *</label>
                      <input
                        type="text"
                        placeholder="e.g. TECHNO"
                        value={manualGenre}
                        onChange={(e) => setManualGenre(e.target.value)}
                        style={styles.modalInputFull}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={styles.fieldLabel}>Artist Image URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. https://images.unsplash.com/... or blank for default"
                        value={manualImageUrl}
                        onChange={(e) => setManualImageUrl(e.target.value)}
                        style={styles.modalInputFull}
                      />
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>Apple Music ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 768227318"
                        value={manualAppleId}
                        onChange={(e) => setManualAppleId(e.target.value)}
                        style={styles.modalInputFull}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Biography / Notes</label>
                    <textarea
                      placeholder="Enter details about this artist's schedule, requirements, or profile biography..."
                      value={manualBio}
                      onChange={(e) => setManualBio(e.target.value)}
                      style={styles.modalTextarea}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)} 
                      style={{
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
                        transition: 'var(--transition-fast)'
                      }}
                      className="pulse-hover"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      style={{ ...styles.btnManualSubmit, flex: 1, margin: 0 }} 
                      disabled={syncing || !manualName.trim()}
                    >
                      Create Local Record
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. Schedule Performance Modal (Ticket-style Premium design) */}
      {showScheduleModal && createPortal(
        <div style={styles.ticketModalOverlay} onClick={() => setShowScheduleModal(false)}>
          <div style={styles.ticketModalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.ticketModalHeader}>
              {selectedPerf ? 'Edit Performance Set' : 'Schedule Performance Set'}
            </h3>

            <form onSubmit={handleSavePerformance}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Select Artist *</label>
                <select
                  required
                  value={formArtistId}
                  onChange={(e) => setFormArtistId(e.target.value)}
                  style={styles.formSelect}
                  disabled={!!selectedPerf}
                >
                  <option value="">-- Choose Artist --</option>
                  {artists.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.genre || 'ELECTRONIC'})</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Select Stage *</label>
                <select
                  required
                  value={formStageId}
                  onChange={(e) => setFormStageId(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="">-- Choose Stage --</option>
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Festival Day *</label>
                <select
                  required
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value)}
                  style={styles.formSelect}
                >
                  {days.map(d => (
                    <option key={d.id} value={d.id}>{d.label} - {d.desc}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={styles.formLabel}>Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formStartHour}
                    onChange={(e) => setFormStartHour(e.target.value)}
                    style={styles.formInput}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={styles.formLabel}>End Time *</label>
                  <input
                    type="time"
                    required
                    value={formEndHour}
                    onChange={(e) => setFormEndHour(e.target.value)}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Performance Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  style={styles.formSelect}
                >
                  <option value="SCHEDULED">SCHEDULED (Upcoming)</option>
                  <option value="LIVE">LIVE (Performing Now)</option>
                  <option value="DELAYED">DELAYED (Rescheduled/Late)</option>
                  <option value="CANCELLED">CANCELLED (Set Cancelled)</option>
                  <option value="COMPLETED">COMPLETED (Set Finished)</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                {selectedPerf && (
                  <button
                    type="button"
                    onClick={() => handleDeletePerformance(selectedPerf.id)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#FFEBE9',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginRight: 'auto'
                    }}
                  >
                    Delete Slot
                  </button>
                )}
                <button type="button" onClick={() => setShowScheduleModal(false)} style={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnSave} className="pulse-hover">
                  {selectedPerf ? 'Save Changes' : 'Schedule Set'}
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
  },
  subTabButton: {
    background: 'none',
    border: 'none',
    padding: '12px 4px 16px 4px',
    fontSize: '14px',
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
    marginBottom: '8px',
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
  splitLayout: {
    display: 'flex',
    gap: '24px',
  },
  leftColumn: {
    flex: 3.2,
  },
  rightColumn: {
    flex: 1,
  },
  stackLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  lineupCard: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
  },
  lineupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  lineupTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
  },
  lineupFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterPillActive: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
    backgroundColor: 'var(--purple-light)',
    padding: '4px 12px',
    borderRadius: '100px',
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
    transition: 'var(--transition-fast)',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1.5px solid rgba(93, 63, 211, 0.06)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-light)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  trRow: {
    borderBottom: '1px solid rgba(93, 63, 211, 0.04)',
    transition: 'var(--transition-fast)',
  },
  td: {
    padding: '16px',
    fontSize: '13.5px',
    color: 'var(--text-main)',
    fontWeight: '500',
  },
  tdArtist: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  },
  artistNameText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--indigo-dark)',
  },
  genreBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '100px',
  },
  timeSlotWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  statusConfirmed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--success)',
    fontWeight: '700',
    fontSize: '12.5px',
  },
  statusPending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--warning)',
    fontWeight: '700',
  },
  dotConfirmed: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
  },
  dotPending: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--warning)',
  },
  tableFooter: {
    paddingTop: '20px',
    borderTop: '1px solid rgba(93, 63, 211, 0.04)',
    marginTop: '12px',
    textAlign: 'center',
  },
  viewFullDb: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
    cursor: 'pointer',
  },
  progressCard: {
    backgroundColor: 'var(--purple-dark)',
    backgroundImage: 'radial-gradient(at 100% 0%, rgba(138, 114, 235, 0.25) 0px, transparent 50%)',
    padding: '12px 16px',
    borderRadius: '14px',
    color: '#FFF',
    boxShadow: '0 6px 18px rgba(47,17,96,0.1)',
  },
  progressLabel: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: 'rgba(255,255,255,0.6)',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressVal: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: '800',
    lineHeight: '1',
  },
  progressTrack: {
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--coral-accent)',
  },
  progressDesc: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: '1.3',
    fontWeight: '500',
  },
  conflictsCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  conflictTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
  },
  conflictList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  conflictAlert: {
    display: 'flex',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: 'var(--coral-light)',
    border: '1px solid rgba(255, 111, 97, 0.08)',
  },
  warningIcon: {
    color: 'var(--coral-accent)',
    flexShrink: 0,
    marginTop: '1px',
  },
  alertHeader: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#9C251C',
  },
  alertDesc: {
    fontSize: '11px',
    color: 'var(--coral-accent)',
    fontWeight: '500',
    lineHeight: '1.35',
    marginTop: '1px',
  },
  conflictInfo: {
    display: 'flex',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: 'rgba(93, 63, 211, 0.04)',
    border: '1px solid rgba(93, 63, 211, 0.05)',
  },
  infoIcon: {
    color: 'var(--purple-primary)',
    flexShrink: 0,
    marginTop: '1px',
  },
  infoHeader: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
  },
  infoDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '500',
    lineHeight: '1.35',
    marginTop: '1px',
  },
  timelineSection: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  timelineTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(93, 63, 211, 0.06)',
    paddingBottom: '20px',
  },
  daySelector: {
    display: 'flex',
    backgroundColor: 'rgba(93, 63, 211, 0.03)',
    borderRadius: '14px',
    padding: '4px',
    gap: '4px',
  },
  dayTab: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'var(--transition-fast)',
  },
  dayTabActive: {
    backgroundColor: '#FFF',
    boxShadow: 'var(--shadow-sm)',
  },
  dayLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
  },
  dayDesc: {
    fontSize: '10px',
    fontWeight: '500',
    color: 'var(--text-light)',
    marginTop: '1px',
  },
  timelineControls: {
    display: 'flex',
    gap: '6px',
  },
  ctrlBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid rgba(93, 63, 211, 0.08)',
    backgroundColor: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  ganttScrollWrapper: {
    overflowX: 'auto',
  },
  ganttGrid: {
    minWidth: '700px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'relative',
  },
  ganttHoursRow: {
    display: 'flex',
    borderBottom: '1px solid rgba(93, 63, 211, 0.04)',
    paddingBottom: '8px',
    alignItems: 'center',
    paddingRight: '120px',
    boxSizing: 'border-box',
  },
  stageLabelHeader: {
    width: '130px',
    flexShrink: 0,
  },
  hourCell: {
    flex: 1,
    textAlign: 'left',
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'var(--text-light)',
    paddingLeft: '4px',
  },
  ganttRow: {
    display: 'flex',
    height: '56px',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '12px',
    border: '1px solid rgba(93, 63, 211, 0.02)',
    paddingRight: '120px',
    boxSizing: 'border-box',
  },
  stageLabel: {
    width: '130px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
    paddingLeft: '16px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  slotsArea: {
    flex: 1,
    height: '100%',
    position: 'relative',
    borderLeft: '1.5px solid rgba(93, 63, 211, 0.04)',
  },
  timelineBlock: {
    position: 'absolute',
    top: '8px',
    bottom: '8px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 12px',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  slotArtist: {
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  slotTime: {
    fontSize: '9px',
    fontWeight: '500',
    opacity: '0.85',
    marginTop: '1px',
  },
  dottedAddSlot: {
    position: 'absolute',
    border: '1px dashed var(--purple-primary)',
    backgroundColor: 'rgba(93, 63, 211, 0.04)',
    borderRadius: '8px',
    top: '8px',
    bottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  timelineFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    borderTop: '1px solid rgba(93, 63, 211, 0.04)',
    paddingTop: '16px',
  },
  legendRow: {
    display: 'flex',
    gap: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  tipText: {
    fontSize: '11.5px',
    color: 'var(--text-light)',
    fontWeight: '500',
    fontStyle: 'italic',
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
  modalTabs: {
    display: 'flex',
    padding: '0 24px',
    borderBottom: '1px solid var(--border-light)',
    backgroundColor: '#FAF9FF',
  },
  modalTabActive: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--purple-primary)',
    padding: '14px 4px',
    borderBottom: '2.5px solid var(--purple-primary)',
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  syncSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  syncHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  syncTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--indigo-dark)',
  },
  syncDesc: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: '1.45',
  },
  modalInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border-light)',
    fontSize: '13px',
    fontFamily: 'monospace',
    outline: 'none',
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
    fontWeight: '500',
  },
  btnSync: {
    padding: '10px 16px',
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  examplesBox: {
    backgroundColor: '#FAF9FF',
    border: '1px solid rgba(93, 63, 211, 0.08)',
    borderRadius: '10px',
    padding: '12px',
    marginTop: '12px',
  },
  code: {
    backgroundColor: 'rgba(93, 63, 211, 0.06)',
    color: 'var(--purple-primary)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  manualForm: {
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
  modalTextarea: {
    width: '100%',
    height: '80px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border-light)',
    fontSize: '13px',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
  },
  btnManualSubmit: {
    width: '100%',
    padding: '11px',
    backgroundColor: 'var(--coral-accent)',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 12px rgba(255, 111, 97, 0.15)',
  },
  ticketModalOverlay: {
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
  ticketModalContent: {
    width: '460px',
    padding: '32px',
    borderRadius: '24px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    boxShadow: '0 20px 48px rgba(30, 27, 75, 0.15), 0 0 32px rgba(93, 63, 211, 0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  ticketModalHeader: {
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
    boxSizing: 'border-box',
    width: '100%',
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
    boxSizing: 'border-box',
    width: '100%',
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
    backgroundColor: 'var(--purple-primary)',
    color: '#FFF',
    border: 'none',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(93, 63, 211, 0.2)',
  },
};
