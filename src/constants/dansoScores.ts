import rawSampleScores from '../data/sampleScores.json';
import type { DansoYulmyeong } from '../types/danso';

export interface JeongganCell {
  /** null이면 쉼표 */
  note: DansoYulmyeong | null;
  /** 박자 길이 (정간 칸 수, 예: 1 = 1박, 2 = 2박) */
  duration: number;
  /** 가사 또는 구음 힌트 */
  label?: string;
}

export interface DansoScore {
  id: string;
  title: string;
  jangdan: string;
  beatsPerMeasure: number;
  bpm: number;
  description: string;
  cells: JeongganCell[];
}

export const DANSO_SAMPLE_SCORES: DansoScore[] =
  rawSampleScores as DansoScore[];

/**
 * 현재 인덱스 이후 연주 가능한(쉼표가 아닌) 다음 정간 칸 인덱스를 반환합니다.
 */
export function findNextPlayableIndex(
  cells: JeongganCell[],
  afterIndex: number,
): number {
  for (let i = afterIndex + 1; i < cells.length; i += 1) {
    if (cells[i].note !== null) {
      return i;
    }
  }
  return -1;
}
