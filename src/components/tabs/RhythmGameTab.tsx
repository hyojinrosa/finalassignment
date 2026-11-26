import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Drum,
  Gamepad2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DANSO_NOTES } from '../../constants/dansoNotes';
import { DANSO_SAMPLE_SCORES } from '../../constants/dansoScores';
import {
  JANGDAN_PRESETS,
  type JangdanId,
  type JangdanPreset,
  type JangguStroke,
} from '../../constants/jangdanPresets';
import type { UseAudioPitchReturn } from '../../hooks/useAudioPitch';
import type { DansoYulmyeong } from '../../types/danso';
import { JangdanAudioEngine } from '../../utils/jangdanEngine';
import { ToneDansoEngine } from '../../utils/toneDansoEngine';
import {
  RhythmReportModal,
  type NoteOutcome,
} from '../rhythm/RhythmReportModal';
import { JeongganboViewer } from '../score/JeongganboViewer';

interface RhythmGameTabProps {
  audioPitch: UseAudioPitchReturn;
  onGameComplete?: (jangdanName: string, songTitle: string, score: number) => void;
}

interface FallingNote {
  id: number;
  cellIndex: number;
  yulmyeong: DansoYulmyeong;
  laneIndex: number;
  spawnTimeMs: number;
  targetTimeMs: number;
  groupIndex: number;
  stroke: JangguStroke;
  status: 'pending' | 'hit' | 'missed';
}

interface BurstParticle {
  id: number;
  xPercent: number;
  yPercent: number;
  tx: number;
  ty: number;
  colorClass: string;
}

const LANE_COLORS = [
  'border-emerald-300 bg-emerald-500 text-white',
  'border-sky-300 bg-sky-500 text-white',
  'border-amber-300 bg-amber-500 text-white',
  'border-violet-300 bg-violet-500 text-white',
  'border-rose-300 bg-rose-500 text-white',
] as const;

const HOLE_BUTTON_RING = [
  'border-emerald-400 hover:bg-emerald-500/20',
  'border-sky-400 hover:bg-sky-500/20',
  'border-amber-400 hover:bg-amber-500/20',
  'border-violet-400 hover:bg-violet-500/20',
  'border-rose-400 hover:bg-rose-500/20',
] as const;

const TRAVEL_TIME_MS = 2800;
const EXCELLENT_WINDOW_MS = 160;
const GOOD_WINDOW_MS = 380;

export function RhythmGameTab({ audioPitch, onGameComplete }: RhythmGameTabProps) {
  const [selectedJangdanId, setSelectedJangdanId] =
    useState<JangdanId>('jajinmori');
  const [bpm, setBpm] = useState<number>(JANGDAN_PRESETS[0].defaultBpm);
  const [jangdanSoundOn, setJangdanSoundOn] = useState(true);
  const [selectedScoreId, setSelectedScoreId] = useState(
    DANSO_SAMPLE_SCORES[1].id,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [scorePoints, setScorePoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [pressedLane, setPressedLane] = useState<number | null>(null);
  const [judgement, setJudgement] = useState<{
    text: string;
    tone: 'neutral' | 'excellent' | 'good' | 'miss';
  }>({ text: '준비됨', tone: 'neutral' });
  const [notes, setNotes] = useState<FallingNote[]>([]);
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);

  // 결과 리포트 상태
  const [outcomes, setOutcomes] = useState<NoteOutcome[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // 장단 시각 비트 (구음 인덱스, 화면 흔들림 키, 파티클, 캐릭터 리액션)
  const [activeStepIdx, setActiveStepIdx] = useState<number>(-1);
  const [shakeKey, setShakeKey] = useState(0);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [mascotMood, setMascotMood] = useState<
    'idle' | 'excellent' | 'good' | 'miss'
  >('idle');

  const dansoSynthRef = useRef<ToneDansoEngine | null>(null);
  const jangdanAudioRef = useRef<JangdanAudioEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const notesRef = useRef<FallingNote[]>([]);
  const outcomesRef = useRef<NoteOutcome[]>([]);
  const lastPitchNoteRef = useRef<DansoYulmyeong | null>(null);
  const particleIdRef = useRef(0);
  const moodTimerRef = useRef<number | null>(null);

  const triggerMascotMood = useCallback(
    (mood: 'excellent' | 'good' | 'miss') => {
      if (moodTimerRef.current !== null) {
        window.clearTimeout(moodTimerRef.current);
      }
      setMascotMood(mood);
      moodTimerRef.current = window.setTimeout(() => {
        setMascotMood('idle');
      }, 650);
    },
    [],
  );

  const selectedJangdan: JangdanPreset = useMemo(
    () =>
      JANGDAN_PRESETS.find((j) => j.id === selectedJangdanId) ??
      JANGDAN_PRESETS[0],
    [selectedJangdanId],
  );

  const selectedScore = useMemo(
    () =>
      DANSO_SAMPLE_SCORES.find((s) => s.id === selectedScoreId) ??
      DANSO_SAMPLE_SCORES[0],
    [selectedScoreId],
  );

  useEffect(() => {
    const danso = new ToneDansoEngine();
    const jangdan = new JangdanAudioEngine();
    dansoSynthRef.current = danso;
    jangdanAudioRef.current = jangdan;
    return () => {
      danso.dispose();
      jangdan.dispose();
      dansoSynthRef.current = null;
      jangdanAudioRef.current = null;
    };
  }, []);

  const spawnParticles = useCallback(
    (xPercent: number, yPercent: number, colorClass: string, count = 8) => {
      const batch: BurstParticle[] = Array.from({ length: count }).map(
        (_, i) => {
          particleIdRef.current += 1;
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const dist = 28 + Math.random() * 34;
          return {
            id: particleIdRef.current,
            xPercent,
            yPercent,
            tx: Math.round(Math.cos(angle) * dist),
            ty: Math.round(Math.sin(angle) * dist),
            colorClass,
          };
        },
      );

      setParticles((prev) => [...prev.slice(-24), ...batch]);
      window.setTimeout(() => {
        const ids = new Set(batch.map((b) => b.id));
        setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
      }, 600);
    },
    [],
  );

  /**
   * 노트 목표 시각(targetTimeMs)이 선택한 장단의 어느 묶음(groupIndex)과
   * 어떤 구음(덩·쿵·따)에 해당하는지 매핑합니다.
   */
  const resolveBeatMetadata = useCallback(
    (
      targetTimeMs: number,
      firstBeatTimeMs: number,
    ): { groupIndex: number; stroke: JangguStroke } => {
      const stepMs =
        ((60 / bpm) * 1000) / selectedJangdan.subdivisionsPerBeat;
      const totalSteps = selectedJangdan.pattern.length;
      const rawStep = Math.max(
        0,
        Math.round((targetTimeMs - firstBeatTimeMs) / stepMs),
      );
      const patternStepIdx = rawStep % totalSteps;

      // 묶음 인덱스 찾기
      let cursor = 0;
      for (let gIdx = 0; gIdx < selectedJangdan.groups.length; gIdx += 1) {
        const grp = selectedJangdan.groups[gIdx];
        if (patternStepIdx < cursor + grp.steps.length) {
          const localStep = grp.steps[patternStepIdx - cursor];
          const fallbackStroke =
            localStep.stroke ??
            grp.steps.find((s) => s.stroke !== null)?.stroke ??
            null;
          return { groupIndex: gIdx, stroke: fallbackStroke };
        }
        cursor += grp.steps.length;
      }

      return { groupIndex: 0, stroke: '덩' };
    },
    [bpm, selectedJangdan],
  );

  const buildSchedule = useCallback(() => {
    const beatMs = (60 / bpm) * 1000;
    const firstBeatTimeMs = 1500;
    let cursorMs = firstBeatTimeMs;
    const scheduled: FallingNote[] = [];

    selectedScore.cells.forEach((cell, cellIdx) => {
      if (cell.note) {
        const laneIndex = DANSO_NOTES.findIndex((n) => n.id === cell.note);
        if (laneIndex !== -1) {
          const { groupIndex, stroke } = resolveBeatMetadata(
            cursorMs,
            firstBeatTimeMs,
          );
          scheduled.push({
            id: cellIdx + 1,
            cellIndex: cellIdx,
            yulmyeong: cell.note,
            laneIndex,
            spawnTimeMs: cursorMs - TRAVEL_TIME_MS,
            targetTimeMs: cursorMs,
            groupIndex,
            stroke,
            status: 'pending',
          });
        }
      }
      cursorMs += cell.duration * beatMs;
    });

    return scheduled;
  }, [bpm, selectedScore, resolveBeatMetadata]);

  const stopGame = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
    setActiveStepIdx(-1);
  }, []);

  const startGame = useCallback(() => {
    const scheduled = buildSchedule();
    notesRef.current = scheduled;
    outcomesRef.current = [];
    setNotes(scheduled);
    setOutcomes([]);
    setIsReportOpen(false);
    setScorePoints(0);
    setCombo(0);
    setMaxCombo(0);
    setJudgement({ text: '연주를 시작하세요!', tone: 'neutral' });
    setActiveCellIndex(null);
    startTimeRef.current = performance.now();
    setIsPlaying(true);
  }, [buildSchedule]);

  const resetGame = useCallback(() => {
    stopGame();
    notesRef.current = [];
    outcomesRef.current = [];
    setNotes([]);
    setOutcomes([]);
    setIsReportOpen(false);
    setScorePoints(0);
    setCombo(0);
    setMaxCombo(0);
    setJudgement({ text: '준비됨', tone: 'neutral' });
    setActiveCellIndex(null);
  }, [stopGame]);

  const triggerHoleHit = useCallback(
    (laneIndex: number, playAudio = true) => {
      const noteMeta = DANSO_NOTES[laneIndex];
      if (!noteMeta) return;
      const yulmyeong = noteMeta.id;

      setPressedLane(laneIndex);
      window.setTimeout(() => {
        setPressedLane((curr) => (curr === laneIndex ? null : curr));
      }, 140);

      if (playAudio) {
        void dansoSynthRef.current?.playSample({
          frequencyHz: noteMeta.frequencyHz,
          durationSec: 0.45,
        });
      }

      if (!isPlaying) return;

      const elapsed = performance.now() - startTimeRef.current;
      const target = notesRef.current.find(
        (item) =>
          item.status === 'pending' &&
          item.laneIndex === laneIndex &&
          Math.abs(elapsed - item.targetTimeMs) <= GOOD_WINDOW_MS,
      );

      if (!target) {
        setCombo(0);
        setJudgement({ text: `아쉬워요 (${yulmyeong})`, tone: 'miss' });
        triggerMascotMood('miss');
        return;
      }

      const delta = Math.abs(elapsed - target.targetTimeMs);
      target.status = 'hit';
      const isExcellent = delta <= EXCELLENT_WINDOW_MS;

      outcomesRef.current.push({
        yulmyeong: target.yulmyeong,
        groupIndex: target.groupIndex,
        stroke: target.stroke,
        result: isExcellent ? 'excellent' : 'good',
      });
      setOutcomes([...outcomesRef.current]);

      setNotes([...notesRef.current]);
      setActiveCellIndex(target.cellIndex);
      setScorePoints((prev) => prev + (isExcellent ? 100 : 60));
      setCombo((prev) => {
        const next = prev + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
      setJudgement({
        text: isExcellent
          ? `훌륭해요! (${yulmyeong})`
          : `좋아요! (${yulmyeong})`,
        tone: isExcellent ? 'excellent' : 'good',
      });
      triggerMascotMood(isExcellent ? 'excellent' : 'good');

      const laneX = laneIndex * 20 + 10;
      spawnParticles(
        laneX,
        78,
        isExcellent ? 'bg-emerald-400' : 'bg-sky-400',
        isExcellent ? 10 : 6,
      );
    },
    [isPlaying, spawnParticles, triggerMascotMood],
  );

  // 배경 장구(덩, 쿵, 따) 비트 스케줄러 + 강약 시각 효과
  useEffect(() => {
    if (!isPlaying) {
      setActiveStepIdx(-1);
      return undefined;
    }

    const stepMs =
      ((60 / bpm) * 1000) / selectedJangdan.subdivisionsPerBeat;
    let stepCursor = 0;

    const fireStep = () => {
      const idx = stepCursor % selectedJangdan.pattern.length;
      const step = selectedJangdan.pattern[idx];
      setActiveStepIdx(idx);

      if (step.stroke) {
        if (jangdanSoundOn) {
          jangdanAudioRef.current?.playStroke(step.stroke);
        }
        if (step.intensity === 'strong') {
          setShakeKey((prev) => prev + 1);
          spawnParticles(50, 18, 'bg-amber-400', 8);
        } else if (step.intensity === 'medium') {
          spawnParticles(28, 18, 'bg-sky-400', 4);
        } else {
          spawnParticles(72, 18, 'bg-rose-400', 4);
        }
      }

      stepCursor += 1;
    };

    fireStep();
    const timer = window.setInterval(fireStep, stepMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, bpm, selectedJangdan, jangdanSoundOn, spawnParticles]);

  // 낙하 노트 애니메이션 & 놓친 노트 '아쉬워요' 기록 + 게임 종료 시 리포트 오픈
  useEffect(() => {
    if (!isPlaying) return undefined;

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      let changed = false;
      let newestActive: number | null = null;

      for (const note of notesRef.current) {
        if (
          note.status === 'pending' &&
          elapsed - note.targetTimeMs > GOOD_WINDOW_MS
        ) {
          note.status = 'missed';
          changed = true;
          outcomesRef.current.push({
            yulmyeong: note.yulmyeong,
            groupIndex: note.groupIndex,
            stroke: note.stroke,
            result: 'miss',
          });
          setOutcomes([...outcomesRef.current]);
          setCombo(0);
          setJudgement({ text: `아쉬워요 (${note.yulmyeong})`, tone: 'miss' });
          triggerMascotMood('miss');
        }
        if (Math.abs(elapsed - note.targetTimeMs) <= 250) {
          newestActive = note.cellIndex;
        }
      }

      if (newestActive !== null) {
        setActiveCellIndex(newestActive);
      }

      const allFinished = notesRef.current.every((n) => n.status !== 'pending');
      if (changed || !allFinished) {
        setNotes([...notesRef.current]);
      }

      if (allFinished) {
        const finalScore = outcomesRef.current.reduce(
          (sum, item) =>
            sum +
            (item.result === 'excellent'
              ? 100
              : item.result === 'good'
                ? 60
                : 0),
          0,
        );
        setIsPlaying(false);
        setActiveStepIdx(-1);
        setJudgement({ text: '연주 완료!', tone: 'excellent' });
        setIsReportOpen(true);
        onGameComplete?.(selectedJangdan.name, selectedScore.title, finalScore);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, onGameComplete, selectedJangdan.name, selectedScore.title, triggerMascotMood]);

  // 마이크 음정 입력 자동 판정
  useEffect(() => {
    if (!isPlaying || !audioPitch.isListening) {
      lastPitchNoteRef.current = null;
      return;
    }

    const detected = audioPitch.analysis.matchedNote?.id ?? null;
    if (detected && detected !== lastPitchNoteRef.current) {
      lastPitchNoteRef.current = detected;
      const laneIdx = DANSO_NOTES.findIndex((n) => n.id === detected);
      if (laneIdx !== -1) {
        triggerHoleHit(laneIdx, false);
      }
    } else if (!detected) {
      lastPitchNoteRef.current = null;
    }
  }, [
    isPlaying,
    audioPitch.isListening,
    audioPitch.analysis.matchedNote,
    triggerHoleHit,
  ]);

  // 키보드 1~5 단축키 (5개 구멍 버튼과 1:1 매칭)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < DANSO_NOTES.length) {
        triggerHoleHit(idx, true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerHoleHit]);

  const handleSelectJangdan = (preset: JangdanPreset) => {
    resetGame();
    setSelectedJangdanId(preset.id);
    setBpm(preset.defaultBpm);
  };

  const elapsedNow = isPlaying ? performance.now() - startTimeRef.current : 0;

  // 스텝의 글로벌 인덱스 계산용 오프셋
  let groupStepOffset = 0;

  return (
    <>
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 왼쪽: 국악 장단 리듬 게임 스테이지 */}
        <div className="space-y-5 lg:col-span-7">
          {/* 국악 장단 4종 선택 + 3박×4묶음(자진모리) 패턴 & BPM 조절 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Drum className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    국악 장단 선택 &amp; 속도(BPM) 조절
                  </h2>
                  <p className="text-xs text-stone-500">
                    장단을 박자 묶음(예: 자진모리 3박×4묶음)으로 나누어 표시합니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setJangdanSoundOn((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  jangdanSoundOn
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
                }`}
              >
                {jangdanSoundOn ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    장구 비트 ON
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    장구 비트 OFF
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {JANGDAN_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedJangdan.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectJangdan(preset)}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-bamboo-600 bg-bamboo-50 text-bamboo-800 ring-1 ring-bamboo-500/30'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">
                      {preset.name}
                    </span>
                    <span className="block text-[11px] font-semibold text-amber-700">
                      {preset.meter}
                    </span>
                    <span className="block text-[10px] text-stone-500">
                      {preset.tempoLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 묶음 기반 장단 구음 패턴 바 + BPM 슬라이더 */}
            <div className="mt-3 flex flex-col gap-3 rounded-xl bg-stone-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-stone-700">
                  {selectedJangdan.name} · {selectedJangdan.description}
                </span>
                <label className="flex items-center gap-2 font-bold text-bamboo-700">
                  <span>BPM {bpm}</span>
                  <input
                    type="range"
                    min={selectedJangdan.minBpm}
                    max={selectedJangdan.maxBpm}
                    step={2}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-28 accent-bamboo-600"
                  />
                </label>
              </div>

              <div
                className={`grid grid-cols-1 gap-2 ${
                  selectedJangdan.groups.length === 4
                    ? 'sm:grid-cols-4'
                    : 'sm:grid-cols-3'
                }`}
              >
                {selectedJangdan.groups.map((group) => {
                  const baseOffset = groupStepOffset;
                  groupStepOffset += group.steps.length;

                  return (
                    <div
                      key={group.groupLabel}
                      className="rounded-lg border border-stone-200 bg-white p-2"
                    >
                      <p className="mb-1.5 text-[10px] font-semibold text-stone-500">
                        {group.groupLabel}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {group.steps.map((step, sIdx) => {
                          const globalIdx = baseOffset + sIdx;
                          const isActive = activeStepIdx === globalIdx;
                          return (
                            <div
                              key={globalIdx}
                              className={`flex h-7 items-center justify-center rounded-md border text-xs font-extrabold transition-all ${
                                isActive
                                  ? step.intensity === 'strong'
                                    ? 'scale-110 border-amber-500 bg-amber-500 text-white shadow-sm'
                                    : step.stroke
                                      ? 'scale-105 border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-stone-400 bg-stone-300 text-stone-700'
                                  : step.stroke
                                    ? 'border-stone-200 bg-stone-50 text-stone-800'
                                    : 'border-dashed border-stone-200 bg-white text-stone-300'
                              }`}
                            >
                              {step.stroke ?? '·'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 리듬 게임 보드 */}
          <div
            key={shakeKey}
            className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ${
              shakeKey > 0 ? 'animate-beat-shake' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bamboo-600 text-white">
                  <Gamepad2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    율명 리듬 게임 (중 · 임 · 무 · 황 · 태)
                  </h2>
                  <p className="text-xs text-stone-500">
                    떨어지는 노트 레인 바로 아래의 가상 단소 5개 구멍 버튼(1~5)을 눌러 연주하세요.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {outcomes.length > 0 && !isPlaying && (
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-bamboo-500 bg-bamboo-50 px-3 py-2 text-xs font-semibold text-bamboo-700 hover:bg-bamboo-100"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    결과 리포트
                  </button>
                )}

                {!audioPitch.isListening && (
                  <button
                    type="button"
                    onClick={() => void audioPitch.startListening()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    마이크 켜기
                  </button>
                )}

                <button
                  type="button"
                  onClick={isPlaying ? stopGame : startGame}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors ${
                    isPlaying
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-bamboo-600 hover:bg-bamboo-700'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      일시정지
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      게임 시작
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetGame}
                  aria-label="게임 초기화"
                  className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-50"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 점수 · 판정 · 콤보 바 */}
            <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-stone-900 px-4 py-3 text-center text-white">
              <div>
                <p className="text-[10px] text-stone-400">점수</p>
                <p className="text-lg font-extrabold text-amber-400">
                  {scorePoints}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400">판정</p>
                <p
                  className={`text-sm font-extrabold ${
                    judgement.tone === 'excellent'
                      ? 'text-emerald-400'
                      : judgement.tone === 'good'
                        ? 'text-sky-400'
                        : judgement.tone === 'miss'
                          ? 'text-rose-400'
                          : 'text-stone-300'
                  }`}
                >
                  {judgement.text}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400">콤보</p>
                <p className="text-lg font-extrabold text-sky-400">
                  {combo} COMBO
                </p>
              </div>
            </div>

            {/* 5레인 노트 낙하 영역 + 레인과 1:1 정렬된 가상 단소 5구멍 버튼 */}
            <div className="relative h-96 overflow-hidden rounded-xl border border-stone-800 bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950/60">
              {/* 5개 수직 레인 가이드 */}
              <div className="grid h-full grid-cols-5">
                {DANSO_NOTES.map((note) => (
                  <div
                    key={note.id}
                    className="border-r border-white/10 last:border-r-0"
                  />
                ))}
              </div>

              {/* 하단 가로 단소 몸통 바 & 판정선 (구멍 버튼과 정확히 일치) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-24 h-1 bg-emerald-400/85 shadow-[0_0_12px_rgba(52,211,153,0.95)]" />

              {/* 장단 도우미 캐릭터 (좌: 장구 치는 소녀, 우: 한복 토끼) */}
              <div
                className={`pointer-events-none absolute bottom-25 left-2 z-20 flex flex-col items-center transition-all duration-200 ${
                  mascotMood === 'excellent'
                    ? 'scale-115 -translate-y-2.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                    : mascotMood === 'good'
                      ? 'scale-105 -translate-y-1'
                      : mascotMood === 'miss'
                        ? 'scale-95 translate-y-1 grayscale-[35%] opacity-85 animate-wiggle'
                        : 'scale-100'
                }`}
              >
                {mascotMood === 'excellent' && (
                  <span className="mb-0.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                    신난다! ✨
                  </span>
                )}
                {mascotMood === 'miss' && (
                  <span className="mb-0.5 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                    💦 앗!
                  </span>
                )}
                <img
                  src="/janggu_girl.png"
                  alt="장구 치는 소녀"
                  className="h-16 w-16 object-contain drop-shadow-md sm:h-20 sm:w-20"
                />
              </div>

              <div
                className={`pointer-events-none absolute right-2 bottom-25 z-20 flex flex-col items-center transition-all duration-200 ${
                  mascotMood === 'excellent'
                    ? 'scale-115 -translate-y-2.5 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]'
                    : mascotMood === 'good'
                      ? 'scale-105 -translate-y-1'
                      : mascotMood === 'miss'
                        ? 'scale-95 translate-y-1 grayscale-[35%] opacity-85 animate-wiggle'
                        : 'scale-100'
                }`}
              >
                {mascotMood === 'excellent' && (
                  <span className="mb-0.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-stone-900 shadow-sm">
                    최고야! 🎉
                  </span>
                )}
                {mascotMood === 'miss' && (
                  <span className="mb-0.5 rounded-full bg-stone-600 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                    💦 으앙
                  </span>
                )}
                <img
                  src="/rabbit.png"
                  alt="한복 토끼"
                  className="h-16 w-16 object-contain drop-shadow-md sm:h-20 sm:w-20"
                />
              </div>

              {/* 파티클 효과 */}
              {particles.map((pt) => (
                <span
                  key={pt.id}
                  style={
                    {
                      left: `${pt.xPercent}%`,
                      top: `${pt.yPercent}%`,
                      '--tx': `${pt.tx}px`,
                      '--ty': `${pt.ty}px`,
                    } as React.CSSProperties
                  }
                  className={`pointer-events-none absolute h-2.5 w-2.5 rounded-full animate-particle-burst ${pt.colorClass}`}
                />
              ))}

              {/* 떨어지는 노트 (중, 임, 무, 황, 태) — X좌표: laneIndex * 20 + 10% */}
              {notes
                .filter((n) => n.status === 'pending')
                .map((note) => {
                  const progress =
                    (elapsedNow - note.spawnTimeMs) / TRAVEL_TIME_MS;
                  if (progress < -0.1 || progress > 1.15) return null;

                  const topPercent = Math.min(82, Math.max(-8, progress * 75));
                  const leftPercent = note.laneIndex * 20 + 10;

                  return (
                    <div
                      key={note.id}
                      style={{
                        top: `${topPercent}%`,
                        left: `${leftPercent}%`,
                      }}
                      className={`pointer-events-none absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-lg font-black shadow-lg ${
                        LANE_COLORS[note.laneIndex]
                      }`}
                    >
                      {note.yulmyeong}
                    </div>
                  );
                })}

              {/* 하단 가상 단소 5개 구멍 버튼 (5개 레인의 중앙에 정확히 1:1 정렬) */}
              <div className="absolute inset-x-0 bottom-0 grid h-24 grid-cols-5 items-center border-t border-amber-700/40 bg-gradient-to-b from-amber-900/50 to-stone-950/95">
                {DANSO_NOTES.map((note, idx) => {
                  const isPressed = pressedLane === idx;
                  return (
                    <div
                      key={note.id}
                      className="flex flex-col items-center justify-center gap-1"
                    >
                      <button
                        type="button"
                        aria-label={`제${idx + 1}공 ${note.id}(${note.koreanName})`}
                        onPointerDown={() => triggerHoleHit(idx, true)}
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-[3px] transition-all duration-75 ${
                          HOLE_BUTTON_RING[idx]
                        } ${
                          isPressed
                            ? 'scale-90 bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.9)]'
                            : 'bg-stone-900/90 text-white shadow-inner'
                        }`}
                      >
                        <span className="text-base font-black">{note.id}</span>
                      </button>
                      <span className="text-[10px] font-semibold text-amber-200">
                        {idx + 1}공 · {note.westernNote}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 연습 곡 선택 & 정간보 악보 뷰어 */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900">연습 곡 선택</h3>
            <div className="mt-3 space-y-2">
              {DANSO_SAMPLE_SCORES.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    resetGame();
                    setSelectedScoreId(song.id);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${
                    song.id === selectedScoreId
                      ? 'border-bamboo-500 bg-bamboo-50 font-semibold text-bamboo-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{song.title}</span>
                  <span className="text-[11px] text-stone-500">
                    {song.jangdan}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <JeongganboViewer
            score={selectedScore}
            activeCellIndex={activeCellIndex}
            onSelectNote={(yulmyeong) => {
              const laneIdx = DANSO_NOTES.findIndex((n) => n.id === yulmyeong);
              if (laneIdx !== -1) triggerHoleHit(laneIdx, true);
            }}
          />
        </div>
      </section>

      <RhythmReportModal
        isOpen={isReportOpen}
        scoreTitle={selectedScore.title}
        jangdan={selectedJangdan}
        totalScore={scorePoints}
        maxCombo={maxCombo}
        outcomes={outcomes}
        onRetry={startGame}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
}
