import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ticketsAPI } from '../utils/api';
import { Spinner } from '../components/ui';
import { format } from 'date-fns';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const regId = searchParams.get('regId');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (regId) {
      ticketsAPI.getTicket(regId)
        .then(res => setTicket(res.data.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [regId]);

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">

        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">You're In! 🎉</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Your ticket has been confirmed. Check your email for a copy.
          </p>
        </motion.div>

        {ticket && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 overflow-hidden"
          >
            {/* Ticket header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
              <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1">Your Ticket</p>
              <h2 className="text-xl font-black leading-snug">{ticket.event?.title}</h2>
            </div>

            {/* Ticket dashed divider */}
            <div className="flex items-center px-6">
              <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-950 -ml-9 shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mx-3" />
              <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-950 -mr-9 shrink-0" />
            </div>

            <div className="p-6">
              {/* Event details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Date', value: ticket.event?.startDate ? format(new Date(ticket.event.startDate), 'MMM d, yyyy') : '—' },
                  { label: 'Time', value: ticket.event?.startDate ? format(new Date(ticket.event.startDate), 'h:mm a') : '—' },
                  { label: 'Venue', value: ticket.event?.location?.isOnline ? 'Online' : ticket.event?.location?.venue },
                  { label: 'Ticket Type', value: ticket.ticketType?.name },
                  { label: 'Attendee', value: ticket.attendeeInfo?.name },
                  { label: 'Booking ID', value: ticket.registrationId },
                ].map(row => (
                  <div key={row.label}>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider font-medium">{row.label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* QR Code */}
              {ticket.qrCode && (
                <div className="flex flex-col items-center py-6 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Show at Entry</p>
                  <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <img src={ticket.qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">Scan this QR code at the event entrance</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 mt-6"
        >
          {regId && (
            <Link
              to={`/tickets/${regId}`}
              className="flex-1 text-center px-5 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors"
            >
              View Full Ticket
            </Link>
          )}
          <Link
            to="/my-tickets"
            className="flex-1 text-center px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            All My Tickets
          </Link>
          <Link
            to="/events"
            className="flex-1 text-center px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Browse More Events
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
