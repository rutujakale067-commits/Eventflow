// =============================================
// Events Listing Page
// =============================================

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventsAPI } from '../utils/api';
import { EventCard, Spinner, EmptyState } from '../components/ui';

const CATEGORIES = ['All', 'Technology', 'Music', 'Business', 'Sports', 'Arts', 'Food', 'Health', 'Education', 'Other'];
const SORT_OPTIONS = [
  { value: 'startDate', label: 'Date (Soonest)' },
  { value: '-startDate', label: 'Date (Latest)' },
  { value: '-totalRegistrations', label: 'Most Popular' },
  { value: '-createdAt', label: 'Newest Listed' },
];

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    sort: '-startDate',
    page: 1,
  });

  const fetchEvents = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = { limit: 12, ...f };
      if (!params.category) delete params.category;
      if (!params.city) delete params.city;
      if (!params.search) delete params.search;

      const res = await eventsAPI.getAll(params);
      setEvents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(filters);
  }, [filters, fetchEvents]);

  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const [searchInput, setSearchInput] = useState(filters.search);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Explore Events</h1>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search events..."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
              <button type="submit" className="px-5 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Sort:</label>
              <select
                value={filters.sort}
                onChange={e => updateFilter('sort', e.target.value)}
                className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => updateFilter('category', cat === 'All' ? '' : cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  (cat === 'All' && !filters.category) || filters.category === cat
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <Spinner />
        ) : events.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No events found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={
              <button
                onClick={() => { setFilters({ search: '', category: '', city: '', sort: '-startDate', page: 1 }); setSearchInput(''); }}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                Clear Filters
              </button>
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> events found
              </p>
            </div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              layout
            >
              {events.map((event, i) => (
                <EventCard key={event._id} event={event} index={i} />
              ))}
            </motion.div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilters(f => ({ ...f, page: p }))}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                      filters.page === p
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
