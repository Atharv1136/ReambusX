'use client';

import AnimatedCounter from '@/components/ui/AnimatedCounter';
import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  accent?: 'blue' | 'orange' | 'green' | 'red' | 'purple';
  delay?: number;
};

const accentMap = {
  blue: {
    bar: 'accent-bar-blue',
    glow: 'glow-ring-blue',
    iconBg: 'bg-accent-blue/10',
    iconText: 'text-accent-blue',
  },
  orange: {
    bar: 'accent-bar-orange',
    glow: 'glow-ring-orange',
    iconBg: 'bg-accent-orange/10',
    iconText: 'text-accent-orange',
  },
  green: {
    bar: 'accent-bar-green',
    glow: 'glow-ring-green',
    iconBg: 'bg-success/10',
    iconText: 'text-success',
  },
  red: {
    bar: 'accent-bar-red',
    glow: 'glow-ring-red',
    iconBg: 'bg-danger/10',
    iconText: 'text-danger',
  },
  purple: {
    bar: 'accent-bar-purple',
    glow: '',
    iconBg: 'bg-accent-purple/10',
    iconText: 'text-accent-purple',
  },
};

export default function StatCard({ title, value, helper, icon, accent = 'blue', delay = 0 }: StatCardProps) {
  const a = accentMap[accent];
  const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numericValue);
  const delayClass = delay > 0 && delay <= 8 ? `anim-delay-${delay}` : '';

  return (
    <article
      className={`relative glass-card rounded-2xl p-5 pl-7 ${a.bar} ${a.glow} animate-fade-in-up ${delayClass}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-text-secondary font-medium">
          {title}
        </p>
        {icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.iconBg}`}>
            <div className={a.iconText}>{icon}</div>
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-3xl font-bold text-text-primary">
        {isNumeric ? <AnimatedCounter value={numericValue} /> : value}
      </p>
      {helper && (
        <p className="mt-1.5 text-xs text-text-secondary">{helper}</p>
      )}
    </article>
  );
}
