export type AmbienceCategory = 'white_noise' | 'lofi_beats';

export interface AmbienceTrackDefinition {
  id: string;
  name: string;
  category: AmbienceCategory;
  subtitle: string;
  acousticProfile: string;
  defaultVolume: number;
  bpm?: number;
}

export const AMBIENCE_TRACKS: AmbienceTrackDefinition[] = [
  {
    id: 'white_noise',
    name: 'Crisp White Noise',
    category: 'white_noise',
    subtitle: 'Broadband acoustic masking for distracting rooms',
    acousticProfile: '180 Hz – 6.5 kHz soft shelf',
    defaultVolume: 0.42,
  },
  {
    id: 'brown_noise',
    name: 'Warm Brown Noise',
    category: 'white_noise',
    subtitle: 'Deep low-frequency rumble ideal for dense reading',
    acousticProfile: '260 Hz warm low-pass',
    defaultVolume: 0.58,
  },
  {
    id: 'midnight_rain',
    name: 'Midnight Rain',
    category: 'white_noise',
    subtitle: 'Filtered pink-noise rainfall with slow organic swell',
    acousticProfile: '1.1 kHz modulated rainfall',
    defaultVolume: 0.55,
  },
  {
    id: 'study_hall',
    name: 'Quiet Study Hall',
    category: 'white_noise',
    subtitle: 'Soft library room tone for steady reading cadence',
    acousticProfile: '420 Hz acoustic room tone',
    defaultVolume: 0.48,
  },
  {
    id: 'lofi_late_night',
    name: 'Late-Night Lofi Beats',
    category: 'lofi_beats',
    subtitle: 'Detuned Rhodes Dm9 chords, soft boom-bap & subtle vinyl',
    acousticProfile: '74 BPM · Dm9 → Cmaj9',
    defaultVolume: 0.68,
    bpm: 74,
  },
  {
    id: 'lofi_botanical',
    name: 'Botanical Chillhop',
    category: 'lofi_beats',
    subtitle: 'Warm electric piano arpeggios & brushed rimbeat groove',
    acousticProfile: '82 BPM · Fmaj7 → Cmaj7',
    defaultVolume: 0.64,
    bpm: 82,
  },
];

interface RunningNoiseNode {
  source: AudioBufferSourceNode;
  gain: GainNode;
  lfo?: OscillatorNode;
  extraSources?: AudioBufferSourceNode[];
}

interface RunningLofiLoop {
  timerId: number;
  gain: GainNode;
  step: number;
  crackleSource?: AudioBufferSourceNode;
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const LATE_NIGHT_CHORDS: number[][] = [
  [50, 57, 60, 64, 67], // Dm9
  [43, 53, 57, 59, 64], // G13
  [48, 55, 59, 62, 67], // Cmaj9
  [45, 55, 58, 61, 65], // A7alt
];

const BOTANICAL_CHORDS: number[][] = [
  [53, 60, 64, 69, 72], // Fmaj7
  [52, 59, 62, 67, 71], // Em7
  [50, 57, 60, 64, 69], // Dm9
  [48, 55, 59, 64, 67], // Cmaj7
];

export class DeepWorkAmbienceEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private whiteBuffer: AudioBuffer | null = null;
  private pinkBuffer: AudioBuffer | null = null;
  private brownBuffer: AudioBuffer | null = null;
  private crackleBuffer: AudioBuffer | null = null;

  private noiseLayers = new Map<string, RunningNoiseNode>();
  private lofiLoops = new Map<string, RunningLofiLoop>();

  private masterVolume = 0.72;
  private isMuted = false;
  private trackVolumes: Record<string, number> = Object.fromEntries(
    AMBIENCE_TRACKS.map((t) => [t.id, t.defaultVolume])
  );

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 16;
        this.compressor.ratio.value = 3.5;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume * 0.65;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.buildNoiseBuffers(this.ctx);
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private buildNoiseBuffers(ctx: AudioContext): void {
    const length = Math.floor(ctx.sampleRate * 3);

    // 1. White noise
    const white = ctx.createBuffer(1, length, ctx.sampleRate);
    const wData = white.getChannelData(0);
    for (let i = 0; i < length; i++) {
      wData[i] = Math.random() * 2 - 1;
    }
    this.whiteBuffer = white;

    // 2. Pink noise (Paul Kellet's refined filter)
    const pink = ctx.createBuffer(1, length, ctx.sampleRate);
    const pData = pink.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const whiteSample = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + whiteSample * 0.0555179;
      b1 = 0.99332 * b1 + whiteSample * 0.0750759;
      b2 = 0.96900 * b2 + whiteSample * 0.1538520;
      b3 = 0.86650 * b3 + whiteSample * 0.3104856;
      b4 = 0.55000 * b4 + whiteSample * 0.5329522;
      b5 = -0.7616 * b5 - whiteSample * 0.0168980;
      pData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteSample * 0.5362) * 0.11;
      b6 = whiteSample * 0.115926;
    }
    this.pinkBuffer = pink;

    // 3. Brown noise (integrated random walk + seamless crossfade at ends)
    const brown = ctx.createBuffer(1, length, ctx.sampleRate);
    const brData = brown.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const whiteSample = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * whiteSample) / 1.02;
      brData[i] = lastOut * 3.1;
    }
    const fadeSamples = Math.min(2048, Math.floor(length * 0.05));
    for (let i = 0; i < fadeSamples; i++) {
      const alpha = i / fadeSamples;
      brData[i] = brData[i] * alpha + brData[length - fadeSamples + i] * (1 - alpha);
    }
    this.brownBuffer = brown;

    // 4. Vinyl crackle sparse dust impulses
    const crackle = ctx.createBuffer(1, length, ctx.sampleRate);
    const cData = crackle.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const r = Math.random();
      cData[i] = r > 0.9987 ? (Math.random() * 2 - 1) * 0.35 : (Math.random() * 2 - 1) * 0.004;
    }
    this.crackleBuffer = crackle;
  }

  public syncActiveTracks(
    activeIds: string[],
    trackVolumes: Record<string, number>,
    masterVolume: number,
    isMuted: boolean
  ): void {
    this.masterVolume = masterVolume;
    this.isMuted = isMuted;
    this.trackVolumes = { ...this.trackVolumes, ...trackVolumes };

    if (activeIds.length === 0) {
      this.stopAllLayers();
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.compressor || !this.masterGain) return;

    const now = ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(isMuted ? 0 : masterVolume * 0.65, now, 0.05);

    const wanted = new Set(activeIds);

    // Stop layers no longer active
    for (const id of Array.from(this.noiseLayers.keys())) {
      if (!wanted.has(id)) {
        this.stopNoiseLayer(id);
      }
    }
    for (const id of Array.from(this.lofiLoops.keys())) {
      if (!wanted.has(id)) {
        this.stopLofiLoop(id);
      }
    }

    // Start or update active layers
    for (const id of activeIds) {
      const vol = this.trackVolumes[id] ?? 0.5;
      if (id === 'lofi_late_night' || id === 'lofi_botanical') {
        const existing = this.lofiLoops.get(id);
        if (existing) {
          existing.gain.gain.setTargetAtTime(vol * 0.85, now, 0.05);
        } else {
          this.startLofiLoop(ctx, id, vol);
        }
      } else {
        const existing = this.noiseLayers.get(id);
        if (existing) {
          existing.gain.gain.setTargetAtTime(vol * 0.6, now, 0.05);
        } else {
          this.startNoiseLayer(ctx, id, vol);
        }
      }
    }
  }

  private startNoiseLayer(ctx: AudioContext, id: string, vol: number): void {
    if (!this.compressor) return;
    const buffer =
      id === 'brown_noise' || id === 'study_hall'
        ? this.brownBuffer
        : id === 'midnight_rain'
        ? this.pinkBuffer
        : this.whiteBuffer;
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const layerGain = ctx.createGain();
    layerGain.gain.setValueAtTime(0.001, ctx.currentTime);
    layerGain.gain.setTargetAtTime(vol * 0.6, ctx.currentTime, 0.12);

    let lfo: OscillatorNode | undefined;

    if (id === 'white_noise') {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 180;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 6500;
      source.connect(hp);
      hp.connect(lp);
      lp.connect(layerGain);
    } else if (id === 'brown_noise') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      lp.Q.value = 0.7;
      source.connect(lp);
      lp.connect(layerGain);
    } else if (id === 'midnight_rain') {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1150;
      bp.Q.value = 0.45;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2800;

      // Subtle slow rainfall swell modulation
      const swellGain = ctx.createGain();
      swellGain.gain.value = 0.85;
      lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.14;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 0.14;
      lfo.connect(lfoDepth);
      lfoDepth.connect(swellGain.gain);
      lfo.start();

      source.connect(bp);
      bp.connect(lp);
      lp.connect(swellGain);
      swellGain.connect(layerGain);
    } else {
      // Quiet Study Hall warm mid-low acoustic bed
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 440;
      const pk = ctx.createBiquadFilter();
      pk.type = 'peaking';
      pk.frequency.value = 210;
      pk.gain.value = 3.5;
      source.connect(lp);
      lp.connect(pk);
      pk.connect(layerGain);
    }

    layerGain.connect(this.compressor);
    source.start();

    this.noiseLayers.set(id, { source, gain: layerGain, lfo });
  }

  private stopNoiseLayer(id: string): void {
    const node = this.noiseLayers.get(id);
    if (!node) return;
    try {
      node.source.stop();
      node.source.disconnect();
      node.lfo?.stop();
      node.lfo?.disconnect();
      node.gain.disconnect();
    } catch {
      // Ignore already stopped audio nodes
    }
    this.noiseLayers.delete(id);
  }

  private startLofiLoop(ctx: AudioContext, id: string, vol: number): void {
    if (!this.compressor) return;

    const layerGain = ctx.createGain();
    layerGain.gain.setValueAtTime(0.001, ctx.currentTime);
    layerGain.gain.setTargetAtTime(vol * 0.85, ctx.currentTime, 0.1);

    const masterWarmth = ctx.createBiquadFilter();
    masterWarmth.type = 'lowpass';
    masterWarmth.frequency.value = id === 'lofi_late_night' ? 2100 : 2800;
    masterWarmth.Q.value = 0.6;

    layerGain.connect(masterWarmth);
    masterWarmth.connect(this.compressor);

    let crackleSource: AudioBufferSourceNode | undefined;
    if (id === 'lofi_late_night' && this.crackleBuffer) {
      crackleSource = ctx.createBufferSource();
      crackleSource.buffer = this.crackleBuffer;
      crackleSource.loop = true;
      const crackleFilter = ctx.createBiquadFilter();
      crackleFilter.type = 'bandpass';
      crackleFilter.frequency.value = 1800;
      const crackleGain = ctx.createGain();
      crackleGain.gain.value = 0.16;
      crackleSource.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(layerGain);
      crackleSource.start();
    }

    const bpm = id === 'lofi_late_night' ? 74 : 82;
    const eighthMs = Math.round((60 / bpm / 2) * 1000);

    const loopState: RunningLofiLoop = {
      timerId: 0,
      gain: layerGain,
      step: 0,
      crackleSource,
    };

    const tick = () => {
      if (!this.ctx || !this.lofiLoops.has(id)) return;
      const now = this.ctx.currentTime;
      const swingOffset = loopState.step % 2 === 1 ? 0.018 : 0;
      const triggerTime = now + 0.02 + swingOffset;
      this.triggerLofiStep(this.ctx, layerGain, id, loopState.step, triggerTime);
      loopState.step = (loopState.step + 1) % 32;
    };

    tick();
    loopState.timerId = window.setInterval(tick, eighthMs);
    this.lofiLoops.set(id, loopState);
  }

  private triggerLofiStep(
    ctx: AudioContext,
    dest: AudioNode,
    id: string,
    step: number,
    time: number
  ): void {
    const bar = Math.floor(step / 8);
    const barStep = step % 8;
    const chords = id === 'lofi_late_night' ? LATE_NIGHT_CHORDS : BOTANICAL_CHORDS;
    const chord = chords[bar % chords.length];

    // Warm electric piano chord on beat 1 (and soft syncopation on barStep === 5 for botanical)
    if (barStep === 0) {
      const chordDuration = id === 'lofi_late_night' ? 2.6 : 2.1;
      chord.forEach((midi, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(midiToFreq(midi), time);
        osc.detune.setValueAtTime((idx % 2 === 0 ? -1 : 1) * 3.5, time);

        const noteGain = ctx.createGain();
        const peak = idx === 0 ? 0.13 : 0.065;
        noteGain.gain.setValueAtTime(0.0001, time + idx * 0.018);
        noteGain.gain.linearRampToValueAtTime(peak, time + idx * 0.018 + 0.045);
        noteGain.gain.exponentialRampToValueAtTime(0.0008, time + chordDuration);

        osc.connect(noteGain);
        noteGain.connect(dest);
        osc.start(time + idx * 0.018);
        osc.stop(time + chordDuration + 0.05);
      });
    } else if (id === 'lofi_botanical' && (barStep === 3 || barStep === 6)) {
      // Gentle upper bell melody note
      const noteMidi = chord[(barStep + bar) % chord.length] + 12;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(midiToFreq(noteMidi), time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.055, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.75);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.8);
    }

    // Soft boom-bap kick on 0 and (3 or 5)
    if (barStep === 0 || barStep === 5 || (id === 'lofi_botanical' && barStep === 3)) {
      const kickOsc = ctx.createOscillator();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(105, time);
      kickOsc.frequency.exponentialRampToValueAtTime(42, time + 0.14);

      const kickGain = ctx.createGain();
      kickGain.gain.setValueAtTime(0.24, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

      kickOsc.connect(kickGain);
      kickGain.connect(dest);
      kickOsc.start(time);
      kickOsc.stop(time + 0.26);
    }

    // Soft brushed snare / rim on beats 2 & 4 (barStep 2 & 6)
    if ((barStep === 2 || barStep === 6) && this.whiteBuffer) {
      const snareSrc = ctx.createBufferSource();
      snareSrc.buffer = this.whiteBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = id === 'lofi_late_night' ? 1400 : 1900;
      bp.Q.value = 1.2;

      const snareGain = ctx.createGain();
      snareGain.gain.setValueAtTime(0.07, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

      snareSrc.connect(bp);
      bp.connect(snareGain);
      snareGain.connect(dest);
      snareSrc.start(time);
      snareSrc.stop(time + 0.13);
    }

    // Soft closed hat on eighth notes
    if (this.whiteBuffer) {
      const hatSrc = ctx.createBufferSource();
      hatSrc.buffer = this.whiteBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5200;

      const hatGain = ctx.createGain();
      const accent = barStep % 2 === 0 ? 0.026 : 0.015;
      hatGain.gain.setValueAtTime(accent, time);
      hatGain.gain.exponentialRampToValueAtTime(0.0005, time + 0.045);

      hatSrc.connect(hp);
      hp.connect(hatGain);
      hatGain.connect(dest);
      hatSrc.start(time);
      hatSrc.stop(time + 0.06);
    }
  }

  private stopLofiLoop(id: string): void {
    const loop = this.lofiLoops.get(id);
    if (!loop) return;
    window.clearInterval(loop.timerId);
    try {
      loop.crackleSource?.stop();
      loop.crackleSource?.disconnect();
      loop.gain.disconnect();
    } catch {
      // Ignore already stopped audio nodes
    }
    this.lofiLoops.delete(id);
  }

  public stopAllLayers(): void {
    for (const id of Array.from(this.noiseLayers.keys())) {
      this.stopNoiseLayer(id);
    }
    for (const id of Array.from(this.lofiLoops.keys())) {
      this.stopLofiLoop(id);
    }
  }

  public dispose(): void {
    this.stopAllLayers();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
    }
  }
}

export const deepWorkAmbienceEngine = new DeepWorkAmbienceEngine();
