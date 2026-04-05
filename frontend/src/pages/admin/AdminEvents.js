import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { eventsAPI } from '../../utils/api';
import { Spinner, Badge, Button } from '../../components/ui';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, status: status || undefined, search: search || undefined };
      const res = await eventsAPI.getAll({ ...params, status: status || 'published' });
      setEvents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (event) => {
    const newStatus = event.status === 'published' ? 'draft' : 'published';
    try {
      await eventsAPI.update(event._id, { status: newStatus });
      toast.success(`Event ${newStatus === 'published' ? 'published' : 'unpublished'}`);
      fetchEvents();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const statusColor = { published: 'green', draft: 'gray', cancelled: 'red', completed: 'blue' };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Events</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{pagination.total || 0} total events</p>
          </div>
          <Link
            to="/admin/events/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events..."
            className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Table */}
        {loading ? <Spinner /> : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {['Event', 'Date', 'Location', 'Registrations', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {events.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-600">No events found</td></tr>
                  ) : events.map(event => (
                    <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {event.coverImage ? (
                            <img src={event.coverImage} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-lg shrink-0">🎪</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">{event.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{event.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {event.location?.isOnline ? '🌐 Online' : event.location?.city}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white font-semibold">
                        {event.totalRegistrations} / {event.maxCapacity}
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={statusColor[event.status] || 'gray'}>{event.status}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/events/edit/${event._id}`}
                            className="px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(event)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              event.status === 'published'
                                ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100'
                                : 'text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100'
                            }`}
                          >
                            {event.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(event._id, event.title)}
                            disabled={deleting === event._id}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deleting === event._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                      page === p ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                    }`}
                  >{p}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
