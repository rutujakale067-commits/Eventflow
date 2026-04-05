// =============================================
// Dashboard Page — User
// =============================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { registrationsAPI } from '../utils/api';
import { Spinner, Badge, Button } from '../components/ui/index';

const statusColor = { completed: 'green', pending: 'yellow', failed: 'red', refunded: 'red' };
const statusLabel = { completed: 'Confirmed', pending: 'Pending Payment', failed: 'Failed', refunded: 'Refunded' };

export default function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, attended: 0 });

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const res = await registrationsAPI.getMy({ limit: 20 });
      const data = res.data.data;
      setRegistrations(data);

      const now = new Date();
      setStats({
        total: data.length,
        upcoming: data.filter(r => r.paymentStatus === 'completed' && new Date(r.event?.startDate) > now).length,
        attended: data.filter(r => r.checkedIn).length,
      });
    } catch (err) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Registrations', value: stats.total, icon: '🎫', color: 'from-violet-500 to-indigo-500' },
    { label: 'Upcoming Events', value: stats.upcoming, icon: '📅', color: 'from-blue-500 to-cyan-500' },
    { label: 'Events Attended', value: stats.attended, icon: '✅', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here's your event activity overview.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl mb-4`}>
              {s.icon}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link to="/events">
          <Button variant="primary" size="sm">
            <span>🔍</span> Browse Events
          </Button>
        </Link>
        <Link to="/my-tickets">
          <Button variant="secondary" size="sm">
            <span>🎟️</span> My Tickets
          </Button>
        </Link>
        <Link to="/profile">
          <Button variant="secondary" size="sm">
            <span>👤</span> Edit Profile
          </Button>
        </Link>
      </div>

      {/* Recent Registrations */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Recent Registrations</h2>
          <Link to="/my-tickets" className="text-violet-600 text-sm font-medium hover:underline">View all →</Link>
        </div>

        {loading ? (
          <Spinner />
        ) : registrations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No registrations yet</p>
            <Link to="/events"><Button variant="primary" size="sm">Explore Events</Button></Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {registrations.slice(0, 5).map((reg, i) => (
              <motion.div key={reg._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {/* Event image */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-400 to-indigo-500">
                  {reg.event?.coverImage && (
                    <img src={reg.event.coverImage} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{reg.event?.title || 'Event'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {reg.event?.startDate ? format(new Date(reg.event.startDate), 'MMM d, yyyy') : '—'}
                    {' · '}{reg.ticketType?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={statusColor[reg.paymentStatus] || 'violet'}>
                    {statusLabel[reg.paymentStatus] || reg.paymentStatus}
                  </Badge>
                  {reg.paymentStatus === 'completed' && (
                    <Link to={`/tickets/${reg.registrationId}`}>
                      <Button variant="outline" size="sm">View Ticket</Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
