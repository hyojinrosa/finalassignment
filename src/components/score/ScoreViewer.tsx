import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Grid,
  Music,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DANSO_NOTES } from '../../constants/dansoNotes';
import {
  DANSO_SAMPLE_SCORES,
  findNextPlayableIndex,
  type DansoScore,
} from '../../constants/dansoScores';
import type { DansoYulmyeong } from '../../types/danso';
import { MetronomeAudio } from '../../utils/metronome';
import { StaffScoreView } from './StaffScoreView';

export type ScoreFormat = 'jeongganbo' | 'staff';

export interface PracticePulse {
  note: DansoYulmyeong;
  seq: number;
  source: 'fingering' | 'pitch' | 'virtual';
}

interface ScoreViewerProps {
  inputMode: 'real' | 'virtual';
  /** 실시간 연속 입력 (실물 악기 모드: 웹캠 운지 또는 마이크 음정) */
  liveMatchedNote?: DansoYulmyeong | null;
  /** 일회성 트리거 입력 (가상 악기 모드: 구멍 터치/연주 시 seq 증가) */
  virtualPulse?: PracticePulse | null;
  /** 현재 목표 음이 바뀔 때 상위 컴포넌트에 알림 */
  onTargetNoteChange?: (note: DansoYulmyeong) => void;
  /** 악보 칸 클릭/재생 시 음정 미리듣기 콜백 */
  onPreviewNote?: (note: DansoYulmyeong) => void;
  /** 한 곡을 끝까지 완주했을 때 호출되는 콜백 */
  onSongComplete?: (songTitle: string) => void;
}

const NOTE_LOOKUP = Object.fromEntries(
  DANSO_NOTES.map((note) => [note.id, note]),
) as Record<DansoYulmyeong, (typeof DANSO_NOTES)[number]>;

/**
 * 학생들이 보고 연주할 수 있는 다기능 악보 뷰어.
 * - { note, duration } 기반 정간보 격자 & 일반 오선보 전환
 * - 박자(BPM + duration)에 맞춰 하이라이트가 부드럽게 이동하는 박자 재생
 * - 연습 모드(실물/가상 악기 입력 연동 자동 진행)
 * - Web Audio API 메트로놈("딱, 딱" 클릭음) ON/OFF 및 BPM 조절
 */
export function ScoreViewer({
  inputMode,
  liveMatchedNote = null,
  virtualPulse = null,
  onTargetNoteChange,
  onPreviewNote,
  onSongComplete,
}: ScoreViewerProps) {
  const [selectedScoreId, setSelectedScoreId] = useState(
    DANSO_SAMPLE_SCORES[0].id,
  );
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>('jeongganbo');
  const [practiceMode, setPracticeMode] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // 박자 재생 & 메트로놈 상태
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [beatProgress, setBeatProgress] = useState(0);
  const [bpm, setBpm] = useState(DANSO_SAMPLE_SCORES[0].bpm);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentBeatPulse, setCurrentBeatPulse] = useState(0);

  const metronomeRef = useRef<MetronomeAudio | null>(null);
  const lastAdvanceAtRef = useRef<number>(0);
  const lastMatchedNoteRef = useRef<DansoYulmyeong | null>(null);
  const lastPulseSeqRef = useRef<number>(0);

  const selectedScore: DansoScore = useMemo(
    () =>
      DANSO_SAMPLE_SCORES.find((item) => item.id === selectedScoreId) ??
      DANSO_SAMPLE_SCORES[0],
    [selectedScoreId],
  );

  const playableIndices = useMemo(
    () =>
      selectedScore.cells
        .map((c, idx) => (c.note ? idx : -1))
        .filter((idx) => idx !== -1),
    [selectedScore],
  );

  const currentCell = selectedScore.cells[activeIndex];
  const currentTargetNote = currentCell?.note ?? null;
  const currentNoteMeta = currentTargetNote
    ? NOTE_LOOKUP[currentTargetNote]
    : null;

  useEffect(() => {
    const metro = new MetronomeAudio();
    metronomeRef.current = metro;
    return () => {
      metro.dispose();
      metronomeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (currentTargetNote && !isCompleted) {
      onTargetNoteChange?.(currentTargetNote);
    }
  }, [currentTargetNote, isCompleted, onTargetNoteChange]);

  const advanceToNextPlayable = useCallback(() => {
    setActiveIndex((prevIdx) => {
      const nextIdx = findNextPlayableIndex(selectedScore.cells, prevIdx);
      if (nextIdx === -1) {
        setIsCompleted(true);
        onSongComplete?.(selectedScore.title);
        return prevIdx;
      }
      return nextIdx;
    });
  }, [selectedScore.cells, selectedScore.title, onSongComplete]);

  // 1) 독립 메트로놈 타이머 (연습 모드 중에도 켜고 끌 수 있음)
  useEffect(() => {
    if (!metronomeOn) {
      setCurrentBeatPulse(0);
      return undefined;
    }

    const beatIntervalMs = (60 / bpm) * 1000;
    let beatCount = 0;

    const triggerBeat = () => {
      const beatInMeasure = beatCount % selectedScore.beatsPerMeasure;
      metronomeRef.current?.playClick(beatInMeasure === 0);
      setCurrentBeatPulse(beatInMeasure + 1);
      beatCount += 1;
    };

    triggerBeat();
    const timer = window.setInterval(triggerBeat, beatIntervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [metronomeOn, bpm, selectedScore.beatsPerMeasure]);

  // 2) 박자(duration)에 맞춘 부드러운 하이라이트 자동 이동 (박자 재생)
  useEffect(() => {
    if (!isBeatPlaying || isCompleted) {
      setBeatProgress(0);
      return undefined;
    }

    let rafId = 0;
    let currentIdx = activeIndex;
    let cellStartTime = performance.now();

    const frame = (now: number) => {
      const cell = selectedScore.cells[currentIdx];
      if (!cell) {
        setIsBeatPlaying(false);
        setBeatProgress(0);
        return;
      }

      const beatMs = (60 / bpm) * 1000;
      const cellDurationMs = Math.max(250, cell.duration * beatMs);
      const elapsed = now - cellStartTime;
      const ratio = Math.min(1, elapsed / cellDurationMs);
      setBeatProgress(ratio);

      if (elapsed >= cellDurationMs) {
        const nextIdx = currentIdx + 1;
        if (nextIdx >= selectedScore.cells.length) {
          setIsBeatPlaying(false);
          setBeatProgress(0);
          setIsCompleted(true);
          onSongComplete?.(selectedScore.title);
          return;
        }
        currentIdx = nextIdx;
        cellStartTime = now;
        setActiveIndex(nextIdx);
        setBeatProgress(0);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isBeatPlaying, isCompleted, bpm, selectedScore.cells, activeIndex]);

  // 3) 실물 악기 모드(웹캠 운지 또는 마이크 음정) 연습 모드 자동 진행
  useEffect(() => {
    if (
      isBeatPlaying ||
      inputMode !== 'real' ||
      !practiceMode ||
      isCompleted ||
      !currentTargetNote
    ) {
      return undefined;
    }

    if (liveMatchedNote !== currentTargetNote) {
      lastMatchedNoteRef.current = liveMatchedNote;
      return undefined;
    }

    const now = performance.now();
    const sameAsPrev = lastMatchedNoteRef.current === liveMatchedNote;
    const elapsedSinceAdvance = now - lastAdvanceAtRef.current;

    if (sameAsPrev && elapsedSinceAdvance < 700) {
      return undefined;
    }

    const dwellTimer = window.setTimeout(() => {
      lastAdvanceAtRef.current = performance.now();
      lastMatchedNoteRef.current = liveMatchedNote;
      advanceToNextPlayable();
    }, 220);

    return () => {
      window.clearTimeout(dwellTimer);
    };
  }, [
    isBeatPlaying,
    inputMode,
    practiceMode,
    isCompleted,
    currentTargetNote,
    liveMatchedNote,
    advanceToNextPlayable,
  ]);

  // 4) 가상 악기 모드(구멍 터치 / 소리 재생) 연습 모드 자동 진행
  useEffect(() => {
    if (
      isBeatPlaying ||
      inputMode !== 'virtual' ||
      !practiceMode ||
      isCompleted ||
      !currentTargetNote ||
      !virtualPulse
    ) {
      return;
    }

    if (virtualPulse.seq === lastPulseSeqRef.current) return;
    lastPulseSeqRef.current = virtualPulse.seq;

    if (virtualPulse.note === currentTargetNote) {
      advanceToNextPlayable();
    }
  }, [
    isBeatPlaying,
    inputMode,
    practiceMode,
    isCompleted,
    currentTargetNote,
    virtualPulse,
    advanceToNextPlayable,
  ]);

  const handleSelectSong = (songId: string) => {
    setIsBeatPlaying(false);
    setBeatProgress(0);
    setSelectedScoreId(songId);
    const song =
      DANSO_SAMPLE_SCORES.find((s) => s.id === songId) ??
      DANSO_SAMPLE_SCORES[0];
    setBpm(song.bpm);
    const firstPlayable = findNextPlayableIndex(song.cells, -1);
    setActiveIndex(firstPlayable === -1 ? 0 : firstPlayable);
    setIsCompleted(false);
    lastAdvanceAtRef.current = 0;
  };

  const handleReset = () => {
    setIsBeatPlaying(false);
    setBeatProgress(0);
    const firstPlayable = findNextPlayableIndex(selectedScore.cells, -1);
    setActiveIndex(firstPlayable === -1 ? 0 : firstPlayable);
    setIsCompleted(false);
    lastAdvanceAtRef.current = 0;
  };

  const handleStepPrev = () => {
    setIsBeatPlaying(false);
    setIsCompleted(false);
    for (let i = activeIndex - 1; i >= 0; i -= 1) {
      if (selectedScore.cells[i].note) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const handleStepNext = () => {
    setIsBeatPlaying(false);
    advanceToNextPlayable();
  };

  const currentStepNumber = isCompleted
    ? playableIndices.length
    : Math.max(1, playableIndices.indexOf(activeIndex) + 1);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      {/* 상단: 제목 + 입력 연동 + 악보 형식 + 연습 모드 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Music className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">
                악보 뷰어 (Score Viewer)
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  inputMode === 'real'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {inputMode === 'real'
                  ? '실물 악기 연동 (웹캠 · 마이크)'
                  : '가상 악기 연동 (지공 터치)'}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              정간 칸의 박자(duration)에 맞춰 하이라이트가 이동하며, 메트로놈과 함께 연습할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setScoreFormat('jeongganbo')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold transition-colors ${
                scoreFormat === 'jeongganbo'
                  ? 'bg-bamboo-600 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              정간보
            </button>
            <button
              type="button"
              onClick={() => setScoreFormat('staff')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold transition-colors ${
                scoreFormat === 'staff'
                  ? 'bg-bamboo-600 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Music className="h-3.5 w-3.5" />
              오선보
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPracticeMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              practiceMode
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-stone-200 bg-white text-stone-500'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            연습 모드 {practiceMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 샘플 곡 선택 + 박자 재생 & 메트로놈 컨트롤 바 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {DANSO_SAMPLE_SCORES.map((song) => {
            const isSelected = song.id === selectedScore.id;
            return (
              <button
                key={song.id}
                type="button"
                onClick={() => handleSelectSong(song.id)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-bamboo-600 bg-bamboo-600 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {song.title}
                <span className="ml-1.5 opacity-75">({song.jangdan})</span>
              </button>
            );
          })}
        </div>

        {/* 메트로놈 & 박자 따라가기 컨트롤 */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              if (isCompleted) handleReset();
              setIsBeatPlaying((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-white transition-colors ${
              isBeatPlaying
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {isBeatPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                박자 정지
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                박자 재생
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMetronomeOn((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-colors ${
              metronomeOn
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
            }`}
          >
            {metronomeOn ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                메트로놈 ON
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                메트로놈 OFF
              </>
            )}
          </button>

          {/* 박자 점 시각화 */}
          <div
            className="flex items-center gap-1 px-1"
            aria-label="메트로놈 박자 표시"
          >
            {Array.from({ length: selectedScore.beatsPerMeasure }).map(
              (_, beatIdx) => {
                const isCurrentBeat =
                  metronomeOn && currentBeatPulse === beatIdx + 1;
                return (
                  <span
                    key={beatIdx}
                    className={`h-2.5 w-2.5 rounded-full transition-transform duration-100 ${
                      isCurrentBeat
                        ? beatIdx === 0
                          ? 'scale-125 bg-rose-500'
                          : 'scale-115 bg-amber-500'
                        : 'bg-stone-300'
                    }`}
                  />
                );
              },
            )}
          </div>

          <label className="flex items-center gap-1.5 pl-1 font-semibold text-stone-600">
            <span>BPM {bpm}</span>
            <input
              type="range"
              min={50}
              max={130}
              step={2}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-20 accent-amber-600"
            />
          </label>
        </div>
      </div>

      {/* 현재 연주 목표 바 + 네비게이션 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">
              ‘{selectedScore.title}’ 한 곡을 모두 완주했습니다!
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-sm font-black text-white">
              현재 음: {currentNoteMeta?.id} ({currentNoteMeta?.hanja})
            </span>
            <span className="font-semibold text-stone-700">
              {currentNoteMeta?.westernNote}({currentNoteMeta?.solfege}) ·{' '}
              {currentCell?.duration ?? 1}박 · 막을 구멍:{' '}
              {currentNoteMeta?.holes
                .map((closed, i) => (closed ? `${i + 1}공` : null))
                .filter(Boolean)
                .join('·') || '모두 열기'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs">
          <span className="mr-1 font-semibold text-stone-500">
            {currentStepNumber} / {playableIndices.length}
          </span>
          <button
            type="button"
            onClick={handleStepPrev}
            aria-label="이전 음"
            className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleStepNext}
            aria-label="다음 음"
            className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="처음부터 다시"
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-semibold text-stone-600 hover:bg-stone-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            처음부터
          </button>
        </div>
      </div>

      {/* 악보 본문 (정간보 격자 또는 일반 오선보) */}
      <div className="mt-4">
        {scoreFormat === 'jeongganbo' ? (
          <div className="grid grid-cols-4 gap-2 rounded-xl border-2 border-amber-800/30 bg-hanji p-3 sm:grid-cols-8">
            {selectedScore.cells.map((cell, idx) => {
              const meta = cell.note ? NOTE_LOOKUP[cell.note] : null;
              const isActive = !isCompleted && activeIndex === idx;
              const isPast =
                isCompleted || (idx < activeIndex && cell.note !== null);
              const spanClass =
                cell.duration >= 2 ? 'col-span-2' : 'col-span-1';

              return (
                <button
                  key={`${selectedScore.id}-${idx}`}
                  type="button"
                  disabled={!cell.note}
                  onClick={() => {
                    if (!cell.note) return;
                    setIsBeatPlaying(false);
                    setBeatProgress(0);
                    setIsCompleted(false);
                    setActiveIndex(idx);
                    onPreviewNote?.(cell.note);
                  }}
                  className={`relative flex min-h-[82px] flex-col items-center justify-center overflow-hidden rounded-lg border p-2 text-center transition-all duration-300 ease-out ${spanClass} ${
                    isActive
                      ? 'scale-[1.03] border-emerald-600 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/40'
                      : isPast
                        ? 'border-bamboo-500/30 bg-bamboo-50/60 text-bamboo-700'
                        : cell.note
                          ? 'border-amber-800/25 bg-white/95 hover:border-bamboo-500'
                          : 'cursor-default border-dashed border-stone-300 bg-stone-100/60'
                  }`}
                >
                  {/* 박자 진행에 맞춘 부드러운 하이라이트 진행 바 */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 bg-emerald-300/35 transition-[width] duration-75 ease-linear"
                      style={{
                        width: `${isBeatPlaying ? beatProgress * 100 : 100}%`,
                      }}
                    />
                  )}

                  <span className="relative z-10 flex w-full items-center justify-between text-[9px] font-medium text-stone-400">
                    <span>{idx + 1}</span>
                    {cell.duration > 1 && (
                      <span className="rounded bg-amber-100 px-1 text-amber-800">
                        {cell.duration}박
                      </span>
                    )}
                  </span>

                  {meta ? (
                    <div className="relative z-10 flex flex-col items-center">
                      <span
                        className={`text-xl font-black ${
                          isActive ? 'text-emerald-900' : 'text-stone-900'
                        }`}
                      >
                        {meta.id}
                      </span>
                      <span className="text-[10px] font-semibold text-bamboo-700">
                        {meta.hanja} · {meta.westernNote}
                      </span>
                      {cell.label && (
                        <span className="mt-0.5 rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-900">
                          {cell.label}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="relative z-10 text-xs font-semibold text-stone-400">
                      △ 쉼
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <StaffScoreView
            score={selectedScore}
            activeCellIndex={isCompleted ? null : activeIndex}
            beatProgress={isBeatPlaying ? beatProgress : 1}
            completedUpTo={
              isCompleted ? selectedScore.cells.length : activeIndex - 1
            }
            onSelectNote={(yulmyeong, idx) => {
              setIsBeatPlaying(false);
              setBeatProgress(0);
              setIsCompleted(false);
              setActiveIndex(idx);
              onPreviewNote?.(yulmyeong);
            }}
          />
        )}
      </div>
    </div>
  );
}
