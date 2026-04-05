import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { Button } from '../components/ui';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    setChangingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Password change failed');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-8">My Profile</h1>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-black text-xl text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{user?.email}</p>
              <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${user?.role === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                {user?.role === 'admin' ? '⚡ Admin' : '👤 Member'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Personal Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text' },
              { key: 'phone', label: 'Phone Number', type: 'tel' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email" value={user?.email || ''} disabled
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
                <input
                  type="password" required
                  value={pwForm[field.key]}
                  onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            ))}
            <Button type="submit" variant="outline" loading={changingPw}>Update Password</Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
