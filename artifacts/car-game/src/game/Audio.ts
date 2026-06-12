// Audio.ts - Web Audio API procedural sound engine

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private enabled = false;
  private musicVolume = 0.6;
  private sfxVolume = 0.8;

  init(musicVol: number, sfxVol: number) {
    this.musicVolume = musicVol;
    this.sfxVolume = sfxVol;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = sfxVol;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = musicVol;
      this.musicGain.connect(this.masterGain);

      this.enabled = true;
      this.startEngineSound();
    } catch {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private startEngineSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Base rumble oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    const distortion = this.ctx.createWaveShaper();

    // Distortion curve for engine rumble
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 300) * x / (Math.PI + 300 * Math.abs(x));
    }
    distortion.curve = curve;

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 80;
    this.engineGain.gain.value = 0;

    this.engineOsc.connect(distortion);
    distortion.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);
    this.engineOsc.start();
  }

  updateEngine(speed: number, throttle: number, rpm: number) {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.enabled) return;
    const now = this.ctx.currentTime;
    const freq = 60 + rpm * 80 + speed * 0.4;
    this.engineOsc.frequency.setTargetAtTime(freq, now, 0.05);
    const vol = throttle > 0.05 ? 0.08 + throttle * 0.12 : 0.04 + speed * 0.0003;
    this.engineGain.gain.setTargetAtTime(vol * this.sfxVolume, now, 0.05);
  }

  playHorn() {
    if (!this.ctx || !this.sfxGain || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 420;
    gain.gain.value = 0.15 * this.sfxVolume;
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playTireSqueal(intensity: number) {
    if (!this.ctx || !this.sfxGain || !this.enabled || intensity < 0.2) return;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * intensity * 0.3;
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 2;
    source.buffer = buffer;
    gain.gain.value = intensity * 0.4 * this.sfxVolume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }

  playCrash(intensity: number) {
    if (!this.ctx || !this.sfxGain || !this.enabled) return;
    const duration = 0.3;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 12) * intensity;
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = Math.min(1, intensity * 0.8) * this.sfxVolume;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }

  playNitroStart() {
    if (!this.ctx || !this.sfxGain || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playCollectCoin() {
    if (!this.ctx || !this.sfxGain || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = v;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    }
  }

  destroy() {
    try {
      this.engineOsc?.stop();
      this.ctx?.close();
    } catch {}
  }
}

export const audioEngine = new AudioEngine();
