import React, { useState } from 'react';

interface TransferTicketModalProps {
  ticketId: number;
  ticketName: string;
  token: string | null;
  onClose: () => void;
  onTransferred: (ticketId: number) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const TransferTicketModal: React.FC<TransferTicketModalProps> = ({
  ticketId,
  ticketName,
  token,
  onClose,
  onTransferred,
}) => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || !token || submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/tickets/${ticketId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetEmail: email.trim() }),
      });
      const body = await res.json();
      if (res.ok) {
        onTransferred(ticketId);
      } else {
        setServerError(body.message || 'Transferul a eșuat. Încearcă din nou.');
      }
    } catch (err) {
      console.error('Ticket transfer failed', err);
      setServerError('Eroare de conexiune cu serverul.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md rounded-3xl border border-primary/30 shadow-[0_0_40px_rgba(112,0,255,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-primary/10 via-[#150d2d]/30 to-tertiary/10 p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-tertiary mb-1">Transfer bilet</p>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{ticketName}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Închide"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="font-body-md text-sm text-white/60 leading-relaxed">
            Biletul va fi mutat definitiv pe contul destinatarului. Poți transfera doar bilete care
            nu au trecut încă prin check-in.
          </p>

          <div>
            <label className="font-label-sm text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1.5 block">
              Email destinatar
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="prieten@exemplu.com"
              autoFocus
              className={`w-full bg-white/5 border rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-1 placeholder-white/20 transition-all font-semibold ${
                touched && !emailValid
                  ? 'border-error/60 focus:border-error focus:ring-error'
                  : 'border-white/10 focus:border-primary focus:ring-primary'
              }`}
            />
            {touched && !emailValid && (
              <p className="mt-1.5 font-label-sm text-[11px] text-error">Introdu o adresă de email validă.</p>
            )}
          </div>

          {serverError && (
            <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/40">
              <p className="font-label-sm text-xs text-error">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!emailValid || submitting}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold uppercase tracking-wider text-xs py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(112,0,255,0.3)] hover:shadow-[0_0_35px_rgba(112,0,255,0.6)] disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 duration-300"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Se transferă...
              </span>
            ) : (
              'Transferă biletul'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
