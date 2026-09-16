import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeData {
  qrPayload: string;
  expiresInSeconds: number;
  windowSeconds: number;
}

interface DynamicTicketQrProps {
  ticketId: number;
  token: string | null;
}

/**
 * Anti-screenshot rotating QR: fetches a signed, 30s-windowed payload from the backend and
 * re-fetches the moment the window expires, so a screenshot of the code stops scanning within
 * seconds. The circular ring around the timer shows how long the current code stays valid.
 */
export const DynamicTicketQr: React.FC<DynamicTicketQrProps> = ({ ticketId, token }) => {
  const [qr, setQr] = useState<QrCodeData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState(false);
  // The interval callback needs the latest fetch function without re-arming the timer every tick.
  const fetchRef = useRef<() => void>(() => {});
  const retryRef = useRef(0);

  const MAX_RETRIES = 4;

  const fetchQr = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tickets/${ticketId}/qr-code`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // A page with several tickets fires one QR request per card at once — the backend's
        // burst rate limiter can 429 a few of them. Back off with jitter and retry instead of
        // declaring the code broken on the first rejection.
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current += 1;
          setTimeout(() => fetchRef.current(), 700 + Math.random() * 900);
        } else {
          setError(true);
          // Self-heal: try again next window instead of staying broken until a manual refresh.
          setTimeout(() => {
            retryRef.current = 0;
            fetchRef.current();
          }, 30_000);
        }
        return;
      }
      const body = await res.json();
      const data: QrCodeData = body.data;
      retryRef.current = 0;
      setQr(data);
      setSecondsLeft(data.expiresInSeconds);
      setError(false);
    } catch (err) {
      console.error('Failed to fetch dynamic QR', err);
      if (retryRef.current < MAX_RETRIES) {
        retryRef.current += 1;
        setTimeout(() => fetchRef.current(), 700 + Math.random() * 900);
      } else {
        setError(true);
      }
    }
  }, [ticketId, token]);

  fetchRef.current = fetchQr;

  useEffect(() => {
    // Small random stagger so multiple ticket cards don't all hit the API in the same instant.
    const initial = setTimeout(() => fetchRef.current(), Math.random() * 500);
    return () => clearTimeout(initial);
  }, [fetchQr]);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const windowSeconds = qr?.windowSeconds ?? 30;
  const progress = secondsLeft / windowSeconds;
  const RADIUS = 15;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  if (error) {
    return (
      <div className="p-6 text-center border border-error/40 bg-error/10 rounded-xl">
        <p className="font-label-sm text-xs uppercase tracking-wider text-error">
          Codul QR nu a putut fi generat
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(0,219,233,0.15)] border border-tertiary/30 my-4 relative">
        {qr ? (
          // Error-correction level M (not H): H adds 30% redundancy meant for damaged printed
          // codes, which makes the modules much finer — a low-res camera (or an emulator fed by
          // a laptop webcam) struggles to read them. On a clean phone screen, M is plenty.
          <QRCodeSVG value={qr.qrPayload} size={180} level="M" includeMargin={false} />
        ) : (
          <div className="w-[180px] h-[180px] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-t-tertiary border-primary/20 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Countdown ring: how long the current code is still valid */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-9 h-9">
          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={RADIUS} fill="none" strokeWidth="3" className="stroke-white/10" />
            <circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-tertiary transition-[stroke-dashoffset] duration-1000 ease-linear"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-tertiary tabular-nums">
            {secondsLeft}
          </span>
        </div>
        <p className="font-label-sm text-[10px] uppercase tracking-widest text-white/40">
          Codul se regenerează automat
        </p>
      </div>
    </div>
  );
};
