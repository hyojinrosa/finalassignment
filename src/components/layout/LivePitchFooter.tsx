import { Mic, MicOff } from 'lucide-react';
import type { UseAudioPitchReturn } from '../../hooks/useAudioPitch';

interface LivePitchFooterProps {
  audioPitch: UseAudioPitchReturn;
}

/**
 * 화면 하단에 현재 연주 중인 서양 음명(C, D, E 등)과
 * 국악 율명(궁·상·각·치·우 / 중·임·무·황·태)을 실시간으로 크게 표시하는 도크.
 */
export function LivePitchFooter({ audioPitch }: LivePitchFooterProps) {
  const { isListening, analysis, error, startListening, stopListening } =
    audioPitch;
  const { frequencyHz, clarity, westernNote, gugakNote } = analysis;

  const cents = westernNote?.centsOff ?? 0;
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const meterPercent = ((clampedCents + 50) / 100) * 100;
  const isInTune = westernNote !== null && Math.abs(cents) <= 15;

  return (
    <section
      aria-label="실시간 음높이 및 율명 모니터"
      className="sticky bottom-0 z-30 border-t border-stone-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        {/* 왼쪽: 마이크 컨트롤 & 주파수 */}
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <button
            type="button"
            onClick={isListening ? stopListening : () => void startListening()}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>마이크 중지</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>음정 분석 시작</span>
              </>
            )}
          </button>

          <div className="text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              YIN Pitch (Hz)
            </p>
            <p className="font-mono text-base font-bold text-stone-800 sm:text-lg">
              {frequencyHz ? `${frequencyHz.toFixed(1)} Hz` : '---.- Hz'}
            </p>
            {error && <p className="text-[11px] text-rose-600">{error}</p>}
          </div>
        </div>

        {/* 중앙 & 오른쪽: 크게 표시되는 서양 음명 + 국악 율명 + 튜닝 미터 */}
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          {/* 서양 음명 */}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-2">
            <div>
              <span className="block text-[11px] font-semibold text-stone-500">
                서양 음명
              </span>
              <span className="text-xs text-stone-400">
                {westernNote
                  ? `${westernNote.centsOff >= 0 ? '+' : ''}${westernNote.centsOff} cents`
                  : isListening
                    ? '소리 대기 중'
                    : '마이크 꺼짐'}
              </span>
            </div>
            <span
              className={`text-3xl font-black tracking-tight sm:text-4xl ${
                westernNote
                  ? isInTune
                    ? 'text-emerald-600'
                    : 'text-stone-900'
                  : 'text-stone-300'
              }`}
            >
              {westernNote ? westernNote.fullName : '—'}
            </span>
          </div>

          {/* 국악 율명 (궁·상·각·치·우 & 단소 율명) */}
          <div className="flex items-center justify-between rounded-xl border border-bamboo-500/30 bg-bamboo-50/70 px-4 py-2">
            <div>
              <span className="block text-[11px] font-semibold text-bamboo-700">
                국악 오음 · 율명
              </span>
              <span className="text-xs text-stone-500">
                {gugakNote
                  ? `${gugakNote.yulmyeong.koreanName}(${gugakNote.yulmyeong.hanja})`
                  : '궁 · 상 · 각 · 치 · 우'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-black sm:text-4xl ${
                  gugakNote ? 'text-bamboo-700' : 'text-stone-300'
                }`}
              >
                {gugakNote ? gugakNote.oheum : '—'}
              </span>
              {gugakNote && (
                <span className="text-lg font-extrabold text-amber-700 sm:text-xl">
                  ({gugakNote.yulmyeong.id})
                </span>
              )}
            </div>
          </div>

          {/* 센트 튜닝 바 */}
          <div className="flex flex-col justify-center rounded-xl border border-stone-200 bg-white px-4 py-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-stone-500">
              <span>낮음 (-50c)</span>
              <span
                className={`font-bold ${
                  isInTune ? 'text-emerald-600' : 'text-stone-600'
                }`}
              >
                {westernNote
                  ? isInTune
                    ? '정음'
                    : cents < 0
                      ? '조금 낮음'
                      : '조금 높음'
                  : `신뢰도 ${Math.round(clarity * 100)}%`}
              </span>
              <span>높음 (+50c)</span>
            </div>
            <div className="relative mt-2 h-2.5 w-full rounded-full bg-stone-200">
              <div className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-emerald-500" />
              {westernNote && (
                <div
                  className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-all duration-75 ${
                    isInTune ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ left: `${meterPercent}%` }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

