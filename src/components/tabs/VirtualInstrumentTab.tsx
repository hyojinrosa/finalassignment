import { useEffect, useRef, useState } from 'react';
import { Volume2, Wind } from 'lucide-react';
import { DANSO_HOLE_LABELS, DANSO_NOTES } from '../../constants/dansoNotes';
import type { HoleStates } from '../../types/danso';
import { ToneDansoEngine } from '../../utils/toneDansoEngine';

/**
 * 실제 단소(총 길이 약 40cm, 내경 13mm/외경 20mm, 지공 지름 약 7.5mm)의
 * 비율에 맞춘 지공 상대 위치(%) 정보.
 */
const DANSO_REAL_PROPORTIONS = [
  { index: 0, label: '제1공 (뒤·엄지)', topPercent: 45, isBack: true },
  { index: 1, label: '제2공 (왼손 검지)', topPercent: 51.2, isBack: false },
  { index: 2, label: '제3공 (왼손 중지)', topPercent: 61.2, isBack: false },
  { index: 3, label: '제4공 (오른손 중지)', topPercent: 71.2, isBack: false },
  { index: 4, label: '제5공 (아래 구멍)', topPercent: 81.2, isBack: false },
] as const;

export function VirtualInstrumentTab() {
  const [holes, setHoles] = useState<HoleStates>([true, true, true, true, false]);
  const [isBlowing, setIsBlowing] = useState(false);
  const [isYeokchwi, setIsYeokchwi] = useState(false);
  const [breathBrightness, setBreathBrightness] = useState(0.55);
  const [vibratoDepth, setVibratoDepth] = useState(0.16);
  const [playOnHoleTouch, setPlayOnHoleTouch] = useState(true);

  const engineRef = useRef<ToneDansoEngine | null>(null);

  const matchedNote = DANSO_NOTES.find((note) =>
    note.holes.every((closed, idx) => closed === holes[idx]),
  );

  const baseFreq = matchedNote?.frequencyHz ?? 440;
  const activeFreq = isYeokchwi ? baseFreq * 2 : baseFreq;

  useEffect(() => {
    const engine = new ToneDansoEngine();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isBlowing) {
      void engineRef.current?.updateHoldFrequency({
        frequencyHz: activeFreq,
        breathAmount: breathBrightness,
        vibratoDepth,
      });
    }
  }, [activeFreq, isBlowing, breathBrightness, vibratoDepth]);

  const computeNextFreq = (nextHoles: HoleStates) => {
    const nextMatched = DANSO_NOTES.find((note) =>
      note.holes.every((closed, idx) => closed === nextHoles[idx]),
    );
    const freq = nextMatched?.frequencyHz ?? 440;
    return isYeokchwi ? freq * 2 : freq;
  };

  const toggleHole = (index: number) => {
    const nextHoles = [...holes] as HoleStates;
    nextHoles[index] = !nextHoles[index];
    setHoles(nextHoles);

    // 구멍 터치 시 실제 단소 샘플 재생
    if (playOnHoleTouch && !isBlowing) {
      void engineRef.current?.playSample({
        frequencyHz: computeNextFreq(nextHoles),
        breathAmount: breathBrightness,
        vibratoDepth,
        durationSec: 0.75,
      });
    }
  };

  const handlePlayOnce = () => {
    setIsBlowing(false);
    void engineRef.current?.playSample({
      frequencyHz: activeFreq,
      breathAmount: breathBrightness,
      vibratoDepth,
      durationSec: 0.95,
    });
  };

  const handleStartBlow = () => {
    setIsBlowing(true);
    void engineRef.current?.startHold({
      frequencyHz: activeFreq,
      breathAmount: breathBrightness,
      vibratoDepth,
    });
  };

  const handleStopBlow = () => {
    if (!isBlowing) return;
    setIsBlowing(false);
    engineRef.current?.stopHold();
  };

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            가상 단소 연주 (Tone.js 샘플 엔진 · 실물 지공 비율)
          </h2>
          <p className="text-xs text-stone-500">
            실제 단소(40cm)의 지공 간격(45% · 51% · 61% · 71% · 81%)과 구멍 크기 비율을 적용했습니다. 구멍을 터치하면 즉시 소리가 납니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onPointerDown={handleStartBlow}
            onPointerUp={handleStopBlow}
            onPointerLeave={handleStopBlow}
            onPointerCancel={handleStopBlow}
            className={`inline-flex select-none items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors ${
              isBlowing
                ? 'bg-emerald-600 shadow-inner'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            <Wind className="h-4 w-4" />
            {isBlowing ? '부는 중...' : '누르고 불기'}
          </button>

          <button
            type="button"
            onClick={handlePlayOnce}
            className="inline-flex items-center gap-2 rounded-xl bg-bamboo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-bamboo-700"
          >
            <Volume2 className="h-4 w-4" />
            한 번 불기
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 md:grid-cols-12">
        {/* 실물 비율 가상 단소 몸체 */}
        <div className="flex flex-col items-center gap-4 rounded-xl bg-hanji p-6 md:col-span-5">
          <div className="relative h-[440px] w-14 rounded-full border-2 border-amber-800/35 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 shadow-inner">
            {/* 취구 (0% ~ 4%) */}
            <div
              className={`absolute top-[2%] left-1/2 h-3.5 w-7 -translate-x-1/2 rounded-b-full transition-colors ${
                isBlowing ? 'bg-sky-500' : 'bg-stone-800/85'
              }`}
              title="취구 (0cm)"
            />

            {/* 대나무 마디 장식선 */}
            <div className="pointer-events-none absolute top-[28%] inset-x-0 h-[3px] bg-amber-700/25" />
            <div className="pointer-events-none absolute top-[56%] inset-x-0 h-[2px] bg-amber-700/20" />
            <div className="pointer-events-none absolute top-[88%] inset-x-0 h-[3px] bg-amber-700/25" />

            {/* 실제 단소 비율 지공 5개 (지름 약 7.5mm / 관 외경 20mm ≈ 38% 비율) */}
            {DANSO_REAL_PROPORTIONS.map((hole) => {
              const isClosed = holes[hole.index];
              return (
                <div
                  key={hole.label}
                  style={{ top: `${hole.topPercent}%` }}
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  {hole.isBack && (
                    <span className="absolute top-1/2 -left-11 -translate-y-1/2 rounded bg-stone-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      뒤·1공
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={hole.label}
                    onClick={() => toggleHole(hole.index)}
                    className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-all ${
                      isClosed
                        ? 'scale-110 border-emerald-700 bg-emerald-500 shadow-md ring-4 ring-emerald-500/25'
                        : 'border-red-500 bg-white hover:bg-red-50'
                    }`}
                  >
                    <span className="sr-only">{hole.label}</span>
                  </button>

                  {!hole.isBack && (
                    <span className="pointer-events-none absolute top-1/2 left-8 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-stone-500">
                      {hole.index + 1}공
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsYeokchwi(false)}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                !isYeokchwi
                  ? 'bg-bamboo-600 text-white'
                  : 'bg-white text-stone-600'
              }`}
            >
              평취 (1옥타브)
            </button>
            <button
              type="button"
              onClick={() => setIsYeokchwi(true)}
              className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                isYeokchwi
                  ? 'bg-bamboo-600 text-white'
                  : 'bg-white text-stone-600'
              }`}
            >
              역취 (2옥타브)
            </button>
          </div>
        </div>

        {/* 율명 표시 + 지공 토글 + Tone.js 음색 조절 */}
        <div className="space-y-4 md:col-span-7">
          <div className="rounded-xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">현재 운지에 해당하는 율명</p>
            <p className="mt-1 text-3xl font-extrabold text-bamboo-700">
              {matchedNote
                ? `${matchedNote.id} (${matchedNote.hanja}) · ${matchedNote.oheum}(${matchedNote.oheumHanja})`
                : '사용자 지정 운지'}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {matchedNote
                ? `${matchedNote.koreanName} · ${matchedNote.westernNote} (${activeFreq.toFixed(1)} Hz)`
                : `기본 5음 외의 조합입니다. ${activeFreq.toFixed(1)} Hz로 재생됩니다.`}
            </p>
          </div>

          <ul className="space-y-2">
            {DANSO_HOLE_LABELS.map((label, idx) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => toggleHole(idx)}
                  className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-xs hover:bg-stone-50"
                >
                  <span className="font-medium text-stone-700">{label}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-semibold ${
                      holes[idx]
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {holes[idx] ? '막음' : '열림'}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs">
            <p className="font-bold text-stone-800">Tone.js 샘플 음색 설정</p>

            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-stone-600">구멍 터치 시 즉시 소리 재생</span>
              <input
                type="checkbox"
                checked={playOnHoleTouch}
                onChange={(e) => setPlayOnHoleTouch(e.target.checked)}
                className="accent-bamboo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="text-stone-600">관명 음색 밝기 (Filter)</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={breathBrightness}
                onChange={(e) => setBreathBrightness(Number(e.target.value))}
                className="w-36 accent-bamboo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="text-stone-600">전통 요성 깊이 (Vibrato)</span>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.02}
                value={vibratoDepth}
                onChange={(e) => setVibratoDepth(Number(e.target.value))}
                className="w-36 accent-bamboo-600"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
