// =============================================
// FILE: /frontend/src/utils/api.js
// CHANGES:
//   • authAPI.getPermissions() — new endpoint
//   • adminAPI.analytics.*    — 4 new chart endpoints
//   • All existing calls PRESERVED
// =============================================

import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (err.response?.status === 403) {
      toast.error('You do not have permission to do this.');
    } else if (err.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject({ ...err, message });
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => API.post('/auth/register', data),
  login:          (data) => API.post('/auth/login', data),
  getMe:          ()     => API.get('/auth/me'),
  updateProfile:  (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  // NEW: fetch role-based permissions map
  getPermissions: ()     => API.get('/auth/permissions'),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll:       (params) => API.get('/events', { params }),
  getFeatured:  ()       => API.get('/events/featured'),
  getCategories:()       => API.get('/events/categories'),
  getById:      (id)     => API.get(`/events/${id}`),
  create:       (data)   => API.post('/events', data),
  update:       (id, data) => API.put(`/events/${id}`, data),
  delete:       (id)     => API.delete(`/events/${id}`),
};

// ─── Registrations ────────────────────────────────────────────────────────────
export const registrationsAPI = {
  create:  (data)   => API.post('/registrations', data),
  getMy:   (params) => API.get('/registrations/my', { params }),
  getById: (id)     => API.get(`/registrations/${id}`),
  cancel:  (id)     => API.delete(`/registrations/${id}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  createRazorpayOrder: (data) => API.post('/payments/razorpay/create-order', data),
  verifyRazorpay:      (data) => API.post('/payments/razorpay/verify', data),
  createStripeIntent:  (data) => API.post('/payments/stripe/create-intent', data),
  confirmFree:         (data) => API.post('/payments/free', data),
};

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const ticketsAPI = {
  getTicket: (regId) => API.get(`/tickets/${regId}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:    ()       => API.get('/admin/dashboard'),
  getUsers:        (params) => API.get('/admin/users', { params }),
  getRegistrations:(params) => API.get('/admin/registrations', { params }),
  getPayments:     (params) => API.get('/admin/payments', { params }),
  exportCSV:       (params) => API.get('/admin/export/registrations', { params, responseType: 'blob' }),
  checkIn:         (qrData) => API.post('/admin/checkin', { qrData }),
  updateUserRole:  (id, role) => API.patch(`/admin/users/${id}/role`, { role }),

  // NEW: granular analytics endpoints
  analytics: {
    registrationsPerEvent: (params) => API.get('/admin/analytics/registrations-per-event', { params }),
    revenueOverTime:       (params) => API.get('/admin/analytics/revenue-over-time', { params }),
    popularEvents:         ()       => API.get('/admin/analytics/popular-events'),
    userGrowth:            (params) => API.get('/admin/analytics/user-growth', { params }),
  }
};

export default API;
