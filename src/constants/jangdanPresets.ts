export type JangdanId = 'jajinmori' | 'semachi' | 'jungmori' | 'jungjungmori';

export type JangguStroke = '덩' | '쿵' | '따' | null;

export interface JangdanStep {
  stroke: JangguStroke;
  /** 강약: strong(덩 합장단), medium(쿵), light(따) */
  intensity: 'strong' | 'medium' | 'light' | null;
}

export interface JangdanGroup {
  /** 묶음 이름 (예: 첫 번째 박, 두 번째 박 ...) */
  groupLabel: string;
  steps: JangdanStep[];
}

export interface JangdanPreset {
  id: JangdanId;
  name: string;
  meter: string;
  tempoLabel: string;
  defaultBpm: number;
  minBpm: number;
  maxBpm: number;
  subdivisionsPerBeat: number;
  description: string;
  /** 장단을 박자 묶음 단위로 구조화 (예: 자진모리 = 3박씩 4묶음, 총 12박) */
  groups: JangdanGroup[];
  /** 전체 스텝을 1차원 배열로 펼친 패턴 */
  pattern: JangdanStep[];
}

function createPreset(
  config: Omit<JangdanPreset, 'pattern'>,
): JangdanPreset {
  return {
    ...config,
    pattern: config.groups.flatMap((group) => group.steps),
  };
}

export const JANGDAN_PRESETS: JangdanPreset[] = [
  createPreset({
    id: 'jajinmori',
    name: '자진모리',
    meter: '12/8박자 (3박 × 4묶음)',
    tempoLabel: '빠른 템포',
    defaultBpm: 116,
    minBpm: 75,
    maxBpm: 155,
    subdivisionsPerBeat: 3,
    description: '12박을 3박씩 4묶음으로 나누어 빠르고 몰아치듯 연주하는 장단입니다.',
    groups: [
      {
        groupLabel: '첫 번째 박 (1~3)',
        steps: [
          { stroke: '덩', intensity: 'strong' },
          { stroke: null, intensity: null },
          { stroke: null, intensity: null },
        ],
      },
      {
        groupLabel: '두 번째 박 (4~6)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: null, intensity: null },
          { stroke: '따', intensity: 'light' },
        ],
      },
      {
        groupLabel: '세 번째 박 (7~9)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: null, intensity: null },
          { stroke: null, intensity: null },
        ],
      },
      {
        groupLabel: '네 번째 박 (10~12)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: null, intensity: null },
          { stroke: '따', intensity: 'light' },
        ],
      },
    ],
  }),
  createPreset({
    id: 'semachi',
    name: '세마치',
    meter: '9/8박자 (3박 × 3묶음)',
    tempoLabel: '경쾌한 3소박 3박',
    defaultBpm: 96,
    minBpm: 60,
    maxBpm: 135,
    subdivisionsPerBeat: 3,
    description: '9박을 3박씩 3묶음으로 연주하는 경쾌한 장단으로 아리랑·도라지에 쓰입니다.',
    groups: [
      {
        groupLabel: '첫 번째 박 (1~3)',
        steps: [
          { stroke: '덩', intensity: 'strong' },
          { stroke: null, intensity: null },
          { stroke: null, intensity: null },
        ],
      },
      {
        groupLabel: '두 번째 박 (4~6)',
        steps: [
          { stroke: '덩', intensity: 'strong' },
          { stroke: null, intensity: null },
          { stroke: '따', intensity: 'light' },
        ],
      },
      {
        groupLabel: '세 번째 박 (7~9)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: '따', intensity: 'light' },
          { stroke: null, intensity: null },
        ],
      },
    ],
  }),
  createPreset({
    id: 'jungmori',
    name: '중모리',
    meter: '12/4박자 (3박 × 4묶음)',
    tempoLabel: '보통 속도',
    defaultBpm: 74,
    minBpm: 50,
    maxBpm: 110,
    subdivisionsPerBeat: 1,
    description: '12박을 보통 속도로 안정감 있게 짚어 나가는 서정적 장단입니다.',
    groups: [
      {
        groupLabel: '첫 번째 박 (1~3)',
        steps: [
          { stroke: '덩', intensity: 'strong' },
          { stroke: null, intensity: null },
          { stroke: '쿵', intensity: 'medium' },
        ],
      },
      {
        groupLabel: '두 번째 박 (4~6)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: '따', intensity: 'light' },
          { stroke: null, intensity: null },
        ],
      },
      {
        groupLabel: '세 번째 박 (7~9)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: '쿵', intensity: 'medium' },
          { stroke: '따', intensity: 'light' },
        ],
      },
      {
        groupLabel: '네 번째 박 (10~12)',
        steps: [
          { stroke: '덩', intensity: 'strong' },
          { stroke: '따', intensity: 'light' },
          { stroke: '쿵', intensity: 'medium' },
        ],
      },
    ],
  }),
  createPreset({
    id: 'jungjungmori',
    name: '중중모리',
    meter: '12/8박자 (3박 × 4묶음)',
    tempoLabel: '흥겨운 중간 속도',
    defaultBpm: 92,
    minBpm: 60,
    maxBpm: 130,
    subdivisionsPerBeat: 3,
    description: '12박을 3박씩 4묶음으로 흥겹게 몰아가는 중간 속도 장단입니다.',
    groups: [
      {
        groupLabel: '첫 번째 박 (1~3)',
        steps: [
          { stroke: '덩', intensity: 'strong' },
          { stroke: null, intensity: null },
          { stroke: null, intensity: null },
        ],
      },
      {
        groupLabel: '두 번째 박 (4~6)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: null, intensity: null },
          { stroke: '따', intensity: 'light' },
        ],
      },
      {
        groupLabel: '세 번째 박 (7~9)',
        steps: [
          { stroke: '덩', intensity: 'strong' },
          { stroke: null, intensity: null },
          { stroke: '따', intensity: 'light' },
        ],
      },
      {
        groupLabel: '네 번째 박 (10~12)',
        steps: [
          { stroke: '쿵', intensity: 'medium' },
          { stroke: '따', intensity: 'light' },
          { stroke: null, intensity: null },
        ],
      },
    ],
  }),
];
