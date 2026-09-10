export class Sound {
  enabled = true;
  private context?: AudioContext;
  private master?: GainNode;
  unlock() {
    if (!this.context) {
      this.context = new AudioContext(); this.master = this.context.createGain(); this.master.gain.value = this.enabled ? 0.28 : 0; this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
  }
  toggle() { this.enabled = !this.enabled; if (this.master) this.master.gain.value = this.enabled ? 0.28 : 0; return this.enabled; }
  play(kind: string) {
    if (!this.enabled || !this.context || !this.master) return;
    const ctx = this.context, t = ctx.currentTime;
    if (['slash', 'heavy', 'hit', 'hurt', 'dodge', 'kill', 'land'].includes(kind)) {
      const duration = kind === 'heavy' ? 0.38 : kind === 'dodge' ? 0.22 : 0.14;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.setValueAtTime(kind === 'heavy' ? 280 : kind === 'slash' ? 3500 : 1700, t); filter.frequency.exponentialRampToValueAtTime(100, t + duration);
      gain.gain.value = kind === 'heavy' ? 1 : 0.4; source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start();
    }
    if (['heavy', 'hurt', 'wave', 'clear', 'kill', 'jump'].includes(kind)) {
      const oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.type = kind === 'wave' || kind === 'clear' ? 'sine' : 'triangle';
      const freq = kind === 'wave' ? 110 : kind === 'clear' ? 330 : kind === 'kill' ? 460 : kind === 'jump' ? 150 : 80;
      const duration = kind === 'wave' || kind === 'clear' ? 1.1 : 0.22;
      oscillator.frequency.setValueAtTime(freq, t); oscillator.frequency.exponentialRampToValueAtTime(kind === 'clear' || kind === 'jump' ? freq * 2 : freq * 0.4, t + duration);
      gain.gain.setValueAtTime(0.001, t); gain.gain.exponentialRampToValueAtTime(0.45, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      oscillator.connect(gain); gain.connect(this.master); oscillator.start(); oscillator.stop(t + duration);
    }
  }
}
