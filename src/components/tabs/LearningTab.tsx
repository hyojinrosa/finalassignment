import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, Wind } from 'lucide-react';
import { DANSO_HOLE_LABELS, DANSO_NOTES } from '../../constants/dansoNotes';
import { DansoSynthesizer } from '../../utils/dansoSynth';

const FINGER_SHORT_NAMES = [
  '왼손 엄지',
  '왼손 검지',
  '왼손 중지',
  '오른손 중지',
  '열어두기',
] as const;

export function LearningTab() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [withSound, setWithSound] = useState(true);
  const [breathMode, setBreathMode] = useState<'pyeong' | 'yeok'>('pyeong');
  const synthRef = useRef<DansoSynthesizer | null>(null);

  const selectedNote = DANSO_NOTES[selectedIndex];
  const octaveMultiplier = breathMode === 'yeok' ? 2 : 1;
  const displayFreq = selectedNote.frequencyHz * octaveMultiplier;

  useEffect(() => {
    const synth = new DansoSynthesizer();
    synthRef.current = synth;
    return () => {
      synth.dispose();
      synthRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return undefined;

    if (withSound) {
      synthRef.current?.playOnce(
        {
          frequencyHz: DANSO_NOTES[selectedIndex].frequencyHz * octaveMultiplier,
          harmonicAmount: 0.65,
          breathAmount: 0.45,
          vibratoEnabled: true,
        },
        1400,
      );
    }

    const timer = window.setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % DANSO_NOTES.length);
    }, 2200);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAutoPlaying, selectedIndex, withSound, octaveMultiplier]);

  const handleSelectNote = (idx: number) => {
    setSelectedIndex(idx);
    if (withSound) {
      synthRef.current?.playOnce(
        {
          frequencyHz: DANSO_NOTES[idx].frequencyHz * octaveMultiplier,
          harmonicAmount: 0.65,
          breathAmount: 0.45,
          vibratoEnabled: true,
        },
        900,
      );
    }
  };

  const handlePreviewSound = () => {
    synthRef.current?.playOnce(
      {
        frequencyHz: displayFreq,
        harmonicAmount: 0.65,
        breathAmount: 0.45,
        vibratoEnabled: true,
      },
      1000,
    );
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* 왼쪽: 율명 선택 & 자동 학습 컨트롤 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-900">단소 5음 율명 선택</h2>
            <p className="mt-1 text-xs text-stone-500">
              음계를 클릭하거나 자동 순차 재생으로 운지 변화를 익혀보세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors ${
              isAutoPlaying
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-bamboo-600 hover:bg-bamboo-700'
            }`}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                정지
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                자동 학습
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-stone-600">취법:</span>
            <button
              type="button"
              onClick={() => setBreathMode('pyeong')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                breathMode === 'pyeong'
                  ? 'bg-bamboo-600 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              평취 (기본음)
            </button>
            <button
              type="button"
              onClick={() => setBreathMode('yeok')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                breathMode === 'yeok'
                  ? 'bg-bamboo-600 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              역취 (한 옥타브 위)
            </button>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-1.5 text-stone-600">
            <input
              type="checkbox"
              checked={withSound}
              onChange={(e) => setWithSound(e.target.checked)}
              className="accent-bamboo-600"
            />
            <span>음정 미리듣기</span>
          </label>
        </div>

        <div className="mt-4 space-y-2.5">
          {DANSO_NOTES.map((note, idx) => {
            const isSelected = idx === selectedIndex;
            const freq = note.frequencyHz * octaveMultiplier;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => handleSelectNote(idx)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-bamboo-500 bg-bamboo-50 text-bamboo-700 shadow-xs ring-1 ring-bamboo-500/20'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold transition-colors ${
                      isSelected
                        ? 'bg-bamboo-600 text-white'
                        : 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {note.id}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {note.koreanName} ({note.hanja})
                    </p>
                    <p className="text-xs text-stone-500">
                      기준음 {note.westernNote}({note.solfege}) · {freq.toFixed(1)} Hz
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                  {note.holes.filter(Boolean).length}공 막기
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 운지 & 호흡 애니메이션 가이드 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-bamboo-600">
              Fingering &amp; Breath Animation
            </span>
            <h3 className="text-xl font-bold text-stone-900">
              {selectedNote.id} ({selectedNote.hanja}) — {selectedNote.koreanName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              {selectedNote.westernNote} ({displayFreq.toFixed(1)} Hz)
            </span>
            <button
              type="button"
              onClick={handlePreviewSound}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200"
            >
              <Volume2 className="h-3.5 w-3.5" />
              음 듣기
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          {selectedNote.description}
        </p>

        <div className="mt-5 grid grid-cols-1 items-center gap-6 rounded-2xl bg-hanji p-6 sm:grid-cols-12">
          {/* 단소 + 취구 호흡 애니메이션 + 손가락 이동 애니메이션 */}
          <div className="flex flex-col items-center sm:col-span-5">
            {/* 취구(입김) 애니메이션 */}
            <div className="mb-2 flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
              <Wind className="h-3.5 w-3.5 animate-breath-flow" />
              <span>
                {breathMode === 'pyeong'
                  ? '부드러운 입김 (평취 · 45°)'
                  : '빠르고 좁은 입김 (역취 · 45°)'}
              </span>
            </div>

            <div className="relative flex flex-col items-center gap-3.5 rounded-full border-2 border-amber-800/30 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-200 px-8 py-7 shadow-inner">
              {/* 취구 */}
              <div
                className="relative mb-2 flex h-3.5 w-9 items-center justify-center rounded-full bg-stone-700/85"
                title="취구 (입술 대는 곳)"
              >
                <span className="absolute -left-5 h-2 w-4 rounded-full bg-sky-400/60 blur-[1px] animate-breath-flow" />
              </div>

              {selectedNote.holes.map((isClosed, holeIdx) => (
                <div
                  key={DANSO_HOLE_LABELS[holeIdx]}
                  className="relative flex items-center justify-center"
                >
                  {/* 제1공 뒷구멍 표시 */}
                  {holeIdx === 0 && (
                    <span className="absolute -left-12 rounded bg-stone-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      뒤
                    </span>
                  )}

                  {/* 지공 원 */}
                  <span
                    className={`h-7 w-7 rounded-full border-2 transition-all duration-300 ${
                      isClosed
                        ? 'scale-105 border-emerald-700 bg-emerald-500 shadow-md ring-4 ring-emerald-500/20'
                        : 'border-rose-400 bg-white'
                    }`}
                  />

                  {/* 막는 손가락 슬라이드 애니메이션 */}
                  <span
                    className={`pointer-events-none absolute left-9 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all duration-300 ${
                      isClosed
                        ? 'translate-x-0 bg-emerald-600 text-white opacity-100 shadow-xs animate-finger-tap'
                        : 'translate-x-4 bg-stone-200 text-stone-400 opacity-45'
                    }`}
                  >
                    {FINGER_SHORT_NAMES[holeIdx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5지공 상태 표 + 호흡 세기 바 */}
          <div className="space-y-4 sm:col-span-7">
            <ul className="space-y-2">
              {DANSO_HOLE_LABELS.map((label, holeIdx) => {
                const isClosed = selectedNote.holes[holeIdx];
                return (
                  <li
                    key={label}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition-colors ${
                      isClosed
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : 'border-stone-200/80 bg-white'
                    }`}
                  >
                    <span className="font-medium text-stone-700">{label}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-semibold ${
                        isClosed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isClosed ? '막음' : '열림'}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-xl border border-stone-200 bg-white p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                <span>권장 호흡 압력</span>
                <span className="text-sky-700">
                  {breathMode === 'pyeong' ? '중간 (안정적 유지)' : '강함 (집중된 입김)'}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    breathMode === 'pyeong'
                      ? 'w-1/2 bg-gradient-to-r from-sky-400 to-emerald-500'
                      : 'w-5/6 bg-gradient-to-r from-amber-400 to-rose-500'
                  }`}
                />
              </div>
            </div>

            {/* 판소리 할아버지 명창의 국악 이론 팁 */}
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/75 p-3.5">
              <img
                src="/grandpa.png"
                alt="판소리 할아버지 명창 선생님"
                className="relative z-10 h-14 w-14 shrink-0 object-contain drop-shadow-xs"
              />
              <div className="text-xs leading-relaxed text-stone-700">
                <p className="font-extrabold text-amber-900">
                  명창 할아버지의 단소 원리 교실
                </p>
                <p className="mt-0.5">
                  “단소를 몸과 45° 각도로 기울여 입김이 취구 모서리에 맑게
                  부딪치게 하거라. 손가락 끝 살로 지공을 빈틈없이 막아야 맑은
                  중·임·무·황·태 소리가 난단다.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
