import { DANSO_NOTES } from '../constants/dansoNotes';
import type {
  DansoNote,
  GugakNoteMatch,
  PitchAnalysisResult,
  WesternNoteMatch,
} from '../types/danso';

const MIN_VOLUME_RMS = 0.01;
const YIN_THRESHOLD = 0.15;
const YIN_FALLBACK_THRESHOLD = 0.32;

const WESTERN_NOTE_NAMES = [
  'C',
  'D♭',
  'D',
  'E♭',
  'E',
  'F',
  'F#',
  'G',
  'A♭',
  'A',
  'B♭',
  'B',
] as const;

/**
 * YIN 알고리즘(de Cheveigné & Kawahara, 2002) 기반의 기본 주파수(Hz) 검출 함수.
 * 1) 차이 함수(Difference function)
 * 2) 누적 평균 정규화 차이 함수(CMNDF)
 * 3) 절대 임계값 탐색 + 골짜기 최소값 선택
 * 4) 포물선 보간(Parabolic interpolation)으로 정밀 주파수 산출
 */
export function detectPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  minFreq = 120,
  maxFreq = 1800,
): { frequencyHz: number | null; clarity: number; volumeRms: number } {
  const bufferSize = buffer.length;
  let rmsSum = 0;

  for (let i = 0; i < bufferSize; i += 1) {
    const sample = buffer[i];
    rmsSum += sample * sample;
  }

  const volumeRms = Math.sqrt(rmsSum / bufferSize);
  if (volumeRms < MIN_VOLUME_RMS) {
    return { frequencyHz: null, clarity: 0, volumeRms };
  }

  const halfSize = Math.floor(bufferSize / 2);
  const minTau = Math.max(2, Math.floor(sampleRate / maxFreq));
  const maxTau = Math.min(halfSize - 1, Math.floor(sampleRate / minFreq));

  if (maxTau <= minTau) {
    return { frequencyHz: null, clarity: 0, volumeRms };
  }

  const yinBuffer = new Float32Array(maxTau + 1);
  yinBuffer[0] = 1;

  // Step 1 & 2: 차이 함수 + 누적 평균 정규화 차이 함수 (CMNDF)
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau += 1) {
    let difference = 0;
    for (let j = 0; j < halfSize; j += 1) {
      const delta = buffer[j] - buffer[j + tau];
      difference += delta * delta;
    }
    runningSum += difference;
    yinBuffer[tau] = runningSum > 0 ? (difference * tau) / runningSum : 1;
  }

  // Step 3: 절대 임계값 이하의 첫 번째 극소값(valley) 탐색
  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (yinBuffer[tau] < YIN_THRESHOLD) {
      while (tau + 1 <= maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau += 1;
      }
      tauEstimate = tau;
      break;
    }
  }

  // 임계값을 직접 통과하지 못한 경우 전역 최소값 확인
  if (tauEstimate === -1) {
    let bestTau = minTau;
    let bestVal = yinBuffer[minTau];
    for (let tau = minTau + 1; tau <= maxTau; tau += 1) {
      if (yinBuffer[tau] < bestVal) {
        bestVal = yinBuffer[tau];
        bestTau = tau;
      }
    }
    if (bestVal > YIN_FALLBACK_THRESHOLD) {
      return {
        frequencyHz: null,
        clarity: Math.max(0, 1 - bestVal),
        volumeRms,
      };
    }
    tauEstimate = bestTau;
  }

  // Step 4: 포물선 보간(Parabolic Interpolation)으로 서브샘플 지연 보정
  let refinedTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < maxTau) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];
    const denom = 2 * s1 - s2 - s0;
    if (Math.abs(denom) > 1e-9) {
      refinedTau = tauEstimate + (s2 - s0) / (2 * denom);
    }
  }

  const clarity = Math.max(0, Math.min(1, 1 - yinBuffer[tauEstimate]));
  const frequencyHz = refinedTau > 0 ? sampleRate / refinedTau : null;

  return { frequencyHz, clarity, volumeRms };
}

/**
 * 추출된 주파수(Hz)를 서양 음명(C, D, E 등 12평균율)과 센트 오차로 매핑합니다.
 */
export function mapFrequencyToWesternNote(
  frequencyHz: number | null,
): WesternNoteMatch | null {
  if (!frequencyHz || frequencyHz <= 0) {
    return null;
  }

  const midiFloat = 69 + 12 * Math.log2(frequencyHz / 440);
  const midiRounded = Math.round(midiFloat);
  const centsOff = Math.round((midiFloat - midiRounded) * 100);

  const noteIndex = ((midiRounded % 12) + 12) % 12;
  const noteName = WESTERN_NOTE_NAMES[noteIndex];
  const octave = Math.floor(midiRounded / 12) - 1;
  const idealFreq = 440 * Math.pow(2, (midiRounded - 69) / 12);

  return {
    noteName,
    octave,
    fullName: `${noteName}${octave}`,
    frequencyHz: idealFreq,
    centsOff,
  };
}

/**
 * 추출된 주파수(Hz)를 국악 오음 율명(궁, 상, 각, 치, 우) 및 단소 율명(중, 임, 무, 황, 태)으로 매핑합니다.
 * 옥타브가 다른 경우(평취/역취)도 반음 거리(cents) 기준으로 가장 가까운 율명에 매칭합니다.
 */
export function mapFrequencyToGugakNote(
  frequencyHz: number | null,
): GugakNoteMatch | null {
  if (!frequencyHz || frequencyHz <= 0) {
    return null;
  }

  let closestNote: DansoNote = DANSO_NOTES[0];
  let smallestCents = Infinity;

  for (const note of DANSO_NOTES) {
    for (const octaveFactor of [0.5, 1, 2]) {
      const targetFreq = note.frequencyHz * octaveFactor;
      const cents = 1200 * Math.log2(frequencyHz / targetFreq);
      if (Math.abs(cents) < Math.abs(smallestCents)) {
        smallestCents = cents;
        closestNote = note;
      }
    }
  }

  return {
    oheum: closestNote.oheum,
    oheumHanja: closestNote.oheumHanja,
    yulmyeong: closestNote,
    centsOff: Math.round(smallestCents),
  };
}

export function analyzeAudioBuffer(
  buffer: Float32Array,
  sampleRate: number,
): PitchAnalysisResult {
  const { frequencyHz, clarity, volumeRms } = detectPitchYIN(buffer, sampleRate);
  const westernNote = mapFrequencyToWesternNote(frequencyHz);
  const gugakNote = mapFrequencyToGugakNote(frequencyHz);

  return {
    frequencyHz,
    clarity,
    volumeRms,
    westernNote,
    gugakNote,
    matchedNote: gugakNote?.yulmyeong ?? null,
    centsOff: gugakNote?.centsOff ?? null,
  };
}
