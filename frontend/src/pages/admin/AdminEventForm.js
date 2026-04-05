// =============================================
// FILE: /frontend/src/pages/admin/AdminEventForm.js
// CHANGES:
//   • mapLink field in Location section
//   • latitude / longitude fields (optional)
//   • fullAddress field (optional override)
//   • All existing fields PRESERVED
// =============================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { eventsAPI } from '../../utils/api';
import { Button, Spinner } from '../../components/ui';
import AdminLayout from '../../components/admin/AdminLayout';

const EMPTY_TICKET = { name: '', price: 0, totalSeats: 100, description: '', isActive: true, currency: 'INR' };

const defaultForm = {
  title: '', description: '', shortDescription: '', category: 'Technology',
  location: {
    venue: '', address: '', city: '', state: '', country: 'India',
    isOnline: false, onlineLink: '',
    mapLink: '',                   // NEW
    fullAddress: '',               // NEW
    coordinates: { lat: '', lng: '' }  // NEW
  },
  startDate: '', endDate: '', registrationDeadline: '',
  ticketTypes: [{ ...EMPTY_TICKET, name: 'General' }],
  maxCapacity: 100, status: 'draft', isFeatured: false,
  coverImage: '', tags: '', highlights: ''
};

export default function AdminEventForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);
  const [form, setForm]   = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    eventsAPI.getById(id)
      .then(res => {
        const e = res.data.data;
        setForm({
          ...defaultForm,
          ...e,
          startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 16) : '',
          endDate:   e.endDate   ? new Date(e.endDate).toISOString().slice(0, 16)   : '',
          registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline).toISOString().slice(0, 16) : '',
          tags:       Array.isArray(e.tags)       ? e.tags.join(', ')      : '',
          highlights: Array.isArray(e.highlights) ? e.highlights.join('\n') : '',
          location: {
            ...defaultForm.location,
            ...e.location,
            coordinates: e.location?.coordinates || { lat: '', lng: '' }
          }
        });
      })
      .catch(() => { toast.error('Event not found'); navigate('/admin/events'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const set = (path, value) => {
    setForm(f => {
      const keys = path.split('.');
      if (keys.length === 1) return { ...f, [path]: value };
      if (keys.length === 2) return { ...f, [keys[0]]: { ...f[keys[0]], [keys[1]]: value } };
      if (keys.length === 3) return {
        ...f,
        [keys[0]]: { ...f[keys[0]], [keys[1]]: { ...f[keys[0]][keys[1]], [keys[2]]: value } }
      };
      return f;
    });
  };

  const updateTicket = (i, key, value) => {
    setForm(f => {
      const tickets = [...f.ticketTypes];
      tickets[i] = { ...tickets[i], [key]: key === 'price' || key === 'totalSeats' ? Number(value) : value };
      return { ...f, ticketTypes: tickets };
    });
  };

  const addTicket    = () => setForm(f => ({ ...f, ticketTypes: [...f.ticketTypes, { ...EMPTY_TICKET }] }));
  const removeTicket = (i) => setForm(f => ({ ...f, ticketTypes: f.ticketTypes.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: typeof form.tags === 'string'
          ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
          : form.tags,
        highlights: typeof form.highlights === 'string'
          ? form.highlights.split('\n').map(h => h.trim()).filter(Boolean)
          : form.highlights,
        maxCapacity: form.ticketTypes.reduce((s, t) => s + Number(t.totalSeats || 0), 0),
        location: {
          ...form.location,
          coordinates: {
            lat: form.location.coordinates?.lat ? Number(form.location.coordinates.lat) : null,
            lng: form.location.coordinates?.lng ? Number(form.location.coordinates.lng) : null
          }
        }
      };

      if (isEdit) {
        await eventsAPI.update(id, payload);
        toast.success('Event updated!');
      } else {
        await eventsAPI.create(payload);
        toast.success('Event created!');
      }
      navigate('/admin/events');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><Spinner /></AdminLayout>;

  const inputClass = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider";

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/admin/events')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {isEdit ? 'Edit Event' : 'Create New Event'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isEdit ? 'Update event details' : 'Fill in the details below'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Basic Info ───────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Basic Information</h2>

            <div>
              <label className={labelClass}>Event Title *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="TechSummit 2025..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Short Description</label>
              <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="One-line summary" className={inputClass} maxLength={300} />
            </div>
            <div>
              <label className={labelClass}>Full Description *</label>
              <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Tell attendees about this event..." className={`${inputClass} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
                  {['Technology','Music','Business','Sports','Arts','Food','Health','Education','Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                  {['draft','published','cancelled','completed'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Cover Image URL</label>
              <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="https://images.unsplash.com/..." className={inputClass} />
              {form.coverImage && (
                <img src={form.coverImage} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-xl" onError={e => { e.target.style.display = 'none'; }} />
              )}
            </div>
            <div>
              <label className={labelClass}>Tags (comma separated)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="AI, Machine Learning, Startups" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Highlights (one per line)</label>
              <textarea value={form.highlights} onChange={e => set('highlights', e.target.value)} rows={3} placeholder="50+ Speakers&#10;Networking Dinner&#10;Workshops" className={`${inputClass} resize-none`} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className="w-4 h-4 rounded text-violet-600" />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">Feature this event on homepage</label>
            </div>
          </div>

          {/* ── Date & Time ──────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Date & Time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Start Date & Time *</label>
                <input required type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>End Date & Time *</label>
                <input required type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Registration Deadline</label>
                <input type="datetime-local" value={form.registrationDeadline} onChange={e => set('registrationDeadline', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* ── Location (ENHANCED) ──────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Location</h2>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="online" checked={form.location.isOnline} onChange={e => set('location.isOnline', e.target.checked)} className="w-4 h-4 rounded text-violet-600" />
              <label htmlFor="online" className="text-sm font-medium text-gray-700 dark:text-gray-300">This is an online event</label>
            </div>

            {form.location.isOnline ? (
              <div>
                <label className={labelClass}>Online Link</label>
                <input value={form.location.onlineLink} onChange={e => set('location.onlineLink', e.target.value)} placeholder="https://zoom.us/j/..." className={inputClass} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Venue Name *</label>
                    <input required value={form.location.venue} onChange={e => set('location.venue', e.target.value)} placeholder="Convention Centre" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Street Address</label>
                    <input value={form.location.address} onChange={e => set('location.address', e.target.value)} placeholder="123 Main Street" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>City *</label>
                    <input required value={form.location.city} onChange={e => set('location.city', e.target.value)} placeholder="Mumbai" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input value={form.location.state} onChange={e => set('location.state', e.target.value)} placeholder="Maharashtra" className={inputClass} />
                  </div>
                </div>

                {/* NEW: Map Link */}
                <div>
                  <label className={labelClass}>
                    Google Maps Link
                    <span className="ml-1 normal-case font-normal text-gray-400">(optional — paste a Maps URL)</span>
                  </label>
                  <input
                    value={form.location.mapLink}
                    onChange={e => set('location.mapLink', e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    If left empty, a search URL is auto-generated from the venue + city.
                  </p>
                </div>

                {/* NEW: Full Address override */}
                <div>
                  <label className={labelClass}>
                    Full Address (display)
                    <span className="ml-1 normal-case font-normal text-gray-400">(optional override)</span>
                  </label>
                  <input
                    value={form.location.fullAddress}
                    onChange={e => set('location.fullAddress', e.target.value)}
                    placeholder="Auto-generated from venue, city, state"
                    className={inputClass}
                  />
                </div>

                {/* NEW: Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Latitude
                      <span className="ml-1 normal-case font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.location.coordinates?.lat || ''}
                      onChange={e => set('location.coordinates.lat', e.target.value)}
                      placeholder="19.0760"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Longitude
                      <span className="ml-1 normal-case font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.location.coordinates?.lng || ''}
                      onChange={e => set('location.coordinates.lng', e.target.value)}
                      placeholder="72.8777"
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Ticket Types ─────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Ticket Types</h2>
              <button type="button" onClick={addTicket} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Type
              </button>
            </div>

            <div className="space-y-4">
              {form.ticketTypes.map((ticket, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket Type {i + 1}</span>
                    {form.ticketTypes.length > 1 && (
                      <button type="button" onClick={() => removeTicket(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Name *</label>
                      <input required value={ticket.name} onChange={e => updateTicket(i, 'name', e.target.value)} placeholder="General / VIP / Early Bird" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Price (₹) *</label>
                      <input required type="number" min={0} value={ticket.price} onChange={e => updateTicket(i, 'price', e.target.value)} placeholder="999" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Total Seats *</label>
                      <input required type="number" min={1} value={ticket.totalSeats} onChange={e => updateTicket(i, 'totalSeats', e.target.value)} placeholder="100" className={inputClass} />
                    </div>
                    <div className="sm:col-span-4">
                      <label className={labelClass}>Description (optional)</label>
                      <input value={ticket.description} onChange={e => updateTicket(i, 'description', e.target.value)} placeholder="Includes meals, workshops..." className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Total capacity: <strong className="text-gray-700 dark:text-gray-300">
                {form.ticketTypes.reduce((s, t) => s + Number(t.totalSeats || 0), 0)} seats
              </strong>
            </p>
          </div>

          {/* ── Actions ──────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 justify-end pb-8">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/events')}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} size="lg">
              {isEdit ? '💾 Update Event' : '🚀 Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
