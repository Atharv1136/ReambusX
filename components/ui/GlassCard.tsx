import type { ReactNode } from 'react';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  accent?: 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'none';
  glow?: 'blue' | 'orange' | 'green' | 'red' | 'none';
  hover?: boolean;
  animate?: boolean;
  delay?: number;
};

const accentBarMap = {
  blue: 'accent-bar-blue',
  orange: 'accent-bar-orange',
  green: 'accent-bar-green',
  red: 'accent-bar-red',
  purple: 'accent-bar-purple',
  none: '',
};

const glowMap = {
  blue: 'glow-ring-blue',
  orange: 'glow-ring-orange',
  green: 'glow-ring-green',
  red: 'glow-ring-red',
  none: '',
};

export default function GlassCard({
  children,
  className = '',
  accent = 'none',
  glow = 'none',
  hover = true,
  animate = true,
  delay = 0,
}: GlassCardProps) {
  const accentClass = accentBarMap[accent];
  const glowClass = glowMap[glow];
  const hoverClass = hover ? 'glass-card' : 'glass';
  const animateClass = animate ? 'animate-fade-in-up' : '';
  const delayClass = delay > 0 && delay <= 8 ? `anim-delay-${delay}` : '';

  return (
    <div
      className={`relative rounded-2xl p-5 ${hoverClass} ${accentClass} ${glowClass} ${animateClass} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}
