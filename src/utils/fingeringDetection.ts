import type { NormalizedLandmark } from '@mediapipe/hands';
import { DANSO_NOTES } from '../constants/dansoNotes';
import type { DansoNote, HoleStates } from '../types/danso';

export interface VirtualHoleZone {
  index: number;
  label: string;
  shortLabel: string;
  /** 정규화된 X 좌표 (0 ~ 1, 거울 모드 기준 화면 좌->우) */
  x: number;
  /** 정규화된 Y 좌표 (0 ~ 1, 화면 상->하) */
  y: number;
  /** 충돌 판정 반경 (정규화 Y 기준 비율) */
  radius: number;
}

/**
 * 웹캠 화면 중앙 세로축에 배치되는 가상 단소 5지공 좌표.
 * 제1공(뒤·엄지)은 엄지가 닿기 쉽도록 왼쪽 위 측면에 배치하고,
 * 제2공~제5공(앞 지공)은 중앙 세로선을 따라 위에서 아래로 배치합니다.
 */
export const DEFAULT_VIRTUAL_HOLES: VirtualHoleZone[] = [
  { index: 0, label: '제1공 (뒤·엄지)', shortLabel: '1공', x: 0.41, y: 0.25, radius: 0.052 },
  { index: 1, label: '제2공 (왼손 검지)', shortLabel: '2공', x: 0.5, y: 0.35, radius: 0.052 },
  { index: 2, label: '제3공 (왼손 중지)', shortLabel: '3공', x: 0.5, y: 0.49, radius: 0.052 },
  { index: 3, label: '제4공 (오른손 중지)', shortLabel: '4공', x: 0.5, y: 0.63, radius: 0.052 },
  { index: 4, label: '제5공 (아래 구멍)', shortLabel: '5공', x: 0.5, y: 0.77, radius: 0.052 },
];

/**
 * MediaPipe Hands 손가락 끝(Tip) 및 끝마디(DIP) 랜드마크 인덱스.
 * 엄지(4), 검지(8), 중지(12), 약지(16), 소지(20) 끝점과
 * 구멍 위에 손가락 마디가 걸쳤을 때를 보조하는 DIP(3, 7, 11, 15)를 사용합니다.
 */
const FINGER_TOUCH_LANDMARKS = [4, 8, 12, 16, 20, 3, 7, 11, 15] as const;

/**
 * 거울 모드(Webcam mirrored) 영상과 일치하도록 랜드마크 X 좌표를 반전합니다.
 */
export function mirrorLandmarks(
  landmarks: NormalizedLandmark[],
): NormalizedLandmark[] {
  return landmarks.map((lm) => ({
    ...lm,
    x: 1 - lm.x,
  }));
}

/**
 * 화면 종횡비(aspectRatio = width / height)를 보정해
 * 손가락 랜드마크가 각 가상 지공 원(Circle) 안에 들어왔는지 판정합니다.
 */
export function detectCoveredHoles(
  handsLandmarks: NormalizedLandmark[][],
  holes: VirtualHoleZone[] = DEFAULT_VIRTUAL_HOLES,
  aspectRatio = 4 / 3,
  radiusScale = 1,
): HoleStates {
  const result: HoleStates = [false, false, false, false, false];

  if (handsLandmarks.length === 0) {
    return result;
  }

  for (const hole of holes) {
    const threshold = hole.radius * radiusScale;
    let isCovered = false;

    for (const hand of handsLandmarks) {
      for (const lmIndex of FINGER_TOUCH_LANDMARKS) {
        const lm = hand[lmIndex];
        if (!lm) continue;

        const dx = (lm.x - hole.x) * aspectRatio;
        const dy = lm.y - hole.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= threshold) {
          isCovered = true;
          break;
        }
      }
      if (isCovered) break;
    }

    result[hole.index] = isCovered;
  }

  return result;
}

/**
 * 현재 막힌 지공 상태 배열과 일치하는 단소 율명을 찾습니다.
 */
export function matchNoteByHoles(holes: HoleStates): DansoNote | null {
  return (
    DANSO_NOTES.find((note) =>
      note.holes.every((closed, idx) => closed === holes[idx]),
    ) ?? null
  );
}

