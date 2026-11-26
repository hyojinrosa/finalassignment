import { useCallback, useEffect, useRef, useState } from 'react';
import { Gamepad2, Mic, Pause, Play, RotateCcw } from 'lucide-react';
import { DANSO_NOTES } from '../../constants/dansoNotes';
import { DANSO_SAMPLE_SCORES } from '../../constants/dansoScores';
import type { UseAudioPitchReturn } from '../../hooks/useAudioPitch';
import type { DansoYulmyeong } from '../../types/danso';
import { ToneDansoEngine } from '../../utils/toneDansoEngine';
import { JeongganboViewer } from '../score/JeongganboViewer';

interface RhythmGameTabProps {
  audioPitch: UseAudioPitchReturn;
}

interface FallingNote {
  id: number;
  cellIndex: number;
  yulmyeong: DansoYulmyeong;
  laneIndex: number;
  spawnTimeMs: number;
  targetTimeMs: number;
  status: 'pending' | 'hit' | 'missed';
}

const LANE_COLORS = [
  'border-emerald-500 bg-emerald-500 text-white',
  'border-sky-500 bg-sky-500 text-white',
  'border-amber-500 bg-amber-500 text-white',
  'border-violet-500 bg-violet-500 text-white',
  'border-rose-500 bg-rose-500 text-white',
] as const;

const TRAVEL_TIME_MS = 2800;
const HIT_WINDOW_MS = 380;

export function RhythmGameTab({ audioPitch }: RhythmGameTabProps) {
  const [selectedScoreId, setSelectedScoreId] = useState(
    DANSO_SAMPLE_SCORES[1].id,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [scorePoints, setScorePoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [judgement, setJudgement] = useState<string>('준비됨');
  const [notes, setNotes] = useState<FallingNote[]>([]);
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);

  const synthRef = useRef<ToneDansoEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const notesRef = useRef<FallingNote[]>([]);
  const lastPitchNoteRef = useRef<DansoYulmyeong | null>(null);

  const selectedScore =
    DANSO_SAMPLE_SCORES.find((s) => s.id === selectedScoreId) ??
    DANSO_SAMPLE_SCORES[0];

  useEffect(() => {
    const engine = new ToneDansoEngine();
    synthRef.current = engine;
    return () => {
      engine.dispose();
      synthRef.current = null;
    };
  }, []);

  const buildSchedule = useCallback(() => {
    const beatMs = (60 / selectedScore.bpm) * 1000;
    let cursorMs = 1200;
    const scheduled: FallingNote[] = [];

    selectedScore.cells.forEach((cell, cellIdx) => {
      if (cell.note) {
        const laneIndex = DANSO_NOTES.findIndex((n) => n.id === cell.note);
        if (laneIndex !== -1) {
          scheduled.push({
            id: cellIdx + 1,
            cellIndex: cellIdx,
            yulmyeong: cell.note,
            laneIndex,
            spawnTimeMs: cursorMs - TRAVEL_TIME_MS,
            targetTimeMs: cursorMs,
            status: 'pending',
          });
        }
      }
      cursorMs += cell.duration * beatMs;
    });

    return scheduled;
  }, [selectedScore]);

  const stopGame = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startGame = useCallback(() => {
    const scheduled = buildSchedule();
    notesRef.current = scheduled;
    setNotes(scheduled);
    setScorePoints(0);
    setCombo(0);
    setJudgement('연주를 시작하세요!');
    setActiveCellIndex(null);
    startTimeRef.current = performance.now();
    setIsPlaying(true);
  }, [buildSchedule]);

  const resetGame = useCallback(() => {
    stopGame();
    notesRef.current = [];
    setNotes([]);
    setScorePoints(0);
    setCombo(0);
    setJudgement('준비됨');
    setActiveCellIndex(null);
  }, [stopGame]);

  const triggerLaneHit = useCallback(
    (yulmyeong: DansoYulmyeong, playAudio = true) => {
      const noteMeta = DANSO_NOTES.find((n) => n.id === yulmyeong);
      if (playAudio && noteMeta) {
        void synthRef.current?.playSample({
          frequencyHz: noteMeta.frequencyHz,
          durationSec: 0.45,
        });
      }

      if (!isPlaying) return;

      const elapsed = performance.now() - startTimeRef.current;
      const target = notesRef.current.find(
        (item) =>
          item.status === 'pending' &&
          item.yulmyeong === yulmyeong &&
          Math.abs(elapsed - item.targetTimeMs) <= HIT_WINDOW_MS,
      );

      if (!target) return;

      const delta = Math.abs(elapsed - target.targetTimeMs);
      target.status = 'hit';
      const isPerfect = delta <= 170;

      setNotes([...notesRef.current]);
      setActiveCellIndex(target.cellIndex);
      setScorePoints((prev) => prev + (isPerfect ? 100 : 60));
      setCombo((prev) => prev + 1);
      setJudgement(
        isPerfect
          ? `PERFECT! (${yulmyeong})`
          : `GOOD! (${yulmyeong})`,
      );
    },
    [isPlaying],
  );

  // 게임 진행 루프 + 미스 판정
  useEffect(() => {
    if (!isPlaying) return undefined;

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      let changed = false;
      let newestActive: number | null = null;

      for (const note of notesRef.current) {
        if (
          note.status === 'pending' &&
          elapsed - note.targetTimeMs > HIT_WINDOW_MS
        ) {
          note.status = 'missed';
          changed = true;
          setCombo(0);
          setJudgement(`MISS (${note.yulmyeong})`);
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
        setIsPlaying(false);
        setJudgement('곡 연주 완료!');
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
  }, [isPlaying]);

  // 마이크 음정 입력에 따른 자동 리듬 판정
  useEffect(() => {
    if (!isPlaying || !audioPitch.isListening) {
      lastPitchNoteRef.current = null;
      return;
    }

    const detected = audioPitch.analysis.matchedNote?.id ?? null;
    if (detected && detected !== lastPitchNoteRef.current) {
      lastPitchNoteRef.current = detected;
      triggerLaneHit(detected, false);
    } else if (!detected) {
      lastPitchNoteRef.current = null;
    }
  }, [
    isPlaying,
    audioPitch.isListening,
    audioPitch.analysis.matchedNote,
    triggerLaneHit,
  ]);

  // 키보드 1~5 단축키 지원
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < DANSO_NOTES.length) {
        triggerLaneHit(DANSO_NOTES[idx].id, true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerLaneHit]);

  const elapsedNow = isPlaying ? performance.now() - startTimeRef.current : 0;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* 왼쪽: 5레인 단소 리듬 게임 보드 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bamboo-600 text-white">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                단소 리듬 게임 모드 (중 · 임 · 무 · 황 · 태)
              </h2>
              <p className="text-xs text-stone-500">
                떨어지는 율명 노트에 맞춰 단소를 불거나 아래 패드(단축키 1~5)를 누르세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* 점수 & 콤보 상태 바 */}
        <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-stone-900 px-4 py-3 text-center text-white">
          <div>
            <p className="text-[10px] text-stone-400">점수</p>
            <p className="text-lg font-extrabold text-amber-400">
              {scorePoints}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400">판정</p>
            <p className="text-sm font-bold text-emerald-400">{judgement}</p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400">콤보</p>
            <p className="text-lg font-extrabold text-sky-400">{combo} COMBO</p>
          </div>
        </div>

        {/* 5레인 노트 낙하 영역 */}
        <div className="relative h-80 overflow-hidden rounded-xl border border-stone-800 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-800">
          {/* 세로 레인 구분선 */}
          <div className="grid h-full grid-cols-5">
            {DANSO_NOTES.map((note) => (
              <div
                key={note.id}
                className="border-r border-white/10 last:border-r-0"
              />
            ))}
          </div>

          {/* 히트 판정선 */}
          <div className="pointer-events-none absolute inset-x-0 bottom-14 h-1 bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />

          {/* 떨어지는 노트 (중, 임, 무, 황, 태) */}
          {notes
            .filter((n) => n.status === 'pending')
            .map((note) => {
              const progress =
                (elapsedNow - note.spawnTimeMs) / TRAVEL_TIME_MS;
              if (progress < -0.1 || progress > 1.15) return null;

              const topPercent = Math.min(95, Math.max(-10, progress * 82));
              const leftPercent = note.laneIndex * 20 + 10;

              return (
                <div
                  key={note.id}
                  style={{
                    top: `${topPercent}%`,
                    left: `${leftPercent}%`,
                  }}
                  className={`pointer-events-none absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-base font-black shadow-lg ${
                    LANE_COLORS[note.laneIndex]
                  }`}
                >
                  {note.yulmyeong}
                </div>
              );
            })}

          {/* 하단 5개 연주 패드 */}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 gap-1.5 bg-stone-950/90 p-2">
            {DANSO_NOTES.map((note, idx) => (
              <button
                key={note.id}
                type="button"
                onClick={() => triggerLaneHit(note.id, true)}
                className="flex flex-col items-center rounded-lg border border-white/15 bg-white/10 py-1.5 text-white transition-transform hover:bg-white/20 active:scale-95"
              >
                <span className="text-sm font-black">{note.id}</span>
                <span className="text-[10px] text-stone-300">
                  {note.westernNote} ({note.solfege}) · {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽: 곡 선택 & 정간보 악보 뷰어 */}
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
                <span className="text-[11px] text-stone-500">{song.jangdan}</span>
              </button>
            ))}
          </div>
        </div>

        <JeongganboViewer
          score={selectedScore}
          activeCellIndex={activeCellIndex}
          onSelectNote={(yulmyeong) => triggerLaneHit(yulmyeong, true)}
        />
      </div>
    </section>
  );
}

