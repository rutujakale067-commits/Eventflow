// =============================================
// Home Page
// =============================================

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import { EventCard, Spinner } from '../components/ui';

const CATEGORIES = ['Technology', 'Music', 'Business', 'Sports', 'Arts', 'Food', 'Health', 'Education'];

const categoryEmojis = {
  Technology: '💻', Music: '🎵', Business: '💼', Sports: '⚽',
  Arts: '🎨', Food: '🍕', Health: '🏃', Education: '📚'
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    eventsAPI.getFeatured()
      .then(res => setFeatured(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/events?search=${encodeURIComponent(search.trim())}`);
    else navigate('/events');
  };

  return (
    <div className="overflow-x-hidden">

      {/* ---- HERO ---- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-violet-950 to-indigo-950" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%), radial-gradient(circle at 60% 80%, #6366f1 0%, transparent 40%)' }}
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
          {/* Announcement pill */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            New events added every week
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6"
          >
            Discover &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Attend Events
            </span>
            <br />You'll Love
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            From tech conferences to music festivals — find, register, and get your QR ticket in minutes.
          </motion.p>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-3 max-w-xl mx-auto mb-12"
          >
            <div className="flex-1 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4">
              <svg className="w-5 h-5 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events, artists, venues..."
                className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm"
              />
            </div>
            <button type="submit" className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-violet-500/30 transition-all hover:-translate-y-0.5 whitespace-nowrap text-sm">
              Search
            </button>
          </motion.form>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 text-white/50 text-sm"
          >
            {[['500+', 'Events'], ['50K+', 'Attendees'], ['100+', 'Cities']].map(([num, label]) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-2xl font-black text-white">{num}</span>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ---- CATEGORIES ---- */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Browse by Category</h2>
            <p className="text-gray-500 dark:text-gray-400">Find events that match your passion</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/events?category=${cat}`}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{categoryEmojis[cat]}</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors text-center">{cat}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FEATURED EVENTS ---- */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-violet-600 dark:text-violet-400 font-semibold text-sm mb-2 uppercase tracking-wider">⭐ Featured</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Trending Events</h2>
            </motion.div>
            <Link to="/events" className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              View all →
            </Link>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((event, i) => (
                <EventCard key={event._id} event={event} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400">Register for an event in 3 simple steps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🔍', title: 'Discover', desc: 'Browse hundreds of events across categories and cities.' },
              { step: '02', icon: '💳', title: 'Register & Pay', desc: 'Secure your spot with instant payment via Razorpay or Stripe.' },
              { step: '03', icon: '🎟️', title: 'Get Your Ticket', desc: 'Receive a QR-coded ticket instantly. Show it at the door.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm"
              >
                <div className="absolute -top-4 left-8 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black px-3 py-1 rounded-lg">{item.step}</div>
                <div className="text-5xl mb-5">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 0%, transparent 60%)' }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to find your next experience?</h2>
            <p className="text-violet-200 text-lg mb-10">Join thousands of people discovering amazing events every day.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events" className="px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 text-base">
                Browse Events
              </Link>
              <Link to="/register" className="px-8 py-4 bg-violet-800/50 backdrop-blur-sm text-white font-bold rounded-2xl border border-white/20 hover:bg-violet-800 transition-all text-base">
                Create Account →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
