import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button } from "../../components/ui";

export default function AdminCheckin() {
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const processQR = async (qrData) => {
    if (scanning) return;
    setScanning(true);
    setResult(null);
    try {
      const res = await adminAPI.checkIn(qrData);
      setResult({ success: true, ...res.data });
      toast.success(res.data.message);
    } catch (err) {
      const errData = err.response?.data;
      setResult({ success: false, message: errData?.message || err.message, data: errData?.data });
      toast.error(errData?.message || 'Check-in failed');
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    // Try to parse as JSON first, otherwise treat as registrationId
    let qrData = manualInput.trim();
    try {
      JSON.parse(qrData); // if valid JSON, use as-is
    } catch {
      // If not JSON, wrap as minimal QR data
      qrData = JSON.stringify({ registrationId: qrData });
    }
    await processQR(qrData);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      scanFrame();
    } catch (err) {
      toast.error('Camera access denied. Please use manual entry.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // jsQR scan would go here — for now we rely on manual input
    }
    if (streamRef.current) requestAnimationFrame(scanFrame);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Check-In Scanner</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Scan attendee QR codes to check them in</p>
        </div>

        {/* Camera / Scanner */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Camera Scanner</h2>
            <Button
              variant={cameraActive ? 'danger' : 'primary'}
              size="sm"
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? '⏹ Stop Camera' : '📷 Start Camera'}
            </Button>
          </div>

          <div className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 ${cameraActive ? 'aspect-video' : 'aspect-video flex items-center justify-center'}`}>
            {cameraActive ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-violet-400 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-violet-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-violet-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-violet-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-violet-500 rounded-br-xl" />
                    <motion.div
                      animate={{ top: ['10%', '85%', '10%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-2 right-2 h-0.5 bg-violet-500 rounded-full shadow-lg shadow-violet-500/50"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 dark:text-gray-600">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-sm font-medium">Click "Start Camera" to scan QR codes</p>
                <p className="text-xs mt-1">Or use manual entry below</p>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Manual Entry</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter a booking ID (e.g. REG-XXXXXXXX) or paste raw QR JSON data</p>
          <form onSubmit={handleManualSubmit} className="flex gap-3">
            <input
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="REG-ABC12345 or paste QR JSON data"
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
            />
            <Button type="submit" variant="primary" loading={scanning}>
              Check In
            </Button>
          </form>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`rounded-2xl border p-6 ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : result.data?.alreadyCheckedIn
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">
                  {result.success ? '✅' : result.data?.alreadyCheckedIn ? '⚠️' : '❌'}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-lg mb-2 ${
                    result.success ? 'text-green-800 dark:text-green-200'
                    : result.data?.alreadyCheckedIn ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result.message}
                  </p>
                  {result.data && !result.data.alreadyCheckedIn && (
                    <div className="space-y-1 text-sm">
                      {result.data.attendeeName && <p className="text-gray-700 dark:text-gray-300"><strong>Attendee:</strong> {result.data.attendeeName}</p>}
                      {result.data.event && <p className="text-gray-700 dark:text-gray-300"><strong>Event:</strong> {result.data.event}</p>}
                      {result.data.ticketType && <p className="text-gray-700 dark:text-gray-300"><strong>Ticket:</strong> {result.data.ticketType}</p>}
                      {result.data.checkedInAt && <p className="text-gray-700 dark:text-gray-300"><strong>Time:</strong> {new Date(result.data.checkedInAt).toLocaleString()}</p>}
                    </div>
                  )}
                  {result.data?.alreadyCheckedIn && result.data?.checkedInAt && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Previously checked in at {new Date(result.data.checkedInAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setResult(null); setManualInput(''); }}
                className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:underline"
              >
                Clear & scan another →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">How to use</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2"><span className="text-violet-500 shrink-0">1.</span> Ask the attendee to show their QR code ticket</li>
            <li className="flex items-start gap-2"><span className="text-violet-500 shrink-0">2.</span> Use camera scanner OR enter booking ID manually</li>
            <li className="flex items-start gap-2"><span className="text-violet-500 shrink-0">3.</span> Green = valid entry. Yellow = already checked in. Red = invalid ticket</li>
            <li className="flex items-start gap-2"><span className="text-violet-500 shrink-0">4.</span> Each QR code can only be used once</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
