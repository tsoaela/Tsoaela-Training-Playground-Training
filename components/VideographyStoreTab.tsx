import React, { useState, useEffect, useMemo } from 'react';
import { 
  Video, 
  Play, 
  Pause, 
  Upload, 
  Download, 
  Sparkles, 
  Search, 
  X, 
  Clock, 
  Layers, 
  Film, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw, 
  FastForward, 
  Volume2, 
  VolumeX, 
  Maximize2 
} from 'lucide-react';
import { CreatorStoreProfile, VideoItem, UserProfile } from '../types';
import { INITIAL_VIDEOS } from '../data/storesData';
import {
  CREATOR_FREE_SALES_THRESHOLD,
  getStoreForUserAndPlatform,
} from '../utils/creatorStoreSystem';
import { CreatorModalTab, CreatorProfileStoreModal } from './CreatorProfileStoreModal';
import { CreatorStorefrontBar } from './CreatorStorefrontBar';
import { CreatorEarningsDashboard } from './CreatorEarningsDashboard';

interface VideographyStoreTabProps {
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: (action: () => void, message: string) => void;
  onPurchaseVideo: (video: VideoItem, licenseType: 'Standard' | 'Broadcast') => void;
}

export const VideographyStoreTab: React.FC<VideographyStoreTabProps> = ({
  user,
  isAuthenticated,
  onRequireAuth,
  onPurchaseVideo,
}) => {
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_videos');
      return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    } catch {
      return INITIAL_VIDEOS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_videos', JSON.stringify(videos));
    } catch (e) {
      console.error(e);
    }
  }, [videos]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedLicense, setSelectedLicense] = useState<'Standard' | 'Broadcast'>('Standard');

  // Creator Storefront, Payment Account & Service Agreement State
  const [creatorStore, setCreatorStore] = useState<CreatorStoreProfile | null>(() =>
    getStoreForUserAndPlatform(user.id, 'videography')
  );
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeModalTab, setStoreModalTab] = useState<CreatorModalTab>('profile');
  const [myStoreFilterActive, setMyStoreFilterActive] = useState(false);

  useEffect(() => {
    const syncStore = () => setCreatorStore(getStoreForUserAndPlatform(user.id, 'videography'));
    syncStore();
    window.addEventListener('ttg-creator-store-updated', syncStore);
    return () => window.removeEventListener('ttg-creator-store-updated', syncStore);
  }, [user.id]);

  // Videographer Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCreator, setNewCreator] = useState(creatorStore?.artistName || user.name || '');
  const [newCategory, setNewCategory] = useState<VideoItem['category']>('Cinematic B-Roll');
  const [newResolution, setNewResolution] = useState<VideoItem['resolution']>('4K UHD (3840×2160)');
  const [newFps, setNewFps] = useState<number>(60);
  const [newCodec, setNewCodec] = useState<VideoItem['codec']>('Apple ProRes 422 HQ');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newPriceStandard, setNewPriceStandard] = useState('29.99');
  const [newPriceBroadcast, setNewPriceBroadcast] = useState('79.99');
  const [newDescription, setNewDescription] = useState('');

  // Video playback simulation timer
  useEffect(() => {
    let interval: any = null;
    if (activeVideo && isVideoPlaying) {
      interval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= activeVideo.durationSeconds) {
            setIsVideoPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [activeVideo, isVideoPlaying, playbackSpeed]);

  const myStoreVideosCount = useMemo(() => {
    if (!creatorStore) return 0;
    const targetName = creatorStore.artistName.trim().toLowerCase();
    return videos.filter(
      (v) =>
        v.creatorId === user.id ||
        v.creatorId === creatorStore.id ||
        v.creator.trim().toLowerCase() === targetName
    ).length;
  }, [videos, creatorStore, user.id]);

  const filteredVideos = videos.filter(v => {
    if (myStoreFilterActive && creatorStore) {
      const targetName = creatorStore.artistName.trim().toLowerCase();
      const belongsToMe =
        v.creatorId === user.id ||
        v.creatorId === creatorStore.id ||
        v.creator.trim().toLowerCase() === targetName;
      if (!belongsToMe) return false;
    }
    if (selectedCategory !== 'all' && v.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return v.title.toLowerCase().includes(q) || v.creator.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const handleOpenStoreModal = (tab: CreatorModalTab) => {
    onRequireAuth(() => {
      setStoreModalTab(tab);
      setIsStoreModalOpen(true);
    }, 'Sign in to create your Director Profile, link a Payment Account, and review the Storefront Service Agreement.');
  };

  const handleOpenUploadModal = () => {
    onRequireAuth(() => {
      if (creatorStore?.artistName) {
        setNewCreator(creatorStore.artistName);
      }
      setIsUploadModalOpen(true);
    }, 'Sign in or register as a Videographer to publish 4K / ProRes b-roll footage and documentary films.');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newThumbnailUrl.trim()) return;

    const newVideo: VideoItem = {
      id: `video_${Date.now()}`,
      title: newTitle.trim(),
      creator: newCreator.trim() || creatorStore?.artistName || user.name || 'Anonymous Director',
      creatorId: creatorStore?.id || user.id,
      duration: '0:50',
      durationSeconds: 50,
      resolution: newResolution,
      fps: newFps as any,
      codec: newCodec,
      category: newCategory,
      thumbnailUrl: newThumbnailUrl.trim(),
      priceStandard: parseFloat(newPriceStandard) || 29.99,
      priceBroadcast: parseFloat(newPriceBroadcast) || 79.99,
      aspectRatio: '2.39:1 Anamorphic',
      fileSizeBytes: '2.8 GB',
      downloads: 0,
      tags: ['ProRes', '4K', newCategory, 'Cinematic'],
      description: newDescription.trim() || 'High-fidelity cinema footage mastered for theatrical and commercial broadcast.'
    };

    setVideos(prev => [newVideo, ...prev]);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewThumbnailUrl('');
    setNewDescription('');
  };

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 24);
    return `00:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}:${frames < 10 ? '0' : ''}${frames}`;
  };

  const categories = [
    { id: 'all', label: 'All Footage' },
    { id: 'cinematic b-roll', label: 'Cinematic B-Roll' },
    { id: 'drone & aerial', label: 'Drone & Aerials' },
    { id: 'masterclass & tutorial', label: 'Masterclasses' },
  ];

  return (
    <div className="bg-stone-900 text-stone-100 min-h-screen pb-24">
      
      {/* Header Banner */}
      <div className="border-b border-white/10 bg-black/40 px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1 uppercase tracking-wider">
              <Film className="w-3.5 h-3.5" />
              <span>Cinematic Videography & Broadcast Footage Store</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              ProRes & 4K Cinema Stock
            </h1>
            <p className="text-sm text-stone-400 mt-1 max-w-2xl">
              High-bitrate anamorphic master footage, aerial reels, and studio masterclasses for directors and production houses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Footage & Sell</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <CreatorStorefrontBar
          platform="videography"
          user={user}
          store={creatorStore}
          darkSurface
          onOpenStoreModal={handleOpenStoreModal}
          onUploadClick={handleOpenUploadModal}
          myStoreFilterActive={myStoreFilterActive}
          onToggleMyStoreFilter={() => setMyStoreFilterActive((v) => !v)}
          myItemsCount={myStoreVideosCount}
        />

        <CreatorEarningsDashboard
          platform="videography"
          user={user}
          store={creatorStore}
          darkSurface
          onOpenStoreModal={handleOpenStoreModal}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search footage, codecs, tags..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-stone-500 focus:outline-none focus:border-rose-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <div 
              key={video.id}
              className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-rose-500/50 transition-all flex flex-col justify-between"
            >
              <div 
                className="relative aspect-16/9 overflow-hidden bg-black cursor-pointer"
                onClick={() => {
                  setActiveVideo(video);
                  setCurrentProgress(0);
                  setIsVideoPlaying(true);
                }}
              >
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />

                {/* Top Overlay Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white font-bold">
                    {video.resolution.split(' ')[0]}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-[10px] font-mono text-white font-bold">
                    {video.fps} FPS
                  </span>
                </div>

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-stone-300">
                  {video.duration}
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono text-stone-300">
                  {video.codec}
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white truncate">
                    {video.title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    by <span className="font-semibold text-stone-300">{video.creator}</span>
                  </p>
                </div>

                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  {video.description}
                </p>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Commercial License</span>
                    <span className="text-sm font-bold font-mono text-rose-400">
                      ${video.priceStandard.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveVideo(video);
                      setCurrentProgress(0);
                      setIsVideoPlaying(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Preview & License
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Cinematic Video Player & Licensing Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-stone-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-white truncate max-w-md">
                  {activeVideo.title}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setActiveVideo(null);
                  setIsVideoPlaying(false);
                }}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Canvas Simulation Container */}
            <div className="relative aspect-16/9 bg-black flex items-center justify-center overflow-hidden">
              <img 
                src={activeVideo.thumbnailUrl} 
                alt={activeVideo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />

              {/* Scanning lines / timecode HUD */}
              <div className="absolute top-4 left-4 font-mono text-xs text-rose-400 bg-black/80 px-2 py-1 rounded border border-rose-500/30">
                REC ● {formatTimecode(currentProgress)}
              </div>

              <div className="absolute top-4 right-4 font-mono text-xs text-stone-300 bg-black/80 px-2 py-1 rounded">
                {activeVideo.resolution} · {activeVideo.fps} FPS · {activeVideo.codec}
              </div>

              {/* Watermark for preview */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                <span className="text-4xl sm:text-6xl font-black text-white tracking-widest uppercase rotate-[-15deg] select-none">
                  TTG CINEMA PREVIEW
                </span>
              </div>

              {/* Scrubber and Play Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col gap-2">
                <div 
                  className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickRatio = (e.clientX - rect.left) / rect.width;
                    setCurrentProgress(Math.floor(clickRatio * activeVideo.durationSeconds));
                  }}
                >
                  <div 
                    className="h-full bg-rose-600 rounded-full"
                    style={{ width: `${(currentProgress / activeVideo.durationSeconds) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-stone-300">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className="p-1 text-white hover:text-rose-400"
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                    <span>{formatTimecode(currentProgress)} / {activeVideo.duration}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-[10px]">Speed:</span>
                    {[0.5, 1, 2].map(speed => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          playbackSpeed === speed ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Licensing Bar */}
            <div className="p-6 bg-stone-900 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedLicense('Standard')}
                  className={`flex-1 sm:flex-none p-3 rounded-xl border text-left transition-all ${
                    selectedLicense === 'Standard'
                      ? 'border-rose-500 bg-rose-950/40 text-white'
                      : 'border-white/10 text-stone-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold block">Standard Commercial</span>
                  <span className="text-[10px] text-stone-400">Web, YouTube, Social Ads · ${activeVideo.priceStandard.toFixed(2)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLicense('Broadcast')}
                  className={`flex-1 sm:flex-none p-3 rounded-xl border text-left transition-all ${
                    selectedLicense === 'Broadcast'
                      ? 'border-rose-500 bg-rose-950/40 text-white'
                      : 'border-white/10 text-stone-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold block">Broadcast & Theatrical</span>
                  <span className="text-[10px] text-stone-400">Television, Cinema, Streaming · ${activeVideo.priceBroadcast.toFixed(2)}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onPurchaseVideo(activeVideo, selectedLicense);
                  setActiveVideo(null);
                  setIsVideoPlaying(false);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>
                  Buy Master Footage (${selectedLicense === 'Standard' ? activeVideo.priceStandard.toFixed(2) : activeVideo.priceBroadcast.toFixed(2)})
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Videographer Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-stone-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-500" />
                Upload Cinematic Footage & Master Stock
              </h3>
              <button 
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Clip Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Alpine Storm Awakening"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Resolution</label>
                  <select
                    value={newResolution}
                    onChange={(e) => setNewResolution(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-800 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="4K UHD (3840×2160)">4K UHD (3840×2160)</option>
                    <option value="6K B-Roll (6144×3456)">6K B-Roll (6144×3456)</option>
                    <option value="8K Master (7680×4320)">8K Master (7680×4320)</option>
                    <option value="1080p FHD">1080p FHD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Codec</label>
                  <select
                    value={newCodec}
                    onChange={(e) => setNewCodec(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-800 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Apple ProRes 422 HQ">Apple ProRes 422 HQ</option>
                    <option value="Apple ProRes RAW">Apple ProRes RAW</option>
                    <option value="H.265 / HEVC 10-bit">H.265 / HEVC 10-bit</option>
                    <option value="REDCODE RAW">REDCODE RAW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Thumbnail Preview URL</label>
                <input
                  type="url"
                  value={newThumbnailUrl}
                  onChange={(e) => setNewThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Commercial Price ($)</label>
                  <input
                    type="number"
                    step="1.00"
                    min="10.00"
                    value={newPriceStandard}
                    onChange={(e) => setNewPriceStandard(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Broadcast Price ($)</label>
                  <input
                    type="number"
                    step="5.00"
                    min="30.00"
                    value={newPriceBroadcast}
                    onChange={(e) => setNewPriceBroadcast(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Clip Description & Camera Rig</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Captured with Cooke Anamorphic primes on ARRI ALEXA Mini LF..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Director / Creator Name</label>
                <input
                  type="text"
                  value={newCreator}
                  onChange={(e) => setNewCreator(e.target.value)}
                  placeholder="Your director or studio name"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              {(() => {
                const salesSoFar = creatorStore?.completedSalesCount || 0;
                const post50 = salesSoFar >= CREATOR_FREE_SALES_THRESHOLD;
                const priceNum = parseFloat(newPriceStandard) || 29.99;
                const netShare = post50 ? priceNum * 0.95 : priceNum;
                return (
                  <div className="p-3 bg-rose-950/35 border border-rose-700/50 rounded-xl text-xs text-rose-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold block text-white">
                        {post50
                          ? 'Post-50 Sales Net Payout (95% Creator · 5% Site Service Fee)'
                          : 'First 50 Sales Launch Payout (100% Net · 0% Site Fee)'}
                      </span>
                      <span className="text-[11px] text-rose-200/80">
                        {post50
                          ? `${salesSoFar} sales completed — 5% site fee paid to Site Owner.`
                          : `${salesSoFar}/50 sales used — 5% site service fee starts after 50 sales.`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-white shrink-0">
                      ${netShare.toFixed(2)}
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow"
                >
                  Publish Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Videographer Artist Profile, Payment Account & Service Agreement Modal */}
      <CreatorProfileStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        platform="videography"
        user={user}
        existingStore={creatorStore}
        initialTab={storeModalTab}
        onStoreSaved={(saved) => setCreatorStore(saved)}
        onProceedToUpload={handleOpenUploadModal}
      />

    </div>
  );
};
