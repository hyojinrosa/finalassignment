export interface DansoSynthOptions {
  /** 기본 주파수 (Hz) */
  frequencyHz: number;
  /** 배음 강도 (0 ~ 1) */
  harmonicAmount?: number;
  /** 숨소리(공기 마찰음) 강도 (0 ~ 1) */
  breathAmount?: number;
  /** 요성(비브라토) 활성화 여부 */
  vibratoEnabled?: boolean;
  /** 출력 볼륨 (0 ~ 1) */
  masterGain?: number;
}

interface ActiveVoice {
  stop: (releaseSec?: number) => void;
  setFrequency: (freqHz: number) => void;
}

/**
 * Web Audio API 기반 전통 단소 음색 합성기.
 * 기본음 + 배음(2~4차) + 대역통과 필터링된 숨소리(Chiff/Air) + 요성(Vibrato)을 결합합니다.
 */
export class DansoSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeVoice: ActiveVoice | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.noiseBuffer) {
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * 지속음을 시작합니다 (가상 단소 누르고 불기 / 연속 연주용).
   */
  startNote(options: DansoSynthOptions): void {
    this.stopNote(0.06);

    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const {
      frequencyHz,
      harmonicAmount = 0.65,
      breathAmount = 0.45,
      vibratoEnabled = true,
      masterGain = 0.35,
    } = options;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(
      Math.max(0.01, masterGain),
      now + 0.08,
    );
    master.connect(ctx.destination);

    // 대나무 관 공명감을 살리는 로우패스 톤 셰이핑
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(Math.min(4200, frequencyHz * 5.2), now);
    toneFilter.Q.setValueAtTime(1.1, now);
    toneFilter.connect(master);

    // 기본음 + 배음(Harmonics) 오실레이터 구성
    const partials: Array<{ ratio: number; level: number; type: OscillatorType }> = [
      { ratio: 1, level: 1.0, type: 'sine' },
      { ratio: 2, level: 0.28 * harmonicAmount, type: 'sine' },
      { ratio: 3, level: 0.14 * harmonicAmount, type: 'triangle' },
      { ratio: 4, level: 0.04 * harmonicAmount, type: 'sine' },
    ];

    const oscillators: Array<{ osc: OscillatorNode; ratio: number }> = [];

    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = partial.type;
      osc.frequency.setValueAtTime(frequencyHz * partial.ratio, now);
      gain.gain.setValueAtTime(partial.level, now);
      osc.connect(gain);
      gain.connect(toneFilter);
      osc.start(now);
      oscillators.push({ osc, ratio: partial.ratio });
    }

    // 요성(Vibrato LFO)
    let lfoOsc: OscillatorNode | null = null;
    if (vibratoEnabled) {
      lfoOsc = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfoOsc.type = 'sine';
      lfoOsc.frequency.setValueAtTime(5.2, now);
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(frequencyHz * 0.007, now + 0.35);
      lfoOsc.connect(lfoGain);
      for (const item of oscillators) {
        lfoGain.connect(item.osc.frequency);
      }
      lfoOsc.start(now);
    }

    // 취구 숨소리(Breath Noise + Bandpass Filter)
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    const breathFilter = ctx.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(
      Math.min(3200, Math.max(900, frequencyHz * 2.2)),
      now,
    );
    breathFilter.Q.setValueAtTime(2.8, now);

    const breathGain = ctx.createGain();
    const baseBreath = Math.max(0.001, 0.16 * breathAmount);
    // 취구 첫 어택(chiff) 시 숨소리를 살짝 강조했다가 안정화
    breathGain.gain.setValueAtTime(0.001, now);
    breathGain.gain.linearRampToValueAtTime(baseBreath * 1.9, now + 0.03);
    breathGain.gain.exponentialRampToValueAtTime(baseBreath, now + 0.16);

    noiseSource.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(master);
    noiseSource.start(now);

    let stopped = false;

    this.activeVoice = {
      setFrequency: (nextFreq: number) => {
        if (stopped) return;
        const t = ctx.currentTime;
        for (const item of oscillators) {
          item.osc.frequency.setTargetAtTime(nextFreq * item.ratio, t, 0.02);
        }
        toneFilter.frequency.setTargetAtTime(
          Math.min(4200, nextFreq * 5.2),
          t,
          0.03,
        );
        breathFilter.frequency.setTargetAtTime(
          Math.min(3200, Math.max(900, nextFreq * 2.2)),
          t,
          0.03,
        );
      },
      stop: (releaseSec = 0.14) => {
        if (stopped) return;
        stopped = true;
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.001), t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + releaseSec);

        const cleanupAt = t + releaseSec + 0.03;
        for (const item of oscillators) {
          item.osc.stop(cleanupAt);
        }
        lfoOsc?.stop(cleanupAt);
        noiseSource.stop(cleanupAt);
      },
    };
  }

  /**
   * 현재 울리고 있는 음의 주파수를 부드럽게 변경합니다.
   */
  updateFrequency(frequencyHz: number): void {
    this.activeVoice?.setFrequency(frequencyHz);
  }

  /**
   * 현재 울리고 있는 음을 감쇠 종료합니다.
   */
  stopNote(releaseSec = 0.14): void {
    this.activeVoice?.stop(releaseSec);
    this.activeVoice = null;
  }

  /**
   * 지정한 길이(ms)만큼 단소 음을 재생합니다.
   */
  playOnce(options: DansoSynthOptions, durationMs = 850): number {
    this.startNote(options);
    return window.setTimeout(() => {
      this.stopNote(0.18);
    }, durationMs);
  }

  dispose(): void {
    this.stopNote(0.05);
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

