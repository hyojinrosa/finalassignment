import type { JangguStroke } from '../constants/jangdanPresets';

/**
 * Web Audio API 기반 전통 장구 구음(덩, 쿵, 따) 타악기 합성 엔진.
 * - 덩(합장단): 궁편 저음 공명 + 채편 타격음 동시 재생
 * - 쿵(궁편): 깊고 따뜻한 북편 저음
 * - 따(채편): 맑고 경쾌한 열채 타격음
 */
export class JangdanAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.ctx;
  }

  private playKung(ctx: AudioContext, volume = 0.55): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(128, now);
    osc.frequency.exponentialRampToValueAtTime(56, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  private playTta(ctx: AudioContext, volume = 0.36): void {
    const now = ctx.currentTime;

    // 대나무 열채 타격 공명음
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.05);

    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(volume * 0.65, now + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    // 채편 가죽 마찰 노이즈 스냅
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2100, now);
      filter.Q.setValueAtTime(1.8, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.001, now);
      nGain.gain.linearRampToValueAtTime(volume * 0.75, now + 0.002);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.07);
    }
  }

  playStroke(stroke: JangguStroke): void {
    if (!stroke) return;
    const ctx = this.ensureContext();

    if (stroke === '덩') {
      this.playKung(ctx, 0.58);
      this.playTta(ctx, 0.34);
    } else if (stroke === '쿵') {
      this.playKung(ctx, 0.48);
    } else if (stroke === '따') {
      this.playTta(ctx, 0.36);
    }
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

