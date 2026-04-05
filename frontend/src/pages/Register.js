import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.phone);
      toast.success(`Account created! Welcome, ${user.name} 🎉`);
      navigate('/events');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Decoration */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 70%, white 0%, transparent 50%)' }} />
        <div className="relative z-10 text-center text-white px-12">
          <div className="text-8xl mb-6">🚀</div>
          <h2 className="text-3xl font-black mb-4">Start your journey</h2>
          <div className="space-y-4 mt-8">
            {['Browse 500+ curated events', 'Instant QR-code tickets', 'Easy cancellation & management'].map(feat => (
              <div key={feat} className="flex items-center gap-3 text-violet-200 text-left">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-black">E</span>
            </div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white">Event<span className="text-violet-600">Flow</span></span>
          </Link>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Create an account</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Join EventFlow and discover amazing events</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
              { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '+91 98765 43210', required: false },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
                <input
                  type={field.type}
                  required={field.required}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Create Account
            </Button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
