// =============================================
// FILE: /frontend/src/pages/EventDetail.js
// CHANGES:
//   • Location card shows map link button
//   • Role-based UI: admin sees Edit button, user sees Register
//   • hasPermission() used for fine-grained gating
//   • Attendee count / fill-rate progress bar
//   • All existing logic PRESERVED
// =============================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { eventsAPI, registrationsAPI } from '../utils/api';
import { Badge, CountdownTimer, Button, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function EventDetail() {
  const { id } = useParams();
  const { user, isAuthenticated, isAdmin, hasPermission } = useAuth(); // NEW: hasPermission
  const navigate = useNavigate();

  const [event, setEvent]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [registering, setRegistering] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showRegModal, setShowRegModal]     = useState(false);
  const [attendeeInfo, setAttendeeInfo]     = useState({
    name: '', email: '', phone: '', organization: ''
  });

  useEffect(() => {
    eventsAPI.getById(id)
      .then(res => {
        setEvent(res.data.data);
        const firstActive = res.data.data.ticketTypes?.find(t => t.isActive);
        if (firstActive) setSelectedTicket(firstActive);
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (user) {
      setAttendeeInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        organization: ''
      });
    }
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    if (!selectedTicket) return toast.error('Please select a ticket type');
    setRegistering(true);
    try {
      const res = await registrationsAPI.create({
        eventId: event._id,
        ticketTypeName: selectedTicket.name,
        quantity: 1,
        attendeeInfo
      });
      const { registrationId, isFree } = res.data.data;
      setShowRegModal(false);
      navigate(`/checkout/${registrationId}${isFree ? '?free=true' : ''}`);
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (!event) return null;

  const startDate    = new Date(event.startDate);
  const endDate      = new Date(event.endDate);
  const isUpcoming   = startDate > new Date();
  const lowestPrice  = event.lowestPrice ?? event.ticketTypes?.reduce((m, t) => Math.min(m, t.price), Infinity);
  const isFree       = lowestPrice === 0;
  const fillRate     = Math.round((event.totalRegistrations / Math.max(event.maxCapacity, 1)) * 100);

  // NEW: build Google Maps URL from mapLink or coordinates or venue name
  const buildMapUrl = () => {
    if (event.location?.mapLink) return event.location.mapLink;
    if (event.location?.coordinates?.lat) {
      const { lat, lng } = event.location.coordinates;
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    const query = encodeURIComponent(event.location?.fullAddress || `${event.location?.venue} ${event.location?.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const categoryColors = {
    Technology: 'blue', Music: 'violet', Sports: 'green', Business: 'yellow',
    Arts: 'red', Food: 'yellow', Health: 'green', Education: 'blue', Other: 'gray'
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 bg-gray-900 overflow-hidden">
        {event.coverImage ? (
          <>
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-indigo-900" />
        )}
        <div className="absolute bottom-6 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge color={categoryColors[event.category] || 'gray'}>{event.category}</Badge>
              {event.isFeatured && <Badge color="yellow">⭐ Featured</Badge>}
              {event.status === 'cancelled' && <Badge color="red">Cancelled</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{event.title}</h1>

            {/* NEW: Admin edit shortcut visible inline */}
            {isAdmin && (
              <Link
                to={`/admin/events/edit/${event._id}`}
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold rounded-xl hover:bg-white/30 transition-colors"
              >
                ✏️ Edit Event
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Details ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <span className="text-2xl">📅</span>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">Date & Time</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(startDate, 'h:mm a')} — {format(endDate, 'h:mm a')}
                </p>
              </div>

              {/* NEW: Enhanced location card with map button */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <span className="text-2xl">📍</span>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">Location</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {event.location?.isOnline ? 'Online Event' : event.location?.venue}
                </p>
                {event.location?.isOnline ? (
                  event.location?.onlineLink ? (
                    <a
                      href={event.location.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Join Online →
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Link shared after registration</p>
                  )
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {event.location?.fullAddress || `${event.location?.city}, ${event.location?.state}`}
                    </p>
                    {/* NEW: View on Map button */}
                    <a
                      href={buildMapUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Google Maps
                    </a>
                  </>
                )}
              </div>

              {/* Registrations / Capacity */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <span className="text-2xl">👥</span>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">Registrations</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {event.totalRegistrations} / {event.maxCapacity}
                </p>
                {/* NEW: fill-rate bar */}
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fillRate >= 90 ? 'bg-red-500' : fillRate >= 60 ? 'bg-orange-400' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(fillRate, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 font-medium ${
                  fillRate >= 90 ? 'text-red-500' : fillRate >= 60 ? 'text-orange-500' : 'text-green-600 dark:text-green-400'
                }`}>
                  {event.maxCapacity - event.totalRegistrations} spots left
                </p>
              </div>

              {/* Price */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <span className="text-2xl">💰</span>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">Price</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {isFree ? 'Free Event' : `From ₹${lowestPrice?.toLocaleString('en-IN')}`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isFree ? 'No payment required' : `${event.ticketTypes?.filter(t => t.isActive).length} ticket types`}
                </p>
              </div>
            </div>

            {/* Countdown Timer */}
            {isUpcoming && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                  ⏱ Event Starts In
                </p>
                <CountdownTimer targetDate={event.startDate} />
              </div>
            )}

            {/* About */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About This Event</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {/* Highlights */}
            {event.highlights?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {event.speakers?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Speakers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {event.speakers.map((speaker, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold mb-3 overflow-hidden">
                        {speaker.avatar
                          ? <img src={speaker.avatar} alt={speaker.name} className="w-full h-full object-cover" />
                          : speaker.name?.[0]}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{speaker.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{speaker.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Ticket Selection ─────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Get Tickets</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {isFree ? 'FREE' : `₹${lowestPrice?.toLocaleString('en-IN')}`}
                  {!isFree && <span className="text-sm font-normal text-gray-400 ml-1">onwards</span>}
                </p>
              </div>

              <div className="p-6 space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Select Ticket Type
                </p>

                {event.ticketTypes?.filter(t => t.isActive).map(ticket => {
                  const available = ticket.totalSeats - ticket.soldSeats;
                  const isSelected = selectedTicket?.name === ticket.name;
                  return (
                    <button
                      key={ticket.name}
                      onClick={() => setSelectedTicket(ticket)}
                      disabled={available === 0}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : available === 0
                            ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                            : 'border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{ticket.name}</span>
                        <span className="font-black text-violet-600 dark:text-violet-400 text-sm">
                          {ticket.price === 0 ? 'Free' : `₹${ticket.price.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      {ticket.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ticket.description}</p>
                      )}
                      <p className={`text-xs font-medium ${
                        available === 0 ? 'text-red-500' : available < 20 ? 'text-orange-500' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {available === 0 ? 'Sold Out' : `${available} remaining`}
                      </p>
                    </button>
                  );
                })}

                {/* NEW: role-gated CTA */}
                {isAdmin ? (
                  <Link
                    to={`/admin/events/edit/${event._id}`}
                    className="block w-full text-center px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all text-sm mt-4"
                  >
                    ✏️ Edit This Event
                  </Link>
                ) : event.isRegistrationOpen ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                    onClick={() => {
                      if (!isAuthenticated) { toast.error('Please sign in to register'); navigate('/login'); return; }
                      if (!hasPermission('registerForEvent')) { toast.error('Registration is not available for your account type'); return; }
                      setShowRegModal(true);
                    }}
                  >
                    {isFree ? '🎟️ Register Free' : '💳 Buy Ticket'}
                  </Button>
                ) : (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {event.status === 'cancelled' ? '❌ Event Cancelled' : '🔒 Registration Closed'}
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  🔒 Secure payment powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Registration Modal ──────────────────────────────────────────────── */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Complete Registration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{event.title}</p>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {/* Ticket summary */}
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTicket?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1 ticket</p>
                </div>
                <p className="text-lg font-black text-violet-600 dark:text-violet-400">
                  {selectedTicket?.price === 0 ? 'FREE' : `₹${selectedTicket?.price?.toLocaleString('en-IN')}`}
                </p>
              </div>

              {[
                { key: 'name',         label: 'Full Name',              type: 'text',  required: true },
                { key: 'email',        label: 'Email Address',          type: 'email', required: true },
                { key: 'phone',        label: 'Phone Number',           type: 'tel',   required: false },
                { key: 'organization', label: 'Organization (optional)', type: 'text', required: false },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={attendeeInfo[field.key]}
                    onChange={e => setAttendeeInfo(a => ({ ...a, [field.key]: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                  />
                </div>
              ))}

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={registering}>
                {selectedTicket?.price === 0
                  ? 'Confirm Free Registration'
                  : `Proceed to Payment · ₹${selectedTicket?.price?.toLocaleString('en-IN')}`
                }
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
