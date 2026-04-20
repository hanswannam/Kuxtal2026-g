import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * CountdownTimer — displays remaining time until `endDate` (ISO string or YYYY-MM-DD).
 * Shows "Finalizada" when past. Compact variant for cards, default for detail pages.
 */
export function CountdownTimer({ endDate, label = 'Termina en', compact = false, className = '' }) {
  const [remaining, setRemaining] = useState(() => computeRemaining(endDate));

  useEffect(() => {
    if (!endDate) return undefined;
    setRemaining(computeRemaining(endDate));
    const id = setInterval(() => setRemaining(computeRemaining(endDate)), 60 * 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (!endDate) return null;

  if (remaining.expired) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-destructive ${className}`}
        data-testid="countdown-expired"
      >
        <Clock className="w-3.5 h-3.5" /> Promoción finalizada
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-primary ${className}`}
        data-testid="countdown-compact"
      >
        <Clock className="w-3.5 h-3.5" />
        {remaining.days > 0 ? `${remaining.days}d ` : ''}
        {remaining.hours}h {remaining.minutes}m
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-accent/30 bg-accent/10 p-3 ${className}`}
      data-testid="countdown-full"
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold text-accent-foreground mb-2 flex items-center gap-1.5">
        <Clock className="w-3 h-3" /> {label}
      </p>
      <div className="grid grid-cols-4 gap-2 text-center">
        <TimeBlock value={remaining.days} unit="días" />
        <TimeBlock value={remaining.hours} unit="h" />
        <TimeBlock value={remaining.minutes} unit="min" />
        <TimeBlock value={remaining.seconds} unit="s" />
      </div>
    </div>
  );
}

function TimeBlock({ value, unit }) {
  return (
    <div className="bg-white rounded-lg border border-border py-1.5">
      <div className="text-lg font-bold text-primary leading-none">{String(value).padStart(2, '0')}</div>
      <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{unit}</div>
    </div>
  );
}

function computeRemaining(endDate) {
  if (!endDate) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { expired: false, days, hours, minutes, seconds };
}
