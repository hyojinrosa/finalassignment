import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  Crown,
  Edit3,
  Gamepad2,
  HandMetal,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  MILESTONE_BADGES,
  getEarnedBadges,
  getPrimaryBadge,
  type UserProgressData,
} from '../../utils/userProgressStorage';

interface HomeMenuScreenProps {
  progress: UserProgressData;
  onEditName: () => void;
}

interface MenuCardConfig {
  path: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: typeof BookOpen;
  cardClasses: string;
  iconBgClasses: string;
}

const MENU_CARDS: MenuCardConfig[] = [
  {
    path: '/learning',
    title: '기초 학습 애니메이션',
    subtitle: '단소의 원리와 호흡법 · 운지 애니메이션 보기',
    icon: BookOpen,
    cardClasses:
      'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/80 hover:border-emerald-300 hover:shadow-emerald-100/80',
    iconBgClasses: 'bg-emerald-400 text-white',
  },
  {
    path: '/practice',
    title: 'AI 실시간 연습',
    subtitle: '웹캠과 마이크를 이용한 실시간 운지 및 음정 교정',
    icon: Camera,
    cardClasses:
      'border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50/70 hover:border-sky-300 hover:shadow-sky-100/80',
    iconBgClasses: 'bg-sky-400 text-white',
  },
  {
    path: '/virtual',
    title: '가상 악기 연주',
    subtitle: '악보를 보며 화면 터치로 연주하기',
    icon: HandMetal,
    cardClasses:
      'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/70 hover:border-amber-300 hover:shadow-amber-100/80',
    iconBgClasses: 'bg-amber-400 text-white',
  },
  {
    path: '/rhythm',
    title: '장단 리듬 게임',
    subtitle: '율명 노트를 맞추며 장단을 익히는 게임 모드',
    icon: Gamepad2,
    cardClasses:
      'border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50/70 hover:border-violet-300 hover:shadow-violet-100/80',
    iconBgClasses: 'bg-violet-400 text-white',
  },
  {
    path: '/chatbot',
    title: '세종대왕 챗봇',
    subtitle: '단소 스승 세종대왕님과 대화하기',
    badge: '준비 중',
    icon: Crown,
    cardClasses:
      'border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/70 hover:border-rose-300 hover:shadow-rose-100/80',
    iconBgClasses: 'bg-rose-400 text-white',
  },
];

export function HomeMenuScreen({ progress, onEditName }: HomeMenuScreenProps) {
  const navigate = useNavigate();
  const displayName = progress.userName || '친구';
  const earnedBadges = getEarnedBadges(progress);
  const primaryBadge = getPrimaryBadge(progress);

  const bestJangdanEntries = Object.entries(progress.bestJangdanScores).sort(
    (a, b) => b[1] - a[1],
  );
  const topJangdan = bestJangdanEntries[0];

  return (
    <div className="space-y-6">
      {/* 상단 환영 배너 + 이름 옆 배지 아이콘 */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-amber-200/80 bg-gradient-to-r from-amber-100/80 via-rose-50 to-sky-100/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              소리마루에 오신 것을 환영합니다!
            </span>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                반갑습니다, {displayName}님!
              </h2>

              {primaryBadge && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold shadow-2xs ${primaryBadge.colorClass}`}
                >
                  <Award className="h-4 w-4" />
                  {primaryBadge.label}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-stone-600">
              아래 메뉴에서 원하는 학습 모드를 선택해 단소 실력을 키워 보세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onEditName}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-white/90 px-4 py-2 text-xs font-bold text-stone-700 shadow-xs transition-colors hover:bg-white"
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-600" />
            이름 변경
          </button>
        </div>
      </section>

      {/* 메인 2단 구성: 왼쪽 5개 커다란 카드형 메뉴 + 오른쪽 나의 기록 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label="학습 메뉴 선택"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8"
        >
          {MENU_CARDS.map((card, index) => {
            const Icon = card.icon;
            const isFullWidthLast = index === MENU_CARDS.length - 1;

            return (
              <button
                key={card.path}
                type="button"
                onClick={() => navigate(card.path)}
                className={`group flex items-start gap-4 rounded-3xl border-2 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  card.cardClasses
                } ${isFullWidthLast ? 'sm:col-span-2' : ''}`}
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-105 ${card.iconBgClasses}`}
                >
                  <Icon className="h-7 w-7" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-stone-900">
                      {card.title}
                    </h3>
                    {card.badge && (
                      <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {/* 오른쪽: 나의 기록 & 배지 도감 */}
        <aside
          aria-label="나의 학습 기록"
          className="rounded-3xl border-2 border-amber-200/80 bg-gradient-to-b from-white to-amber-50/60 p-5 shadow-sm lg:col-span-4"
        >
          <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-white">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                나의 기록
              </h3>
              <p className="text-xs text-stone-500">
                {displayName}님의 누적 학습 현황
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {/* 최고 점수 카드 */}
            <div className="rounded-2xl border border-violet-200/80 bg-violet-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-800">
                  리듬 게임 최고 점수
                </span>
                <Award className="h-4 w-4 text-violet-600" />
              </div>
              <p className="mt-1 text-3xl font-black text-violet-700">
                {progress.rhythmHighScore}점
              </p>
              {topJangdan && topJangdan[1] > 0 && (
                <p className="mt-1 text-xs font-semibold text-violet-600">
                  🏆 {topJangdan[0]} 최고 {topJangdan[1]}점!
                </p>
              )}
            </div>

            {/* 배지 컬렉션 */}
            <div>
              <h4 className="text-xs font-bold text-stone-700">
                나의 배지 ({earnedBadges.length}/{MILESTONE_BADGES.length})
              </h4>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {MILESTONE_BADGES.map((badge) => {
                  const unlocked = badge.isEarned(progress);
                  return (
                    <div
                      key={badge.id}
                      title={badge.description}
                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-bold ${
                        unlocked
                          ? badge.colorClass
                          : 'border-dashed border-stone-200 bg-white/70 text-stone-400'
                      }`}
                    >
                      {unlocked ? (
                        <Award className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 최근 달성 배지 / 학습 현황 */}
            <div>
              <h4 className="text-xs font-bold text-stone-700">
                최근 학습 현황
              </h4>
              {progress.recentBadges.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {progress.recentBadges.map((badge) => (
                    <li
                      key={badge}
                      className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-800"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{badge}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 rounded-xl border border-dashed border-stone-200 bg-white/80 p-3 text-xs text-stone-500">
                  아직 기록이 없어요! 리듬 게임이나 악보 연습을 완료하면 여기에
                  기록이 쌓입니다.
                </p>
              )}
            </div>

            {/* 연습한 곡 리스트 */}
            <div>
              <h4 className="text-xs font-bold text-stone-700">
                연습 완료한 곡 ({progress.practicedSongs.length}곡)
              </h4>
              {progress.practicedSongs.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {progress.practicedSongs.map((song) => (
                    <span
                      key={song}
                      className="rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-900"
                    >
                      {song}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-stone-400">
                  첫 곡을 완주해 보세요!
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
