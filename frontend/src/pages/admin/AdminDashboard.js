// =============================================
// FILE: /frontend/src/pages/admin/AdminDashboard.js
// CHANGES: Full rewrite with Recharts charts
//   • AreaChart  — Revenue over time
//   • BarChart   — Registrations per event
//   • LineChart  — User growth
//   • Progress   — Popular events fill-rate
//   • All stat cards preserved + enhanced
// =============================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell
} from 'recharts';
import { adminAPI } from '../../utils/api';
import { Spinner, StatsCard, Badge } from '../../components/ui';
import AdminLayout from '../../components/admin/AdminLayout';

// ─── Month name helper ────────────────────────────────────────────────────────
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Chart colour palette ─────────────────────────────────────────────────────
const CHART_COLORS = ['#7c3aed', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── Tooltip styles ───────────────────────────────────────────────────────────
const CustomTooltipStyle = {
  backgroundColor: 'rgba(17,24,39,0.9)',
  border: '1px solid #374151',
  borderRadius: '12px',
  padding: '10px 14px',
  color: '#f9fafb',
  fontSize: 13
};

const statusColor = { completed: 'green', pending: 'yellow', failed: 'red', cancelled: 'gray' };

export default function AdminDashboard() {
  const [data, setData]           = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('revenue'); // revenue | registrations | users

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, regsRes, revenueRes, popularRes, growthRes] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.analytics.registrationsPerEvent({ limit: 8 }),
          adminAPI.analytics.revenueOverTime({ months: 12 }),
          adminAPI.analytics.popularEvents(),
          adminAPI.analytics.userGrowth({ months: 6 }),
        ]);
        setData(dashRes.data.data);
        setAnalytics({
          registrationsPerEvent: regsRes.data.data,
          revenueOverTime: revenueRes.data.data,
          popularEvents: popularRes.data.data,
          userGrowth: growthRes.data.data,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <AdminLayout><Spinner /></AdminLayout>;

  const { stats, recentRegistrations, recentEvents } = data || {};

  // Shape data for Recharts
  const revenueChartData = (analytics.revenueOverTime || []).map(m => ({
    name: `${MONTHS[m._id?.month]} '${String(m._id?.year).slice(-2)}`,
    Revenue: m.revenue,
    Transactions: m.transactions
  }));

  const regPerEventData = (analytics.registrationsPerEvent || []).map(r => ({
    name: r.eventTitle?.length > 18 ? r.eventTitle.slice(0, 18) + '…' : r.eventTitle,
    Registrations: r.registrations,
    Revenue: r.revenue,
    fill: CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)]
  }));

  const userGrowthData = (analytics.userGrowth || []).map(u => ({
    name: `${MONTHS[u._id?.month]}`,
    Users: u.newUsers
  }));

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Page header ────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Live overview of your platform performance
          </p>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Users',     value: stats?.totalUsers?.toLocaleString() || '0',                     icon: '👥', color: 'violet' },
            { label: 'Total Events',    value: stats?.totalEvents?.toLocaleString() || '0',                    icon: '🎪', color: 'blue' },
            { label: 'Registrations',   value: stats?.totalRegistrations?.toLocaleString() || '0',             icon: '🎟️', color: 'green' },
            { label: 'Total Revenue',   value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,       icon: '💰', color: 'orange' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <StatsCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* ── Chart section ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-4 border-b border-gray-100 dark:border-gray-800">
            {[
              { key: 'revenue',       label: '💰 Revenue' },
              { key: 'registrations', label: '🎟️ Registrations' },
              { key: 'users',         label: '👥 User Growth' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Revenue Area Chart */}
            {activeTab === 'revenue' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Revenue Over Time</h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Last 12 months</span>
                </div>
                {revenueChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">No revenue data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f293733" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={CustomTooltipStyle}
                        formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="Revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Registrations Bar Chart */}
            {activeTab === 'registrations' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Registrations per Event</h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Top 8 events</span>
                </div>
                {regPerEventData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={regPerEventData} margin={{ top: 4, right: 4, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f293733" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={CustomTooltipStyle}
                        formatter={(v, name) => [
                          name === 'Revenue' ? `₹${v.toLocaleString('en-IN')}` : v,
                          name
                        ]}
                      />
                      <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                      <Bar dataKey="Registrations" fill="#7c3aed" radius={[6, 6, 0, 0]}>
                        {regPerEventData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* User Growth Line Chart */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">User Growth</h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Last 6 months</span>
                </div>
                {userGrowthData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">No user data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={userGrowthData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f293733" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={CustomTooltipStyle} />
                      <Line type="monotone" dataKey="Users" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Popular Events + Quick Actions ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Popular Events fill-rate */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 dark:text-white">Popular Events</h2>
              <Link to="/admin/events" className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">Manage →</Link>
            </div>
            <div className="space-y-4">
              {(analytics.popularEvents || []).slice(0, 6).map((ev, i) => {
                const fill = Math.min(Math.round((ev.totalRegistrations / Math.max(ev.maxCapacity, 1)) * 100), 100);
                return (
                  <div key={ev._id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 flex-shrink-0 text-xs font-black text-gray-400 dark:text-gray-500">
                          {i + 1}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ev.title}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 flex-shrink-0 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{ev.totalRegistrations}/{ev.maxCapacity}</span>
                        <span className={`font-bold ${fill >= 80 ? 'text-red-500' : fill >= 50 ? 'text-orange-500' : 'text-green-600 dark:text-green-400'}`}>
                          {fill}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fill}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          fill >= 80 ? 'bg-red-500' : fill >= 50 ? 'bg-orange-400' : 'bg-violet-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
              {(analytics.popularEvents || []).length === 0 && (
                <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-6">No published events yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-5">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { icon: '➕', label: 'Create New Event',    to: '/admin/events/new',    color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
                { icon: '🎟️', label: 'View Registrations', to: '/admin/registrations', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
                { icon: '📱', label: 'Check-In Scanner',   to: '/admin/checkin',       color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
                { icon: '👥', label: 'Manage Users',       to: '/admin/users',         color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
                { icon: '📥', label: 'Export CSV',         to: '/admin/registrations', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
              ].map(item => (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${item.color}`}>{item.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-1">
                    {item.label}
                  </span>
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Activity ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Registrations */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">Recent Registrations</h2>
              <Link to="/admin/registrations" className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {(recentRegistrations || []).length === 0 ? (
                <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-8">No registrations yet</p>
              ) : (recentRegistrations || []).map(reg => (
                <div key={reg._id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {reg.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{reg.user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reg.event?.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge color={statusColor[reg.paymentStatus] || 'gray'}>{reg.paymentStatus}</Badge>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {format(new Date(reg.createdAt), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">Recent Events</h2>
              <Link to="/admin/events" className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {(recentEvents || []).length === 0 ? (
                <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-8">No events yet</p>
              ) : (recentEvents || []).map(event => (
                <div key={event._id} className="flex items-center gap-3 px-6 py-3.5">
                  {event.coverImage ? (
                    <img src={event.coverImage} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shrink-0">🎪</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge color={event.status === 'published' ? 'green' : event.status === 'cancelled' ? 'red' : 'gray'}>
                      {event.status}
                    </Badge>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{event.totalRegistrations} regs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
