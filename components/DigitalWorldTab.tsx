import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MediaStreamItem, 
  EducationCourse, 
  EducationLesson, 
  BroadcastTelemetry, 
  UserProfile, 
  ReadingProgress,
  CreatorStoreProfile,
  ArtMediaType
} from '../types';
import { 
  ART_MEDIA_STREAMS, 
  EDUCATION_COURSES, 
  INITIAL_BROADCAST_TELEMETRY 
} from '../data/artMediaData';
import { CourseCertificateModal } from './CourseCertificateModal';
import {
  formatCertificateSerial,
  getCertificateForEducationCourse,
} from '../data/certificatesData';
import {
  CREATOR_FREE_SALES_THRESHOLD,
  getStoreForUserAndPlatform,
} from '../utils/creatorStoreSystem';
import { CreatorModalTab, CreatorProfileStoreModal } from './CreatorProfileStoreModal';
import { CreatorStorefrontBar } from './CreatorStorefrontBar';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Music, 
  Tv, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Radio, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Bell, 
  Search, 
  Sliders, 
  FileText, 
  ArrowUpRight, 
  Shield, 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  X, 
  Award, 
  Grid, 
  Activity, 
  Eye, 
  ExternalLink,
  Upload
} from 'lucide-react';

interface DigitalWorldTabProps {
  user: UserProfile;
  readingProgress: Record<string, ReadingProgress>;
  onUpdateProgress: (guideId: string, chapterIdx: number, totalChapters: number, notes?: string) => void;
  onOpenReminders: (targetTitle?: string) => void;
  onOpenPaywall: () => void;
}

export const DigitalWorldTab: React.FC<DigitalWorldTabProps> = ({
  user,
  readingProgress,
  onUpdateProgress,
  onOpenReminders,
  onOpenPaywall,
}) => {
  // Navigation Sub-tab
  const [subTab, setSubTab] = useState<'music' | 'visuals' | 'mural' | 'academy' | 'control_room'>('music');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseDomain, setSelectedCourseDomain] = useState<string>('all');

  // Creator Storefront, Payment Account, Service Agreement & Uploaded Art Streams
  const [creatorStore, setCreatorStore] = useState<CreatorStoreProfile | null>(() =>
    getStoreForUserAndPlatform(user.id, 'digital_art')
  );
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeModalTab, setStoreModalTab] = useState<CreatorModalTab>('profile');
  const [myStoreFilterActive, setMyStoreFilterActive] = useState(false);

  const [customStreams, setCustomStreams] = useState<MediaStreamItem[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_digital_world_custom_streams');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_digital_world_custom_streams', JSON.stringify(customStreams));
    } catch {
      // ignore storage restrictions
    }
  }, [customStreams]);

  useEffect(() => {
    const syncStore = () => setCreatorStore(getStoreForUserAndPlatform(user.id, 'digital_art'));
    syncStore();
    window.addEventListener('ttg-creator-store-updated', syncStore);
    return () => window.removeEventListener('ttg-creator-store-updated', syncStore);
  }, [user.id]);

  const allArtStreams = useMemo(
    () => [...customStreams, ...ART_MEDIA_STREAMS],
    [customStreams]
  );

  // Upload Art Stream Modal state
  const [isUploadStreamModalOpen, setIsUploadStreamModalOpen] = useState(false);
  const [uploadStreamType, setUploadStreamType] = useState<ArtMediaType>('music');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState(creatorStore?.artistName || user.name || '');
  const [uploadStyle, setUploadStyle] = useState('Ambient Spatial DSP');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFreqHz, setUploadFreqHz] = useState('432');
  const [uploadDimensions, setUploadDimensions] = useState('12m × 6m Architectural Wall');

  const myStoreStreamsCount = useMemo(() => {
    if (!creatorStore) return 0;
    const targetName = creatorStore.artistName.trim().toLowerCase();
    return customStreams.filter(
      (s) => s.artist.trim().toLowerCase() === targetName || s.artist.trim().toLowerCase() === (user.name || '').trim().toLowerCase()
    ).length;
  }, [customStreams, creatorStore, user.name]);

  const handleOpenStoreModal = (tab: CreatorModalTab) => {
    setStoreModalTab(tab);
    setIsStoreModalOpen(true);
  };

  const handleOpenUploadStreamModal = () => {
    if (subTab === 'visuals' || subTab === 'mural' || subTab === 'music') {
      setUploadStreamType(subTab);
    }
    if (creatorStore?.artistName) {
      setUploadArtist(creatorStore.artistName);
    }
    setIsUploadStreamModalOpen(true);
  };

  const handleSubmitArtStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadArtist.trim()) return;

    const newItem: MediaStreamItem = {
      id: `stream_custom_${Date.now()}`,
      title: uploadTitle.trim(),
      artist: uploadArtist.trim(),
      mediaType: uploadStreamType,
      genreOrStyle: uploadStyle.trim() || 'Contemporary Digital Art',
      durationOrStreamStatus: uploadStreamType === 'music' ? 'Creator Stream · 24-bit' : 'Creator Edition',
      loudnessLUFS: uploadStreamType === 'music' ? -14.0 : undefined,
      sampleRate: uploadStreamType === 'music' ? '48 kHz / 24-bit' : undefined,
      resolution: uploadStreamType === 'music' ? undefined : '4K Master Digital',
      fps: uploadStreamType === 'visuals' ? 60 : undefined,
      location: uploadStreamType === 'mural' ? 'TTG Creator Storefront Gallery' : undefined,
      dimensions: uploadStreamType === 'mural' ? uploadDimensions.trim() || '12m × 6m' : undefined,
      description: uploadDesc.trim() || 'Original multimedia creation published via TTG Digital World Storefront.',
      curatorNotes: 'Published by verified creator storefront.',
      tags: ['Creator Store', uploadStreamType.toUpperCase()],
      audioFrequencyHz: uploadStreamType === 'music' ? (parseInt(uploadFreqHz, 10) || 432) : undefined,
    };

    setCustomStreams((prev) => [newItem, ...prev]);
    if (uploadStreamType === 'music') setActiveMusicStream(newItem);
    else if (uploadStreamType === 'visuals') setActiveVisualStream(newItem);
    else setActiveMuralStream(newItem);

    setSubTab(uploadStreamType);
    setIsUploadStreamModalOpen(false);
    setUploadTitle('');
    setUploadDesc('');
  };

  // Active Media Streams
  const [activeMusicStream, setActiveMusicStream] = useState<MediaStreamItem>(ART_MEDIA_STREAMS[0]);
  const [activeVisualStream, setActiveVisualStream] = useState<MediaStreamItem>(ART_MEDIA_STREAMS[3]);
  const [activeMuralStream, setActiveMuralStream] = useState<MediaStreamItem>(ART_MEDIA_STREAMS[6]);

  // Audio Player State & Web Audio Synthesizer
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [binauralPreset, setBinauralPreset] = useState<'alpha' | 'theta' | 'off'>('alpha');
  const [isDuckingActive, setIsDuckingActive] = useState(false);
  const [filterCutoff, setFilterCutoff] = useState(2500);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const canvasAudioRef = useRef<HTMLCanvasElement | null>(null);

  // Visuals Canvas Animation State
  const canvasVisualRef = useRef<HTMLCanvasElement | null>(null);
  const [visualSpeed, setVisualSpeed] = useState(1.0);
  const [visualColorMode, setVisualColorMode] = useState<'cyan' | 'prismatic' | 'amber' | 'emerald'>('cyan');
  const [selectedAbrQuality, setSelectedAbrQuality] = useState<'4K Master' | '1440p High' | '1080p Standard' | '720p Mobile'>('4K Master');

  // Mural Zoom & Canvas State
  const canvasMuralRef = useRef<HTMLCanvasElement | null>(null);
  const [muralZoom, setMuralZoom] = useState(1.0);
  const [showMuralGrid, setShowMuralGrid] = useState(true);
  const [showPigmentChemistry, setShowPigmentChemistry] = useState(false);
  const [muralPan, setMuralPan] = useState({ x: 0, y: 0 });

  // Broadcast Telemetry & Control Room State
  const [broadcastTelemetry, setBroadcastTelemetry] = useState<BroadcastTelemetry>(INITIAL_BROADCAST_TELEMETRY);
  const [activeSwitcherInput, setActiveSwitcherInput] = useState<number>(1);
  const [isEmergencyFailoverTriggered, setIsEmergencyFailoverTriggered] = useState(false);
  const [isEngineeringManualOpen, setIsEngineeringManualOpen] = useState(false);

  // Education Academy Active Course & Modal
  const [activeCourse, setActiveCourse] = useState<EducationCourse | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [lessonNote, setLessonNote] = useState('');
  const [isLessonNoteSaved, setIsLessonNoteSaved] = useState(false);
  const [certificateCourse, setCertificateCourse] = useState<EducationCourse | null>(null);

  // Sync Audio Synthesis
  useEffect(() => {
    if (!isPlayingAudio) {
      if (osc1Ref.current) {
        try { osc1Ref.current.stop(); } catch (e) { /* ignore */ }
        osc1Ref.current = null;
      }
      if (osc2Ref.current) {
        try { osc2Ref.current.stop(); } catch (e) { /* ignore */ }
        osc2Ref.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Base Frequency from active track
      const baseFreq = activeMusicStream.audioFrequencyHz || 432;
      const beatOffset = binauralPreset === 'alpha' ? 10 : binauralPreset === 'theta' ? 4 : 0;

      // Filter Node
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterCutoff, ctx.currentTime);
      filterNodeRef.current = filter;

      // Master Gain Node
      const gain = ctx.createGain();
      const currentVol = isDuckingActive ? audioVolume * 0.45 : audioVolume;
      gain.gain.setValueAtTime(currentVol * 0.25, ctx.currentTime);
      gainNodeRef.current = gain;

      // Left Channel Oscillator
      const oscLeft = ctx.createOscillator();
      oscLeft.type = 'sine';
      oscLeft.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      // Right Channel Oscillator with binaural offset
      const oscRight = ctx.createOscillator();
      oscRight.type = 'sine';
      oscRight.frequency.setValueAtTime(baseFreq + beatOffset, ctx.currentTime);

      // Stereo Panners
      const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      if (pannerLeft && pannerRight) {
        pannerLeft.pan.setValueAtTime(-0.8, ctx.currentTime);
        pannerRight.pan.setValueAtTime(0.8, ctx.currentTime);
        oscLeft.connect(pannerLeft);
        oscRight.connect(pannerRight);
        pannerLeft.connect(filter);
        pannerRight.connect(filter);
      } else {
        oscLeft.connect(filter);
        oscRight.connect(filter);
      }

      filter.connect(gain);
      gain.connect(ctx.destination);

      oscLeft.start();
      oscRight.start();

      osc1Ref.current = oscLeft;
      osc2Ref.current = oscRight;
    } catch (e) {
      console.error('Web Audio init error:', e);
    }

    return () => {
      if (osc1Ref.current) {
        try { osc1Ref.current.stop(); } catch (e) { /* ignore */ }
        osc1Ref.current = null;
      }
      if (osc2Ref.current) {
        try { osc2Ref.current.stop(); } catch (e) { /* ignore */ }
        osc2Ref.current = null;
      }
    };
  }, [isPlayingAudio, activeMusicStream, binauralPreset]);

  // Adjust volume / ducking dynamically
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const vol = isDuckingActive ? audioVolume * 0.45 : audioVolume;
      gainNodeRef.current.gain.setTargetAtTime(vol * 0.25, audioCtxRef.current.currentTime, 0.05);
    }
  }, [audioVolume, isDuckingActive]);

  // Adjust filter cutoff dynamically
  useEffect(() => {
    if (filterNodeRef.current && audioCtxRef.current) {
      filterNodeRef.current.frequency.setTargetAtTime(filterCutoff, audioCtxRef.current.currentTime, 0.05);
    }
  }, [filterCutoff]);

  // Animated Audio Visualizer Canvas
  useEffect(() => {
    const canvas = canvasAudioRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background grid line
      ctx.strokeStyle = 'rgba(214, 211, 209, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const bars = 48;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        const freqAmp = isPlayingAudio 
          ? Math.sin(frame * 0.08 + i * 0.25) * 0.5 + Math.cos(frame * 0.04 + i * 0.15) * 0.5
          : Math.sin(i * 0.3) * 0.1;
        const normalizedAmp = Math.max(0.08, Math.abs(freqAmp) * (isPlayingAudio ? audioVolume : 0.2));
        const barHeight = normalizedAmp * (height * 0.85);

        // Gradient based on LUFS safe range
        const isSafeLoudness = activeMusicStream.loudnessLUFS && activeMusicStream.loudnessLUFS <= -14.0;
        ctx.fillStyle = isSafeLoudness ? '#10B981' : '#F59E0B';
        ctx.fillRect(x + 1, height / 2 - barHeight / 2, barWidth - 2, barHeight);
      }

      // Draw subtle wave line across
      ctx.strokeStyle = isPlayingAudio ? '#10B981' : '#A8A29E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < width; x += 4) {
        const wave = isPlayingAudio 
          ? Math.sin(x * 0.03 + frame * 0.05) * 12 * audioVolume 
          : 0;
        const y = height / 2 + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlayingAudio, audioVolume, activeMusicStream]);

  // Animated Generative Visuals Canvas (Simulated 4K GLSL shader stream)
  useEffect(() => {
    const canvas = canvasVisualRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.02 * visualSpeed;
      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const rings = 20;

      // Palette selection
      let strokeColor1 = '#38BDF8';
      let strokeColor2 = '#818CF8';
      if (visualColorMode === 'prismatic') {
        strokeColor1 = '#EC4899';
        strokeColor2 = '#3B82F6';
      } else if (visualColorMode === 'amber') {
        strokeColor1 = '#F59E0B';
        strokeColor2 = '#EF4444';
      } else if (visualColorMode === 'emerald') {
        strokeColor1 = '#10B981';
        strokeColor2 = '#065F46';
      }

      for (let r = 1; r <= rings; r++) {
        ctx.beginPath();
        const baseRadius = (r / rings) * Math.min(cx, cy) * 0.95;
        const points = 72;

        for (let i = 0; i <= points; i++) {
          const theta = (i / points) * Math.PI * 2;
          const deform = Math.sin(theta * 6 + t + r * 0.4) * (14 * (r / rings));
          const rad = baseRadius + deform;
          const x = cx + Math.cos(theta) * rad;
          const y = cy + Math.sin(theta) * rad;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.strokeStyle = r % 2 === 0 ? strokeColor1 : strokeColor2;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.35 + (r / rings) * 0.5;
        ctx.stroke();
      }

      // Center Core
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = strokeColor1;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [visualSpeed, visualColorMode]);

  // Interactive Mural Canvas (High-res simulated architectural fresco)
  useEffect(() => {
    const canvas = canvasMuralRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // Apply zoom and pan
    ctx.translate(w / 2 + muralPan.x, h / 2 + muralPan.y);
    ctx.scale(muralZoom, muralZoom);
    ctx.translate(-w / 2, -h / 2);

    // Architectural textured wall background (Hydraulic Lime Plaster simulation)
    const wallGrad = ctx.createLinearGradient(0, 0, w, h);
    wallGrad.addColorStop(0, '#78350f');
    wallGrad.addColorStop(0.3, '#b45309');
    wallGrad.addColorStop(0.7, '#d97706');
    wallGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(20, 20, w - 40, h - 40);

    // Fresco monumental geometric figures & sweeping architectural horizons
    ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.45, 90, 0, Math.PI * 2);
    ctx.fill();

    // Maritime Waves & Modernist Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, h * 0.7);
    ctx.bezierCurveTo(w * 0.25, h * 0.55, w * 0.45, h * 0.85, w * 0.7, h * 0.65);
    ctx.bezierCurveTo(w * 0.85, h * 0.5, w * 0.95, h * 0.75, w - 40, h * 0.7);
    ctx.stroke();

    // Mineral Pigment Textures
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.moveTo(w * 0.55, h * 0.2);
    ctx.lineTo(w * 0.85, h * 0.6);
    ctx.lineTo(w * 0.4, h * 0.7);
    ctx.closePath();
    ctx.fill();

    // Coordinate Grid Overlay
    if (showMuralGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 20; x <= w - 20; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, h - 20);
        ctx.stroke();
      }
      for (let y = 20; y <= h - 20; y += step) {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(w - 20, y);
        ctx.stroke();
      }
    }

    // Pigment Chemistry Hotspots
    if (showPigmentChemistry) {
      const hotspots = [
        { x: w * 0.35, y: h * 0.45, label: 'Potassium Silicate (K₂SiO₃) · 98.4% Crystalline Bond' },
        { x: w * 0.6, y: h * 0.55, label: 'Natural Iron Oxide (Fe₂O₃) · UV-Inert Grade 1' },
        { x: w * 0.75, y: h * 0.3, label: 'Strontium Aluminate · Photoluminescent 12hr' },
      ];

      hotspots.forEach(pt => {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(pt.x + 10, pt.y - 12, 220, 24);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '9px monospace';
        ctx.fillText(pt.label, pt.x + 15, pt.y + 4);
      });
    }

    ctx.restore();
  }, [muralZoom, showMuralGrid, showPigmentChemistry, muralPan]);

  // Handle open lesson reader
  const handleOpenCourse = (course: EducationCourse) => {
    setActiveCourse(course);
    setActiveLessonIdx(0);
    const progress = readingProgress[course.id];
    setLessonNote(progress?.notes || '');
    setIsLessonNoteSaved(false);
  };

  const handleSaveLessonNote = () => {
    if (!activeCourse) return;
    onUpdateProgress(activeCourse.id, -1, activeCourse.syllabus.length, lessonNote);
    setIsLessonNoteSaved(true);
    setTimeout(() => setIsLessonNoteSaved(false), 2000);
  };

  const handleToggleLessonDone = (idx: number) => {
    if (!activeCourse) return;
    onUpdateProgress(activeCourse.id, idx, activeCourse.syllabus.length, lessonNote);
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    return EDUCATION_COURSES.filter(course => {
      if (selectedCourseDomain !== 'all') {
        if (selectedCourseDomain === 'music' && !course.platformDomain.includes('Music')) return false;
        if (selectedCourseDomain === 'visuals' && !course.platformDomain.includes('Visuals')) return false;
        if (selectedCourseDomain === 'mural' && !course.platformDomain.includes('Mural')) return false;
        if (selectedCourseDomain === 'broadcast' && !course.platformDomain.includes('Broadcast')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          course.title.toLowerCase().includes(q) ||
          course.overview.toLowerCase().includes(q) ||
          course.instructor.toLowerCase().includes(q) ||
          course.learningOutcomes.some(o => o.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedCourseDomain, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
          <span>TTG Digital World</span>
          <span aria-hidden="true">·</span>
          <span>Art Media Platforms & Broadcast Academies</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">Digital Educare Tutoring · Free Short Lessons</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 text-balance">
              Digital World of Education & Art Media
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-2xl text-sm sm:text-base">
              High-fidelity music streaming with -14 LUFS DSP, real-time 4K generative visual streams, monumental mural canvases, and structured broadcast engineering academies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% Free · No Subscription Fees</span>
            </span>
          </div>
        </div>

        {/* Platform Domain Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 p-1 bg-stone-100 dark:bg-stone-850 rounded-xl w-fit border border-stone-200 dark:border-stone-750 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('music')}
            className={`px-3.5 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all ${
              subTab === 'music'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Music Streaming & Audio Lab</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('visuals')}
            className={`px-3.5 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all ${
              subTab === 'visuals'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Tv className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Visuals & Motion Streaming</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('mural')}
            className={`px-3.5 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all ${
              subTab === 'mural'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Mural Art & Spatial Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('academy')}
            className={`px-3.5 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all ${
              subTab === 'academy'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Education Academies</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('control_room')}
            className={`px-3.5 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all ${
              subTab === 'control_room'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>TAI-ONE Broadcast Studio</span>
          </button>
        </div>
      </div>

      {/* Creator Artist Profile, Storefront, Payment Account & Service Agreement Bar for Art Media */}
      {(subTab === 'music' || subTab === 'visuals' || subTab === 'mural') && (
        <CreatorStorefrontBar
          platform="digital_art"
          user={user}
          store={creatorStore}
          onOpenStoreModal={handleOpenStoreModal}
          onUploadClick={handleOpenUploadStreamModal}
          myStoreFilterActive={myStoreFilterActive}
          onToggleMyStoreFilter={() => setMyStoreFilterActive((v) => !v)}
          myItemsCount={myStoreStreamsCount}
        />
      )}

      {/* ======================================================== */}
      {/* 1. MUSIC STREAMING & AUDIO DSP LABORATORY               */}
      {/* ======================================================== */}
      {subTab === 'music' && (
        <div className="space-y-8">
          
          {/* Active Audio Player Deck */}
          <div className="p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{activeMusicStream.durationOrStreamStatus}</span>
                  <span>·</span>
                  <span>{activeMusicStream.sampleRate}</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {activeMusicStream.title}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeMusicStream.artist} · <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{activeMusicStream.audioFrequencyHz} Hz Harmonic Tuning</span>
                </p>
              </div>

              {/* Master Play / Pause Action */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm active:scale-95"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Audio Stream</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Hi-Res Stream</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReminders(activeMusicStream.title)}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title="Schedule Daily Audio Focus Block"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live FFT Audio Visualizer Canvas & Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Visualizer Canvas (2 Cols) */}
              <div className="lg:col-span-2 rounded-xl bg-stone-950 p-4 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span>Fast Fourier Transform (FFT) Real-Time Audio Telemetry</span>
                  <span className="text-emerald-400">48 kHz Sampling · K-Weighted Filter</span>
                </div>
                <canvas 
                  ref={canvasAudioRef} 
                  width={640} 
                  height={150} 
                  className="w-full h-36 rounded-lg bg-stone-900/80"
                />
              </div>

              {/* DSP Loudness & Voice Ducking Telemetry Gauge */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 space-y-4 text-xs">
                <span className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px] block">
                  Broadcast DSP Telemetry
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-stone-500">Integrated Loudness:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {activeMusicStream.loudnessLUFS} LUFS (Target: -14.0)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-stone-600 dark:text-stone-400">Voice-Over Ducking:</span>
                  <button
                    type="button"
                    onClick={() => setIsDuckingActive(!isDuckingActive)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      isDuckingActive
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {isDuckingActive ? 'Ducking -6dB Active' : 'Normal Bed'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-stone-600 dark:text-stone-400">Binaural Mode:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setBinauralPreset('alpha')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        binauralPreset === 'alpha' ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      10Hz Alpha
                    </button>
                    <button
                      type="button"
                      onClick={() => setBinauralPreset('theta')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        binauralPreset === 'theta' ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      4Hz Theta
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive Audio Lab Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">
                  Master Output Gain ({Math.round(audioVolume * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">
                  Biquad Low-Pass Filter ({filterCutoff} Hz)
                </label>
                <input
                  type="range"
                  min="500"
                  max="8000"
                  step="250"
                  value={filterCutoff}
                  onChange={(e) => setFilterCutoff(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    const course = EDUCATION_COURSES.find(c => c.id === 'course_music_dsp');
                    if (course) handleOpenCourse(course);
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Audio DSP Academy Course</span>
                </button>
              </div>
            </div>

          </div>

          {/* Music Streams Catalog */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Curated Audio & Studio Submixes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allArtStreams
                .filter(s => s.mediaType === 'music')
                .filter(s => {
                  if (!myStoreFilterActive || !creatorStore) return true;
                  const target = creatorStore.artistName.trim().toLowerCase();
                  return s.artist.trim().toLowerCase() === target || s.id.startsWith('stream_custom_');
                })
                .map((stream) => {
                const isActive = activeMusicStream.id === stream.id;

                return (
                  <div
                    key={stream.id}
                    onClick={() => {
                      setActiveMusicStream(stream);
                      setIsPlayingAudio(true);
                    }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{stream.genreOrStyle}</span>
                        <span className="font-mono">{stream.durationOrStreamStatus}</span>
                      </div>

                      <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {stream.title}
                      </h4>

                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                        {stream.description}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {stream.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-mono">{stream.loudnessLUFS} LUFS</span>
                      <button
                        type="button"
                        className="px-3 py-1 font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1.5"
                      >
                        {isActive && isPlayingAudio ? (
                          <>
                            <Pause className="w-3 h-3" /> Playing
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> Select Stream
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VISUALS & MOTION STREAMING                           */}
      {/* ======================================================== */}
      {subTab === 'visuals' && (
        <div className="space-y-8">
          
          {/* Active 4K Generative Visuals Player */}
          <div className="p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>{activeVisualStream.resolution}</span>
                  <span>·</span>
                  <span>{activeVisualStream.fps} FPS</span>
                  <span>·</span>
                  <span>Adaptive Bitrate (ABR)</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {activeVisualStream.title}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeVisualStream.artist} · {activeVisualStream.genreOrStyle}
                </p>
              </div>

              {/* Quality & Reminder Action */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedAbrQuality}
                  onChange={(e) => setSelectedAbrQuality(e.target.value as any)}
                  className="px-3 py-1.5 text-xs font-mono border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="4K Master">4K Master (24.8 Mbps)</option>
                  <option value="1440p High">1440p QHD (14.2 Mbps)</option>
                  <option value="1080p Standard">1080p Full HD (6.0 Mbps)</option>
                  <option value="720p Mobile">720p Mobile (2.5 Mbps)</option>
                </select>

                <button
                  type="button"
                  onClick={() => onOpenReminders(activeVisualStream.title)}
                  className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Schedule Visual Study Session"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Generative Canvas Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[480px] w-full border border-stone-800 flex items-center justify-center">
              <canvas
                ref={canvasVisualRef}
                width={1280}
                height={720}
                className="w-full h-full object-cover"
              />

              {/* On-screen Telemetry Overlay */}
              <div className="absolute top-4 left-4 p-2.5 rounded-lg bg-stone-950/80 backdrop-blur-sm border border-stone-800 text-[11px] font-mono text-stone-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-white">LIVE GLSL SHADER PIPELINE</span>
                </div>
                <div>Profile: {selectedAbrQuality} · 60 FPS</div>
                <div>Bitrate: {selectedAbrQuality.includes('4K') ? '24.8' : '6.2'} Mbps</div>
              </div>

              {/* Bottom Control Bar Overlay */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-stone-950/85 backdrop-blur-md border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-stone-400">Palette:</span>
                  {(['cyan', 'prismatic', 'amber', 'emerald'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setVisualColorMode(mode)}
                      className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium ${
                        visualColorMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-stone-400">Simulation Velocity:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.2"
                    value={visualSpeed}
                    onChange={(e) => setVisualSpeed(parseFloat(e.target.value))}
                    className="w-24 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Visuals Masterclass Shortcut */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/30 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                  Generative Motion Systems Academy Course
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Master WebGL fragment shaders, Navier-Stokes fluid mechanics, and multi-tier ABR HLS streaming architectures.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const course = EDUCATION_COURSES.find(c => c.id === 'course_visual_motion');
                  if (course) handleOpenCourse(course);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shrink-0 transition-colors"
              >
                Enroll Lesson Syllabus ($0)
              </button>
            </div>

          </div>

          {/* Visuals Catalog */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Curated Visual & Generative Streams
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allArtStreams
                .filter(s => s.mediaType === 'visuals')
                .filter(s => {
                  if (!myStoreFilterActive || !creatorStore) return true;
                  const target = creatorStore.artistName.trim().toLowerCase();
                  return s.artist.trim().toLowerCase() === target || s.id.startsWith('stream_custom_');
                })
                .map((stream) => (
                <div
                  key={stream.id}
                  onClick={() => setActiveVisualStream(stream)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    activeVisualStream.id === stream.id
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{stream.genreOrStyle}</span>
                      <span className="font-mono">{stream.resolution}</span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {stream.title}
                    </h4>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {stream.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {stream.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400 font-mono">{stream.fps} FPS Playout</span>
                    <button
                      type="button"
                      className="px-3 py-1 font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200"
                    >
                      {activeVisualStream.id === stream.id ? 'Active Feed' : 'Load Stream'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MURAL ART & SPATIAL CANVAS                           */}
      {/* ======================================================== */}
      {subTab === 'mural' && (
        <div className="space-y-8">
          
          {/* Interactive Mural Viewer Deck */}
          <div className="p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>{activeMuralStream.dimensions}</span>
                  <span>·</span>
                  <span>{activeMuralStream.resolution}</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {activeMuralStream.title}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeMuralStream.artist} · Location: {activeMuralStream.location}
                </p>
              </div>

              {/* Canvas Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMuralGrid(!showMuralGrid)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    showMuralGrid 
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-750' 
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  Proportional Grid
                </button>

                <button
                  type="button"
                  onClick={() => setShowPigmentChemistry(!showPigmentChemistry)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    showPigmentChemistry 
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-750' 
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  Pigment Chemistry
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReminders(activeMuralStream.title)}
                  className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Schedule Mural Workshop Reminder"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Zoomable Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-stone-950 aspect-[16/9] max-h-[460px] w-full border border-stone-800">
              <canvas
                ref={canvasMuralRef}
                width={1280}
                height={720}
                className="w-full h-full object-cover"
              />

              {/* Floating Zoom Controls */}
              <div className="absolute bottom-4 right-4 p-1.5 rounded-xl bg-stone-950/80 backdrop-blur-md border border-stone-800 flex items-center gap-1.5 text-xs text-white">
                <button
                  type="button"
                  onClick={() => setMuralZoom(prev => Math.max(0.6, prev - 0.2))}
                  className="p-1.5 rounded hover:bg-stone-800"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs px-1 tabular-nums">{Math.round(muralZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setMuralZoom(prev => Math.min(3.0, prev + 0.2))}
                  className="p-1.5 rounded hover:bg-stone-800"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setMuralZoom(1.0); setMuralPan({ x: 0, y: 0 }); }}
                  className="px-2 py-1 text-[11px] rounded bg-stone-800 hover:bg-stone-700 ml-1"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Mural Academy Shortcut */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/30 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                  Monumental Muralism: Spatial Scaling & Chemistry Academy
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Explore Fibonacci coordinate grids, hydraulic lime plaster silicification, and AR laser projection mapping.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const course = EDUCATION_COURSES.find(c => c.id === 'course_mural_art');
                  if (course) handleOpenCourse(course);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shrink-0 transition-colors"
              >
                Enroll Lesson Syllabus ($0)
              </button>
            </div>

          </div>

          {/* Mural Streams Catalog */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Curated Architectural & Monumental Murals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allArtStreams
                .filter(s => s.mediaType === 'mural')
                .filter(s => {
                  if (!myStoreFilterActive || !creatorStore) return true;
                  const target = creatorStore.artistName.trim().toLowerCase();
                  return s.artist.trim().toLowerCase() === target || s.id.startsWith('stream_custom_');
                })
                .map((stream) => (
                <div
                  key={stream.id}
                  onClick={() => setActiveMuralStream(stream)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    activeMuralStream.id === stream.id
                      ? 'border-amber-600 dark:border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">{stream.genreOrStyle}</span>
                      <span className="font-mono">{stream.dimensions}</span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {stream.title}
                    </h4>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {stream.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {stream.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400 font-mono">{stream.durationOrStreamStatus}</span>
                    <button
                      type="button"
                      className="px-3 py-1 font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200"
                    >
                      {activeMuralStream.id === stream.id ? 'Viewing' : 'Inspect Canvas'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TTG DIGITAL WORLD EDUCATION ACADEMY                   */}
      {/* ======================================================== */}
      {subTab === 'academy' && (
        <div className="space-y-8">
          
          {/* Academy Header & Filters */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 block mb-1">
                  TTG Digital World of Education
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Broadcast & Creative Engineering Academy
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
                  Structured self-paced syllabi covering broadcast acoustics, -14 LUFS loudness mastering, GLSL generative shaders, and urban mural spatial geometry.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {EDUCATION_COURSES.length} Core Academies Active
                </span>
              </div>
            </div>

            {/* Domain Filters & Search */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs w-fit">
                <button
                  type="button"
                  onClick={() => setSelectedCourseDomain('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    selectedCourseDomain === 'all'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  All Academies
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCourseDomain('music')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    selectedCourseDomain === 'music'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Audio DSP
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCourseDomain('visuals')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    selectedCourseDomain === 'visuals'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Visuals & Motion
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCourseDomain('mural')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    selectedCourseDomain === 'mural'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Mural Arts
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCourseDomain('broadcast')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    selectedCourseDomain === 'broadcast'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Broadcast Control
                </button>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search curricula & lessons..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourses.map((course) => {
              const progress = readingProgress[course.id];
              const completedCount = progress?.completedChapters?.length || 0;
              const totalCount = course.syllabus.length;
              const percent = Math.round((completedCount / totalCount) * 100);

              return (
                <div
                  key={course.id}
                  className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{course.platformDomain}</span>
                      <span className="font-mono">{course.duration}</span>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                      {course.title}
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {course.overview}
                    </p>

                    {/* Progress Bar */}
                    <div className="pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        <span>Course Progress</span>
                        <span>{completedCount}/{totalCount} Modules ({percent}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Learning Outcomes Preview */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                        Core Competencies
                      </span>
                      {course.learningOutcomes.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-purple-600 font-bold">›</span>
                          <span className="line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>
                    {/* Attached Category Certificate Line */}
                    {(() => {
                      const certSpec = getCertificateForEducationCourse(course);
                      if (!certSpec) return null;
                      return (
                        <div className="pt-2 flex items-center justify-between gap-2 text-[11px] px-3 py-2 rounded-xl bg-[#022c22] text-[#ecfccb] border border-[#84cc16]/45">
                          <div className="flex items-center gap-2 min-w-0">
                            <Award className="w-3.5 h-3.5 text-[#bef264] shrink-0" />
                            <span className="truncate font-semibold">{certSpec.credentialTitle}</span>
                          </div>
                          <span className="font-mono text-[10px] text-[#a3e635] shrink-0">
                            {certSpec.credentialCodePrefix}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 font-mono">{course.lessonsCount} Master Modules</span>
                      <button
                        type="button"
                        onClick={() => onOpenReminders(course.title)}
                        className="p-1 text-stone-400 hover:text-purple-600 rounded"
                        title="Set study reminder"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCertificateCourse(course)}
                        className="px-3 py-2 text-xs font-bold rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 text-[#a3e635]" />
                        <span>Certificate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCourse(course)}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 flex items-center gap-1.5"
                      >
                        <span>Study Syllabus</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAI-ONE BROADCAST CONTROL ROOM                       */}
      {/* ======================================================== */}
      {subTab === 'control_room' && (
        <div className="space-y-8">
          
          {/* Studio Control Header */}
          <div className="p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>{broadcastTelemetry.status}</span>
                  <span>·</span>
                  <span>Master Orchestrator Console</span>
                  <span>·</span>
                  <span>DR RTO: 157.41 ms</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  TAI-ONE Broadcast Control Room & Matrix Switcher
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Multi-channel video routing, synthetic observability probes, automated SQLite snapshot replication, and AES-256 cloud vaults.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEngineeringManualOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Engineering Manual</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEmergencyFailoverTriggered(true);
                    setTimeout(() => setIsEmergencyFailoverTriggered(false), 3000);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-1.5 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Test DR Dry-Run</span>
                </button>
              </div>
            </div>

            {/* Emergency Failover Toast Banner */}
            {isEmergencyFailoverTriggered && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="font-bold">Automated Disaster Recovery Dry-Run Completed:</span>
                  <span>Atomic SQLite snapshot restored to secondary edge in 157.41 ms (Zero packet loss).</span>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">100% SLA PASS</span>
              </div>
            )}

            {/* Matrix Video Switcher Bus */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100 block">
                Master Video Switcher Bus (Input Matrix)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 1, label: 'Input 1: Studio Host', desc: '1080p 60fps SDI Feed' },
                  { id: 2, label: 'Input 2: Generative 4K', desc: 'GLSL Raymarching Feed' },
                  { id: 3, label: 'Input 3: Lisbon Mural', desc: '8K Gigapixel Pan-Tilt' },
                  { id: 4, label: 'Input 4: Audio Radar', desc: 'FFT Spectrum Telemetry' },
                ].map((input) => (
                  <button
                    key={input.id}
                    type="button"
                    onClick={() => setActiveSwitcherInput(input.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeSwitcherInput === input.id
                        ? 'border-rose-600 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/30 ring-1 ring-rose-500 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-stone-500">BUS {input.id}</span>
                      {activeSwitcherInput === input.id && (
                        <span className="text-rose-600 font-bold">PROGRAM OUT</span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-stone-900 dark:text-stone-100">{input.label}</div>
                    <div className="text-[10px] text-stone-500">{input.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Synthetic Monitoring Observability Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750">
                <span className="text-[11px] text-stone-500 block">Synthetic Latency</span>
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {broadcastTelemetry.latencyMs} ms
                </span>
                <span className="text-[10px] text-stone-400 block">Target: &lt;20 ms (PASS)</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750">
                <span className="text-[11px] text-stone-500 block">Playout Bitrate</span>
                <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                  {broadcastTelemetry.bitrateMbps} Mbps
                </span>
                <span className="text-[10px] text-stone-400 block">4K HEVC Master</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750">
                <span className="text-[11px] text-stone-500 block">Audio DSP Loudness</span>
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {broadcastTelemetry.currentLUFS} LUFS
                </span>
                <span className="text-[10px] text-stone-400 block">EBU R128 Compliant</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750">
                <span className="text-[11px] text-stone-500 block">SLA Availability</span>
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                  100.00%
                </span>
                <span className="text-[10px] text-stone-400 block">{broadcastTelemetry.uptime}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: EDUCATION COURSE LESSON READER & NOTES        */}
      {/* ======================================================== */}
      {activeCourse && (() => {
        const progress = readingProgress[activeCourse.id];
        const completedChapters = progress?.completedChapters || [];
        const completedCount = completedChapters.length;
        const totalCount = activeCourse.syllabus.length;
        const percent = Math.round((completedCount / totalCount) * 100);
        const currentLesson = activeCourse.syllabus[activeLessonIdx] || activeCourse.syllabus[0];
        const isCurrentDone = completedChapters.includes(activeLessonIdx);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-stone-950/75 backdrop-blur-md"
              onClick={() => setActiveCourse(null)}
            />

            <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      {activeCourse.platformDomain} · {activeCourse.duration}
                    </span>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">{activeCourse.title}</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Instructor: {activeCourse.instructor}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCertificateCourse(activeCourse)}
                      className="px-3 py-1.5 text-xs font-bold text-[#bef264] bg-[#052e16] hover:bg-[#064e3b] border border-[#84cc16]/60 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#a3e635]" />
                      <span className="hidden sm:inline">Course Certificate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenReminders(activeCourse.title)}
                      className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Set reminder for course"
                    >
                      <Bell className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="hidden sm:inline">Set Reminder</span>
                    </button>

                    <button
                      onClick={() => setActiveCourse(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Course Reading Process Bar */}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4 text-xs">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-stone-500">
                      <span>Curriculum Completion</span>
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{completedCount} of {totalCount} Modules ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  {percent >= 100 && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                      <Award className="w-3.5 h-3.5" />
                      <span>Certified</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Module Browser & Active Lesson Reader */}
              <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800">
                
                {/* Left: Syllabus List */}
                <div className="w-full md:w-72 p-4 bg-stone-50/50 dark:bg-stone-950/50 space-y-2 shrink-0 overflow-y-auto">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-2">
                    Syllabus Modules ({activeCourse.syllabus.length})
                  </span>
                  {activeCourse.syllabus.map((lesson, idx) => {
                    const isDone = completedChapters.includes(idx);
                    const isSelected = activeLessonIdx === idx;

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setActiveLessonIdx(idx)}
                        className={`w-full p-2.5 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'border-purple-600 dark:border-purple-500 bg-purple-50/40 dark:bg-purple-950/30'
                            : 'border-transparent hover:bg-stone-200/50 dark:hover:bg-stone-850'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 font-bold ${
                            isDone 
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">
                              {lesson.title}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono block">
                              {lesson.duration} · {isDone ? 'Finished' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Active Lesson Content */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="text-[11px] font-mono text-purple-700 dark:text-purple-400">
                        Lesson {activeLessonIdx + 1} of {totalCount} · {currentLesson.duration}
                      </span>
                      <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                        {currentLesson.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleLessonDone(activeLessonIdx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                        isCurrentDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {isCurrentDone ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Module Finished</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>Mark as Completed</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Key Takeaways */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-stone-800 dark:text-stone-200 space-y-1.5">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-purple-900 dark:text-purple-300 block mb-1">
                      Key Technical Competencies
                    </span>
                    {currentLesson.keyTakeaways.map((point, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">›</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  {/* Lesson Body Content */}
                  <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                    {currentLesson.content}
                  </div>

                  {/* Personal Lesson Notes */}
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100">
                      <span>Personal Lesson Notes & Takeaways</span>
                      {isLessonNoteSaved && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-normal">
                          <CheckCircle2 className="w-3 h-3" /> Saved to profile
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={lessonNote}
                      onChange={(e) => setLessonNote(e.target.value)}
                      placeholder="Record key reflections or broadcast parameters from this module..."
                      className="w-full p-2.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveLessonNote}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Reader Footer */}
              <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-mono">
                  Self-Paced Tutoring Progress Synchronized · Finish at your own pace
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCourse(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                >
                  Close Academy
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 7. MODAL: TAI-ONE ENGINEERING MANUAL (PDF Specs)        */}
      {/* ======================================================== */}
      {isEngineeringManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-md"
            onClick={() => setIsEngineeringManualOpen(false)}
          />

          <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Document ID: DR-SPEC-2026-v16.0 · 100% SLA
                </span>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  TAI-ONE Studio Engineering Manual & Playbook
                </h3>
              </div>
              <button
                onClick={() => setIsEngineeringManualOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-mono">
              <div className="p-3 bg-stone-100 dark:bg-stone-850 rounded-lg border border-stone-200 dark:border-stone-750">
                <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">SECTION 1: Core Studio Backends</span>
                <p>1. Master Orchestrator: Sub-second routing between live ingest streams and generative video matrices.</p>
                <p>2. Audio DSP: Enforces -14.0 LUFS broadcast target with 15ms lookahead voice ducking.</p>
                <p>3. Video Switcher: ABR HLS manifests linking 4K (24 Mbps) to 720p Mobile.</p>
                <p>4. DRM Security Hub: AES-256-GCM encryption with atomic SQLite backup vaults.</p>
              </div>

              <div className="p-3 bg-stone-100 dark:bg-stone-850 rounded-lg border border-stone-200 dark:border-stone-750">
                <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">SECTION 2: FastAPI Gateway Rate Limits</span>
                <p>• Auth Token Requests: 5 req/min</p>
                <p>• Public Media Feeds: 30 req/min</p>
                <p>• Studio Stream Control: 120 req/min quota</p>
              </div>

              <div className="p-3 bg-stone-100 dark:bg-stone-850 rounded-lg border border-stone-200 dark:border-stone-750">
                <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">SECTION 3: Disaster Recovery Benchmark</span>
                <p>• Total RTO: 157.41 ms (Atomic snapshot restore to secondary edge)</p>
                <p>• Compression: Gzip 97.8% ratio</p>
                <p>• Incident Matrix: P1 (Stream outage) to P4 (Minor telemetry drift)</p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setIsEngineeringManualOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Certificate Preview & PDF Modal */}
      {(() => {
        const cert = certificateCourse ? getCertificateForEducationCourse(certificateCourse) : null;
        const prog = certificateCourse ? readingProgress[certificateCourse.id] : undefined;
        const pct = prog?.progressPercent || 0;
        const serial = cert && certificateCourse
          ? formatCertificateSerial(cert.credentialCodePrefix, certificateCourse.id, user.id)
          : '';
        return (
          <CourseCertificateModal
            isOpen={!!certificateCourse}
            onClose={() => setCertificateCourse(null)}
            certificate={cert}
            courseTitle={certificateCourse?.title || ''}
            recipientName={user.name}
            serialNumber={serial}
            issueDate={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            progressPercent={pct}
            isEarned={Boolean(prog?.isCompleted || pct >= 100)}
          />
        );
      })()}

      {/* Upload Art Stream to Storefront Modal */}
      {isUploadStreamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
              <h3 className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Upload Art Work / Stream to Online Storefront</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadStreamModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitArtStream} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Art Medium</label>
                  <select
                    value={uploadStreamType}
                    onChange={(e) => setUploadStreamType(e.target.value as ArtMediaType)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="music">Music &amp; Audio DSP</option>
                    <option value="visuals">Visuals &amp; Motion Art</option>
                    <option value="mural">Mural &amp; Spatial Canvas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Artist Name *</label>
                  <input
                    type="text"
                    value={uploadArtist}
                    onChange={(e) => setUploadArtist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Work / Stream Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Harmonic Solstice IV"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Style / Genre</label>
                  <input
                    type="text"
                    value={uploadStyle}
                    onChange={(e) => setUploadStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                {uploadStreamType === 'music' ? (
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Tuning (Hz)</label>
                    <input
                      type="number"
                      value={uploadFreqHz}
                      onChange={(e) => setUploadFreqHz(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Dimensions / Spec</label>
                    <input
                      type="text"
                      value={uploadDimensions}
                      onChange={(e) => setUploadDimensions(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Curatorial Description</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={2}
                  placeholder="Describe your composition, shader parameters, or mural technique..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 resize-none"
                />
              </div>

              {(() => {
                const salesSoFar = creatorStore?.completedSalesCount || 0;
                const post50 = salesSoFar >= CREATOR_FREE_SALES_THRESHOLD;
                return (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold block">
                      {post50
                        ? 'Post-50 Sales Tier: 95% Creator Payout · 5% Site Owner Service Fee'
                        : `Zero-Fee Launch Tier: 100% Creator Payout (${salesSoFar}/50 sales · 5% fee starts after 50 sales)`}
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadStreamModalOpen(false)}
                  className="px-4 py-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow cursor-pointer"
                >
                  Publish to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Art Artist Profile, Payment Account & Service Agreement Modal */}
      <CreatorProfileStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        platform="digital_art"
        user={user}
        existingStore={creatorStore}
        initialTab={storeModalTab}
        onStoreSaved={(saved) => setCreatorStore(saved)}
        onProceedToUpload={handleOpenUploadStreamModal}
      />

    </div>
  );
};
