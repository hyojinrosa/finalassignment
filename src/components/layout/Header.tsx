import { Link } from 'react-router-dom';
import { Award, Camera, Mic, Settings, Sparkles } from 'lucide-react';
import type { MilestoneBadge } from '../../utils/userProgressStorage';

interface HeaderProps {
  userName?: string;
  primaryBadge: MilestoneBadge | null;
  isCameraActive: boolean;
  isMicActive: boolean;
  onOpenSettings: () => void;
}

export function Header({
  userName,
  primaryBadge,
  isCameraActive,
  isMicActive,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="border-b border-amber-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 text-left transition-opacity hover:opacity-85"
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/70 animate-spin"
              style={{ animationDuration: '6s' }}
            />
            <img
              src="/sogo_boy.png"
              alt="상모 돌리는 소고 소년"
              className="relative z-10 h-11 w-11 object-contain drop-shadow-xs animate-wiggle"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">
                소리마루
              </h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                단소 교실
              </span>
            </div>
            <p className="text-xs text-stone-500 sm:text-sm">
              웹캠 손가락 운지 인식 &amp; 실시간 음정 피드백 학습 앱
            </p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {userName && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>반갑습니다, {userName}님!</span>
              {primaryBadge && (
                <span
                  className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${primaryBadge.colorClass}`}
                >
                  <Award className="h-3 w-3" />
                  {primaryBadge.label}
                </span>
              )}
            </div>
          )}

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isCameraActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-stone-200 bg-stone-50 text-stone-500'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>{isCameraActive ? '웹캠 연결됨' : '웹캠 대기'}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isMicActive
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-stone-200 bg-stone-50 text-stone-500'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>{isMicActive ? '마이크 분석 중' : '마이크 대기'}</span>
          </span>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="설정 열기"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-stone-700 transition-colors hover:border-amber-300 hover:bg-amber-50"
          >
            <Settings className="h-3.5 w-3.5 text-stone-600" />
            <span>설정</span>
          </button>
        </div>
      </div>
    </header>
  );
}
