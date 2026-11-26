import { Camera, Mic, Music2 } from 'lucide-react';

interface HeaderProps {
  isCameraActive: boolean;
  isMicActive: boolean;
}

export function Header({ isCameraActive, isMicActive }: HeaderProps) {
  return (
    <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bamboo-600 text-white shadow-sm">
            <Music2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
                Finger Hero
              </h1>
              <span className="rounded-full bg-bamboo-100 px-2 py-0.5 text-xs font-semibold text-bamboo-700">
                단소 에디션
              </span>
            </div>
            <p className="text-xs text-stone-500 sm:text-sm">
              웹캠 손가락 운지 인식 &amp; 실시간 음정 피드백 학습 앱
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}

