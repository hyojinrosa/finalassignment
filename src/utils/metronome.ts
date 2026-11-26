/**
 * Web Audio API 기반 경량 메트로놈 사운드 생성기.
 * 국악 '박(拍)' / 우드블록 느낌의 또렷한 "딱, 딱" 클릭음을 생성합니다.
 */
export class MetronomeAudio {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * 1박 클릭음 재생 (강박 accent=true일 때 더 높고 또렷한 "딱!" 소리)
   */
  playClick(accent = false): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(accent ? 1320 : 920, now);
    osc.frequency.exponentialRampToValueAtTime(accent ? 540 : 380, now + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(accent ? 1400 : 1000, now);
    filter.Q.setValueAtTime(2.4, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(accent ? 0.36 : 0.22, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

