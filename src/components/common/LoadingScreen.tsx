import { Music2, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

/**
 * 소리마루 초기 입장 시 표시되는 파스텔톤 로딩 화면 컴포넌트.
 */
export function LoadingScreen({
  message = '소리마루로 입장하는 중...',
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 px-4 text-center"
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg animate-bounce">
        <Music2 className="h-10 w-10" />
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-amber-900 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
      </div>

      <h1 className="mt-6 text-2xl font-black tracking-tight text-stone-900">
        소리마루
      </h1>
      <p className="mt-2 text-sm font-bold text-stone-600">{message}</p>

      <div className="mt-5 h-2 w-48 overflow-hidden rounded-full bg-amber-200/70">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-amber-400" />
      </div>
    </div>
  );
}
