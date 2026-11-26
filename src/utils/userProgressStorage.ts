export interface UserProgressData {
  userName: string;
  rhythmHighScore: number;
  bestJangdanScores: Record<string, number>;
  practicedSongs: string[];
  recentBadges: string[];
  updatedAt: number;
}

export interface MilestoneBadge {
  id: 'sprout' | 'challenger' | 'jangdan-master' | 'danso-virtuoso';
  label: string;
  description: string;
  colorClass: string;
  isEarned: (data: UserProgressData) => boolean;
}

export const MILESTONE_BADGES: MilestoneBadge[] = [
  {
    id: 'sprout',
    label: '새싹 연주자',
    description: '1곡 이상 연습 또는 리듬 게임 100점 달성',
    colorClass: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    isEarned: (d) => d.practicedSongs.length >= 1 || d.rhythmHighScore >= 100,
  },
  {
    id: 'challenger',
    label: '율명 도전자',
    description: '리듬 게임 300점 이상 달성',
    colorClass: 'border-sky-300 bg-sky-100 text-sky-800',
    isEarned: (d) => d.rhythmHighScore >= 300,
  },
  {
    id: 'jangdan-master',
    label: '장단 마스터',
    description: '리듬 게임 500점 이상 달성',
    colorClass: 'border-amber-400 bg-amber-100 text-amber-900',
    isEarned: (d) => d.rhythmHighScore >= 500,
  },
  {
    id: 'danso-virtuoso',
    label: '단소 명인',
    description: '리듬 게임 800점 이상 및 2곡 이상 완주',
    colorClass: 'border-violet-300 bg-violet-100 text-violet-900',
    isEarned: (d) => d.rhythmHighScore >= 800 && d.practicedSongs.length >= 2,
  },
];

const STORAGE_KEY = 'finger_hero_user_progress_v1';

const DEFAULT_PROGRESS: UserProgressData = {
  userName: '',
  rhythmHighScore: 0,
  bestJangdanScores: {},
  practicedSongs: [],
  recentBadges: [],
  updatedAt: 0,
};

export function getEarnedBadges(data: UserProgressData): MilestoneBadge[] {
  return MILESTONE_BADGES.filter((badge) => badge.isEarned(data));
}

export function getPrimaryBadge(
  data: UserProgressData,
): MilestoneBadge | null {
  const earned = getEarnedBadges(data);
  return earned.length > 0 ? earned[earned.length - 1] : null;
}

export function loadUserProgress(): UserProgressData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<UserProgressData>;
    return {
      userName: typeof parsed.userName === 'string' ? parsed.userName : '',
      rhythmHighScore:
        typeof parsed.rhythmHighScore === 'number' ? parsed.rhythmHighScore : 0,
      bestJangdanScores:
        parsed.bestJangdanScores && typeof parsed.bestJangdanScores === 'object'
          ? parsed.bestJangdanScores
          : {},
      practicedSongs: Array.isArray(parsed.practicedSongs)
        ? parsed.practicedSongs
        : [],
      recentBadges: Array.isArray(parsed.recentBadges)
        ? parsed.recentBadges
        : [],
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function persistProgress(data: UserProgressData): UserProgressData {
  const next: UserProgressData = {
    ...data,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 브라우저 저장소 제한 시 메모리 상태만 유지
  }
  return next;
}

export function clearUserProgress(): UserProgressData {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
  return { ...DEFAULT_PROGRESS };
}

export function saveUserName(
  current: UserProgressData,
  name: string,
): UserProgressData {
  return persistProgress({
    ...current,
    userName: name.trim(),
  });
}

function appendUniqueBadge(badges: string[], badge: string): string[] {
  const filtered = badges.filter((b) => b !== badge);
  return [badge, ...filtered].slice(0, 6);
}

export function recordSongPracticed(
  current: UserProgressData,
  songTitle: string,
): UserProgressData {
  const practicedSongs = current.practicedSongs.includes(songTitle)
    ? current.practicedSongs
    : [...current.practicedSongs, songTitle];

  const shortTitle = songTitle.split('(')[0].trim();
  const recentBadges = appendUniqueBadge(
    current.recentBadges,
    `${shortTitle} 연습 완료!`,
  );

  return persistProgress({
    ...current,
    practicedSongs,
    recentBadges,
  });
}

export function recordRhythmGameResult(
  current: UserProgressData,
  jangdanName: string,
  songTitle: string,
  score: number,
): UserProgressData {
  const prevBest = current.bestJangdanScores[jangdanName] ?? 0;
  const isNewJangdanBest = score > prevBest && score > 0;

  const bestJangdanScores = {
    ...current.bestJangdanScores,
    [jangdanName]: Math.max(prevBest, score),
  };

  const rhythmHighScore = Math.max(current.rhythmHighScore, score);
  const practicedSongs = current.practicedSongs.includes(songTitle)
    ? current.practicedSongs
    : [...current.practicedSongs, songTitle];

  let recentBadges = current.recentBadges;
  if (isNewJangdanBest) {
    recentBadges = appendUniqueBadge(
      recentBadges,
      `${jangdanName} 최고 ${score}점 달성!`,
    );
  } else if (score > 0) {
    recentBadges = appendUniqueBadge(
      recentBadges,
      `${jangdanName} 완주 (${score}점)`,
    );
  }

  return persistProgress({
    ...current,
    rhythmHighScore,
    bestJangdanScores,
    practicedSongs,
    recentBadges,
  });
}
