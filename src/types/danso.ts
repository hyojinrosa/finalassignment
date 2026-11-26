export type AppTabId = 'learning' | 'practice' | 'virtual';

export type DansoYulmyeong = '중' | '임' | '무' | '황' | '태';

export type GugakOheum = '궁' | '상' | '각' | '치' | '우';

/**
 * 단소 5지공 상태 (true = 막음, false = 뗌)
 * [제1공(뒤·왼손엄지), 제2공(앞·왼손검지), 제3공(앞·왼손중지), 제4공(앞·오른손중지), 제5공(앞·맨아래)]
 */
export type HoleStates = [boolean, boolean, boolean, boolean, boolean];

export interface DansoNote {
  id: DansoYulmyeong;
  hanja: string;
  koreanName: string;
  oheum: GugakOheum;
  oheumHanja: string;
  westernNote: string;
  frequencyHz: number;
  holes: HoleStates;
  description: string;
}

export interface WesternNoteMatch {
  noteName: string;
  octave: number;
  fullName: string;
  frequencyHz: number;
  centsOff: number;
}

export interface GugakNoteMatch {
  oheum: GugakOheum;
  oheumHanja: string;
  yulmyeong: DansoNote;
  centsOff: number;
}

export interface PitchAnalysisResult {
  frequencyHz: number | null;
  clarity: number;
  volumeRms: number;
  westernNote: WesternNoteMatch | null;
  gugakNote: GugakNoteMatch | null;
  matchedNote: DansoNote | null;
  centsOff: number | null;
}

export interface HandDetectionState {
  isReady: boolean;
  isRunning: boolean;
  detectedHandsCount: number;
  estimatedHoles: HoleStates | null;
  error: string | null;
}
