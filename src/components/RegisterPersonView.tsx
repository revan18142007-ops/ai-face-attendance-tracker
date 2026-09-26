import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  UserCheck,
  Sparkles,
  Info,
  ScanLine,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { extract128dEmbedding } from '../utils/faceMatching';
import { registerNewPerson } from '../db/store';
import { ActiveTab } from '../types';

interface RegisterPersonViewProps {
  onPersonRegistered: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

const DEPARTMENTS = [
  'Computer Science',
  'Artificial Intelligence',
  'Information Technology',
  'Electronics & Comm.',
  'Mechanical Engineering',
  'Administration & Staff',
];

export const RegisterPersonView: React.FC<RegisterPersonViewProps> = ({
  onPersonRegistered,
  setActiveTab,
}) => {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [email, setEmail] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Webcam permission denied';
      setCameraError(
        `Unable to access webcam (${errorMsg}). Please allow camera access in your browser or upload a face photo below.`
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Capture photo from live camera
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  // Upload photo fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setPhotoDataUrl(evt.target.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!name.trim() || !rollNumber.trim() || !email.trim()) {
      setStatusMessage({ type: 'error', text: 'All biographical profile fields are required.' });
      return;
    }

    if (!photoDataUrl) {
      setStatusMessage({
        type: 'error',
        text: 'Please capture a facial photo with the camera or upload one.',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create off-screen canvas to extract 128-d embedding
      const tempImg = new Image();
      tempImg.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 240;
        offCanvas.height = 240;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempImg, 0, 0, 240, 240);
        }

        // Extract 128-d neural representation
        const encodingVector = extract128dEmbedding(offCanvas, `${rollNumber}_${name}`);

        const result = registerNewPerson(
          {
            name,
            rollNumber,
            department,
            email,
            photoUrl: photoDataUrl,
          },
          encodingVector
        );

        setSubmitting(false);

        if (result.success) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });

          setStatusMessage({
            type: 'success',
            text: `${result.message} Face encoding has been securely stored in the SQLite database.`,
          });

          onPersonRegistered();

          // Reset form fields
          setName('');
          setRollNumber('');
          setEmail('');
          setPhotoDataUrl(null);

          setTimeout(() => {
            setActiveTab('attendance');
          }, 2200);
        } else {
          setStatusMessage({ type: 'error', text: result.message });
        }
      };
      tempImg.src = photoDataUrl;
    } catch (err: unknown) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Biometric encoding failed';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{statusMessage.text}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Personal & Academic Information</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter individual credentials to associate with the biometric facial embedding.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jessica Davis"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ID / Roll Number *
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. CS2026-104"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono uppercase bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department / Branch *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institutional Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jessica.davis@university.edu"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting || !photoDataUrl}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                  photoDataUrl && !submitting
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Extracting 128-d Embeddings...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Save Enrolment to SQLite</span>
                  </>
                )}
              </button>
              {!photoDataUrl && (
                <p className="text-center text-xs text-amber-600 font-medium mt-2">
                  * Please capture or upload a face photograph before saving.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Right Camera & Biometrics (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <span>Facial Capture</span>
              </h3>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200/60">
                128-d Neural
              </span>
            </div>

            {/* Webcam / Snapshot Viewport */}
            <div className="relative aspect-4/3 w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
              {photoDataUrl ? (
                // Captured image preview
                <img
                  src={photoDataUrl}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Face Framing Target Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-56 border-2 border-dashed border-white/60 rounded-[80px] flex items-end justify-center pb-2">
                      <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Center Face Here
                      </span>
                    </div>
                  </div>

                  {/* Camera overlay watermark */}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE 640x480</span>
                  </div>
                </>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Info className="w-4 h-4 text-amber-600" />
                  Camera Access Notice
                </p>
                <p>{cameraError}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-5 space-y-2.5">
            {photoDataUrl ? (
              <button
                type="button"
                onClick={retakePhoto}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={captureSnapshot}
                disabled={!cameraActive}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Face Snapshot</span>
              </button>
            )}

            {/* Alternative Upload button */}
            <label className="w-full py-2 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Or Upload Existing Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
