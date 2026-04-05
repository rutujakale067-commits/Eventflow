import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ticketsAPI } from '../utils/api';
import { Spinner, Badge } from '../components/ui';

export default function TicketView() {
  const { registrationId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef(null);

  useEffect(() => {
    ticketsAPI.getTicket(registrationId)
      .then(res => setTicket(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [registrationId]);

  const handleDownload = () => {
    if (!ticket?.qrCode) return;
    const link = document.createElement('a');
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.registrationId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Spinner fullscreen />;
  if (!ticket) return <div className="pt-20 text-center py-20 text-gray-500">Ticket not found.</div>;

  const event = ticket.event;
  const startDate = event?.startDate ? new Date(event.startDate) : null;

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between mb-6">
          <Link to="/my-tickets" className="text-sm text-violet-600 dark:text-violet-400 font-semibold hover:underline">← My Tickets</Link>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR
          </button>
        </div>

        <motion.div ref={ticketRef} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">

          {/* Event cover */}
          {event?.coverImage && <img src={event.coverImage} alt="" className="w-full h-40 object-cover" />}

          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1">Event Ticket</p>
                <h1 className="text-xl font-black leading-snug">{event?.title}</h1>
              </div>
              <Badge color={ticket.checkedIn ? 'green' : 'violet'}>
                {ticket.checkedIn ? '✅ Checked In' : '🎟️ Valid'}
              </Badge>
            </div>
          </div>

          {/* Ticket tear */}
          <div className="flex items-center px-4 py-0">
            <div className="w-5 h-5 rounded-full bg-gray-50 dark:bg-gray-950 -ml-7 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mx-2" />
            <div className="w-5 h-5 rounded-full bg-gray-50 dark:bg-gray-950 -mr-7 shrink-0" />
          </div>

          {/* Details grid */}
          <div className="px-6 py-5 grid grid-cols-2 gap-5">
            {[
              { label: 'Date', value: startDate ? format(startDate, 'EEE, MMM d, yyyy') : '—' },
              { label: 'Time', value: startDate ? format(startDate, 'h:mm a') : '—' },
              { label: 'Venue', value: event?.location?.isOnline ? 'Online Event' : event?.location?.venue },
              { label: 'City', value: event?.location?.isOnline ? 'Virtual' : event?.location?.city },
              { label: 'Ticket Type', value: ticket.ticketType?.name },
              { label: 'Amount Paid', value: ticket.totalAmount === 0 ? 'Free' : `₹${ticket.totalAmount}` },
              { label: 'Attendee', value: ticket.attendeeInfo?.name },
              { label: 'Email', value: ticket.attendeeInfo?.email },
            ].map(row => (
              <div key={row.label}>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-0.5">{row.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Booking ID */}
          <div className="mx-6 mb-5 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-0.5">Booking Reference</p>
            <p className="text-sm font-black text-gray-900 dark:text-white font-mono tracking-wide">{ticket.registrationId}</p>
          </div>

          {/* QR Code */}
          {ticket.qrCode && (
            <>
              <div className="flex items-center px-4">
                <div className="w-5 h-5 rounded-full bg-gray-50 dark:bg-gray-950 -ml-7 shrink-0" />
                <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mx-2" />
                <div className="w-5 h-5 rounded-full bg-gray-50 dark:bg-gray-950 -mr-7 shrink-0" />
              </div>
              <div className="flex flex-col items-center px-6 py-8">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Scan at Entry</p>
                <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <img src={ticket.qrCode} alt="QR Code" className="w-52 h-52" />
                </div>
                {ticket.checkedIn && ticket.checkedInAt && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-4 font-medium">
                    ✅ Checked in at {format(new Date(ticket.checkedInAt), 'h:mm a, MMM d')}
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Keep this ticket safe. A copy has been sent to {ticket.attendeeInfo?.email}
        </p>
      </div>
    </div>
  );
}
