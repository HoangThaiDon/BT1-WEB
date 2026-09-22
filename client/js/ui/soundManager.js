/**
 * Sound Manager: Trình phát âm thanh sử dụng Web Audio API Synthesizer
 * Không phụ thuộc vào file MP3 ngoài, hoạt động mượt mà ở mọi môi trường
 */
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  _initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Âm thanh di chuyển quân (tiếng click đục)
   */
  playMove() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Âm thanh ăn quân (tiếng va chạm mạnh)
   */
  playCapture() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Âm thanh chiến thắng (Fanfare)
   */
  playWin() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + idx * 0.12);
        osc.stop(this.audioCtx.currentTime + idx * 0.12 + 0.25);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Âm thanh cảnh báo sắp hết giờ (Tick)
   */
  playWarning() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Âm thanh nhặt Buff (tiếng chuông thăng hoa)
   */
  playBuffPickup() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + idx * 0.06);
        osc.stop(this.audioCtx.currentTime + idx * 0.06 + 0.18);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Âm thanh khiên đỡ đòn / vỡ khiên (tiếng kim loại va chạm)
   */
  playShieldBreak() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(720, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.audioCtx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.22);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Âm thanh hồi sinh đồng đội (hợp âm ma thuật ngân vang)
   */
  playRevive() {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const chord = [349.23, 440.0, 523.25, 698.46]; // F4, A4, C5, F5
      chord.forEach((freq) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.audioCtx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.38);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.38);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

const sounds = new SoundManager();
