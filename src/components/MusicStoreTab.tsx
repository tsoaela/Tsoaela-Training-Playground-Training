import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Headphones,
  Heart,
  Download,
  Search,
  X,
  Music,
  Disc3,
  Radio,
  ShoppingBag,
  Shuffle,
  Repeat,
  ArrowUpDown,
  CheckCircle2,
  Sliders,
  Info,
} from 'lucide-react';
import {
  MusicTrack,
  UserProfile,
  MusicLicenseTier,
  MusicCartItem,
  PurchasedMusicRecord,
  MusicAudioLayer,
  CreatorStoreProfile,
} from '../types';
import {
  INITIAL_MUSIC_TRACKS,
  MUSIC_COVER_ART_MAP,
  MUSIC_COVER_PRESETS,
} from '../data/storesData';
import {
  MusicAudioEngine,
  calculateTrackLicensePrice,
  exportTrackWavDownload,
} from '../utils/musicAudioEngine';
import {
  CREATOR_FREE_SALES_THRESHOLD,
  getStoreForUserAndPlatform,
} from '../utils/creatorStoreSystem';
import { MusicArtwork } from './MusicArtwork';
import { MusicCartDrawer } from './MusicCartDrawer';
import { MusicTrackDetailModal } from './MusicTrackDetailModal';
import {
  CreatorProfileStoreModal,
  CreatorModalTab,
} from './CreatorProfileStoreModal';
import { CreatorStorefrontBar } from './CreatorStorefrontBar';
import { CreatorEarningsDashboard } from './CreatorEarningsDashboard';

interface MusicStoreTabProps {
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: (action: () => void, message: string) => void;
  onPurchaseTrack: (
    track: MusicTrack,
    licenseTier?: MusicLicenseTier,
    priceOverride?: number,
    onCompleted?: (invoiceNumber: string, finalAmount: number) => void
  ) => void;
  onPurchaseMusicCart?: (
    cartEntries: { track: MusicTrack; licenseTier: MusicLicenseTier; unitPrice: number }[],
    onCompleted?: (invoiceNumber: string) => void
  ) => void;
}

type CollectionTab = 'all' | 'favorites' | 'owned';
type SortOption = 'featured' | 'most_played' | 'price_asc' | 'price_desc' | 'bpm_desc';

const GENRE_FILTERS = [
  { id: 'all', label: 'All Genres' },
  { id: 'ambient', label: 'Ambient & Modular' },
  { id: 'techno', label: 'Techno & Minimal' },
  { id: 'neoclassical', label: 'Neoclassical & Piano' },
  { id: 'synthwave', label: 'Cybernetic Synthwave' },
  { id: 'cinematic', label: 'Cinematic Score' },
];

export const MusicStoreTab: React.FC<MusicStoreTabProps> = ({
  user,
  onRequireAuth,
  onPurchaseTrack,
  onPurchaseMusicCart,
}) => {
  // Store tracks with localStorage persistence + stale external cover URL healing
  const [tracks, setTracks] = useState<MusicTrack[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_music_tracks');
      if (!saved) return INITIAL_MUSIC_TRACKS;
      const parsed: MusicTrack[] = JSON.parse(saved);
      return parsed.map((track) => {
        const mappedCover = MUSIC_COVER_ART_MAP[track.id];
        const usesBrokenUnsplash = track.coverUrl?.includes('images.unsplash.com');
        if (mappedCover && (!track.coverUrl || usesBrokenUnsplash)) {
          return { ...track, coverUrl: mappedCover };
        }
        return track;
      });
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

  // Persistent favorites, bag & owned library
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ttg_liked_music_tracks');
      return saved ? new Set(JSON.parse(saved)) : new Set(['track_01', 'track_03']);
    } catch {
      return new Set(['track_01', 'track_03']);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_liked_music_tracks', JSON.stringify(Array.from(likedTrackIds)));
    } catch {
      // Ignore storage error
    }
  }, [likedTrackIds]);

  const [cartItems, setCartItems] = useState<MusicCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_music_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_music_cart', JSON.stringify(cartItems));
    } catch {
      // Ignore storage error
    }
  }, [cartItems]);

  const [purchasedMap, setPurchasedMap] = useState<Record<string, PurchasedMusicRecord>>(() => {
    try {
      const saved = localStorage.getItem('ttg_purchased_music_tracks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_purchased_music_tracks', JSON.stringify(purchasedMap));
    } catch {
      // Ignore storage error
    }
  }, [purchasedMap]);

  // Catalog view, filters & sorting
  const [collectionTab, setCollectionTab] = useState<CollectionTab>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Audio playback & channel layer state
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(tracks[0] || INITIAL_MUSIC_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [activeAudioLayer, setActiveAudioLayer] = useState<MusicAudioLayer>('master');

  // Creator Storefront, Payment Account & Service Agreement State
  const [creatorStore, setCreatorStore] = useState<CreatorStoreProfile | null>(() =>
    getStoreForUserAndPlatform(user.id, 'music')
  );
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeModalTab, setStoreModalTab] = useState<CreatorModalTab>('profile');
  const [myStoreFilterActive, setMyStoreFilterActive] = useState(false);

  useEffect(() => {
    const syncStore = () => setCreatorStore(getStoreForUserAndPlatform(user.id, 'music'));
    syncStore();
    window.addEventListener('ttg-creator-store-updated', syncStore);
    return () => window.removeEventListener('ttg-creator-store-updated', syncStore);
  }, [user.id]);

  // Drawers & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inspectTrackId, setInspectTrackId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Artist Upload Modal fields
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState(creatorStore?.artistName || user.name || '');
  const [newAlbum, setNewAlbum] = useState('Singles & Releases');
  const [newGenre, setNewGenre] = useState('Ambient Electronic / Modular');
  const [newPrice, setNewPrice] = useState('7.99');
  const [newBpm, setNewBpm] = useState('120');
  const [newKey, setNewKey] = useState('A Minor');
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(MUSIC_COVER_PRESETS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [hasMultitracks, setHasMultitracks] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Audio engine & live canvas spectrum refs
  const engineRef = useRef<MusicAudioEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new MusicAudioEngine();
  }
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dispose audio engine cleanly on unmount
  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      engine?.dispose();
    };
  }, []);

  // Sync volume & audio layer to audio engine
  useEffect(() => {
    engineRef.current?.setVolume(volume, isMuted);
  }, [volume, isMuted]);

  useEffect(() => {
    engineRef.current?.setAudioLayer(activeAudioLayer);
  }, [activeAudioLayer]);

  // Real-time AnalyserNode spectrum visualizer loop
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = new Uint8Array(64);
    const smoothed = new Float32Array(36);
    let rafId = 0;

    const renderFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const hasLiveSignal = isPlaying && engineRef.current?.getFrequencyData(buffer);
      const barCount = smoothed.length;
      const gap = 3;
      const barWidth = (width - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const raw = hasLiveSignal ? buffer[i % 48] / 255 : 0;
        const target = isPlaying ? Math.max(0.08, raw) : 0.06;
        smoothed[i] += (target - smoothed[i]) * 0.25;

        const barHeight = Math.max(3, smoothed[i] * (height - 4));
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        ctx.fillStyle = isPlaying ? '#10b981' : 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  // Filtered & sorted catalog
  const myStoreTracksCount = useMemo(() => {
    if (!creatorStore) return 0;
    const targetName = creatorStore.artistName.trim().toLowerCase();
    return tracks.filter(
      (t) =>
        t.artistId === user.id ||
        t.artistId === creatorStore.id ||
        t.artist.trim().toLowerCase() === targetName
    ).length;
  }, [tracks, creatorStore, user.id]);

  const filteredTracks = useMemo(() => {
    const list = tracks.filter((t) => {
      if (myStoreFilterActive && creatorStore) {
        const targetName = creatorStore.artistName.trim().toLowerCase();
        const belongsToMe =
          t.artistId === user.id ||
          t.artistId === creatorStore.id ||
          t.artist.trim().toLowerCase() === targetName;
        if (!belongsToMe) return false;
      }
      if (collectionTab === 'favorites' && !likedTrackIds.has(t.id)) return false;
      if (collectionTab === 'owned' && !purchasedMap[t.id]) return false;
      if (selectedGenre !== 'all' && !t.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'most_played') {
      sorted.sort((a, b) => b.plays - a.plays);
    } else if (sortBy === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'bpm_desc') {
      sorted.sort((a, b) => (b.bpm || 0) - (a.bpm || 0));
    }
    return sorted;
  }, [tracks, collectionTab, likedTrackIds, purchasedMap, selectedGenre, searchQuery, sortBy, myStoreFilterActive, creatorStore, user.id]);

  const incrementTrackPlay = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, plays: t.plays + 1 } : t))
    );
  }, []);

  const handleSelectTrackAndPlay = useCallback(
    (track: MusicTrack) => {
      if (currentTrack.id === track.id && isPlaying) {
        setIsPlaying(false);
        engineRef.current?.stop();
      } else {
        setCurrentTrack(track);
        setPlaybackTime(0);
        setIsPlaying(true);
        incrementTrackPlay(track.id);
        engineRef.current?.start(track, activeAudioLayer);
      }
    },
    [currentTrack.id, isPlaying, activeAudioLayer, incrementTrackPlay]
  );

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      engineRef.current?.stop();
    } else {
      setIsPlaying(true);
      engineRef.current?.start(currentTrack, activeAudioLayer);
    }
  }, [isPlaying, currentTrack, activeAudioLayer]);

  const handleNextTrack = useCallback(() => {
    const queue = filteredTracks.length > 0 ? filteredTracks : tracks;
    if (queue.length === 0) return;

    let nextTrack = queue[0];
    if (isShuffle && queue.length > 1) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      nextTrack = candidates[Math.floor(Math.random() * candidates.length)] || queue[0];
    } else {
      const idx = queue.findIndex((t) => t.id === currentTrack.id);
      nextTrack = queue[(idx + 1) % queue.length];
    }

    setCurrentTrack(nextTrack);
    setPlaybackTime(0);
    if (isPlaying) {
      incrementTrackPlay(nextTrack.id);
      engineRef.current?.start(nextTrack, activeAudioLayer);
    }
  }, [filteredTracks, tracks, isShuffle, currentTrack.id, isPlaying, activeAudioLayer, incrementTrackPlay]);

  const handlePrevTrack = useCallback(() => {
    if (playbackTime > 4) {
      setPlaybackTime(0);
      return;
    }
    const queue = filteredTracks.length > 0 ? filteredTracks : tracks;
    if (queue.length === 0) return;

    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = idx <= 0 ? queue.length - 1 : idx - 1;
    const prevTrack = queue[prevIdx];

    setCurrentTrack(prevTrack);
    setPlaybackTime(0);
    if (isPlaying) {
      incrementTrackPlay(prevTrack.id);
      engineRef.current?.start(prevTrack, activeAudioLayer);
    }
  }, [playbackTime, filteredTracks, tracks, currentTrack.id, isPlaying, activeAudioLayer, incrementTrackPlay]);

  // Playback progress timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setPlaybackTime((prev) => {
        if (prev + 1 >= currentTrack.durationSeconds) {
          if (isRepeat) {
            return 0;
          }
          handleNextTrack();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, currentTrack.durationSeconds, isRepeat, handleNextTrack]);

  const handleToggleLike = (trackId: string) => {
    const alreadyLiked = likedTrackIds.has(trackId);
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, likes: Math.max(0, t.likes + (alreadyLiked ? -1 : 1)) }
          : t
      )
    );
  };

  // Cart & Licensing Handlers
  const handleAddToCart = (track: MusicTrack, tier: MusicLicenseTier = 'Personal Master') => {
    const unitPrice = calculateTrackLicensePrice(track.price, tier, track.hasMultitracks);
    setCartItems((prev) => {
      const existing = prev.find((i) => i.trackId === track.id);
      if (existing) {
        return prev.map((i) =>
          i.trackId === track.id ? { ...i, licenseTier: tier, unitPrice } : i
        );
      }
      return [...prev, { trackId: track.id, licenseTier: tier, unitPrice }];
    });
  };

  const handleChangeCartLicense = (trackId: string, tier: MusicLicenseTier) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    const unitPrice = calculateTrackLicensePrice(track.price, tier, track.hasMultitracks);
    setCartItems((prev) =>
      prev.map((i) =>
        i.trackId === trackId ? { ...i, licenseTier: tier, unitPrice } : i
      )
    );
  };

  const handleRemoveFromCart = (trackId: string) => {
    setCartItems((prev) => prev.filter((i) => i.trackId !== trackId));
  };

  const handleInstantPurchase = (track: MusicTrack, tier: MusicLicenseTier = 'Personal Master') => {
    const unitPrice = calculateTrackLicensePrice(track.price, tier, track.hasMultitracks);
    onPurchaseTrack(track, tier, unitPrice, (invoiceNumber, finalAmount) => {
      setPurchasedMap((prev) => ({
        ...prev,
        [track.id]: {
          trackId: track.id,
          licenseTier: tier,
          purchasedAt: new Date().toISOString(),
          invoiceNumber,
          pricePaid: finalAmount,
        },
      }));
      setCartItems((prev) => prev.filter((i) => i.trackId !== track.id));
      setCreatorStore(getStoreForUserAndPlatform(user.id, 'music'));
    });
  };

  const handleCheckoutCart = () => {
    const resolvedEntries = cartItems
      .map((item) => {
        const track = tracks.find((t) => t.id === item.trackId);
        if (!track) return null;
        return { track, licenseTier: item.licenseTier, unitPrice: item.unitPrice };
      })
      .filter(
        (e): e is { track: MusicTrack; licenseTier: MusicLicenseTier; unitPrice: number } =>
          e !== null
      );

    if (resolvedEntries.length === 0) return;

    if (onPurchaseMusicCart) {
      onPurchaseMusicCart(resolvedEntries, (invoiceNumber) => {
        const nowIso = new Date().toISOString();
        setPurchasedMap((prev) => {
          const next = { ...prev };
          resolvedEntries.forEach((entry) => {
            next[entry.track.id] = {
              trackId: entry.track.id,
              licenseTier: entry.licenseTier,
              purchasedAt: nowIso,
              invoiceNumber,
              pricePaid: entry.unitPrice,
            };
          });
          return next;
        });
        setCartItems([]);
        setIsCartOpen(false);
        setCreatorStore(getStoreForUserAndPlatform(user.id, 'music'));
      });
    } else {
      // Fallback to single purchase handler for backwards compatibility
      resolvedEntries.forEach((entry) => handleInstantPurchase(entry.track, entry.licenseTier));
      setCartItems([]);
      setIsCartOpen(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOpenStoreModal = (tab: CreatorModalTab) => {
    onRequireAuth(() => {
      setStoreModalTab(tab);
      setIsStoreModalOpen(true);
    }, 'Sign in to create your Artist Profile, link a Payment Account, and review the Storefront Service Agreement.');
  };

  const handleOpenUploadModal = () => {
    onRequireAuth(() => {
      setUploadError(null);
      if (creatorStore?.artistName) {
        setNewArtist(creatorStore.artistName);
      }
      setIsUploadModalOpen(true);
    }, 'Sign in or register as an Artist to upload and sell your music online.');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) {
      setUploadError('Please enter both track title and artist name.');
      return;
    }

    const parsedPrice = parseFloat(newPrice) || 7.99;
    const clampedPrice = Number(Math.min(10, Math.max(5, parsedPrice)).toFixed(2));
    const parsedBpm = Math.min(200, Math.max(60, parseInt(newBpm, 10) || 120));

    const newTrack: MusicTrack = {
      id: `track_${Date.now()}`,
      title: newTitle.trim(),
      artist: newArtist.trim(),
      artistId: creatorStore?.id || user.id,
      album: newAlbum.trim() || 'Singles & Releases',
      coverUrl: customCoverUrl.trim() || selectedPresetUrl,
      duration: '4:15',
      durationSeconds: 255,
      genre: newGenre,
      price: clampedPrice,
      bpm: parsedBpm,
      key: newKey.trim() || 'A Minor',
      plays: 1,
      likes: 1,
      releaseDate: new Date().toISOString().slice(0, 10),
      isrc: `TTG-M-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      format: 'WAV 24-bit 96kHz',
      hasMultitracks,
      description: `Original master release uploaded by ${newArtist.trim()} on TTG Music Store & Studio.`,
    };

    setTracks((prev) => [newTrack, ...prev]);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setCustomCoverUrl('');
    setCurrentTrack(newTrack);
    setPlaybackTime(0);
    setIsPlaying(true);
    engineRef.current?.start(newTrack, 'master');
  };

  const inspectedTrack = useMemo(
    () => tracks.find((t) => t.id === inspectTrackId) || null,
    [tracks, inspectTrackId]
  );

  const ownedCount = Object.keys(purchasedMap).length;
  const currentOwned = purchasedMap[currentTrack.id];
  const currentCartItem = cartItems.find((i) => i.trackId === currentTrack.id);

  return (
    <div className="bg-[#0e1014] text-stone-100 min-h-screen pb-36">
      {/* Studio Featured Header */}
      <div className="bg-linear-to-b from-emerald-950/60 via-[#111419] to-[#0e1014] border-b border-white/8 px-4 sm:px-8 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-white/12 group relative">
              <MusicArtwork
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                artist={currentTrack.artist}
                className="w-full h-full"
                imgClassName="group-hover:scale-105 transition-transform duration-500"
              />
              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Pause current preview' : 'Play current preview'}
                className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <span className="w-11 h-11 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center shadow-lg">
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </span>
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Disc3
                  className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '6s' }}
                />
                <span>TTG Studio Audio &amp; Multitrack Storefront</span>
                <span className="text-white/25">·</span>
                <span className="text-stone-300 font-normal normal-case">85% Direct Artist Royalty</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white truncate">
                {currentTrack.title}
              </h1>

              <p className="text-sm text-stone-300 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="font-semibold text-white">{currentTrack.artist}</span>
                <span className="text-stone-600">·</span>
                <span className="text-stone-400">{currentTrack.album}</span>
                <span className="text-stone-600">·</span>
                <span className="font-mono text-xs text-stone-300">
                  {currentTrack.bpm || 120} BPM · {currentTrack.key || 'A Minor'}
                </span>
                <span className="text-stone-600">·</span>
                <span className="font-mono font-bold text-emerald-400">${currentTrack.price.toFixed(2)}</span>
              </p>

              {/* Live Analyser Spectrum Bar */}
              <div className="pt-1 flex items-center gap-3">
                <canvas
                  ref={spectrumCanvasRef}
                  width={220}
                  height={26}
                  aria-label="Real-time audio frequency spectrum"
                  className="rounded bg-white/3 px-1.5 py-0.5 border border-white/6"
                />
                {currentTrack.hasMultitracks && (
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-stone-400">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                    {(['master', 'melody', 'bass', 'percussion'] as MusicAudioLayer[]).map((layer) => (
                      <button
                        key={layer}
                        type="button"
                        onClick={() => setActiveAudioLayer(layer)}
                        className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                          activeAudioLayer === layer
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                            : 'hover:text-white'
                        }`}
                      >
                        {layer === 'master' ? 'Mix' : layer}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              <span>{isPlaying ? 'Pause Preview' : 'Play Preview'}</span>
            </button>

            {currentOwned ? (
              <button
                type="button"
                onClick={() => exportTrackWavDownload(currentTrack, currentOwned.licenseTier)}
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download WAV</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  currentCartItem ? setIsCartOpen(true) : handleAddToCart(currentTrack, 'Personal Master')
                }
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>{currentCartItem ? 'View in Bag' : `Add to Bag ($${currentTrack.price.toFixed(2)})`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setInspectTrackId(currentTrack.id)}
              className="px-3.5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-stone-400" />
              <span>Specs &amp; Licenses</span>
            </button>

            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-white/12 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Upload Release</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open Studio Bag with ${cartItems.length} items`}
              className="px-3.5 py-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono">Bag ({cartItems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Creator Storefront, Payment Account & Service Agreement Bar */}
        <CreatorStorefrontBar
          platform="music"
          user={user}
          store={creatorStore}
          darkSurface
          onOpenStoreModal={handleOpenStoreModal}
          onUploadClick={handleOpenUploadModal}
          myStoreFilterActive={myStoreFilterActive}
          onToggleMyStoreFilter={() => setMyStoreFilterActive((prev) => !prev)}
          myItemsCount={myStoreTracksCount}
        />

        {/* Creator Earnings & 50-Sale Service Fee Threshold Dashboard */}
        <CreatorEarningsDashboard
          platform="music"
          user={user}
          store={creatorStore}
          darkSurface
          onOpenStoreModal={handleOpenStoreModal}
        />

        {/* Collection View Switcher + Search + Sort */}
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Primary Collection Tabs */}
            <div className="flex items-center gap-1 bg-white/4 p-1 rounded-lg border border-white/8 self-start">
              <button
                type="button"
                onClick={() => setCollectionTab('all')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  collectionTab === 'all'
                    ? 'bg-white text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Catalog ({tracks.length})
              </button>
              <button
                type="button"
                onClick={() => setCollectionTab('favorites')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  collectionTab === 'favorites'
                    ? 'bg-white text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Favorites ({likedTrackIds.size})
              </button>
              <button
                type="button"
                onClick={() => setCollectionTab('owned')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  collectionTab === 'owned'
                    ? 'bg-emerald-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Owned Library ({ownedCount})
              </button>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks, artists, albums..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort music tracks"
                  className="px-3 py-2 text-xs rounded-lg bg-stone-900 border border-white/10 text-stone-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="most_played">Sort: Most Played</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="bpm_desc">Tempo: Fastest BPM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Genre Filter Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {GENRE_FILTERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenre(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                  selectedGenre === g.id
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : 'bg-white/3 border-white/8 text-stone-400 hover:text-white hover:bg-white/8'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredTracks.length === 0 ? (
          <div className="py-16 px-6 rounded-2xl bg-white/3 border border-white/8 text-center">
            <Music className="w-10 h-10 text-stone-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No tracks match this filter</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
              {collectionTab === 'owned'
                ? 'Purchased tracks and commercial sync licenses will appear here with instant lossless WAV downloads.'
                : 'Try clearing your search query or switching back to All Genres.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setCollectionTab('all');
                setSelectedGenre('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-stone-950 text-xs font-bold hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Reset Catalog Filters
            </button>
          </div>
        ) : (
          <>
            {/* Catalog Product Grid */}
            <section aria-label="Featured Master Releases">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Master Releases &amp; Multitrack Audio
                </h2>
                <span className="text-xs text-stone-400 font-mono">
                  {filteredTracks.length} {filteredTracks.length === 1 ? 'Release' : 'Releases'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {filteredTracks.map((track) => {
                  const isSelected = currentTrack.id === track.id;
                  const isTrackPlaying = isSelected && isPlaying;
                  const isLiked = likedTrackIds.has(track.id);
                  const owned = purchasedMap[track.id];
                  const inBag = cartItems.find((i) => i.trackId === track.id);

                  return (
                    <article
                      key={track.id}
                      className={`p-3.5 rounded-xl bg-white/4 hover:bg-white/7 transition-all group flex flex-col justify-between border ${
                        isSelected ? 'border-emerald-500/60 bg-white/8' : 'border-white/8'
                      }`}
                    >
                      <div>
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-md border border-white/6">
                          <MusicArtwork
                            src={track.coverUrl}
                            alt={track.title}
                            artist={track.artist}
                            className="w-full h-full cursor-pointer"
                            imgClassName="group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setInspectTrackId(track.id)}
                            aria-label={`Inspect ${track.title} details and license tiers`}
                            className="absolute inset-0 bg-transparent cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTrackAndPlay(track);
                            }}
                            aria-label={isTrackPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                            className={`absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                              isTrackPlaying
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
                            }`}
                          >
                            {isTrackPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectTrackId(track.id)}
                          className="text-left w-full group/title focus:outline-none"
                        >
                          <h3
                            className="text-sm font-bold text-white group-hover/title:text-emerald-400 transition-colors truncate"
                            title={track.title}
                          >
                            {track.title}
                          </h3>
                        </button>
                        <p className="text-xs text-stone-300 truncate mt-0.5">{track.artist}</p>
                        <p className="text-[11px] text-stone-400 truncate mt-1 font-mono">
                          {track.bpm || 120} BPM · {track.key || 'A Minor'}
                          {track.hasMultitracks ? ' · Multitrack' : ''}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-mono font-bold text-emerald-400">
                            ${track.price.toFixed(2)}
                          </span>
                          <span className="block text-[10px] text-stone-400">
                            {owned ? 'Owned' : track.format.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(track.id)}
                            aria-label={isLiked ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`}
                            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${
                              isLiked ? 'text-rose-400' : 'text-stone-400 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          </button>

                          {owned ? (
                            <button
                              type="button"
                              onClick={() => exportTrackWavDownload(track, owned.licenseTier)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Download purchased WAV master"
                            >
                              <Download className="w-3 h-3" />
                              <span>WAV</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                inBag ? setIsCartOpen(true) : handleAddToCart(track, 'Personal Master')
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                inBag
                                  ? 'bg-emerald-500 text-stone-950'
                                  : 'bg-white/10 hover:bg-emerald-500 text-white hover:text-stone-950'
                              }`}
                            >
                              {inBag ? 'In Bag' : 'Add'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Detailed Marketplace Row Ledger */}
            <section className="bg-white/3 rounded-2xl border border-white/8 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Studio Audio Masters &amp; Licensing Ledger</span>
                </h3>
                <span className="text-xs text-stone-400 font-mono">
                  {filteredTracks.length} Tracks
                </span>
              </div>

              <div className="divide-y divide-white/6">
                {filteredTracks.map((track, idx) => {
                  const isSelected = currentTrack.id === track.id;
                  const isTrackPlaying = isSelected && isPlaying;
                  const owned = purchasedMap[track.id];
                  const inBag = cartItems.find((i) => i.trackId === track.id);

                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrackAndPlay(track)}
                      className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-white/8' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="text-xs font-mono text-stone-500 w-5 text-center shrink-0">
                          {isTrackPlaying ? (
                            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse inline" />
                          ) : (
                            idx + 1
                          )}
                        </span>

                        <MusicArtwork
                          src={track.coverUrl}
                          alt={track.title}
                          artist={track.artist}
                          className="w-11 h-11 rounded-lg shrink-0 border border-white/10"
                        />

                        <div className="min-w-0">
                          <h4
                            className={`text-sm font-bold truncate ${
                              isSelected ? 'text-emerald-400' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </h4>
                          <p className="text-xs text-stone-400 truncate">
                            {track.artist} · {track.album}
                          </p>
                        </div>
                      </div>

                      <div className="hidden lg:flex items-center gap-6 text-xs text-stone-400 shrink-0 font-mono">
                        <span className="w-44 truncate text-left font-sans">{track.genre}</span>
                        <span>{track.bpm} BPM · {track.key}</span>
                        <span>{track.plays.toLocaleString()} plays</span>
                        <span>{track.duration}</span>
                      </div>

                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setInspectTrackId(track.id)}
                          className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Licenses
                        </button>

                        {owned ? (
                          <button
                            type="button"
                            onClick={() => exportTrackWavDownload(track, owned.licenseTier)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-stone-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Download WAV</span>
                          </button>
                        ) : (
                          <>
                            <span className="text-xs font-mono font-bold text-emerald-400 mr-1">
                              ${track.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                inBag ? setIsCartOpen(true) : handleAddToCart(track, 'Personal Master')
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                                inBag
                                  ? 'bg-emerald-500 text-stone-950'
                                  : 'bg-white/10 hover:bg-emerald-500 hover:text-stone-950 text-white'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{inBag ? 'In Bag' : 'Add'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Persistent Studio Bottom Player */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#15181e]/95 backdrop-blur-md border-t border-white/12 px-4 py-3 text-stone-200">
        <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-64">
            <button
              type="button"
              onClick={() => setInspectTrackId(currentTrack.id)}
              className="shrink-0 rounded-lg overflow-hidden border border-white/10 cursor-pointer"
              title="Open Track Inspector"
            >
              <MusicArtwork
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                artist={currentTrack.artist}
                className="w-11 h-11"
              />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setInspectTrackId(currentTrack.id)}
                className="text-left w-full"
              >
                <h4 className="text-xs font-bold text-white truncate hover:text-emerald-400 transition-colors">
                  {currentTrack.title}
                </h4>
              </button>
              <p className="text-[11px] text-stone-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleLike(currentTrack.id)}
              aria-label="Toggle favorite for current track"
              className={`p-1 shrink-0 transition-colors cursor-pointer ${
                likedTrackIds.has(currentTrack.id)
                  ? 'text-rose-400'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${likedTrackIds.has(currentTrack.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center: Transport & Accessible Scrubber */}
          <div className="order-last sm:order-none w-full sm:w-auto sm:flex-1 max-w-xl flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsShuffle((prev) => !prev)}
                aria-label="Toggle shuffle"
                className={`transition-colors cursor-pointer ${
                  isShuffle ? 'text-emerald-400' : 'text-stone-500 hover:text-white'
                }`}
                title="Shuffle playback"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePrevTrack}
                aria-label="Previous track"
                className="text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-9 h-9 rounded-full bg-white text-stone-950 flex items-center justify-center hover:scale-105 transition-transform shadow cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleNextTrack}
                aria-label="Next track"
                className="text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsRepeat((prev) => !prev)}
                aria-label="Toggle repeat"
                className={`transition-colors cursor-pointer ${
                  isRepeat ? 'text-emerald-400' : 'text-stone-500 hover:text-white'
                }`}
                title="Loop current track"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full flex items-center gap-2 text-[11px] font-mono text-stone-400">
              <span className="w-9 text-right">{formatSeconds(playbackTime)}</span>
              <input
                type="range"
                min={0}
                max={currentTrack.durationSeconds}
                value={playbackTime}
                aria-label="Seek playback position"
                onChange={(e) => setPlaybackTime(Number(e.target.value))}
                className="flex-1 h-1 accent-emerald-500 bg-white/20 rounded-lg cursor-pointer"
              />
              <span className="w-9">{currentTrack.duration}</span>
            </div>
          </div>

          {/* Right: Purchase / Download + Volume */}
          <div className="flex items-center gap-3 shrink-0 sm:w-64 justify-end">
            {currentOwned ? (
              <button
                type="button"
                onClick={() => exportTrackWavDownload(currentTrack, currentOwned.licenseTier)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>WAV</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  currentCartItem ? setIsCartOpen(true) : handleInstantPurchase(currentTrack, 'Personal Master')
                }
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{currentCartItem ? `Bag (${cartItems.length})` : `Buy $${currentTrack.price.toFixed(2)}`}</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                aria-label="Master volume"
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

      {/* Studio Bag Checkout Drawer */}
      <MusicCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        tracks={tracks}
        onChangeLicenseTier={handleChangeCartLicense}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={() => setCartItems([])}
        onCheckout={handleCheckoutCart}
      />

      {/* Track Inspector & Audio Layer / License Modal */}
      <MusicTrackDetailModal
        track={inspectedTrack}
        isOpen={Boolean(inspectedTrack)}
        onClose={() => setInspectTrackId(null)}
        isPlayingCurrent={Boolean(inspectedTrack && currentTrack.id === inspectedTrack.id && isPlaying)}
        onTogglePlayTrack={handleSelectTrackAndPlay}
        activeAudioLayer={activeAudioLayer}
        onSelectAudioLayer={setActiveAudioLayer}
        isLiked={Boolean(inspectedTrack && likedTrackIds.has(inspectedTrack.id))}
        onToggleLike={handleToggleLike}
        purchasedRecord={inspectedTrack ? purchasedMap[inspectedTrack.id] : undefined}
        inCartTier={
          inspectedTrack
            ? cartItems.find((i) => i.trackId === inspectedTrack.id)?.licenseTier
            : undefined
        }
        onAddToCart={handleAddToCart}
        onInstantPurchase={handleInstantPurchase}
        userName={user.name}
      />

      {/* Artist Upload & Monetization Modal */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Upload Artist Music Release"
        >
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#13151a] border border-white/10 rounded-2xl shadow-2xl text-stone-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/4">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Artist Release: Upload &amp; Sell Master</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Close upload modal"
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Track Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Cognitive Horizon"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Artist / Producer</label>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="e.g. Aether Resonance"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Album / EP Name</label>
                  <input
                    type="text"
                    value={newAlbum}
                    onChange={(e) => setNewAlbum(e.target.value)}
                    placeholder="e.g. Sub-Zero Harmonics"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Primary Genre</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-stone-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Ambient Electronic / Modular">Ambient Electronic / Modular</option>
                    <option value="Deep Techno & Minimal">Deep Techno &amp; Minimal</option>
                    <option value="Neoclassical Acoustic & Piano">Neoclassical Acoustic &amp; Piano</option>
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
                      className="w-full pl-6 pr-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={newBpm}
                    onChange={(e) => setNewBpm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Musical Key</label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="F Minor"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              {/* Cover Art Studio Presets + Optional Custom URL */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-stone-300">
                  Studio Album Artwork
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {MUSIC_COVER_PRESETS.map((preset) => {
                    const isActive = !customCoverUrl.trim() && selectedPresetUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPresetUrl(preset.url);
                          setCustomCoverUrl('');
                        }}
                        title={preset.label}
                        className={`aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          isActive
                            ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                            : 'border-white/10 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
                <input
                  type="url"
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  placeholder="Optional custom artwork URL (leave empty to use selected studio cover)"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <label className="p-3 rounded-lg bg-white/4 border border-white/8 flex items-center justify-between text-xs cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">Include Multitrack Audio Layers (WAV)</span>
                  <span className="text-[11px] text-stone-400">
                    Unlocks Multitrack + Master remix tier &amp; real-time channel monitoring
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasMultitracks}
                  onChange={(e) => setHasMultitracks(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
              </label>

              {(() => {
                const salesSoFar = creatorStore?.completedSalesCount || 0;
                const post50 = salesSoFar >= CREATOR_FREE_SALES_THRESHOLD;
                const priceNum = parseFloat(newPrice) || 7.99;
                const netShare = post50 ? priceNum * 0.95 : priceNum;
                return (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-lg text-xs text-emerald-300 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold block text-white">
                        {post50
                          ? `Post-50 Sales Net Payout (95% Creator · 5% Site Service Fee)`
                          : `First 50 Sales Launch Payout (100% Net · 0% Site Fee)`}
                      </span>
                      <span className="text-[11px] text-emerald-300/80">
                        {post50
                          ? `${salesSoFar} sales completed — 5% site fee applies to each sale.`
                          : `${salesSoFar}/50 sales used — 5% site service fee starts after 50 sales.`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-white shrink-0">
                      ${netShare.toFixed(2)} / sale
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-colors shadow cursor-pointer"
                >
                  Publish &amp; Start Selling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Artist Profile, Online Storefront, Payment Account & Service Agreement Modal */}
      <CreatorProfileStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        platform="music"
        user={user}
        existingStore={creatorStore}
        initialTab={storeModalTab}
        onStoreSaved={(saved) => setCreatorStore(saved)}
        onProceedToUpload={handleOpenUploadModal}
      />
    </div>
  );
};
