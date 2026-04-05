// =============================================
// FILE: /frontend/src/components/ui/index.js
// All reusable UI components — fully compatible
// with AdminDashboard, EventCard, EventDetail,
// Dashboard, MyTickets, and all other pages.
// =============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';


// ─────────────────────────────────────────────────────────────────────────────
// SPINNER
// Props:
//   fullscreen?: boolean  — centers in full viewport height
//   size?: 'sm'|'md'|'lg'
// ─────────────────────────────────────────────────────────────────────────────
export function Spinner({ fullscreen = false, size = 'md' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const wheel = (
    <div
      className={`${sizes[size]} border-2 border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin`}
    />
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        {wheel}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {wheel}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON
// Props:
//   variant?: 'primary'|'secondary'|'outline'|'danger'|'ghost'
//   size?:    'sm'|'md'|'lg'
//   loading?: boolean
//   disabled?: boolean
//   className?: string
// ─────────────────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed ' +
    'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2';

  const variants = {
    primary:
      'bg-gradient-to-r from-violet-600 to-indigo-600 text-white ' +
      'hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 active:translate-y-0',
    secondary:
      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ' +
      'hover:bg-gray-200 dark:hover:bg-gray-700',
    outline:
      'border-2 border-violet-600 text-violet-600 dark:text-violet-400 ' +
      'hover:bg-violet-600 hover:text-white dark:hover:text-white',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost:  'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE
// Props:
//   color?: 'violet'|'green'|'red'|'yellow'|'gray'|'blue'|'orange'
// ─────────────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'violet' }) {
  const colors = {
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    green:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT CARD
// Props:
//   event:   object  — full event document from API
//   index?:  number  — stagger animation delay index
// ─────────────────────────────────────────────────────────────────────────────
export function EventCard({ event, index = 0 }) {
  if (!event) return null;

  const start    = new Date(event.startDate);
  const isOnline = event.location?.isOnline;
  const isPast   = start < new Date();

  // Use backend virtual or compute locally
  const lowestPrice =
    event.lowestPrice ??
    (event.ticketTypes || []).reduce(
      (min, t) => (t.isActive !== false ? Math.min(min, t.price) : min),
      Infinity
    );
  const isFree = lowestPrice === 0 || lowestPrice === Infinity;

  const categoryColors = {
    Technology: 'blue',
    Music:      'violet',
    Sports:     'green',
    Business:   'yellow',
    Arts:       'red',
    Food:       'yellow',
    Health:     'green',
    Education:  'blue',
    Other:      'gray',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/events/${event.slug || event._id}`}
        className="group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/10 dark:shadow-black/30 border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-1"
      >
        {/* Cover Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">🎪</span>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {event.category && (
              <Badge color={categoryColors[event.category] || 'gray'}>
                {event.category}
              </Badge>
            )}
            {event.isFeatured && <Badge color="yellow">⭐ Featured</Badge>}
            {isPast && <Badge color="gray">Past</Badge>}
          </div>

          {/* Price badge */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
              {isFree ? 'FREE' : `₹${lowestPrice?.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-3">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {format(start, 'EEE, MMM d · h:mm a')}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Short description */}
          {event.shortDescription && (
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">
              {event.shortDescription}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isOnline ? 'Online' : event.location?.city || '—'}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              {event.totalRegistrations || 0} registered
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN TIMER
// Props:
//   targetDate: string | Date
// ─────────────────────────────────────────────────────────────────────────────
export function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = React.useState({});

  React.useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft({ expired: true });
        return;
      }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <span className="text-red-500 font-medium text-sm">Event has started!</span>
    );
  }

  const units = [
    { key: 'days',    label: 'Days' },
    { key: 'hours',   label: 'Hrs'  },
    { key: 'minutes', label: 'Min'  },
    { key: 'seconds', label: 'Sec'  },
  ];

  return (
    <div className="flex gap-3">
      {units.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center">
          <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center">
            <span className="text-xl font-black text-violet-600 dark:text-violet-400 tabular-nums">
              {String(timeLeft[key] ?? 0).padStart(2, '0')}
            </span>
          </div>
          <span className="text-xs text-gray-400 mt-1 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// Props:
//   icon?:        string (emoji)
//   title:        string
//   description?: string
//   action?:      ReactNode
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS CARD
// Used by: AdminDashboard, Dashboard
// Props:
//   label:   string
//   value:   string | number
//   icon?:   string (emoji)
//   color?:  'violet'|'green'|'blue'|'orange'
//   trend?:  number  — positive shows green, negative shows red
// ─────────────────────────────────────────────────────────────────────────────
export function StatsCard({ label, value, icon, color = 'violet', trend }) {
  const gradients = {
    violet: 'from-violet-500 to-indigo-500',
    green:  'from-emerald-500 to-teal-500',
    blue:   'from-blue-500 to-cyan-500',
    orange: 'from-orange-500 to-amber-500',
  };

  const gradient = gradients[color] || gradients.violet;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg`}
          >
            {icon}
          </div>
        )}
        {trend !== undefined && trend !== null && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-lg ${
              trend > 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export (supports both named and default imports)
// ─────────────────────────────────────────────────────────────────────────────
export default {
  Spinner,
  Button,
  Badge,
  EventCard,
  CountdownTimer,
  EmptyState,
  StatsCard,
};
