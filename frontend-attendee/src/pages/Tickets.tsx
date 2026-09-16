import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Client } from '@stomp/stompjs';

type DayChoice = 1 | 2 | 3 | 4;
type TicketTier = 'GA' | 'VIP';
type ActiveTab = 'all' | 'flash-sale';

// FLASH_SALE_OPEN and FLASH_SALE_TOTAL are now fetched dynamically from backend.

const API_BASE = 'http://localhost:8080/api';

interface FlashSaleStatus {
  open: boolean;
  ticketsRemaining: number;
  totalTickets: number;
  queuePosition: number;
  queueSize: number;
  inQueue: boolean;
  saleOpenTime: string;
  originalDatetime: string;
}

export const Tickets: React.FC = () => {
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const { t, formatPrice } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [addedType, setAddedType] = useState<string | null>(null);

  // Determine initial tab from URL query param
  const getInitialTab = (): ActiveTab => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'flash-sale' ? 'flash-sale' : 'all';
  };
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [configuringTier, setConfiguringTier] = useState<TicketTier | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayChoice>(1);

  const [flashStatus, setFlashStatus] = useState<FlashSaleStatus | null>(null);
  const [flashLoading, setFlashLoading] = useState(false);
  const [flashError, setFlashError] = useState<string | null>(null);
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null);
  const [flashActionLoading, setFlashActionLoading] = useState(false);
  const isPurchasingRef = useRef(false);

  const [flashSaleOpenDate, setFlashSaleOpenDate] = useState<Date | null>(null);

  // Keep a ref to user so STOMP message closures always see the latest user object
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Flash sale countdown (for when not open yet)
  const calcFlashTimeLeft = useCallback(() => {
    if (!flashSaleOpenDate) return undefined;
    const diff = flashSaleOpenDate.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [flashSaleOpenDate]);

  const [flashTimeLeft, setFlashTimeLeft] = useState<any>(calcFlashTimeLeft());
  const isSaleOpen = flashTimeLeft === null;

  useEffect(() => {
    setFlashTimeLeft(calcFlashTimeLeft());
    const id = setInterval(() => setFlashTimeLeft(calcFlashTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [calcFlashTimeLeft]);

  // Fetch flash sale status
  const fetchFlashStatus = useCallback(async () => {
    setFlashLoading(true);
    setFlashError(null);
    try {
      const url = user
        ? `${API_BASE}/flash-sale/status?userId=${user.id}`
        : `${API_BASE}/flash-sale/status`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setFlashStatus(data.data);
        if (data.data.originalDatetime) {
          setFlashSaleOpenDate(new Date(data.data.originalDatetime));
        }
      }
    } catch {
      setFlashError('Could not load flash sale status. Please try again.');
    } finally {
      setFlashLoading(false);
    }
  }, [user]);

  // Fetch initial status once on mount so badge can show if open
  useEffect(() => {
    fetchFlashStatus();
  }, [fetchFlashStatus]);

  useEffect(() => {
    if (activeTab === 'flash-sale') {
      // Fetch a fresh HTTP snapshot when the tab first opens
      fetchFlashStatus();

      const stompClient = new Client({
        brokerURL: `ws://${window.location.hostname}:8080/ws/flash-sale`,
        reconnectDelay: 5000,
        debug: (str) => console.log('[STOMP]', str),
        onConnect: () => {
          console.log('[STOMP] Connected to /topic/flash-sale');
          stompClient.subscribe('/topic/flash-sale', (message) => {
            console.log('[STOMP] Received message:', message.body);
            try {
              const data = JSON.parse(message.body);
              const remaining: number = data.ticketsRemaining;
              const queueSize: number = data.queueSize;
              const queue: any[] = data.queue || [];

              const currentUser = userRef.current;
              let inQueue = false;
              let queuePosition = 0;

              console.log('[STOMP] Received queue array:', queue);
              console.log('[STOMP] Current user id:', currentUser?.id);

              if (currentUser && currentUser.id) {
                const idx = queue.findIndex((id: any) => String(id) === String(currentUser.id));
                console.log('[STOMP] Found user at index:', idx);
                if (idx !== -1) {
                  inQueue = true;
                  queuePosition = idx + 1;
                }
              }

              console.log('[STOMP] Updating flashStatus to inQueue=', inQueue, 'queuePosition=', queuePosition);

              setFlashStatus((prev) => {
                // Build a sensible base when the HTTP snapshot hasn't arrived yet
                const base: FlashSaleStatus = prev ?? {
                  open: true,
                  ticketsRemaining: remaining,
                  totalTickets: remaining,
                  queuePosition,
                  queueSize,
                  inQueue,
                  saleOpenTime: '',
                  originalDatetime: '',
                };
                return {
                  ...base,
                  ticketsRemaining: remaining,
                  queueSize,
                  inQueue,
                  queuePosition,
                };
              });
            } catch (e) {
              console.error('Failed to parse flash sale STOMP message', e);
            }
          });
        },
        onStompError: (frame) => {
          console.error('[STOMP] Error:', frame);
        },
        onDisconnect: () => {
          console.warn('[STOMP] Disconnected');
        },
        onWebSocketError: (event) => {
          console.error('[STOMP] WebSocket error:', event);
        },
      });

      stompClient.activate();

      return () => {
        stompClient.deactivate();
      };
    }
  }, [activeTab, fetchFlashStatus]);

  // ---- Standard ticket handlers ----
  const handleAddToCart = (ticketType: string, displayName: string, price: number) => {
    if (!user) {
      navigate('/auth', { state: { from: location } });
      return;
    }
    addToCart(ticketType, displayName, price);
    setAddedType(ticketType);
    setTimeout(() => setAddedType(null), 2000);
  };

  const openConfigurator = (tier: TicketTier) => {
    if (!user) {
      navigate('/auth', { state: { from: location } });
      return;
    }
    setConfiguringTier(tier);
    setSelectedDay(1);
    setIsModalOpen(true);
  };

  const closeConfigurator = () => {
    setIsModalOpen(false);
    setConfiguringTier(null);
  };

  const confirmDayTicket = () => {
    if (!configuringTier) return;
    const isGA = configuringTier === 'GA';
    const baseEnumStr = isGA ? `GA_DAY_${selectedDay}_PHASE_2` : `VIP_MAINSTAGE_DAY_${selectedDay}_PHASE_2`;
    const price = isGA ? 544.96 : 835.82;
    const namePrefix = isGA ? t('dayTicket') : t('vipDayTicket');
    handleAddToCart(baseEnumStr, `${namePrefix} ${selectedDay}`, price);
    closeConfigurator();
  };

  // ---- Flash Sale handlers ----
  const handleJoinQueue = async () => {
    if (!user) { navigate('/auth', { state: { from: location } }); return; }
    setFlashActionLoading(true);
    setFlashError(null);
    setFlashSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/flash-sale/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join queue');
      // Optimistically update own status; the STOMP broadcast will confirm positions for all clients
      setFlashStatus((prev) => prev ? { ...prev, inQueue: true, queuePosition: data.data?.queuePosition ?? 1 } : prev);
      setFlashSuccess(`You joined the queue! Your position: #${data.data?.queuePosition ?? '?'}`);
    } catch (e: any) {
      setFlashError(e.message);
    } finally {
      setFlashActionLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!user) return;
    setFlashActionLoading(true);
    setFlashError(null);
    setFlashSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/flash-sale/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to leave queue');
      // Optimistically clear own state; STOMP broadcast updates everyone else's positions
      setFlashStatus((prev) => prev ? { ...prev, inQueue: false, queuePosition: 0 } : prev);
      setFlashSuccess('You have left the flash sale queue.');
    } catch (e: any) {
      setFlashError(e.message);
    } finally {
      setFlashActionLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) { navigate('/auth', { state: { from: location } }); return; }
    setFlashActionLoading(true);
    setFlashError(null);
    setFlashSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/flash-sale/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Purchase failed');
      if (data.data && data.data.url) {
        isPurchasingRef.current = true;
        window.location.href = data.data.url;
      } else {
        setFlashSuccess('🎉 Ticket purchased! Check My Account for your ticket.');
        await fetchFlashStatus();
      }
    } catch (e: any) {
      setFlashError(e.message);
    } finally {
      setFlashActionLoading(false);
    }
  };

  // Derived flash sale values
  const totalFlashTickets = flashStatus?.totalTickets ?? 1; // Default to 1 to avoid / 0
  const remainingTickets = flashStatus?.ticketsRemaining ?? totalFlashTickets;
  const soldOut = remainingTickets <= 0;
  const userInQueue = flashStatus?.inQueue ?? false;
  const queuePosition = flashStatus?.queuePosition ?? 0;
  const canPurchase = userInQueue && queuePosition > 0 && queuePosition <= remainingTickets && !soldOut;

  // Handle tab switching with queue warning
  const handleTabSwitch = async (newTab: ActiveTab) => {
    if (activeTab === 'flash-sale' && newTab !== 'flash-sale' && userInQueue) {
      const confirmLeave = window.confirm(
        "You are currently in the flash sale queue. Leaving this tab will remove you from the queue. Are you sure you want to leave?"
      );
      if (confirmLeave) {
        await handleLeaveQueue();
        setActiveTab(newTab);
      }
    } else {
      setActiveTab(newTab);
    }
  };

  // Warn on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTab === 'flash-sale' && userInQueue && !isPurchasingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTab, userInQueue]);

  // Clean up if the component unmounts unexpectedly (optional, but requested behavior relies on warning first)

  return (
    <main className="flex-grow relative pt-[100px] pb-xl px-margin-mobile md:px-margin-desktop min-h-screen">
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="mb-xl text-center py-lg">
          <h1 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-base">
            {t('secureAccess')}
          </h1>
          <p className="font-body-lg text-body-lg text-white max-w-2xl mx-auto drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
            {t('chooseJourney')}
          </p>
        </section>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-xl max-w-5xl mx-auto border-b border-white/10 pb-0">
          <button
            id="tab-all-tickets"
            onClick={() => handleTabSwitch('all')}
            className={`px-6 py-3 font-label-sm text-label-sm uppercase tracking-widest border-b-2 transition-all duration-300 -mb-px ${activeTab === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-white hover:border-white/30'
              }`}
          >
            All Tickets
          </button>
          <button
            id="tab-flash-sale"
            onClick={() => handleTabSwitch('flash-sale')}
            className={`px-6 py-3 font-label-sm text-label-sm uppercase tracking-widest border-b-2 transition-all duration-300 -mb-px flex items-center gap-2 ${activeTab === 'flash-sale'
                ? 'border-[#ffaa00] text-[#ffaa00]'
                : 'border-transparent text-on-surface-variant hover:text-[#ff9933] hover:border-[#ff9933]/40'
              }`}
          >
            <span>⚡</span>
            Flash Sale
            {isSaleOpen && (
              <span
                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,170,0,0.2)', color: '#ffaa00', border: '1px solid rgba(255,170,0,0.4)' }}
              >
                LIVE
              </span>
            )}
          </button>
        </div>

        {/* ============================================================ */}
        {/* ALL TICKETS TAB                                               */}
        {/* ============================================================ */}
        {activeTab === 'all' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg max-w-5xl mx-auto">
            {/* General Access Card (4 Days) */}
            <div className="bg-surface-container-high rounded-xl p-md border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.4),0_15px_30px_rgba(0,0,0,0.8)] flex flex-col glow-hover relative overflow-hidden backdrop-blur-md">
              <div className="mb-lg">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-secondary mb-xs">{t('generalAccess')}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">{t('daysOfMagic')}</p>
              </div>
              <div className="mb-lg">
                <span className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-surface">{formatPrice(1155.31)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">{t('taxes')}</span>
              </div>
              <ul className="space-y-base mb-xl flex-grow">
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>check_circle</span>
                  <span className="font-body-md text-body-md">{t('checkAllStages')}</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>check_circle</span>
                  <span className="font-body-md text-body-md">{t('checkFoodCourt')}</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>check_circle</span>
                  <span className="font-body-md text-body-md">{t('checkEntryGates')}</span>
                </li>
              </ul>
              <button
                disabled={addedType === 'GA_4_DAYS_PHASE_5'}
                onClick={() => handleAddToCart('GA_4_DAYS_PHASE_5', 'GENERAL ACCESS', 1155.31)}
                className="w-full bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-widest py-md rounded-lg hover:shadow-[0_0_15px_rgba(112,0,255,0.5)] transition-shadow disabled:opacity-50"
              >
                {addedType === 'GA_4_DAYS_PHASE_5' ? t('added') : t('addCart')}
              </button>
            </div>

            {/* VIP Card (4 Days) */}
            <div className="bg-surface-container rounded-xl p-md flex flex-col glow-effect relative overflow-hidden backdrop-blur-md border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.4),0_15px_30px_rgba(0,0,0,0.8)]">
              <div className="absolute top-0 right-0 bg-error-container text-on-error-container font-label-sm text-label-sm uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-[0_0_10px_rgba(147,0,10,0.5)] animate-pulse">
                {t('sellingFast')}
              </div>
              <div className="mb-lg mt-base">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-tertiary drop-shadow-[0_0_8px_rgba(0,219,233,0.5)] mb-xs">{t('vipAccess')}</h2>
                <p className="font-body-md text-body-md text-tertiary-fixed-dim">{t('premiumExperience')}</p>
              </div>
              <div className="mb-lg">
                <span className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-surface">{formatPrice(2380.83)}</span>
                <span className="font-body-md text-body-md text-tertiary-fixed-dim">{t('taxes')}</span>
              </div>
              <ul className="space-y-base mb-xl flex-grow">
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
                  <span className="font-body-md text-body-md">{t('checkVipDecks')}</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
                  <span className="font-body-md text-body-md">{t('checkFastTrack')}</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
                  <span className="font-body-md text-body-md">{t('checkDrinks')}</span>
                </li>
              </ul>
              <button
                disabled={addedType === 'VIP_MAINSTAGE_4_DAYS_PHASE_3'}
                onClick={() => handleAddToCart('VIP_MAINSTAGE_4_DAYS_PHASE_3', 'VIP ACCESS', 2380.83)}
                className="w-full bg-tertiary text-on-tertiary font-label-sm text-label-sm uppercase tracking-widest py-md rounded-lg shadow-[0_0_15px_rgba(0,219,233,0.4)] hover:shadow-[0_0_25px_rgba(0,219,233,0.7)] transition-shadow disabled:opacity-50"
              >
                {addedType === 'VIP_MAINSTAGE_4_DAYS_PHASE_3' ? t('added') : t('addCart')}
              </button>
            </div>

            {/* Backstage Ultra Card (4 Days) */}
            <div className="bg-surface-container rounded-xl p-md flex flex-col glow-effect relative overflow-hidden backdrop-blur-md border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.4),0_15px_30px_rgba(0,0,0,0.8)]">
              <div className="absolute top-0 right-0 bg-warning-container text-on-warning-container font-label-sm text-label-sm uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-[0_0_10px_rgba(255,165,0,0.5)] animate-pulse" style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24' }}>
                {t('exclusive') || 'EXCLUSIVE'}
              </div>
              <div className="mb-lg mt-base">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] mb-xs" style={{ color: '#fbbf24' }}>BACKSTAGE ULTRA</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">The Ultimate Insider Access</p>
              </div>
              <div className="mb-lg">
                <span className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-surface" style={{ color: '#fbbf24' }}>{formatPrice(1928.95)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">{t('taxes')}</span>
              </div>
              <ul className="space-y-base mb-xl flex-grow">
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-warning" style={{ fontVariationSettings: "'FILL' 0'", color: '#fbbf24' }}>workspace_premium</span>
                  <span className="font-body-md text-body-md">Exclusive Backstage lounges</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-warning" style={{ fontVariationSettings: "'FILL' 0'", color: '#fbbf24' }}>groups</span>
                  <span className="font-body-md text-body-md">Artist meet & greet access</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-warning" style={{ fontVariationSettings: "'FILL' 0'", color: '#fbbf24' }}>local_shipping</span>
                  <span className="font-body-md text-body-md">Private golf-cart transport</span>
                </li>
              </ul>
              <button
                disabled={addedType === 'GALAXY_BACKSTAGE_4_DAYS'}
                onClick={() => handleAddToCart('GALAXY_BACKSTAGE_4_DAYS', 'BACKSTAGE ULTRA ACCESS', 1928.95)}
                className="w-full text-on-warning font-label-sm text-label-sm uppercase tracking-widest py-md rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.7)] transition-all disabled:opacity-50"
                style={{ backgroundColor: '#d97706', color: '#ffffff' }}
              >
                {addedType === 'GALAXY_BACKSTAGE_4_DAYS' ? t('added') : t('addCart')}
              </button>
            </div>

            {/* One Day GA Card */}
            <div className="bg-surface-container-high rounded-xl p-md border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.4),0_15px_30px_rgba(0,0,0,0.8)] flex flex-col glow-hover relative overflow-hidden backdrop-blur-md">
              <div className="mb-lg">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-secondary mb-xs">{t('dayTicket').toUpperCase()} - GA</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Single Day Access</p>
              </div>
              <div className="mb-lg">
                <span className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-surface">{formatPrice(544.96)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">{t('taxes')}</span>
              </div>
              <ul className="space-y-base mb-xl flex-grow">
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>event</span>
                  <span className="font-body-md text-body-md">1 Day Festival Access</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>music_note</span>
                  <span className="font-body-md text-body-md">Choose your favorite day</span>
                </li>
              </ul>
              <button
                onClick={() => openConfigurator('GA')}
                className="w-full border-2 border-primary text-primary font-label-sm text-label-sm uppercase tracking-widest py-md rounded-lg hover:bg-primary/10 transition-colors"
              >
                {t('addCart')}
              </button>
            </div>

            {/* One Day VIP Card */}
            <div className="bg-surface-container-high rounded-xl p-md border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.4),0_15px_30px_rgba(0,0,0,0.8)] flex flex-col glow-hover relative overflow-hidden backdrop-blur-md">
              <div className="mb-lg">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-tertiary mb-xs">{t('dayTicket').toUpperCase()} - VIP</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Single Day VIP</p>
              </div>
              <div className="mb-lg">
                <span className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-surface">{formatPrice(835.82)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">{t('taxes')}</span>
              </div>
              <ul className="space-y-base mb-xl flex-grow">
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
                  <span className="font-body-md text-body-md">1 Day VIP Access</span>
                </li>
                <li className="flex items-center gap-base">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 0" }}>event</span>
                  <span className="font-body-md text-body-md">Choose your favorite day</span>
                </li>
              </ul>
              <button
                onClick={() => openConfigurator('VIP')}
                className="w-full border-2 border-tertiary text-tertiary font-label-sm text-label-sm uppercase tracking-widest py-md rounded-lg hover:bg-tertiary/10 transition-colors"
              >
                {t('addCart')}
              </button>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* FLASH SALE TAB                                                */}
        {/* ============================================================ */}
        {activeTab === 'flash-sale' && (
          <section className="max-w-3xl mx-auto">
            {/* Card container */}
            <div
              className="rounded-2xl overflow-hidden border relative"
              style={{
                borderColor: isSaleOpen ? 'rgba(255,170,0,0.4)' : 'rgba(255,120,0,0.15)',
                background: isSaleOpen
                  ? 'linear-gradient(135deg, rgba(255,170,0,0.10) 0%, rgba(20,8,0,0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(255,80,0,0.04) 0%, rgba(10,5,0,0.98) 100%)',
                boxShadow: isSaleOpen
                  ? '0 0 80px rgba(255,170,0,0.2), 0 30px 80px rgba(0,0,0,0.9)'
                  : '0 0 30px rgba(255,80,0,0.05), 0 30px 80px rgba(0,0,0,0.9)',
              }}
            >
              {/* Top stripe */}
              <div
                className="h-1 w-full"
                style={{
                  background: isSaleOpen
                    ? 'linear-gradient(90deg, transparent, #ffaa00, #ff6600, #ffaa00, transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(255,100,0,0.3), transparent)',
                }}
              />

              <div className="p-6 md:p-10">
                {/* ---- HEADER ---- */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-3xl font-bold"
                        style={{ filter: 'drop-shadow(0 0 12px rgba(255,170,0,0.7))' }}
                      >
                        ⚡
                      </span>
                      <h2
                        className="font-headline-lg text-headline-lg uppercase"
                        style={{ color: isSaleOpen ? '#ffcc44' : '#ff9933' }}
                      >
                        Flash Sale
                      </h2>
                      <span
                        className="font-label-sm text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border"
                        style={
                          soldOut
                            ? { color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)' }
                            : isSaleOpen
                              ? { color: '#ffaa00', borderColor: 'rgba(255,170,0,0.4)', background: 'rgba(255,170,0,0.12)', animation: 'pulse 1.5s infinite' }
                              : { color: '#ff9933', borderColor: 'rgba(255,153,51,0.3)', background: 'rgba(255,100,0,0.08)' }
                        }
                      >
                        {soldOut ? 'SOLD OUT' : isSaleOpen ? 'LIVE NOW' : 'UPCOMING'}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      GA 4-Day Pass · 50% Discount · Limited to {totalFlashTickets} tickets
                    </p>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-2xl font-bold line-through opacity-40 text-white">1,155.31 RON</span>
                      <span
                        className="text-4xl font-bold"
                        style={{ color: '#ffaa00', textShadow: '0 0 20px rgba(255,170,0,0.5)' }}
                      >
                        577.66 RON
                      </span>
                    </div>
                  </div>
                </div>

                {/* ---- PRE-SALE COUNTDOWN ---- */}
                {!isSaleOpen && flashTimeLeft && (
                  <div
                    className="rounded-xl p-6 mb-8 text-center border"
                    style={{
                      background: 'rgba(255,100,0,0.05)',
                      borderColor: 'rgba(255,100,0,0.15)',
                    }}
                  >
                    <p className="font-label-sm text-label-sm uppercase tracking-widest mb-4" style={{ color: '#ff9933' }}>
                      Sale opens in
                    </p>
                    <div className="flex justify-center gap-4 items-center">
                      {[
                        { v: flashTimeLeft.days, l: 'Days' },
                        { v: flashTimeLeft.hours, l: 'Hrs' },
                        { v: flashTimeLeft.minutes, l: 'Min' },
                        { v: flashTimeLeft.seconds, l: 'Sec' },
                      ].map((item, i, arr) => (
                        <React.Fragment key={item.l}>
                          <div className="flex flex-col items-center">
                            <span
                              className="text-4xl font-bold tabular-nums"
                              style={{ color: '#ff9933', textShadow: '0 0 15px rgba(255,153,51,0.4)' }}
                            >
                              {String(item.v).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'rgba(255,153,51,0.5)' }}>
                              {item.l}
                            </span>
                          </div>
                          {i < arr.length - 1 && (
                            <span className="text-3xl font-light self-start mt-1" style={{ color: 'rgba(255,153,51,0.3)' }}>
                              :
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- TICKET COUNTER ---- */}
                <div className="mb-8 p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">
                    Tickets Remaining
                  </span>
                  <span
                    className="font-display-lg text-display-lg font-bold tabular-nums"
                    style={{
                      color: soldOut
                        ? '#ef4444'
                        : remainingTickets <= 20
                          ? '#ff6600'
                          : '#ffaa00',
                      textShadow: soldOut
                        ? '0 0 20px rgba(239,68,68,0.4)'
                        : '0 0 20px rgba(255,170,0,0.4)',
                    }}
                  >
                    {flashLoading ? '—' : remainingTickets}
                  </span>
                </div>

                {/* ---- FEEDBACK MESSAGES ---- */}
                {flashError && (
                  <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-body-md text-body-md flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-400">error</span>
                    {flashError}
                  </div>
                )}
                {flashSuccess && (
                  <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 font-body-md text-body-md flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                    {flashSuccess}
                  </div>
                )}

                {/* ---- SOLD OUT STATE ---- */}
                {soldOut && (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-6xl text-red-400/50 mb-4 block" style={{ fontVariationSettings: "'FILL' 0" }}>
                      sell
                    </span>
                    <p className="font-headline-lg text-headline-lg text-red-400 uppercase">Sold Out</p>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                      All flash sale tickets have been claimed. Check All Tickets for regular options.
                    </p>
                  </div>
                )}

                {/* ---- QUEUE SECTION (sale open, not sold out) ---- */}
                {isSaleOpen && !soldOut && (
                  <div>
                    {/* User queue status */}
                    {userInQueue ? (
                      <div
                        className="rounded-xl p-6 mb-6 border"
                        style={{
                          background: canPurchase ? 'rgba(255,170,0,0.08)' : 'rgba(255,255,255,0.03)',
                          borderColor: canPurchase ? 'rgba(255,170,0,0.3)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <p className="font-label-sm text-label-sm uppercase tracking-widest mb-1 text-on-surface-variant">
                              Your Queue Position
                            </p>
                            <div className="flex items-baseline gap-3">
                              <span
                                className="text-5xl font-bold tabular-nums"
                                style={{
                                  color: canPurchase ? '#ffaa00' : '#aaa',
                                  textShadow: canPurchase ? '0 0 25px rgba(255,170,0,0.6)' : 'none',
                                }}
                              >
                                #{queuePosition}
                              </span>
                              {canPurchase ? (
                                <span
                                  className="font-label-sm text-label-sm uppercase tracking-widest px-2 py-1 rounded border animate-pulse"
                                  style={{ color: '#ffaa00', borderColor: 'rgba(255,170,0,0.4)', background: 'rgba(255,170,0,0.1)' }}
                                >
                                  ✓ Eligible to buy
                                </span>
                              ) : (
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                                  Standby — waiting for a spot
                                </span>
                              )}
                            </div>
                            {!canPurchase && (
                              <p className="font-body-md text-body-md text-on-surface-variant mt-2 text-sm">
                                You'll be notified when someone at position ≤{remainingTickets} cancels.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-xl p-6 mb-6 border text-center"
                        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                      >
                        <p className="font-body-md text-body-md text-on-surface-variant mb-1">
                          {user ? 'Get in the queue to secure a discounted ticket.' : 'Log in to join the flash sale queue.'}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 max-w-sm mx-auto">
                      {!userInQueue ? (
                        <button
                          id="flash-sale-join-queue-btn"
                          onClick={handleJoinQueue}
                          disabled={flashActionLoading}
                          className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-label-sm text-label-sm uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'linear-gradient(135deg, #ffaa00, #ff6600)',
                            color: '#000',
                            boxShadow: '0 0 30px rgba(255,170,0,0.35)',
                            fontWeight: 700,
                          }}
                        >
                          {flashActionLoading ? (
                            <>
                              <span className="material-symbols-outlined animate-spin">refresh</span>
                              Joining...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                queue
                              </span>
                              Get in Queue
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          {canPurchase && (
                            <button
                              id="flash-sale-purchase-btn"
                              onClick={handlePurchase}
                              disabled={flashActionLoading}
                              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-label-sm text-label-sm uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                background: 'linear-gradient(135deg, #ffaa00, #ff6600)',
                                color: '#000',
                                boxShadow: '0 0 40px rgba(255,170,0,0.5)',
                                fontWeight: 700,
                              }}
                            >
                              {flashActionLoading ? (
                                <>
                                  <span className="material-symbols-outlined animate-spin">refresh</span>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                                    bolt
                                  </span>
                                  Buy Now — 577.66 RON
                                </>
                              )}
                            </button>
                          )}
                          <button
                            id="flash-sale-leave-queue-btn"
                            onClick={handleLeaveQueue}
                            disabled={flashActionLoading}
                            className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-label-sm text-label-sm uppercase tracking-widest border transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                            style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#aaa' }}
                          >
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                              person_remove
                            </span>
                            Leave Queue
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ---- PRE-SALE note ---- */}
                {!isSaleOpen && (
                  <div className="text-center py-4">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      The queue opens on <span style={{ color: '#ffaa00' }}>
                        {flashSaleOpenDate ? flashSaleOpenDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '...'}
                      </span>.
                      Come back then to secure your discounted ticket!
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom stripe */}
              <div
                className="h-[2px] w-full"
                style={{
                  background: isSaleOpen
                    ? 'linear-gradient(90deg, transparent, rgba(255,170,0,0.25), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(255,100,0,0.08), transparent)',
                }}
              />
            </div>
          </section>
        )}

        {/* Configurator Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface-container-highest border border-outline-variant rounded-xl p-lg w-full max-w-md shadow-2xl relative">
              <button
                onClick={closeConfigurator}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <h2 className="font-headline-lg mb-2 text-primary">
                {t('selectDayTitle')}
              </h2>
              <p className="text-on-surface-variant mb-6 font-body-md">
                Select which day you want to attend for the {configuringTier === 'VIP' ? 'VIP' : 'GA'} access.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[1, 2, 3, 4].map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day as DayChoice)}
                    className={`py-4 rounded-lg border-2 transition-all font-headline-md ${selectedDay === day
                        ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(112,0,255,0.4)]'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-white'
                      }`}
                  >
                    {t('selectDay')} {day}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={closeConfigurator}
                  className="w-1/2 border border-outline-variant text-on-surface font-label-md py-3 rounded-lg hover:bg-white/5 transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDayTicket}
                  className="w-1/2 bg-primary-container text-on-primary font-label-md uppercase tracking-widest py-3 rounded-lg hover:shadow-[0_0_20px_rgba(112,0,255,0.6)] transition-all"
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
