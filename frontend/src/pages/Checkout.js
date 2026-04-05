// =============================================
// Checkout Page — Razorpay Integration
// =============================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { registrationsAPI, paymentsAPI } from '../utils/api';
import { Button, Spinner } from '../components/ui';
import { format } from 'date-fns';

// Load Razorpay script dynamically
const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function Checkout() {
  const { registrationId } = useParams();
  const [searchParams] = useSearchParams();
  const isFree = searchParams.get('free') === 'true';
  const navigate = useNavigate();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    registrationsAPI.getById(registrationId)
      .then(res => setRegistration(res.data.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [registrationId, navigate]);

  const handleFreeConfirm = async () => {
    setProcessing(true);
    try {
      await paymentsAPI.confirmFree({ registrationId: registration._id });
      toast.success('Registration confirmed!');
      navigate(`/payment-success?regId=${registration.registrationId}`);
    } catch (err) {
      toast.error(err.message || 'Confirmation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) return toast.error('Payment gateway failed to load. Check your connection.');

      const orderRes = await paymentsAPI.createRazorpayOrder({ registrationId: registration._id });
      const { orderId, amount, currency, keyId, eventName, userName, userEmail } = orderRes.data.data;

      const options = {
        key: keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'EventFlow',
        description: eventName,
        order_id: orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await paymentsAPI.verifyRazorpay({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              registrationId: registration.registrationId,
            });
            toast.success('Payment successful! 🎉');
            navigate(`/payment-success?regId=${registration.registrationId}`);
          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Payment initialization failed');
      setProcessing(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (!registration) return null;

  const event = registration.event;
  const startDate = event?.startDate ? new Date(event.startDate) : null;

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{isFree ? '🎟️' : '💳'}</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {isFree ? 'Confirm Your Ticket' : 'Complete Payment'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Review your order before {isFree ? 'confirming' : 'paying'}</p>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-4">Order Summary</h2>

              <div className="flex gap-4">
                {event?.coverImage && (
                  <img src={event.coverImage} alt={event.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white leading-snug">{event?.title}</p>
                  {startDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      📅 {format(startDate, 'EEE, MMM d, yyyy · h:mm a')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    📍 {event?.location?.isOnline ? 'Online' : `${event?.location?.venue}, ${event?.location?.city}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {[
                { label: 'Ticket Type', value: registration.ticketType?.name },
                { label: 'Attendee', value: registration.attendeeInfo?.name },
                { label: 'Email', value: registration.attendeeInfo?.email },
                { label: 'Quantity', value: `${registration.quantity} ticket${registration.quantity > 1 ? 's' : ''}` },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{row.value}</span>
                </div>
              ))}

              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-black text-violet-600 dark:text-violet-400">
                  {registration.totalAmount === 0 ? 'FREE' : `₹${registration.totalAmount.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-6 justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {isFree ? 'No payment required. Confirm to receive your ticket.' : 'Payments are 100% secure and encrypted via Razorpay.'}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isFree ? (
              <Button variant="primary" size="lg" className="w-full" onClick={handleFreeConfirm} loading={processing}>
                🎟️ Confirm Free Registration
              </Button>
            ) : (
              <Button variant="primary" size="lg" className="w-full" onClick={handleRazorpayPayment} loading={processing}>
                💳 Pay ₹{registration.totalAmount.toLocaleString()} with Razorpay
              </Button>
            )}
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              onClick={() => navigate(-1)}
              disabled={processing}
            >
              ← Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
