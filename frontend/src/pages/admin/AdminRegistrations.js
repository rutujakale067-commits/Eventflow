import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { Spinner, Badge } from '../../components/ui';
import AdminLayout from '../../components/admin/AdminLayout';

const statusColor = { completed: 'green', pending: 'yellow', failed: 'red', refunded: 'gray' };

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRegistrations({ page, limit: 15, search: search || undefined, paymentStatus: paymentStatus || undefined });
      setRegistrations(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [page, search, paymentStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminAPI.exportCSV({ paymentStatus: 'completed' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Registrations</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{pagination.total || 0} total registrations</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or booking ID..."
            className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <select
            value={paymentStatus}
            onChange={e => { setPaymentStatus(e.target.value); setPage(1); }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? <Spinner /> : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {['Booking ID', 'Attendee', 'Event', 'Ticket', 'Amount', 'Payment', 'Check-In', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {registrations.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400 dark:text-gray-600">No registrations found</td></tr>
                  ) : registrations.map(reg => (
                    <tr key={reg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                          {reg.registrationId}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{reg.attendeeInfo?.name || reg.user?.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{reg.attendeeInfo?.email || reg.user?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{reg.event?.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {reg.event?.startDate ? format(new Date(reg.event.startDate), 'MMM d, yyyy') : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{reg.ticketType?.name}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {reg.totalAmount === 0 ? 'Free' : `₹${reg.totalAmount}`}
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={statusColor[reg.paymentStatus] || 'gray'}>{reg.paymentStatus}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        {reg.checkedIn ? (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">✅ Checked In</span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {format(new Date(reg.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                      page === p ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
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
