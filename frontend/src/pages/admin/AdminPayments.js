import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { Spinner, Badge } from '../../components/ui';
import AdminLayout from '../../components/admin/AdminLayout';

const statusColor = { captured: 'green', created: 'yellow', failed: 'red', refunded: 'gray', authorized: 'blue' };

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPayments({ page, limit: 15 });
      setPayments(res.data.data);
      setPagination(res.data.pagination);
      const rev = res.data.data
        .filter(p => p.status === 'captured')
        .reduce((s, p) => s + (p.amountInRupees || 0), 0);
      setTotalRevenue(rev);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">All payment transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Payments', value: pagination.total || 0, icon: '💳', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
            { label: 'Successful', value: payments.filter(p => p.status === 'captured').length, icon: '✅', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
            { label: 'Revenue (this page)', value: `₹${totalRevenue.toLocaleString()}`, icon: '💰', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center text-2xl`}>{s.icon}</div>
              <div>
                <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? <Spinner /> : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {['User', 'Event', 'Gateway', 'Amount', 'Status', 'Transaction ID', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {payments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-600">No payments yet</td></tr>
                  ) : payments.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.user?.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{p.user?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[140px]">
                        <p className="truncate">{p.event?.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          p.gateway === 'razorpay' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          p.gateway === 'stripe' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {p.gateway}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        ₹{p.amountInRupees?.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={statusColor[p.status] || 'gray'}>{p.status}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 max-w-[140px] truncate">
                          {p.razorpayPaymentId || p.stripePaymentIntentId || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {format(new Date(p.createdAt), 'MMM d, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${page === p ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
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
