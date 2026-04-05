import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { registrationsAPI } from '../utils/api';
import { Spinner, Badge, EmptyState } from '../components/ui';

const statusColor = { completed: 'green', pending: 'yellow', failed: 'red', cancelled: 'gray' };

export default function MyTickets() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    registrationsAPI.getMy({ page, limit: 10 })
      .then(res => { setRegistrations(res.data.data); setPagination(res.data.pagination); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = filter === 'all'
    ? registrations
    : registrations.filter(r => r.paymentStatus === filter);

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Tickets</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">All your event registrations</p>
          </div>
          <Link to="/events" className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
            + Find Events
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'completed', 'pending', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState
            icon="🎟️"
            title="No tickets found"
            description="Register for an event to see your tickets here."
            action={<Link to="/events" className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">Browse Events</Link>}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((reg, i) => (
              <motion.div
                key={reg._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-violet-200 dark:hover:border-violet-800 transition-all hover:shadow-md"
              >
                <div className="flex">
                  {reg.event?.coverImage && (
                    <img src={reg.event.coverImage} alt="" className="w-28 h-full object-cover shrink-0 hidden sm:block" />
                  )}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white leading-snug">{reg.event?.title}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>📅 {reg.event?.startDate ? format(new Date(reg.event.startDate), 'MMM d, yyyy') : '—'}</span>
                          <span>📍 {reg.event?.location?.isOnline ? 'Online' : reg.event?.location?.city}</span>
                          <span>🎫 {reg.ticketType?.name}</span>
                          <span>💰 {reg.totalAmount === 0 ? 'Free' : `₹${reg.totalAmount}`}</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ID: {reg.registrationId}</p>
                      </div>
                      <Badge color={statusColor[reg.paymentStatus] || 'gray'}>{reg.paymentStatus}</Badge>
                    </div>

                    <div className="flex gap-3 mt-4">
                      {reg.paymentStatus === 'completed' && (
                        <Link
                          to={`/tickets/${reg.registrationId}`}
                          className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
                        >
                          View Ticket & QR
                        </Link>
                      )}
                      {reg.paymentStatus === 'pending' && (
                        <Link
                          to={`/checkout/${reg.registrationId}`}
                          className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                        >
                          Complete Payment
                        </Link>
                      )}
                      <Link
                        to={`/events/${reg.event?.slug || reg.event?._id}`}
                        className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        View Event
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                  page === p ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
