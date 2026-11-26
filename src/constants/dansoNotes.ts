import type { DansoNote } from '../types/danso';

export const DANSO_HOLE_LABELS = [
  '제1공 (뒤 · 왼손 엄지)',
  '제2공 (앞 · 왼손 검지)',
  '제3공 (앞 · 왼손 중지)',
  '제4공 (앞 · 오른손 중지)',
  '제5공 (앞 · 아래 구멍)',
] as const;

/**
 * 단소 기본 5음계 (중·임·무·황·태) 표준 음정 매핑:
 * - 중(仲): A♭4 (솔#, 415.30 Hz)
 * - 임(林): B♭4 (라#, 466.16 Hz)
 * - 무(無): D♭5 (도#, 554.37 Hz)
 * - 황(潢): E♭5 (레#, 622.25 Hz)
 * - 태(汰): F5  (파,  698.46 Hz)
 */
export const DANSO_NOTES: DansoNote[] = [
  {
    id: '중',
    hanja: '仲',
    koreanName: '중려',
    oheum: '궁',
    oheumHanja: '宮',
    westernNote: 'A♭4',
    solfege: '솔#',
    frequencyHz: 415.3,
    holes: [true, true, true, true, false],
    description: '제1공부터 제4공까지 모두 막고 부드럽게 부는 가장 낮은 기본음(A♭ · 솔#)입니다.',
  },
  {
    id: '임',
    hanja: '林',
    koreanName: '임종',
    oheum: '상',
    oheumHanja: '商',
    westernNote: 'B♭4',
    solfege: '라#',
    frequencyHz: 466.16,
    holes: [true, true, true, false, false],
    description: '제4공(오른손 중지)만 열고 제1·2·3공을 막아 B♭(라#)음을 냅니다.',
  },
  {
    id: '무',
    hanja: '無',
    koreanName: '무역',
    oheum: '각',
    oheumHanja: '角',
    westernNote: 'D♭5',
    solfege: '도#',
    frequencyHz: 554.37,
    holes: [true, true, false, false, false],
    description: '제1공(왼손 엄지)과 제2공(왼손 검지)만 막고 D♭(도#)음을 냅니다.',
  },
  {
    id: '황',
    hanja: '潢',
    koreanName: '황종',
    oheum: '치',
    oheumHanja: '徵',
    westernNote: 'E♭5',
    solfege: '레#',
    frequencyHz: 622.25,
    holes: [true, false, false, false, false],
    description: '뒤쪽 제1공(왼손 엄지)만 막고 앞 구멍을 모두 열어 E♭(레#)음을 냅니다.',
  },
  {
    id: '태',
    hanja: '汰',
    koreanName: '태주',
    oheum: '우',
    oheumHanja: '羽',
    westernNote: 'F5',
    solfege: '파',
    frequencyHz: 698.46,
    holes: [false, false, false, false, false],
    description: '모든 지공을 연 상태에서 안정적으로 파지해 F(파)음을 냅니다.',
  },
];
