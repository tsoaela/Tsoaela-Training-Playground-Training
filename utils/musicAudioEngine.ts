import { MusicLicenseTier, MusicAudioLayer, MusicTrack, PurchasedMusicRecord } from '../types';

const KEY_ROOT_FREQS: Record<string, number> = {
  'C Major': 130.81,
  'D Minor': 146.83,
  'E Minor': 164.81,
  'F Minor': 174.61,
  'G Minor': 196.00,
  'A Minor': 220.00,
  'B Minor': 246.94,
};

// Semitone intervals for minor/major musical scales
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 19];
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 19];

function midiOffsetToFreq(rootFreq: number, semitones: number): number {
  return rootFreq * Math.pow(2, semitones / 12);
}

export function calculateTrackLicensePrice(
  basePrice: number,
  tier: MusicLicenseTier,
  hasMultitracks?: boolean
): number {
  if (tier === 'Personal Master') {
    return Number(basePrice.toFixed(2));
  }
  if (tier === 'Multitrack + Master') {
    const multiplier = hasMultitracks ? 1.45 : 1.25;
    return Number((basePrice * multiplier).toFixed(2));
  }
  // Commercial Sync
  return Number((basePrice * 2.4).toFixed(2));
}

export class MusicAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private stepTimer: number | null = null;
  private stepIndex = 0;
  private activeTrack: MusicTrack | null = null;
  private audioLayer: MusicAudioLayer = 'master';
  private volume = 0.8;
  private isMuted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -16;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 4;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = (this.isMuted ? 0 : this.volume) * 0.45;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.78;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // Pre-bake 0.5s white noise buffer for hats/snare transients
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public start(track: MusicTrack, layer: MusicAudioLayer = this.audioLayer): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.compressor) return;

    this.stopTimerOnly();
    this.activeTrack = track;
    this.audioLayer = layer;
    this.stepIndex = 0;

    if (this.masterGain) {
      const targetGain = (this.isMuted ? 0 : this.volume) * 0.45;
      this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.03);
    }

    const bpm = Math.min(160, Math.max(68, track.bpm || 118));
    const eighthStepMs = Math.round((60 / bpm / 2) * 1000);

    // Fire immediate step cleanly without clicking
    this.triggerStep(ctx, track, this.stepIndex++);
    this.stepTimer = window.setInterval(() => {
      if (!this.activeTrack || !this.ctx) return;
      this.triggerStep(this.ctx, this.activeTrack, this.stepIndex++);
    }, eighthStepMs);
  }

  public setAudioLayer(layer: MusicAudioLayer): void {
    this.audioLayer = layer;
  }

  public setVolume(volume: number, muted: boolean): void {
    this.volume = volume;
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = muted ? 0 : volume * 0.45;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }
  }

  public stop(): void {
    this.stopTimerOnly();
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      } catch {
        // Ignore teardown race
      }
    }
  }

  public dispose(): void {
    this.stop();
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // Ignore close error
      }
      this.ctx = null;
      this.analyser = null;
      this.masterGain = null;
      this.compressor = null;
    }
  }

  public getFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteFrequencyData(target);
    return true;
  }

  private stopTimerOnly(): void {
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }

  private triggerStep(ctx: AudioContext, track: MusicTrack, step: number): void {
    if (!this.compressor) return;

    const now = ctx.currentTime;
    const isMajor = (track.key || '').toLowerCase().includes('major');
    const scale = isMajor ? MAJOR_SCALE : MINOR_SCALE;
    const rootFreq = KEY_ROOT_FREQS[track.key || ''] || 174.61;
    const genreLower = track.genre.toLowerCase();

    const playBass = this.audioLayer === 'master' || this.audioLayer === 'bass';
    const playMelody = this.audioLayer === 'master' || this.audioLayer === 'melody';
    const playPercussion = this.audioLayer === 'master' || this.audioLayer === 'percussion';

    const barStep = step % 16;

    // 1. Sub / Bass layer
    if (playBass && (barStep % 2 === 0 || (genreLower.includes('techno') && barStep % 2 === 1))) {
      const bassDeg = barStep < 8 ? 0 : barStep < 12 ? 3 : 4;
      const bassFreq = midiOffsetToFreq(rootFreq, scale[bassDeg]) / 2;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      osc.type = genreLower.includes('neoclassical') ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(genreLower.includes('techno') ? 380 : 280, now);
      filter.frequency.exponentialRampToValueAtTime(110, now + 0.22);

      const amp = genreLower.includes('neoclassical') ? 0.14 : 0.24;
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(amp, now + 0.015);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.compressor);

      osc.start(now);
      osc.stop(now + 0.28);
      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        env.disconnect();
      };
    }

    // 2. Lead / Chord / Arpeggio layer
    const melodyPattern = genreLower.includes('neoclassical')
      ? [0, 2, 4, 7, 4, 2, 0, 5]
      : genreLower.includes('synthwave')
      ? [0, 4, 7, 9, 7, 4, 5, 7]
      : [0, 2, 4, 6, 4, 7, 5, 3];

    if (playMelody && (!genreLower.includes('ambient') || barStep % 2 === 0)) {
      const degreeIdx = melodyPattern[step % melodyPattern.length];
      const noteFreq = midiOffsetToFreq(rootFreq, scale[degreeIdx % scale.length]);

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      osc.type = genreLower.includes('neoclassical')
        ? 'sine'
        : genreLower.includes('ambient')
        ? 'triangle'
        : 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(genreLower.includes('synthwave') ? 2100 : 1200, now);
      filter.Q.value = genreLower.includes('synthwave') ? 3.5 : 1.0;

      const decay = genreLower.includes('ambient') ? 0.55 : genreLower.includes('neoclassical') ? 0.45 : 0.24;
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.14, now + 0.015);
      env.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.compressor);

      osc.start(now);
      osc.stop(now + decay + 0.03);
      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        env.disconnect();
      };
    }

    // 3. Percussion layer (kick + crisp hat)
    if (playPercussion && !genreLower.includes('neoclassical')) {
      const isKick = genreLower.includes('techno') || genreLower.includes('synthwave')
        ? barStep % 2 === 0
        : barStep === 0 || barStep === 6 || barStep === 8;

      if (isKick) {
        const kickOsc = ctx.createOscillator();
        const kickEnv = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(115, now);
        kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.11);

        kickEnv.gain.setValueAtTime(0.32, now);
        kickEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        kickOsc.connect(kickEnv);
        kickEnv.connect(this.compressor);

        kickOsc.start(now);
        kickOsc.stop(now + 0.18);
        kickOsc.onended = () => {
          kickOsc.disconnect();
          kickEnv.disconnect();
        };
      }

      const isHat = barStep % 2 === 1 && !genreLower.includes('ambient');
      if (isHat && this.noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6500;

        const hatEnv = ctx.createGain();
        hatEnv.gain.setValueAtTime(0.06, now);
        hatEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        noise.connect(hp);
        hp.connect(hatEnv);
        hatEnv.connect(this.compressor);

        noise.start(now);
        noise.stop(now + 0.06);
        noise.onended = () => {
          noise.disconnect();
          hp.disconnect();
          hatEnv.disconnect();
        };
      }
    }
  }
}

/**
 * Generates an authentic downloadable 16-bit Stereo 44.1kHz PCM WAV file matching
 * the track's musical key and BPM so purchased masters download a real playable asset.
 */
export function exportTrackWavDownload(track: MusicTrack, tier: MusicLicenseTier): void {
  const sampleRate = 44100;
  const durationSeconds = 8;
  const numChannels = 2;
  const totalSamples = sampleRate * durationSeconds;

  const isMajor = (track.key || '').toLowerCase().includes('major');
  const scale = isMajor ? MAJOR_SCALE : MINOR_SCALE;
  const rootFreq = KEY_ROOT_FREQS[track.key || ''] || 174.61;
  const bpm = Math.min(160, Math.max(68, track.bpm || 118));
  const stepDuration = 60 / bpm / 2;

  const bufferLength = 44 + totalSamples * numChannels * 2;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // Standard RIFF/WAVE PCM header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const step = Math.floor(t / stepDuration);
    const stepLocal = t - step * stepDuration;

    const noteIdx = [0, 2, 4, 7, 4, 2, 5, 3][step % 8];
    const leadFreq = midiOffsetToFreq(rootFreq, scale[noteIdx % scale.length]);
    const subFreq = rootFreq / 2;

    const env = Math.exp(-stepLocal * 6.5) * Math.min(1, stepLocal * 80);
    const fadeOut = t > durationSeconds - 0.6 ? Math.max(0, (durationSeconds - t) / 0.6) : 1;

    const lead = Math.sin(2 * Math.PI * leadFreq * t) * 0.25 + Math.sin(2 * Math.PI * leadFreq * 2 * t) * 0.08;
    const sub = Math.sin(2 * Math.PI * subFreq * t) * 0.22;
    const shimmerL = Math.sin(2 * Math.PI * (leadFreq * 1.003) * t) * 0.07;
    const shimmerR = Math.sin(2 * Math.PI * (leadFreq * 0.997) * t) * 0.07;

    const sampleL = Math.max(-0.95, Math.min(0.95, (lead * env + sub + shimmerL) * fadeOut));
    const sampleR = Math.max(-0.95, Math.min(0.95, (lead * env + sub + shimmerR) * fadeOut));

    view.setInt16(offset, Math.round(sampleL * 32767), true);
    view.setInt16(offset + 2, Math.round(sampleR * 32767), true);
    offset += 4;
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const slug = track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tierSlug = tier.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}_${tierSlug}_master.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportTrackLicenseCertificate(
  track: MusicTrack,
  record: PurchasedMusicRecord | undefined,
  licenseeName: string
): void {
  const tier = record?.licenseTier || 'Personal Master';
  const invoice = record?.invoiceNumber || `INV-AUD-${track.isrc || track.id}`;
  const dateStr = record?.purchasedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);

  const lines = [
    '====================================================================',
    '  TTG - TSOAELA TRAINING GROUND PLATFORM :: AUDIO LICENSE CERTIFICATE',
    '====================================================================',
    '',
    `Certificate Reference : ${invoice}`,
    `Issue Date            : ${dateStr}`,
    `Licensee              : ${licenseeName || 'Verified TTG Member'}`,
    '',
    'MASTER RECORDING DETAILS',
    '--------------------------------------------------------------------',
    `Track Title           : ${track.title}`,
    `Artist / Creator      : ${track.artist}`,
    `Album / Release       : ${track.album}`,
    `Genre                 : ${track.genre}`,
    `ISRC Code             : ${track.isrc || 'TTG-M-2026-MASTER'}`,
    `Audio Specification   : ${track.format} · ${track.bpm || 120} BPM · ${track.key || 'Original Key'}`,
    `Multitracks Included  : ${tier === 'Multitrack + Master' || tier === 'Commercial Sync' ? (track.hasMultitracks ? 'Yes (Multitrack Submixes)' : 'Extended WAV Package') : 'Stereo Master Only'}`,
    '',
    'GRANTED RIGHTS & USAGE TIER',
    '--------------------------------------------------------------------',
    `License Tier          : ${tier}`,
    tier === 'Commercial Sync'
      ? 'Rights Granted        : Worldwide commercial film, broadcast, game, podcast & paid campaign sync rights.'
      : tier === 'Multitrack + Master'
      ? 'Rights Granted        : Personal master playback + multitrack channel remix & non-broadcast creative project rights.'
      : 'Rights Granted        : Unlimited personal lossless streaming & offline high-resolution archival playback.',
    '',
    '85% of net proceeds from this release were allocated directly to the artist.',
    '====================================================================',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug = track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}_license_certificate.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
