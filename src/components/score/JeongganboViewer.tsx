import { Music } from 'lucide-react';
import { DANSO_NOTES } from '../../constants/dansoNotes';
import type { DansoScore } from '../../constants/dansoScores';
import type { DansoYulmyeong } from '../../types/danso';

interface JeongganboViewerProps {
  score: DansoScore;
  activeCellIndex?: number | null;
  onSelectNote?: (yulmyeong: DansoYulmyeong, cellIndex: number) => void;
}

const NOTE_LOOKUP = Object.fromEntries(
  DANSO_NOTES.map((note) => [note.id, note]),
) as Record<DansoYulmyeong, (typeof DANSO_NOTES)[number]>;

/**
 * 전통 정간보(井間譜) 악보 뷰어 컴포넌트.
 * 각 정간 칸의 박자(duration)에 맞춰 칸 너비와 박자 표기를 렌더링합니다.
 */
export function JeongganboViewer({
  score,
  activeCellIndex = null,
  onSelectNote,
}: JeongganboViewerProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Music className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              정간보 악보 뷰어 — {score.title}
            </h3>
            <p className="text-xs text-stone-500">
              {score.jangdan} · BPM {score.bpm} · 각 정간 칸을 클릭하면 해당 율음 소리를 들을 수 있습니다.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-bamboo-100 px-2.5 py-1 text-[11px] font-semibold text-bamboo-700">
          율명: 중 · 임 · 무 · 황 · 태
        </span>
      </div>

      <p className="mt-3 text-xs text-stone-600">{score.description}</p>

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl border-2 border-amber-800/30 bg-hanji p-3 sm:grid-cols-6">
        {score.cells.map((cell, idx) => {
          const noteInfo = cell.note ? NOTE_LOOKUP[cell.note] : null;
          const isActive = activeCellIndex === idx;
          const spanClass = cell.duration >= 2 ? 'col-span-2' : 'col-span-1';

          return (
            <button
              key={`${score.id}-${idx}`}
              type="button"
              disabled={!cell.note}
              onClick={() => {
                if (cell.note) {
                  onSelectNote?.(cell.note, idx);
                }
              }}
              className={`relative flex min-h-[78px] flex-col items-center justify-center rounded-lg border p-2 text-center transition-all duration-300 ${spanClass} ${
                isActive
                  ? 'scale-[1.03] border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30'
                  : cell.note
                    ? 'border-amber-800/25 bg-white/90 hover:border-bamboo-500 hover:bg-bamboo-50/70'
                    : 'cursor-default border-dashed border-stone-300 bg-stone-100/60'
              }`}
            >
              <span className="absolute top-1 left-1.5 text-[9px] font-medium text-stone-400">
                {idx + 1}
              </span>
              {cell.duration > 1 && (
                <span className="absolute top-1 right-1.5 rounded bg-amber-100 px-1 text-[9px] font-semibold text-amber-800">
                  {cell.duration}박
                </span>
              )}

              {noteInfo ? (
                <>
                  <span className="text-xl font-black text-stone-900">
                    {noteInfo.id}
                  </span>
                  <span className="text-[10px] font-semibold text-bamboo-700">
                    {noteInfo.hanja} · {noteInfo.westernNote}
                  </span>
                  {cell.label && (
                    <span className="mt-0.5 rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-900">
                      {cell.label}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs font-semibold text-stone-400">
                  △ 쉼
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
