import * as Tone from 'tone';

export interface ToneDansoPlayOptions {
  frequencyHz: number;
  breathAmount?: number;
  vibratoDepth?: number;
  durationSec?: number;
}

/**
 * 실제 대나무 단소 음색(배음 + 취구 숨소리 어택)을 PCM 오디오 버퍼로 생성해
 * Tone.Sampler에 로드하고 Tone.Filter / Tone.Vibrato / Tone.Reverb 체인으로 재생하는 엔진.
 */
export class ToneDansoEngine {
  private sampler: Tone.Sampler | null = null;
  private filter: Tone.Filter | null = null;
  private vibrato: Tone.Vibrato | null = null;
  private reverb: Tone.Reverb | null = null;
  private initPromise: Promise<void> | null = null;
  private activeMidiNote: string | null = null;

  private buildSampleBuffer(
    baseFreq: number,
    sampleRate: number,
    durationSec = 2.0,
  ): AudioBuffer {
    const length = Math.floor(sampleRate * durationSec);
    const buffer = Tone.getContext().rawContext.createBuffer(
      1,
      length,
      sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const attack = Math.min(1, t / 0.055);
      const decay = Math.exp(-t * 0.45);
      const envelope = attack * decay;

      // 대나무 단소 배음 구조 (1차 기본음 + 2·3·4차 배음)
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
      const harmonic2 = 0.28 * Math.sin(2 * Math.PI * baseFreq * 2 * t);
      const harmonic3 = 0.12 * Math.sin(2 * Math.PI * baseFreq * 3 * t);
      const harmonic4 = 0.04 * Math.sin(2 * Math.PI * baseFreq * 4 * t);

      // 취구 첫 입김(chiff) + 지속 공기 마찰음
      const chiffEnv = Math.exp(-t * 18);
      const breathNoise = (Math.random() * 2 - 1) * (0.045 + 0.14 * chiffEnv);

      data[i] =
        (fundamental + harmonic2 + harmonic3 + harmonic4 + breathNoise) *
        envelope *
        0.48;
    }

    return buffer;
  }

  async ensureInitialized(): Promise<void> {
    if (this.sampler) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await Tone.start();
      const sampleRate = Tone.getContext().sampleRate;

      // 단소 기본 음역(중 A♭4=415.3Hz, 무 D♭5=554.37Hz, 태 F5=698.46Hz)에 맞춘 멀티 샘플 버퍼 생성
      const sampleAb4 = new Tone.ToneAudioBuffer(
        this.buildSampleBuffer(415.3, sampleRate),
      );
      const sampleDb5 = new Tone.ToneAudioBuffer(
        this.buildSampleBuffer(554.37, sampleRate),
      );
      const sampleF5 = new Tone.ToneAudioBuffer(
        this.buildSampleBuffer(698.46, sampleRate),
      );

      this.filter = new Tone.Filter({
        type: 'lowpass',
        frequency: 2600,
        Q: 0.9,
      });

      this.vibrato = new Tone.Vibrato({
        frequency: 5.2,
        depth: 0.18,
      });

      this.reverb = new Tone.Reverb({
        decay: 1.6,
        wet: 0.22,
      });

      this.sampler = new Tone.Sampler({
        urls: {
          'G#4': sampleAb4,
          'C#5': sampleDb5,
          F5: sampleF5,
        },
        attack: 0.03,
        release: 0.25,
      });

      this.sampler.chain(
        this.filter,
        this.vibrato,
        this.reverb,
        Tone.getDestination(),
      );

      await Tone.loaded();
    })();

    return this.initPromise;
  }

  private applyToneParams(options: ToneDansoPlayOptions): void {
    const breathAmount = options.breathAmount ?? 0.5;
    const vibratoDepth = options.vibratoDepth ?? 0.18;

    if (this.filter) {
      this.filter.frequency.rampTo(1600 + breathAmount * 2200, 0.05);
    }
    if (this.vibrato) {
      this.vibrato.depth.value = vibratoDepth;
    }
  }

  async playSample(options: ToneDansoPlayOptions): Promise<void> {
    await this.ensureInitialized();
    if (!this.sampler) return;

    this.applyToneParams(options);
    const noteName = Tone.Frequency(options.frequencyHz, 'hz').toNote();
    this.sampler.triggerAttackRelease(noteName, options.durationSec ?? 0.85);
  }

  async startHold(options: ToneDansoPlayOptions): Promise<void> {
    await this.ensureInitialized();
    if (!this.sampler) return;

    this.stopHold();
    this.applyToneParams(options);
    const noteName = Tone.Frequency(options.frequencyHz, 'hz').toNote();
    this.activeMidiNote = noteName;
    this.sampler.triggerAttack(noteName);
  }

  async updateHoldFrequency(options: ToneDansoPlayOptions): Promise<void> {
    if (!this.sampler || !this.activeMidiNote) return;
    const nextNote = Tone.Frequency(options.frequencyHz, 'hz').toNote();
    if (nextNote !== this.activeMidiNote) {
      this.sampler.triggerRelease(this.activeMidiNote);
      this.activeMidiNote = nextNote;
      this.applyToneParams(options);
      this.sampler.triggerAttack(nextNote);
    }
  }

  stopHold(): void {
    if (this.sampler && this.activeMidiNote) {
      this.sampler.triggerRelease(this.activeMidiNote);
      this.activeMidiNote = null;
    }
  }

  dispose(): void {
    this.stopHold();
    this.sampler?.dispose();
    this.filter?.dispose();
    this.vibrato?.dispose();
    this.reverb?.dispose();
    this.sampler = null;
    this.filter = null;
    this.vibrato = null;
    this.reverb = null;
    this.initPromise = null;
  }
}

