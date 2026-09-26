import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AttendanceRecord, Person } from '../types';
import {
  getAllPersons,
  getAllEncodings,
  markPersonAttendance,
  getAllAttendance,
} from '../db/store';
import {
  extract128dEmbedding,
  matchFaceEmbedding,
  MatchResult,
} from '../utils/faceMatching';
import { playAttendanceChime, speakGreeting } from '../utils/audio';

interface LiveScannerViewProps {
  onAttendanceUpdated: () => void;
}

export const LiveScannerView: React.FC<LiveScannerViewProps> = ({ onAttendanceUpdated }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Current recognition state
  const [currentMatch, setCurrentMatch] = useState<MatchResult | null>(null);
  const [scanStatus, setScanStatus] = useState<
    'idle' | 'scanning' | 'recognized' | 'already_marked' | 'unknown'
  >('idle');
  const [statusText, setStatusText] = useState('Camera standby. Press Start Scanner to begin.');
  const [recentPunches, setRecentPunches] = useState<AttendanceRecord[]>([]);

  // FPS and recognition counter
  const [fps, setFps] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const cooldownRef = useRef<Record<number, number>>({});

  // Fetch today's punches on load
  const loadTodayPunches = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const logs = getAllAttendance().filter((l) => l.date === today);
    setRecentPunches(logs);
  }, []);

  useEffect(() => {
    loadTodayPunches();
  }, [loadTodayPunches]);

  const persons = getAllPersons();
  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Start Webcam
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
        setIsScanning(true);
        setScanStatus('scanning');
        setStatusText('Searching for registered faces in camera frame...');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Permission denied';
      setCameraError(`Camera error: ${msg}. You can test the recognition pipeline using the simulator buttons below.`);
      setIsScanning(false);
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    setIsScanning(false);
    setScanStatus('idle');
    setStatusText('Scanner paused.');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // Handle Match Logic & Attendance Logging
  const handleRecognizedPerson = useCallback((person: Person, confidence: number) => {
    const now = Date.now();
    // Cooldown 6 seconds for same person in the current scanning session
    if (cooldownRef.current[person.id] && now - cooldownRef.current[person.id] < 6000) {
      return;
    }
    cooldownRef.current[person.id] = now;

    // Check & Mark attendance in SQLite store
    const result = markPersonAttendance(person.id);

    if (result.status === 'marked') {
      setScanStatus('recognized');
      setStatusText(`Verified: Attendance recorded for ${person.name} (${person.rollNumber}) at ${result.time}`);
      if (soundEnabled) {
        playAttendanceChime('success');
        speakGreeting(person.name, false);
      }
      loadTodayPunches();
      onAttendanceUpdated();
    } else if (result.status === 'already_marked') {
      setScanStatus('already_marked');
      setStatusText(`Notice: ${person.name} is already marked present today (${result.time})`);
      if (soundEnabled) {
        playAttendanceChime('warning');
        speakGreeting(person.name, true);
      }
    }
  }, [soundEnabled, loadTodayPunches, onAttendanceUpdated]);

  const handleUnknownPerson = useCallback(() => {
    const now = Date.now();
    if (cooldownRef.current[-1] && now - cooldownRef.current[-1] < 4000) {
      return;
    }
    cooldownRef.current[-1] = now;

    setScanStatus('unknown');
    setStatusText('Alert: Unknown Person. Unregistered face detected.');
    if (soundEnabled) {
      playAttendanceChime('error');
    }
  }, [soundEnabled]);

  // Main Recognition Loop
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate simulated FPS
    const now = Date.now();
    if (lastProcessedTimeRef.current > 0) {
      const delta = (now - lastProcessedTimeRef.current) / 1000;
      setFps(Math.round(1 / delta));
    }
    lastProcessedTimeRef.current = now;

    const allP = getAllPersons();
    const encodings = getAllEncodings();

    if (!allP.length || !encodings.length) {
      setStatusText('No persons registered yet. Please enrol students first.');
      return;
    }

    // Extract live 128-d embedding from video feed
    const liveVector = extract128dEmbedding(canvas);
    const match = matchFaceEmbedding(liveVector, allP, encodings, 0.62);
    setCurrentMatch(match);

    if (match.matched && match.person) {
      handleRecognizedPerson(match.person, match.confidence);
    } else {
      // If low confidence or no face match
      if (match.confidence > 25 && match.distance > 0.62) {
        handleUnknownPerson();
      } else {
        setScanStatus('scanning');
        setStatusText('Searching camera frame for registered biometric identities...');
      }
    }
  }, [handleRecognizedPerson, handleUnknownPerson]);

  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = setInterval(processFrame, 900);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isScanning, processFrame]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Quick Test Simulation Trigger for specific person
  const simulatePersonDetection = (person: Person | null) => {
    if (person) {
      setCurrentMatch({
        matched: true,
        person,
        confidence: 97.4,
        distance: 0.16,
      });
      handleRecognizedPerson(person, 97.4);
    } else {
      setCurrentMatch({
        matched: false,
        person: null,
        confidence: 22.0,
        distance: 0.88,
      });
      handleUnknownPerson();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isScanning
                ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse'
                : 'bg-slate-300'
            }`}
          />
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-tight">
              Biometric Optical Recognition
            </span>
            <span className="text-xs text-slate-500">
              {isScanning ? `Camera Active · Target FPS: ${fps || 15} · 128-d Vector Distance` : 'Scanner Standby'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime & Voice Active' : 'Muted'}</span>
          </button>

          {isScanning ? (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Scanner</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Start Scanner</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera Feed & Overlay (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Real-Time Optical Camera Stream</span>
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-md font-bold uppercase ${
                scanStatus === 'recognized'
                  ? 'bg-emerald-100 text-emerald-800'
                  : scanStatus === 'already_marked'
                  ? 'bg-amber-100 text-amber-800'
                  : scanStatus === 'unknown'
                  ? 'bg-red-100 text-red-800'
                  : isScanning
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {scanStatus === 'recognized'
                ? 'Matched'
                : scanStatus === 'already_marked'
                ? 'Already Logged'
                : scanStatus === 'unknown'
                ? 'Unknown Person'
                : scanStatus === 'scanning'
                ? 'Scanning...'
                : 'Standby'}
            </span>
          </div>

          {/* Camera Viewport */}
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${
                !isScanning ? 'opacity-25' : ''
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 p-6 text-center bg-slate-950/70">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-lg">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="font-bold text-white text-base">Camera feed is on standby</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Click 'Start Scanner' to begin real-time face matching via your webcam, or use test profiles below.
                </p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Neural Scanning Grid & Target Box Overlay */}
            {isScanning && (
              <>
                <div className="absolute inset-10 border-2 border-blue-400/70 rounded-2xl pointer-events-none shadow-[0_0_25px_rgba(59,130,246,0.3)]">
                  {/* Laser Scanning Sweep Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-bounce opacity-80" />
                  
                  {/* Reticle corner markers */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-300" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-300" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-300" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-300" />
                </div>

                {/* Status HUD Pill */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-700/80 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
                    <span className="truncate font-medium">{statusText}</span>
                  </div>
                  {currentMatch?.confidence ? (
                    <span className="shrink-0 font-mono tabular-nums text-emerald-400 font-bold ml-2">
                      {currentMatch.confidence}% Match
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* Current Recognized Person Summary Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              scanStatus === 'recognized'
                ? 'bg-emerald-50/80 border-emerald-200'
                : scanStatus === 'already_marked'
                ? 'bg-amber-50/80 border-amber-200'
                : scanStatus === 'unknown'
                ? 'bg-red-50/80 border-red-200'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            {currentMatch?.matched && currentMatch.person ? (
              <div className="flex items-center gap-4">
                <img
                  src={currentMatch.person.photoUrl}
                  alt={currentMatch.person.name}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-base truncate">
                      {currentMatch.person.name}
                    </h4>
                    <span className="font-mono tabular-nums text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                      {currentMatch.person.rollNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {currentMatch.person.department} · {currentMatch.person.email}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Confidence: {currentMatch.confidence}%
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      Distance: {currentMatch.distance}
                    </span>
                  </div>
                </div>
              </div>
            ) : scanStatus === 'unknown' ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Unknown Person Detected</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Facial embedding does not match any enrolled student or employee in the database.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-10 h-10 rounded-lg bg-slate-200/70 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Waiting for face in camera frame...</h4>
                  <p className="text-[11px] text-slate-500">
                    Stand in front of webcam or click any test subject below to simulate instant verification.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Test Simulator Buttons */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Simulate Recognition (Test Mode):</span>
              </span>
              <span className="text-[11px] text-slate-400">Test biometric matching & duplicate rules</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {persons.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => simulatePersonDetection(p)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <img
                    src={p.photoUrl}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                  />
                  <span className="font-semibold text-slate-800">{p.name.split(' ')[0]}</span>
                </button>
              ))}
              <button
                onClick={() => simulatePersonDetection(null)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
              >
                + Unknown Stranger
              </button>
            </div>
          </div>
        </div>

        {/* Right: Today's Punch Stream (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Today's Verified Punches</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Duplicate check-ins on the same calendar day are blocked
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono tabular-nums">
              {recentPunches.length} Checked In
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
            {recentPunches.length > 0 ? (
              recentPunches.map((item) => {
                const personObj = personMap.get(item.personId);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {personObj?.photoUrl ? (
                        <img
                          src={personObj.photoUrl}
                          alt={item.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 truncate">{item.name}</h5>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.rollNumber} · {item.department}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono tabular-nums font-bold text-slate-700 block">
                        {item.time}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Present
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">No punches logged yet today</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Faces recognized by the camera will automatically record here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
