import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { DynamicTicketQr } from '../components/DynamicTicketQr';
import { TransferTicketModal } from '../components/TransferTicketModal';
import { enqueueRequest, getQueuedRequests, subscribeToSync } from '../utils/offlineQueue';

interface Bracelet {
  id: number;
  rfidTag: string;
  balance: number;
}

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string;
  country: string;
  city: string;
  documentType: string;
  documentId: string;
  phoneNumber: string;
  fullName?: string;
}

interface Ticket {
  id: number;
  ticketType: string;
  displayName: string;
  price: number;
  purchaseDate: string;
  checkInCompleted: boolean;
  attendee: Person | null;
  bracelet: Bracelet | null;
  rfidTag?: string;
  isPendingSync?: boolean;
}

interface AttendeeForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  city: string;
  documentType: string;
  documentId: string;
  phoneNumber: string;
  isDataCorrect: boolean;
}

export const MyAccount: React.FC = () => {
  const { user, token } = useAuth();
  const { t, formatPrice, currency } = useI18n();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingType] = useState<number | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>('20');
  const [isTopUpLoading, setIsTopUpLoading] = useState<number | null>(null);
  const [isExportLoading, setIsExportLoading] = useState(false);

  // Ticket transfer flow: which ticket has the modal open, which card is animating out, toast text.
  const [transferTarget, setTransferTarget] = useState<Ticket | null>(null);
  const [removingTicketId, setRemovingTicketId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Per-ticket form state to capture attendee details for multiple tickets independently
  const [formData, setFormData] = useState<Record<number, AttendeeForm>>({});

  const handleTransferred = (ticketId: number) => {
    setTransferTarget(null);
    setRemovingTicketId(ticketId);
    setToast('Bilet transferat cu succes!');
    // Let the card's exit transition play before actually dropping it from the list.
    setTimeout(() => {
      setTickets(prev => prev.filter(tk => tk.id !== ticketId));
      setRemovingTicketId(null);
    }, 400);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTickets = React.useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:8080/api/tickets/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      let ticketList: Ticket[] = [];
      if (response.ok) {
        const data = await response.json();
        ticketList = data.data; // Unwrap ApiResponse wrapper
      }

      // Merge queued offline check-in requests
      const queuedRequests = await getQueuedRequests();
      const checkInRequests = queuedRequests.filter(req => req.url.includes('/check-in'));

      const queuedCheckInMap: Record<number, any> = {};
      checkInRequests.forEach(req => {
        const parts = req.url.split('/');
        const ticketIdStr = parts[parts.length - 2];
        const ticketId = parseInt(ticketIdStr, 10);
        if (!isNaN(ticketId)) {
          queuedCheckInMap[ticketId] = req.body;
        }
      });

      const hydratedTickets = ticketList.map(t => {
        if (queuedCheckInMap[t.id]) {
          const attendeeData = queuedCheckInMap[t.id];
          return {
            ...t,
            checkInCompleted: true,
            attendee: {
              id: Date.now(),
              ...attendeeData
            },
            rfidTag: `UNTOLD-QR-OFFLINE-${t.id}-${t.purchaseDate ? t.purchaseDate.substring(0, 10).replace(/[^0-9]/g, '') : 'PENDING'}`,
            isPendingSync: true
          };
        }
        return t;
      });

      setTickets(hydratedTickets);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTickets();
  }, [user, navigate, fetchTickets]);

  // Live ticket events (Kafka -> SSE): when someone transfers a ticket to this account, the card
  // appears instantly — no refresh needed. The sender's other open sessions drop it the same way.
  useEffect(() => {
    if (!user || !token) return;
    // Native EventSource can't send an Authorization header, so the stream endpoint authenticates
    // via the token query parameter instead.
    const source = new EventSource(`http://localhost:8080/api/stream/tickets?token=${encodeURIComponent(token)}`);
    source.addEventListener('ticket-event', (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'TICKET_TRANSFERRED') {
          fetchTickets();
          if (event.toUserId === user.id) {
            setToast(`Ai primit un bilet: ${event.ticketName} de la ${event.fromUsername}!`);
            setTimeout(() => setToast(null), 5000);
          }
        }
      } catch (err) {
        console.error('Invalid ticket event', err);
      }
    });
    source.onerror = () => {
      // EventSource retries automatically; nothing to do beyond letting it reconnect.
    };
    return () => source.close();
  }, [user, token, fetchTickets]);

  // Refresh when a queued offline request (e.g. an offline check-in) finishes syncing.
  useEffect(() => {
    const unsubscribe = subscribeToSync(() => {
      fetchTickets();
    });
    return () => {
      unsubscribe();
    };
  }, [fetchTickets]);

  const handleFormChange = (ticketId: number, field: keyof AttendeeForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId] || { firstName: '', lastName: '', dateOfBirth: '', gender: '', country: '', city: '', documentType: '', documentId: '', phoneNumber: '', isDataCorrect: false },
        [field]: value
      }
    }));
  };

  const getLocalizedTicketName = (ticketType?: string) => {
    if (!ticketType) return 'Untold Ticket';
    if (ticketType.startsWith('GA_DAY_')) {
      const day = ticketType.split('_')[2];
      return `${t('generalAccess')} - ${t('dayTicket')} ${day}`;
    }
    if (ticketType.startsWith('VIP_MAINSTAGE_DAY_')) {
      const day = ticketType.split('_')[3];
      return `${t('vipAccess')} - ${t('dayTicket')} ${day}`;
    }
    if (ticketType.startsWith('GA_4_DAYS')) {
      return `${t('generalAccess')} - ${t('daysOfMagic')}`;
    }
    if (ticketType.startsWith('VIP_MAINSTAGE_4_DAYS')) {
      return `${t('vipAccess')} - ${t('daysOfMagic')}`;
    }
    if (ticketType.startsWith('GALAXY_BACKSTAGE')) {
      return `Backstage Ultra Access - ${t('daysOfMagic')}`;
    }
    return ticketType.replace(/_/g, ' ');
  };

  const handleCheckIn = async (ticketId: number) => {
    const currentForm = formData[ticketId] || { firstName: '', lastName: '', dateOfBirth: '', gender: '', country: '', city: '', documentType: '', documentId: '', phoneNumber: '', isDataCorrect: false };

    if (
      !currentForm.firstName.trim() ||
      !currentForm.lastName.trim() ||
      !currentForm.dateOfBirth.trim() ||
      !currentForm.gender.trim() ||
      !currentForm.country.trim() ||
      !currentForm.city.trim() ||
      !currentForm.documentType.trim() ||
      !currentForm.documentId.trim() ||
      !currentForm.phoneNumber.trim() ||
      !currentForm.isDataCorrect
    ) {
      alert('Please fill in all identification fields and agree to the declaration for check-in.');
      return;
    }

    setProcessingType(ticketId);

    const checkInData = {
      firstName: currentForm.firstName,
      lastName: currentForm.lastName,
      dateOfBirth: currentForm.dateOfBirth,
      gender: currentForm.gender,
      country: currentForm.country,
      city: currentForm.city,
      documentType: currentForm.documentType,
      documentId: currentForm.documentId,
      phoneNumber: currentForm.phoneNumber
    };

    const url = `http://localhost:8080/api/tickets/${ticketId}/check-in`;

    // Intercept check-in mutation when navigator is offline
    if (!navigator.onLine) {
      try {
        await enqueueRequest(url, 'POST', checkInData);

        // Optimistically update tickets state
        setTickets(prev => prev.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              checkInCompleted: true,
              attendee: {
                id: Date.now(),
                ...checkInData
              },
              rfidTag: `UNTOLD-QR-OFFLINE-${t.id}-${Date.now().toString().substring(8)}`,
              isPendingSync: true
            };
          }
          return t;
        }));

        alert('You are currently offline. Your check-in details have been saved locally and will sync automatically when your connection is restored.');
      } catch (saveErr) {
        console.error('Failed to queue offline check-in', saveErr);
        alert('Failed to save check-in details locally.');
      } finally {
        setProcessingType(null);
      }
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkInData)
      });
      if (response.ok) {
        const result = await response.json();
        const updatedTicket: Ticket = result.data || result; // Unwrap ApiResponse wrapper
        // Update local state with the returned ticket details
        setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      } else {
        alert('Check-in failed. Please try again.');
      }
    } catch (err) {
      console.error('Check-in failed', err);
      
      // Fallback to offline queue on unexpected network fail
      try {
        await enqueueRequest(url, 'POST', checkInData);
        setTickets(prev => prev.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              checkInCompleted: true,
              attendee: {
                id: Date.now(),
                ...checkInData
              },
              rfidTag: `UNTOLD-QR-OFFLINE-${t.id}-${Date.now().toString().substring(8)}`,
              isPendingSync: true
            };
          }
          return t;
        }));
        alert('Network connection error. Your check-in details have been saved locally and will sync when the server is reachable.');
      } catch (saveErr) {
        console.error('Failed to save offline check-in', saveErr);
        alert('Error connecting to check-in service.');
      }
    } finally {
      setProcessingType(null);
    }
  };

  const handleTopUp = async (ticketId: number) => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsTopUpLoading(ticketId);
    try {
      const response = await fetch(`http://localhost:8080/api/payment/create-topup-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId, amount, currency })
      });

      const data = await response.json();
      if (response.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        alert(data.message || 'Failed to initiate Top-Up checkout.');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error during Top-Up.');
    } finally {
      setIsTopUpLoading(null);
    }
  };

  const handleExportData = async () => {
    setIsExportLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/users/me/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        alert(t('downloadMyDataError'));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `untold-my-data-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Data export failed', err);
      alert(t('downloadMyDataError'));
    } finally {
      setIsExportLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d1e] text-primary relative overflow-hidden">
        <div className="particle-bg absolute inset-0 z-0">
          <div className="particle absolute w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ left: '30vw', top: '40vh' }} />
          <div className="particle absolute w-1 h-1 bg-tertiary/40 rounded-full animate-pulse" style={{ left: '70vw', top: '60vh' }} />
        </div>
        <div className="w-16 h-16 border-4 border-t-tertiary border-primary/20 rounded-full animate-spin mb-4 z-10" />
        <span className="font-display-md text-glow animate-pulse z-10 uppercase tracking-widest text-sm">{t('loadingPortal')}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-on-surface relative overflow-hidden flex flex-col">
      {/* Particle Background */}
      <div className="absolute inset-0 pointer-events-none z-0" id="particles">
        <div className="absolute w-[2px] h-[2px] bg-primary/40 rounded-full animate-pulse" style={{ left: '15%', top: '25%', animationDuration: '8s' }} />
        <div className="absolute w-[3px] h-[3px] bg-tertiary/50 rounded-full animate-pulse" style={{ left: '85%', top: '45%', animationDuration: '6s' }} />
        <div className="absolute w-[2px] h-[2px] bg-secondary/30 rounded-full animate-pulse" style={{ left: '45%', top: '75%', animationDuration: '10s' }} />
        <div className="absolute w-[4px] h-[4px] bg-[#00dbe9]/20 rounded-full animate-pulse" style={{ left: '60%', top: '15%', animationDuration: '12s' }} />
        {/* Glow Spheres */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-tertiary/10 blur-[120px] pointer-events-none" />
      </div>

      <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full z-10">
        <header className="mb-xl flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-8">
          <div className="text-center md:text-left">
            <span className="font-label-sm uppercase tracking-widest text-tertiary mb-2 block font-semibold">{t('attendeePortal')}</span>
            <h1 className="font-display-xl-mobile md:font-display-xl text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-[0_0_30px_rgba(209,188,255,0.4)] uppercase">
              {t('welcome')}{user.username}
            </h1>
            <p className="font-body-lg text-body-lg text-white/60 max-w-2xl">
              {t('portalDesc')}
            </p>
          </div>
        </header>

        <section className="glass-panel rounded-3xl border border-white/10 p-6 md:p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-3xl text-tertiary shrink-0">privacy_tip</span>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-1">{t('myDataSectionTitle')}</h3>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-2xl">{t('myDataSectionDesc')}</p>
              <Link to="/privacy-policy" className="inline-block text-xs text-primary hover:text-tertiary underline mt-2 transition-colors">
                {t('readPrivacyPolicy')}
              </Link>
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExportLoading}
            className="shrink-0 inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {t('downloadingMyData')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">download</span>
                {t('downloadMyData')}
              </>
            )}
          </button>
        </section>

        {tickets.length === 0 ? (
          <div className="glass-panel p-12 md:p-16 rounded-3xl text-center border border-white/5 max-w-3xl mx-auto flex flex-col items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_20px_rgba(112,0,255,0.2)]">
              <span className="material-symbols-outlined text-5xl text-primary animate-pulse">confirmation_number</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 uppercase tracking-tight">{t('noTickets')}</h2>
            <p className="font-body-md text-white/60 mb-8 max-w-md leading-relaxed">
              {t('noTicketsDesc')}
            </p>
            <Link 
              to="/tickets" 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-tertiary text-on-primary font-bold uppercase tracking-widest text-sm px-8 py-4 rounded-xl glow-effect hover:shadow-[0_0_30px_rgba(0,219,233,0.5)] transition-all transform hover:-translate-y-0.5 duration-300"
            >
              {t('buyTicketsNow')}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {tickets.map(ticket => {
              const currentForm = formData[ticket.id] || { firstName: '', lastName: '', dateOfBirth: '', gender: '', country: '', city: '', documentType: '', documentId: '', phoneNumber: '', isDataCorrect: false };
              const isFormValid = 
                currentForm.firstName.trim() !== '' && 
                currentForm.lastName.trim() !== '' && 
                currentForm.dateOfBirth.trim() !== '' && 
                currentForm.gender.trim() !== '' && 
                currentForm.country.trim() !== '' && 
                currentForm.city.trim() !== '' && 
                currentForm.documentType.trim() !== '' && 
                currentForm.documentId.trim() !== '' && 
                currentForm.phoneNumber.trim() !== '' &&
                currentForm.isDataCorrect;

              return (
                <div
                  key={ticket.id}
                  className={`glass-panel rounded-3xl overflow-hidden border ${ticket.checkInCompleted ? 'border-tertiary/20' : 'border-white/10'} transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] ${removingTicketId === ticket.id ? 'opacity-0 scale-95 -translate-y-3 pointer-events-none' : 'opacity-100'}`}
                >
                  {/* Card Top Branding Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-[#150d2d]/30 to-tertiary/10 p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                        <span className="font-mono text-xs uppercase tracking-widest text-tertiary-fixed-dim font-bold">Untold Festival 2026</span>
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                        {getLocalizedTicketName(ticket.ticketType)}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.userType === 'ATTENDEE' && (
                        ticket.checkInCompleted ? (
                          <button
                            disabled
                            title="Biletul nu mai poate fi transferat după finalizarea check-in-ului."
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/30 font-label-sm text-[11px] uppercase tracking-widest cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[18px]">lock</span>
                            Transfer indisponibil
                          </button>
                        ) : (
                          <button
                            onClick={() => setTransferTarget(ticket)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary font-label-sm text-[11px] uppercase tracking-widest hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_20px_rgba(112,0,255,0.35)] transition-all duration-300 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            Transfer bilet
                          </button>
                        )
                      )}
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">payments</span>
                        <div>
                          <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">{t('purchasePrice')}</p>
                          <p className="text-sm font-bold text-white">{formatPrice(ticket.price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conditional Rendering Stage 1 vs Stage 2 */}
                  {!ticket.checkInCompleted ? (
                    /* --- STAGE 1: PRE-CHECK-IN WITH ATTENDEE INPUT FIELDS --- */
                    <div className="p-6 md:p-10">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* Left: Fulfillment Guide */}
                        <div className="lg:col-span-5 space-y-6">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                            <span className="material-symbols-outlined text-primary text-2xl">info</span>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wide">{t('checkinGuide')}</h3>
                          </div>

                          <div className="space-y-4">
                            <div className="flex gap-4 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary font-mono text-sm shrink-0 mt-0.5">
                                {t('step1')}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm uppercase tracking-wide mb-1">{t('firstName')} & {t('lastName')}</h4>
                                <p className="text-xs text-white/50 leading-relaxed">
                                  {t('step1Text')}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary font-mono text-sm shrink-0 mt-0.5">
                                {t('step2')}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm uppercase tracking-wide mb-1">{t('accessToken')}</h4>
                                <p className="text-xs text-white/50 leading-relaxed">
                                  {t('step2Text')}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary font-mono text-sm shrink-0 mt-0.5">
                                {t('step3')}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm uppercase tracking-wide mb-1">{t('cashlessWallet')}</h4>
                                <p className="text-xs text-white/50 leading-relaxed">
                                  {t('step3Text')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Call-to-Action with Attendee Details Form */}
                        <div className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-br from-white/[0.02] to-white/[0.05] p-6 md:p-8 rounded-2xl border border-white/10 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                          <div className="absolute inset-0 pointer-events-none bg-primary/5 filter blur-[30px]" />
                          
                          <div className="mb-6 relative z-10">
                            <span className="bg-error-container/30 border border-error-container/50 text-error-container text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full inline-block mb-3">
                              Mandatory Online Check-In
                            </span>
                            <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{t('registeredAttendee')}</h4>
                            <p className="text-xs text-white/60 leading-relaxed mb-6">
                              Because each ticket belongs to a different attendee, complete their full profile below to generate the personalized access wristband.
                            </p>

                            {/* Attendee Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('firstName')}
                                </label>
                                <input
                                  type="text"
                                  value={currentForm.firstName}
                                  onChange={(e) => handleFormChange(ticket.id, 'firstName', e.target.value)}
                                  placeholder={t('placeholderFirstName')}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/20 transition-all font-semibold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('lastName')}
                                </label>
                                <input
                                  type="text"
                                  value={currentForm.lastName}
                                  onChange={(e) => handleFormChange(ticket.id, 'lastName', e.target.value)}
                                  placeholder={t('placeholderLastName')}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/20 transition-all font-semibold"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('dobLabel')}
                                </label>
                                <input
                                  type="date"
                                  value={currentForm.dateOfBirth}
                                  onChange={(e) => handleFormChange(ticket.id, 'dateOfBirth', e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('genderLabel')}
                                </label>
                                <select
                                  value={currentForm.gender}
                                  onChange={(e) => handleFormChange(ticket.id, 'gender', e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [&>option]:bg-[#0d0d1e]"
                                >
                                  <option value="">{t('genderLabel')}</option>
                                  <option value="Male">{t('male')}</option>
                                  <option value="Female">{t('female')}</option>
                                  <option value="Other">{t('other')}</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('countryLabel')}
                                </label>
                                <input
                                  type="text"
                                  value={currentForm.country}
                                  onChange={(e) => handleFormChange(ticket.id, 'country', e.target.value)}
                                  placeholder="ex: Romania"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/20 transition-all font-semibold"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('cityLabel')}
                                </label>
                                <input
                                  type="text"
                                  value={currentForm.city}
                                  onChange={(e) => handleFormChange(ticket.id, 'city', e.target.value)}
                                  placeholder={t('placeholderCity')}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/20 transition-all font-semibold"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('docTypeLabel')}
                                </label>
                                <select
                                  value={currentForm.documentType}
                                  onChange={(e) => handleFormChange(ticket.id, 'documentType', e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [&>option]:bg-[#0d0d1e]"
                                >
                                  <option value="">{t('docTypeLabel')}</option>
                                  <option value="NATIONAL_ID">{t('idCard')}</option>
                                  <option value="PASSPORT">{t('passport')}</option>
                                  <option value="DRIVERS_LICENSE">{t('driverLicense')}</option>
                                  <option value="OTHER">{t('other')}</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('docIdLabel')}
                                </label>
                                <input
                                  type="text"
                                  value={currentForm.documentId}
                                  onChange={(e) => handleFormChange(ticket.id, 'documentId', e.target.value)}
                                  placeholder="ex: 123456789"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/20 transition-all font-mono"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1 block">
                                  {t('telLabel')}
                                </label>
                                <input
                                  type="tel"
                                  value={currentForm.phoneNumber}
                                  onChange={(e) => handleFormChange(ticket.id, 'phoneNumber', e.target.value)}
                                  placeholder="ex: +40 712 345 678"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/20 transition-all font-mono"
                                />
                              </div>

                              {/* Declaration Checkbox */}
                              <div className="md:col-span-2 flex items-start gap-3 mt-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                                <div className="pt-0.5">
                                  <input
                                    type="checkbox"
                                    id={`declare-${ticket.id}`}
                                    checked={currentForm.isDataCorrect || false}
                                    onChange={(e) => handleFormChange(ticket.id, 'isDataCorrect', e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-primary focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                                  />
                                </div>
                                <label htmlFor={`declare-${ticket.id}`} className="text-xs text-white/80 leading-relaxed cursor-pointer select-none">
                                  {t('declarationText')}
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="relative z-10 w-full space-y-4">
                            <button
                              onClick={() => handleCheckIn(ticket.id)}
                              disabled={processingId === ticket.id || !isFormValid}
                              className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold uppercase tracking-wider text-xs py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(112,0,255,0.3)] hover:shadow-[0_0_35px_rgba(112,0,255,0.6)] disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5 transform active:scale-95 duration-300"
                            >
                              {processingId === ticket.id ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  {t('savingData')}
                                </span>
                              ) : (
                                t('performCheckin')
                              )}
                            </button>
                            
                            <p className="text-[10px] text-center text-white/40 leading-relaxed">
                              {t('checkinWarning')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- STAGE 2: POST-CHECK-IN INTERACTIVE CASHLESS DASHBOARD --- */
                    <div className="p-6 md:p-10 bg-gradient-to-b from-[#0a0a18] to-[#06060f]">
                      {ticket.isPendingSync && (
                        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-amber-500 animate-spin">sync</span>
                            <div className="text-left">
                              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Offline Check-In Active</p>
                              <p className="text-[10px] text-white/60">Your check-in is saved locally. It will sync automatically when you are back online.</p>
                            </div>
                          </div>
                          <span className="bg-amber-500/20 text-amber-400 font-mono text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-amber-500/30">
                            Pending Sync 🔄
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-tertiary/10 border border-tertiary/30 rounded-2xl p-5 mb-8">
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined ${ticket.isPendingSync ? 'text-amber-500 animate-pulse' : 'text-tertiary text-2xl animate-bounce'}`}>{ticket.isPendingSync ? 'sync' : 'check_circle'}</span>
                          <div>
                            <h4 className={`font-bold ${ticket.isPendingSync ? 'text-amber-400' : 'text-tertiary'} text-sm uppercase tracking-wide font-sans`}>{ticket.isPendingSync ? 'Offline Check-In Completed' : t('checkinSuccess')}</h4>
                            <p className="text-xs text-white/60">{ticket.isPendingSync ? 'Your digital ticket has been validated on this device.' : t('checkinSuccessDesc')}</p>
                          </div>
                        </div>
                        {/* Attendee Details Badge */}
                        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 shrink-0 w-full lg:w-auto text-left">
                          <p className="text-[9px] uppercase text-white/40 font-bold tracking-wider">{t('registeredAttendee')}</p>
                          <p className="text-base font-bold text-white tracking-wide">{ticket.attendee?.firstName} {ticket.attendee?.lastName}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] font-mono text-tertiary font-bold">
                            <span>📅 {t('dob')}: {ticket.attendee?.dateOfBirth}</span>
                            <span>📞 {t('tel')}: {ticket.attendee?.phoneNumber}</span>
                          </div>
                          <div className="text-[10px] text-white/50 mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span> {ticket.attendee?.city}, {ticket.attendee?.country}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">badge</span> {ticket.attendee?.documentType} - {ticket.attendee?.documentId}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">person</span> {ticket.attendee?.gender}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                        
                        {/* Column 1: Dynamic (anti-screenshot) QR Code */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative">
                          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-tertiary/10 border border-tertiary/20 px-2 py-0.5 rounded-full text-[9px] text-tertiary font-bold tracking-widest uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                            {t('accessToken')}
                          </div>

                          <DynamicTicketQr ticketId={ticket.id} token={token} />

                          <p className="text-[10px] text-white/40 text-center uppercase tracking-wider font-semibold mt-2">
                            {t('scanGates')}
                          </p>
                        </div>

                        {/* Column 2: Alphanumeric RFID Monospace Tag */}
                        <div className="md:col-span-4 flex flex-col justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-3">
                              <span className="material-symbols-outlined text-xl text-tertiary">nfc</span>
                              <span className="text-xs font-bold uppercase tracking-wider">{t('rfidTagLabel')}</span>
                            </div>
                            
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1.5 font-bold">RFID Tag / Token Digital</p>
                              <span className="font-mono text-sm tracking-[0.2em] font-bold bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg text-tertiary inline-block drop-shadow-[0_0_15px_rgba(0,219,233,0.3)] shadow-[inset_0_0_10px_rgba(0,219,233,0.05)] w-full text-center">
                                {ticket.rfidTag}
                              </span>
                            </div>

                            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-[11px] leading-relaxed text-white/50">
                              <p className="font-bold text-white text-xs mb-1 uppercase tracking-wide">{t('pickupInstructions')}</p>
                              {t('pickupInstructionsText')}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[9px] text-white/30 uppercase tracking-wider mt-4">
                            <span className="material-symbols-outlined text-xs">shield</span>
                            {t('securityNotice')}
                          </div>
                        </div>

                        {/* Column 3: Cashless Top-Up Widget */}
                        <div className="md:col-span-4 flex flex-col justify-between bg-gradient-to-br from-tertiary/[0.02] to-primary/[0.04] border border-tertiary/20 rounded-2xl p-6 relative shadow-[0_10px_30px_rgba(0,219,233,0.05)]">
                          <div className="absolute inset-0 pointer-events-none bg-tertiary/5 filter blur-[30px]" />
                          
                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <div className="flex items-center gap-2 text-white/40">
                                <span className="material-symbols-outlined text-xl text-tertiary">account_balance_wallet</span>
                                <span className="text-xs font-bold uppercase tracking-wider">{t('cashlessWallet')}</span>
                              </div>
                              <span className="text-[10px] bg-tertiary/20 border border-tertiary/30 text-tertiary font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                                Active Balance
                              </span>
                            </div>

                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                              <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider mb-1">{t('cashlessWallet')}</p>
                              <h4 className="text-lg lg:text-xl font-black text-white uppercase tracking-tight">
                                {t('walletBalance')}: {ticket.bracelet ? formatPrice(ticket.bracelet.balance) : formatPrice(0)}
                              </h4>
                            </div>

                            {/* Top-up Widget Input & Button */}
                            <div className="space-y-2 mt-4">
                              <label className="text-[10px] uppercase text-white/40 font-bold tracking-wider block">
                                {t('onlineTopUpAmount')} ({currency})
                              </label>
                              <div className="flex gap-2">
                                <div className="relative flex-grow">
                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-white/40 text-sm">
                                    {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'lei'}
                                  </span>
                                  <input 
                                    type="number" 
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    placeholder={t('amountPlaceholder')}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-white font-bold font-mono focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary text-sm"
                                    min="5"
                                  />
                                </div>
                                
                                <button
                                  onClick={() => handleTopUp(ticket.id)}
                                  disabled={isTopUpLoading === ticket.id}
                                  className="bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold uppercase tracking-wider text-xs px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(0,219,233,0.3)] hover:shadow-[0_0_25px_rgba(0,219,233,0.6)] disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95"
                                >
                                  {isTopUpLoading === ticket.id ? (
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    t('topUpButton')
                                  )}
                                </button>
                              </div>
                              
                              <div className="flex gap-2 justify-between mt-2">
                                {['10', '20', '50', '100'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => setTopUpAmount(val)}
                                    className={`text-[10px] font-bold font-mono py-1 px-3 rounded border transition-all ${topUpAmount === val ? 'bg-tertiary/25 border-tertiary text-tertiary' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                                  >
                                    +{currency === 'EUR' ? `€${val}` : currency === 'USD' ? `$${val}` : `${val} lei`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <p className="text-[9px] text-white/40 text-center mt-6 relative z-10">
                            Top up online now to avoid queues at physical top-up points!
                          </p>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Ticket transfer modal */}
      {transferTarget && (
        <TransferTicketModal
          ticketId={transferTarget.id}
          ticketName={getLocalizedTicketName(transferTarget.ticketType)}
          token={token}
          onClose={() => setTransferTarget(null)}
          onTransferred={handleTransferred}
        />
      )}

      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 px-6 py-3.5 rounded-2xl glass-panel border border-tertiary/40 shadow-[0_0_30px_rgba(0,219,233,0.35)] animate-fade-in">
          <span className="material-symbols-outlined text-tertiary">check_circle</span>
          <p className="font-label-sm text-sm uppercase tracking-widest text-tertiary">{toast}</p>
        </div>
      )}
    </div>
  );
};
