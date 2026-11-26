interface LoadingScreenProps {
  message?: string;
}

/**
 * 소리마루 공통 로딩 화면:
 * 단소 호랑이(tiger.png)와 장구 토끼(rabbit.png)가 악기를 연주하는 모션과 함께 안내 문구를 표시합니다.
 */
export function LoadingScreen({
  message = '국악 마을로 가는 중...',
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 px-4 text-center"
    >
      <div className="relative z-10 flex items-end justify-center gap-4">
        <img
          src="/tiger.png"
          alt="단소 부는 아기 호랑이"
          className="h-28 w-28 object-contain drop-shadow-md animate-bounce sm:h-32 sm:w-32"
        />
        <img
          src="/rabbit.png"
          alt="장단 맞추는 한복 토끼"
          className="h-28 w-28 object-contain drop-shadow-md animate-wiggle sm:h-32 sm:w-32"
        />
      </div>

      <h1 className="mt-5 text-2xl font-black tracking-tight text-stone-900">
        소리마루
      </h1>
      <p className="mt-2 text-base font-extrabold text-amber-800 animate-pulse">
        {message}
      </p>

      <div className="mt-5 h-2.5 w-52 overflow-hidden rounded-full bg-amber-200/70">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" />
      </div>
    </div>
  );
}
