import React, { useEffect } from 'react';
import { X, ShoppingBag, Trash2, ShieldCheck, ArrowRight, Disc3 } from 'lucide-react';
import { MusicCartItem, MusicLicenseTier, MusicTrack } from '../types';
import { calculateTrackLicensePrice } from '../utils/musicAudioEngine';
import { MusicArtwork } from './MusicArtwork';

interface MusicCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: MusicCartItem[];
  tracks: MusicTrack[];
  onChangeLicenseTier: (trackId: string, tier: MusicLicenseTier) => void;
  onRemoveItem: (trackId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

const LICENSE_TIERS: MusicLicenseTier[] = ['Personal Master', 'Multitrack + Master', 'Commercial Sync'];

export const MusicCartDrawer: React.FC<MusicCartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  tracks,
  onChangeLicenseTier,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedItems = cartItems
    .map((item) => {
      const track = tracks.find((t) => t.id === item.trackId);
      if (!track) return null;
      return { item, track };
    })
    .filter((entry): entry is { item: MusicCartItem; track: MusicTrack } => entry !== null);

  const subtotal = resolvedItems.reduce((sum, entry) => sum + entry.item.unitPrice, 0);
  const artistShare = subtotal * 0.85;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Music Store Checkout Bag"
    >
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-[#111317] border-l border-white/10 text-stone-100 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Studio Bag</h2>
              <p className="text-xs text-stone-400">
                {resolvedItems.length} {resolvedItems.length === 1 ? 'release' : 'releases'} selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Studio Bag"
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {resolvedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Disc3 className="w-7 h-7 text-stone-500" />
              </div>
              <h3 className="text-sm font-bold text-white">Your studio bag is empty</h3>
              <p className="text-xs text-stone-400 mt-1.5 max-w-xs leading-relaxed">
                Add lossless WAV masters, multitrack audio mixes, or commercial sync licenses from the catalog to build your collection.
              </p>
            </div>
          ) : (
            resolvedItems.map(({ item, track }) => (
              <div
                key={track.id}
                className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <MusicArtwork
                    src={track.coverUrl}
                    alt={track.title}
                    artist={track.artist}
                    className="w-14 h-14 rounded-lg shrink-0 border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                    <p className="text-xs text-stone-400 truncate">
                      {track.artist} · {track.format}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      ${item.unitPrice.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(track.id)}
                      aria-label={`Remove ${track.title} from bag`}
                      className="block ml-auto mt-1 text-stone-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1.5">
                    License Rights Tier
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LICENSE_TIERS.map((tier) => {
                      const tierPrice = calculateTrackLicensePrice(track.price, tier, track.hasMultitracks);
                      const isSelected = item.licenseTier === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => onChangeLicenseTier(track.id, tier)}
                          className={`px-2 py-1.5 rounded-lg text-left border transition-all text-[11px] cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                              : 'bg-white/3 border-white/8 text-stone-300 hover:bg-white/8'
                          }`}
                        >
                          <span className="block font-semibold truncate">{tier.split(' ')[0]}</span>
                          <span className="block font-mono text-[10px] opacity-85">
                            ${tierPrice.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {resolvedItems.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-[#0c0e12] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-stone-400">
                <span>Artist Royalty Share (85%)</span>
                <span className="font-mono text-stone-200">${artistShare.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
                <span>Order Total (USD)</span>
                <span className="font-mono text-lg text-emerald-400">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant lossless WAV download & official license certificate issued immediately.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClearCart}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-400 hover:text-white hover:bg-white/8 border border-white/10 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onCheckout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <span>Complete Checkout (${subtotal.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
