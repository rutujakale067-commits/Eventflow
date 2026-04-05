import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { Spinner, Badge } from '../../components/ui';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 15, search: search || undefined });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchData();
    } catch (err) {
      toast.error('Role update failed');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Users</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{pagination.total || 0} total users</p>
          </div>
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {loading ? <Spinner /> : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {['User', 'Email', 'Phone', 'Role', 'Joined', 'Last Login', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {users.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-600">No users found</td></tr>
                  ) : users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{user.phone || '—'}</td>
                      <td className="px-5 py-4">
                        <Badge color={user.role === 'admin' ? 'violet' : 'gray'}>{user.role}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleRoleChange(user._id, user.role)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            user.role === 'admin'
                              ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100'
                              : 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100'
                          }`}
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
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
