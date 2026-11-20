import React, { useMemo, useState } from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  AudioLines,
  Waves,
  Disc3,
  Clock,
  X,
} from 'lucide-react';
import { DeepWorkAmbienceController } from '../hooks/useDeepWorkAmbience';
import {
  AMBIENCE_TRACKS,
  AmbienceCategory,
} from '../utils/deepWorkAmbienceEngine';

export interface DeepWorkAmbienceSoundboardProps {
  ambience: DeepWorkAmbienceController;
  isStudySessionActive: boolean;
}

interface QuickMixPreset {
  id: string;
  label: string;
  trackIds: string[];
}

const QUICK_PRESETS: QuickMixPreset[] = [
  {
    id: 'preset_lofi_rain',
    label: 'Lofi Beats + Midnight Rain',
    trackIds: ['lofi_late_night', 'midnight_rain'],
  },
  {
    id: 'preset_brown_focus',
    label: 'Warm Brown Noise',
    trackIds: ['brown_noise'],
  },
  {
    id: 'preset_botanical_hall',
    label: 'Botanical Chillhop + Hall',
    trackIds: ['lofi_botanical', 'study_hall'],
  },
];

export const DeepWorkAmbienceSoundboard: React.FC<DeepWorkAmbienceSoundboardProps> = ({
  ambience,
  isStudySessionActive,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | AmbienceCategory>('all');

  const visibleTracks = useMemo(() => {
    if (categoryFilter === 'all') return AMBIENCE_TRACKS;
    return AMBIENCE_TRACKS.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  const activeCount = ambience.activeTrackIds.length;
  const hasPausedMix = activeCount === 0 && ambience.pausedTrackIds.length > 0;
  const masterPct = Math.round(ambience.masterVolume * 100);

  return (
    <section
      aria-labelledby="deep-work-ambience-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-5 shadow-xs"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span>Deep Work Ambience · Curated White Noise &amp; Lofi Beats</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3
              id="deep-work-ambience-heading"
              className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              Deep Work Ambience Soundboard
            </h3>
            <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
              {activeCount > 0
                ? `${activeCount} active layer${activeCount === 1 ? '' : 's'}${ambience.isMuted ? ' (Muted)' : ''}`
                : 'Standby'}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Layer synthesized acoustic masking and procedural lofi study beats. Automatically pauses when your study session ends.
          </p>
        </div>

        {/* Master Playback & Auto-Pause Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() => ambience.pausePlayback()}
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Mix</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={ambience.resumePlayback}
              className="px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{hasPausedMix ? 'Resume Mix' : 'Start Focus Mix'}</span>
            </button>
          )}

          {activeCount > 0 && (
            <button
              type="button"
              onClick={ambience.stopAll}
              title="Clear all active layers"
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer"
              aria-label="Stop all ambience tracks"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Master Mute + Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60">
            <button
              type="button"
              onClick={ambience.toggleMute}
              className="text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white cursor-pointer"
              aria-label={ambience.isMuted ? 'Unmute master volume' : 'Mute master volume'}
              title={ambience.isMuted ? 'Unmute' : 'Mute'}
            >
              {ambience.isMuted || masterPct === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={ambience.isMuted ? 0 : masterPct}
              onChange={(e) => ambience.setMasterVolume(Number(e.target.value) / 100)}
              aria-label="Master ambience volume"
              className="w-20 sm:w-24 accent-indigo-600 cursor-pointer"
            />
            <span className="text-[11px] font-mono tabular-nums text-stone-600 dark:text-stone-400 w-8 text-right">
              {ambience.isMuted ? '0%' : `${masterPct}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Auto-Pause Notification (Shown when session end paused audio) */}
      {ambience.lastAutoPauseReason && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium">{ambience.lastAutoPauseReason}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={ambience.resumePlayback}
              className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold cursor-pointer whitespace-nowrap"
            >
              Resume Ambience
            </button>
            <button
              type="button"
              onClick={ambience.clearAutoPauseReason}
              aria-label="Dismiss auto-pause notification"
              className="p-1 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs, Presets & Auto-Pause Toggle Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div
            role="tablist"
            aria-label="Filter soundboard tracks"
            className="inline-flex items-center p-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-xs"
          >
            {(
              [
                { id: 'all', label: 'All Sounds' },
                { id: 'white_noise', label: 'White Noise' },
                { id: 'lofi_beats', label: 'Lofi Beats' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={categoryFilter === tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-lg font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  categoryFilter === tab.id
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="hidden sm:inline text-stone-300 dark:text-stone-700" aria-hidden="true">
            |
          </span>

          {/* Quick Mix Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mr-0.5">
              Quick Mix:
            </span>
            {QUICK_PRESETS.map((preset) => {
              const isExactMatch =
                ambience.activeTrackIds.length === preset.trackIds.length &&
                preset.trackIds.every((id) => ambience.activeTrackIds.includes(id));
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => ambience.applyPreset(preset.trackIds)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                    isExactMatch
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-Pause On Study End Switch */}
        <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={ambience.autoPauseOnSessionEnd}
            onChange={(e) => ambience.setAutoPauseOnSessionEnd(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
          />
          <span>Auto-pause when study session ends</span>
          <span className="text-[11px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
            · {isStudySessionActive ? 'Session Live' : 'Armed'}
          </span>
        </label>
      </div>

      {/* Soundboard Track Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {visibleTracks.map((track) => {
          const isActive = ambience.activeTrackIds.includes(track.id);
          const layerPct = Math.round(
            (ambience.trackVolumes[track.id] ?? track.defaultVolume) * 100
          );
          const isLofi = track.category === 'lofi_beats';

          return (
            <div
              key={track.id}
              className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                isActive
                  ? 'border-indigo-500/80 dark:border-indigo-500/70 bg-indigo-50/50 dark:bg-indigo-950/25'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                    {isLofi ? (
                      <Disc3
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive && !ambience.isMuted
                            ? 'text-indigo-600 dark:text-indigo-400 animate-spin'
                            : 'text-stone-400'
                        }`}
                      />
                    ) : (
                      <Waves
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive && !ambience.isMuted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-stone-400'
                        }`}
                      />
                    )}
                    <span>{isLofi ? 'Lofi Beats' : 'White Noise'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{track.acousticProfile}</span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {track.name}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                    {track.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => ambience.toggleTrack(track.id)}
                  aria-pressed={isActive}
                  aria-label={`${isActive ? 'Pause' : 'Play'} ${track.name}`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  {isActive ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Per-Track Mixer Level Slider */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-stone-200/70 dark:border-stone-800">
                <AudioLines
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-stone-400 dark:text-stone-600'
                  }`}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={layerPct}
                  onChange={(e) =>
                    ambience.setTrackVolume(track.id, Number(e.target.value) / 100)
                  }
                  aria-label={`${track.name} layer volume`}
                  className="flex-1 accent-indigo-600 cursor-pointer"
                />
                <span className="text-[11px] font-mono tabular-nums text-stone-600 dark:text-stone-400 w-8 text-right">
                  {layerPct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
