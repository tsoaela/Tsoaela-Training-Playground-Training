import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Upload, 
  DollarSign, 
  Headphones, 
  Heart, 
  Download, 
  Sparkles, 
  Search, 
  X, 
  Music, 
  Disc, 
  Layers, 
  Sliders, 
  Radio, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Share2, 
  Lock 
} from 'lucide-react';
import { MusicTrack, UserProfile } from '../types';
import { INITIAL_MUSIC_TRACKS } from '../data/storesData';

interface MusicStoreTabProps {
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: (action: () => void, message: string) => void;
  onPurchaseTrack: (track: MusicTrack) => void;
}

export const MusicStoreTab: React.FC<MusicStoreTabProps> = ({
  user,
  isAuthenticated,
  onRequireAuth,
  onPurchaseTrack,
}) => {
  // Store tracks with localStorage persistence
  const [tracks, setTracks] = useState<MusicTrack[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_music_tracks');
      return saved ? JSON.parse(saved) : INITIAL_MUSIC_TRACKS;
    } catch {
      return INITIAL_MUSIC_TRACKS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_music_tracks', JSON.stringify(tracks));
    } catch (e) {
      console.error(e);
    }
  }, [tracks]);

  // Audio playback state
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(tracks[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set(['track_01', 'track_03']));

  // Artist Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState(user.name || '');
  const [newAlbum, setNewAlbum] = useState('Singles & Releases');
  const [newGenre, setNewGenre] = useState('Ambient Electronic / Modular');
  const [newPrice, setNewPrice] = useState('7.99');
  const [newBpm, setNewBpm] = useState('120');
  const [newKey, setNewKey] = useState('A Minor');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [hasStems, setHasStems] = useState(true);

  // Web Audio Synthesis Engine (so audio actually plays in the browser!)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  const startAudioEngine = (track: MusicTrack) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop previous oscillators if running
      if (osc1Ref.current) {
        try { osc1Ref.current.stop(); } catch {}
        osc1Ref.current.disconnect();
      }
      if (osc2Ref.current) {
        try { osc2Ref.current.stop(); } catch {}
        osc2Ref.current.disconnect();
      }

      // Base note frequencies based on track key
      const keyFreqs: Record<string, number> = {
        'F Minor': 87.31,
        'D Minor': 73.42,
        'C Major': 65.41,
        'A Minor': 110.00,
        'E Minor': 82.41,
      };
      const baseFreq = keyFreqs[track.key || ''] || 110.0;

      // Filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filterNodeRef.current = filter;

      // Gain
      const gain = ctx.createGain();
      gain.gain.value = (isMuted ? 0 : volume) * 0.15;
      gainNodeRef.current = gain;

      // Oscillator 1 (Warm Sawtooth drone)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = baseFreq;
      osc1.connect(filter);

      // Oscillator 2 (Sub octave Sine)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = baseFreq / 2;
      osc2.connect(filter);

      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  };

  const stopAudioEngine = () => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      } catch {}
    }
  };

  // Sync volume to audio engine
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : volume * 0.15;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Track timer interval
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= currentTrack.durationSeconds) {
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const handlePlayTrack = (track: MusicTrack) => {
    if (currentTrack.id === track.id && isPlaying) {
      setIsPlaying(false);
      stopAudioEngine();
    } else {
      setCurrentTrack(track);
      setPlaybackTime(0);
      setIsPlaying(true);
      startAudioEngine(track);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudioEngine();
    } else {
      setIsPlaying(true);
      startAudioEngine(currentTrack);
    }
  };

  const handleNextTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    setCurrentTrack(nextTrack);
    setPlaybackTime(0);
    if (isPlaying) {
      startAudioEngine(nextTrack);
    }
  };

  const handlePrevTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];
    setCurrentTrack(prevTrack);
    setPlaybackTime(0);
    if (isPlaying) {
      startAudioEngine(prevTrack);
    }
  };

  const handleToggleLike = (trackId: string) => {
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filtered tracks
  const filteredTracks = tracks.filter(t => {
    if (selectedGenre !== 'all' && !t.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenUploadModal = () => {
    onRequireAuth(() => {
      setIsUploadModalOpen(true);
    }, 'Sign in or register as an Artist to upload and sell your music online.');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;

    const parsedPrice = parseFloat(newPrice) || 7.99;
    const clampedPrice = Math.min(10, Math.max(5, parsedPrice));

    const newTrack: MusicTrack = {
      id: `track_${Date.now()}`,
      title: newTitle.trim(),
      artist: newArtist.trim(),
      album: newAlbum.trim() || 'Singles',
      coverUrl: newCoverUrl.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
      duration: '4:15',
      durationSeconds: 255,
      genre: newGenre,
      price: clampedPrice,
      bpm: parseInt(newBpm) || 120,
      key: newKey,
      plays: 1,
      likes: 1,
      releaseDate: new Date().toISOString().slice(0, 10),
      isrc: `TTG-M-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      format: 'WAV 24-bit 96kHz',
      hasStems: hasStems,
      description: `Original master release uploaded by ${newArtist.trim()} on TTG Spotify-Style Music Streaming & Store.`
    };

    setTracks(prev => [newTrack, ...prev]);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setCurrentTrack(newTrack);
    handlePlayTrack(newTrack);
  };

  const genres = [
    { id: 'all', label: 'All Music' },
    { id: 'ambient', label: 'Ambient & Modular' },
    { id: 'techno', label: 'Techno & Minimal' },
    { id: 'neoclassical', label: 'Neoclassical & Piano' },
    { id: 'synthwave', label: 'Cybernetic Synthwave' },
    { id: 'cinematic', label: 'Cinematic Score' },
  ];

  return (
    <div className="bg-[#121212] text-stone-100 min-h-screen pb-32">
      {/* Hero Spotify-Style Banner */}
      <div className="relative overflow-hidden bg-linear-to-b from-emerald-950/80 via-[#121212]/95 to-[#121212] border-b border-white/5 px-4 sm:px-8 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10 group relative">
              <img 
                src={currentTrack.coverUrl} 
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <button
                type="button"
                onClick={handleTogglePlay}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isPlaying ? <Pause className="w-8 h-8 text-emerald-400" /> : <Play className="w-8 h-8 text-emerald-400 ml-1" />}
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                <Disc className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>TTG Spotify-Style Music Streaming & Store</span>
                <span className="text-white/30">·</span>
                <span className="text-white/70">Priced $5 – $10</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {currentTrack.title}
              </h1>
              <p className="text-sm text-stone-400 mt-1 flex items-center gap-3">
                <span className="text-white font-medium">{currentTrack.artist}</span>
                <span>·</span>
                <span>{currentTrack.album}</span>
                <span>·</span>
                <span className="font-mono text-emerald-400 font-bold">${currentTrack.price.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              <span>{isPlaying ? 'PAUSE PREVIEW' : 'PLAY PREVIEW'}</span>
            </button>

            <button
              type="button"
              onClick={() => onPurchaseTrack(currentTrack)}
              className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>BUY TRACK (${currentTrack.price.toFixed(2)})</span>
            </button>

            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="px-4 py-3 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">UPLOAD & SELL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Viewport */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Search & Genre Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {genres.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenre(g.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === g.id
                    ? 'bg-white text-stone-950 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks, artists, albums..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-full bg-white/5 border border-white/10 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Featured Music Store Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Featured Master Releases & Stems ($5 – $10)
            </h2>
            <span className="text-xs text-stone-400">85% Revenue directly to Independent Artists</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTracks.map(track => {
              const isSelected = currentTrack.id === track.id;
              const isTrackPlaying = isSelected && isPlaying;
              const isLiked = likedTrackIds.has(track.id);

              return (
                <div
                  key={track.id}
                  className={`p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all group flex flex-col justify-between border ${
                    isSelected ? 'border-emerald-500/50 bg-white/10' : 'border-white/5'
                  }`}
                >
                  <div>
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-md">
                      <img 
                        src={track.coverUrl} 
                        alt={track.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => handlePlayTrack(track)}
                        className={`absolute right-2 bottom-2 w-10 h-10 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center shadow-xl transition-all ${
                          isTrackPlaying ? 'opacity-100 scale-100' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                        }`}
                        title="Stream preview"
                      >
                        {isTrackPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <h3 className="text-xs font-bold text-white truncate" title={track.title}>
                      {track.title}
                    </h3>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">
                      {track.artist}
                    </p>
                    <span className="inline-block text-[10px] text-stone-500 mt-1">
                      {track.genre}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ${track.price.toFixed(2)}
                      </span>
                      {track.hasStems && (
                        <span className="block text-[9px] text-purple-400 font-mono">
                          + STEMS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(track.id)}
                        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
                          isLiked ? 'text-rose-500' : 'text-stone-500 hover:text-white'
                        }`}
                        title="Add to Favorites"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPurchaseTrack(track)}
                        className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-stone-950 text-[10px] font-bold transition-all"
                        title="Buy Full High-Resolution Audio"
                      >
                        BUY
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Track List Table (Spotify-Style Detailed Rows) */}
        <div className="mt-8 bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-400" />
              All Marketplace Audio Masters
            </h3>
            <span className="text-xs text-stone-400 font-mono">
              {filteredTracks.length} Tracks Available
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredTracks.map((track, idx) => {
              const isSelected = currentTrack.id === track.id;
              const isTrackPlaying = isSelected && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track)}
                  className={`px-4 py-3 flex items-center justify-between gap-4 cursor-pointer transition-colors group ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-mono text-stone-500 w-5 text-center shrink-0">
                      {isTrackPlaying ? (
                        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse inline" />
                      ) : (
                        idx + 1
                      )}
                    </span>

                    <img 
                      src={track.coverUrl} 
                      alt={track.title} 
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />

                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-stone-400 truncate">
                        {track.artist} · <span className="opacity-70">{track.album}</span>
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-8 text-xs text-stone-400 shrink-0 font-mono">
                    <span>{track.genre}</span>
                    <span>{track.bpm} BPM ({track.key})</span>
                    <span>{track.duration}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${track.price.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onPurchaseTrack(track)}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-stone-950 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3 h-3" />
                      <span>Buy & Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Persistent Spotify Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#181818] border-t border-white/10 px-4 py-3 text-stone-200">
        <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left: Track Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial sm:min-w-[200px] sm:max-w-xs">
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0 shadow"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-stone-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleLike(currentTrack.id)}
              className="text-stone-400 hover:text-rose-500 ml-1 shrink-0"
            >
              <Heart className={`w-4 h-4 ${likedTrackIds.has(currentTrack.id) ? 'text-rose-500 fill-current' : ''}`} />
            </button>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="order-last sm:order-none w-full sm:w-auto sm:flex-1 max-w-xl flex flex-col items-center gap-1">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handlePrevTrack}
                className="text-stone-400 hover:text-white transition-colors"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-full bg-white text-stone-950 flex items-center justify-center hover:scale-105 transition-all shadow"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleNextTrack}
                className="text-stone-400 hover:text-white transition-colors"
                title="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Scrubber timeline */}
            <div className="w-full flex items-center gap-2 text-[10px] font-mono text-stone-400">
              <span>{formatSeconds(playbackTime)}</span>
              <div 
                className="flex-1 h-1 bg-white/20 hover:h-1.5 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPercent = (e.clientX - rect.left) / rect.width;
                  setPlaybackTime(Math.floor(clickPercent * currentTrack.durationSeconds));
                }}
              >
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(playbackTime / currentTrack.durationSeconds) * 100}%` }}
                />
              </div>
              <span>{currentTrack.duration}</span>
            </div>
          </div>

          {/* Right: Buy action & Volume */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 sm:min-w-[200px] justify-end">
            <button
              type="button"
              onClick={() => onPurchaseTrack(currentTrack)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Buy (${currentTrack.price.toFixed(2)})</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setIsMuted(prev => !prev)}
                className="text-stone-400 hover:text-white"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-16 accent-emerald-500 h-1 bg-white/20 rounded cursor-pointer"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Artist Upload & Monetization Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-stone-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Artist Release: Upload & Sell Music</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Track Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Cognitive Horizon"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Artist / Band Name</label>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="e.g. Aether Resonance"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Album / EP Name</label>
                  <input
                    type="text"
                    value={newAlbum}
                    onChange={(e) => setNewAlbum(e.target.value)}
                    placeholder="e.g. Sub-Zero Harmonics"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Primary Genre</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ambient Electronic / Modular">Ambient Electronic / Modular</option>
                    <option value="Deep Techno & Minimal">Deep Techno & Minimal</option>
                    <option value="Neoclassical Acoustic & Piano">Neoclassical Acoustic & Piano</option>
                    <option value="Cybernetic Synthwave">Cybernetic Synthwave</option>
                    <option value="Cinematic Score">Cinematic Score</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Price ($5 - $10)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-stone-400">$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="5.00"
                      max="10.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    value={newBpm}
                    onChange={(e) => setNewBpm(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Musical Key</label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="F Minor"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Cover Art Image URL</label>
                <input
                  type="url"
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Include Multitrack Stems (WAV)</span>
                  <span className="text-[11px] text-stone-400">Allows producers to remix your drums, bass, and synths</span>
                </div>
                <input 
                  type="checkbox"
                  checked={hasStems}
                  onChange={(e) => setHasStems(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>Estimated Artist Royalty (85% Net):</span>
                <span className="font-mono font-bold text-sm text-white">
                  ${((parseFloat(newPrice) || 7.99) * 0.85).toFixed(2)} / sale
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-colors shadow"
                >
                  Publish & Start Selling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
