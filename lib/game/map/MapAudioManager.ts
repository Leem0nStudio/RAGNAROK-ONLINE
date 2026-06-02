export class MapAudioManager {
  private ctx: AudioContext | null = null;
  private currentMusic: string | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];

  private readonly VOLUME = 0.15;
  private readonly FADE_DURATION = 1.5;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);
  }

  private resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  crossfadeTo(musicId: string | null): void {
    this.init();
    this.resume();
    if (musicId === this.currentMusic) return;
    this.currentMusic = musicId;
    this.stopAll();

    if (!musicId || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(this.VOLUME, now + this.FADE_DURATION);

    switch (musicId) {
      case 'ambient_prontera_fields':
        this.playWind(this.ctx);
        this.playBirds(this.ctx);
        break;
      case 'ambient_city':
        this.playWind(this.ctx);
        this.playCityHum(this.ctx);
        break;
      case 'ambient_dark_forest':
        this.playDarkDrone(this.ctx);
        this.playWind(this.ctx);
        break;
      case 'ambient_ruins':
        this.playRuinsDrone(this.ctx);
        this.playWind(this.ctx);
        break;
      case 'ambient_dark_sanctuary':
        this.playDarkDrone(this.ctx);
        this.playWhispers(this.ctx);
        break;
      default:
        this.playWind(this.ctx);
    }
  }

  private playWind(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 3);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start();
    this.activeNodes.push(source, gain, filter);
  }

  private playBirds(ctx: AudioContext) {
    const scheduleBird = () => {
      if (this.currentMusic !== 'ambient_prontera_fields') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 2000 + Math.random() * 1500;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
      this.activeNodes.push(osc, gain);
      const delay = 1000 + Math.random() * 4000;
      this.activeNodes.push({ disconnect: () => clearTimeout(birdTimer) } as any);
      const birdTimer = window.setTimeout(scheduleBird, delay);
    };
    scheduleBird();
  }

  private playCityHum(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 80;
    gain.gain.value = 0.04;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    this.activeNodes.push(osc, gain, filter);
  }

  private playDarkDrone(ctx: AudioContext) {
    for (const freq of [55, 65, 72]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.value = 0.03;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.activeNodes.push(osc, gain, filter);
    }
  }

  private playRuinsDrone(ctx: AudioContext) {
    for (const freq of [45, 60]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.035;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 200;
      filter.Q.value = 5;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.activeNodes.push(osc, gain, filter);
    }
  }

  private playWhispers(ctx: AudioContext) {
    const scheduleWhisper = () => {
      if (this.currentMusic !== 'ambient_dark_sanctuary') return;
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000 + Math.random() * 500;
      filter.Q.value = 3;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      source.start();
      source.stop(ctx.currentTime + 0.3);
      this.activeNodes.push(source, gain, filter);
      const whisperTimer = window.setTimeout(scheduleWhisper, 2000 + Math.random() * 5000);
      this.activeNodes.push({ disconnect: () => clearTimeout(whisperTimer) } as any);
    };
    scheduleWhisper();
  }

  private stopAll() {
    for (const node of this.activeNodes) {
      try { node.disconnect(); } catch {}
    }
    this.activeNodes = [];
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.FADE_DURATION);
    }
  }

  playMapEnterSound(): void {
    this.init();
    this.resume();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  stop(): void {
    this.stopAll();
    this.currentMusic = null;
  }

  getCurrentMusic(): string | null {
    return this.currentMusic;
  }
}