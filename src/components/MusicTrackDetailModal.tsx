import React, { useEffect, useState } from 'react';
import {
  X,
  Play,
  Pause,
  Download,
  FileText,
  ShoppingBag,
  CheckCircle2,
  Sliders,
  Disc3,
  Heart,
} from 'lucide-react';
import {
  MusicLicenseTier,
  MusicAudioLayer,
  MusicTrack,
  PurchasedMusicRecord,
} from '../types';
import {
  calculateTrackLicensePrice,
  exportTrackLicenseCertificate,
  exportTrackWavDownload,
} from '../utils/musicAudioEngine';
import { MusicArtwork } from './MusicArtwork';

interface MusicTrackDetailModalProps {
  track: MusicTrack | null;
  isOpen: boolean;
  onClose: () => void;
  isPlayingCurrent: boolean;
  onTogglePlayTrack: (track: MusicTrack) => void;
  activeAudioLayer: MusicAudioLayer;
  onSelectAudioLayer: (layer: MusicAudioLayer) => void;
  isLiked: boolean;
  onToggleLike: (trackId: string) => void;
  purchasedRecord?: PurchasedMusicRecord;
  inCartTier?: MusicLicenseTier;
  onAddToCart: (track: MusicTrack, tier: MusicLicenseTier) => void;
  onInstantPurchase: (track: MusicTrack, tier: MusicLicenseTier) => void;
  userName: string;
}

const LICENSE_OPTIONS: {
  tier: MusicLicenseTier;
  subtitle: string;
  deliverables: string;
}[] = [
  {
    tier: 'Personal Master',
    subtitle: 'High-Res Stereo Master',
    deliverables: 'Lossless 24-bit WAV/FLAC archive & unlimited personal listening.',
  },
  {
    tier: 'Multitrack + Master',
    subtitle: 'Producer Remix Pack',
    deliverables: 'Stereo master plus isolated drum, bass, and harmonic audio layer renders.',
  },
  {
    tier: 'Commercial Sync',
    subtitle: 'Worldwide Broadcast & Media',
    deliverables: 'Cleared for films, games, SaaS demos, documentaries & client spots.',
  },
];

const AUDIO_CHANNELS: { id: MusicAudioLayer; label: string }[] = [
  { id: 'master', label: 'Full Mix' },
  { id: 'melody', label: 'Melody / Synth' },
  { id: 'bass', label: 'Sub / Bass' },
  { id: 'percussion', label: 'Drums / Perc' },
];

export const MusicTrackDetailModal: React.FC<MusicTrackDetailModalProps> = ({
  track,
  isOpen,
  onClose,
  isPlayingCurrent,
  onTogglePlayTrack,
  activeAudioLayer,
  onSelectAudioLayer,
  isLiked,
  onToggleLike,
  purchasedRecord,
  inCartTier,
  onAddToCart,
  onInstantPurchase,
  userName,
}) => {
  const [selectedTier, setSelectedTier] = useState<MusicLicenseTier>('Personal Master');

  useEffect(() => {
    if (inCartTier) {
      setSelectedTier(inCartTier);
    } else if (track?.hasMultitracks) {
      setSelectedTier('Personal Master');
    } else {
      setSelectedTier('Personal Master');
    }
  }, [track?.id, inCartTier]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  const computedPrice = calculateTrackLicensePrice(track.price, selectedTier, track.hasMultitracks);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Track details for ${track.title}`}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#13151a] border border-white/10 rounded-2xl shadow-2xl text-stone-100">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-[#13151a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Disc3 className="w-4 h-4 text-emerald-400" />
            <span>{track.isrc || 'TTG-MASTER'}</span>
            <span>·</span>
            <span>{track.format}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close track inspector"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Overview */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-52 aspect-square rounded-xl overflow-hidden border border-white/10 shrink-0 relative group">
              <MusicArtwork
                src={track.coverUrl}
                alt={track.title}
                artist={track.artist}
                className="w-full h-full"
              />
              <button
                type="button"
                onClick={() => onTogglePlayTrack(track)}
                aria-label={isPlayingCurrent ? 'Pause track' : 'Play track preview'}
                className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <span className="w-12 h-12 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center shadow-lg">
                  {isPlayingCurrent ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </span>
              </button>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {track.genre}
                </p>
                <h2 className="text-2xl font-extrabold text-white mt-1 leading-tight">
                  {track.title}
                </h2>
                <p className="text-sm text-stone-300 mt-1">
                  {track.artist} · <span className="text-stone-400">{track.album}</span>
                </p>
                <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                  {track.description}
                </p>
              </div>

              {/* Technical Specs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="block text-[11px] text-stone-500">Tempo</span>
                  <span className="font-mono font-semibold text-stone-200">{track.bpm || 120} BPM</span>
                </div>
                <div>
                  <span className="block text-[11px] text-stone-500">Key</span>
                  <span className="font-mono font-semibold text-stone-200">{track.key || 'A Minor'}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-stone-500">Duration</span>
                  <span className="font-mono font-semibold text-stone-200">{track.duration}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-stone-500">Streams</span>
                  <span className="font-mono font-semibold text-stone-200">{track.plays.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onTogglePlayTrack(track)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isPlayingCurrent ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlayingCurrent ? 'Pause Preview' : 'Play Studio Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleLike(track.id)}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isLiked
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                      : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{isLiked ? 'Favorited' : 'Favorite'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Channel Isolation Previewer */}
          {track.hasMultitracks && (
            <div className="p-4 rounded-xl bg-white/4 border border-white/8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Multitrack Channel Monitor
                  </h3>
                </div>
                <span className="text-[11px] text-stone-400">
                  Isolate individual synthesis buses in real time
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AUDIO_CHANNELS.map((ch) => {
                  const isActive = activeAudioLayer === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => onSelectAudioLayer(ch.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/3 border-white/8 text-stone-300 hover:bg-white/8'
                      }`}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Purchased Library Actions OR License Selector */}
          {purchasedRecord ? (
            <div className="p-5 rounded-xl bg-emerald-950/35 border border-emerald-500/35 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Owned in Your Library · {purchasedRecord.licenseTier}
                    </h3>
                    <p className="text-xs text-stone-300">
                      Invoice {purchasedRecord.invoiceNumber} · Purchased {purchasedRecord.purchasedAt.slice(0, 10)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => exportTrackWavDownload(track, purchasedRecord.licenseTier)}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Lossless WAV Master</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportTrackLicenseCertificate(track, purchasedRecord, userName)}
                  className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Download License Certificate</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  Select License Rights
                </h3>
                <span className="text-xs text-stone-400">85% net proceeds paid directly to {track.artist}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LICENSE_OPTIONS.map((opt) => {
                  const tierPrice = calculateTrackLicensePrice(track.price, opt.tier, track.hasMultitracks);
                  const isSelected = selectedTier === opt.tier;
                  return (
                    <button
                      key={opt.tier}
                      type="button"
                      onClick={() => setSelectedTier(opt.tier)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-500/12 border-emerald-400 ring-1 ring-emerald-400/50'
                          : 'bg-white/4 border-white/10 hover:bg-white/8'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{opt.tier}</span>
                          <span className="text-sm font-mono font-bold text-emerald-400">
                            ${tierPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-stone-300 mt-1">{opt.subtitle}</p>
                        <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                          {opt.deliverables}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(track, selectedTier);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>{inCartTier ? 'Update Bag License' : `Add to Bag ($${computedPrice.toFixed(2)})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInstantPurchase(track, selectedTier)}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Instant Checkout (${computedPrice.toFixed(2)})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
