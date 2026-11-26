import { DANSO_NOTES } from '../../constants/dansoNotes';
import type { DansoScore } from '../../constants/dansoScores';
import type { DansoYulmyeong } from '../../types/danso';

interface StaffScoreViewProps {
  score: DansoScore;
  activeCellIndex: number | null;
  beatProgress?: number;
  completedUpTo?: number;
  onSelectNote?: (yulmyeong: DansoYulmyeong, cellIndex: number) => void;
}

const STAFF_Y_MAP: Record<
  DansoYulmyeong,
  { y: number; hasFlat: boolean; stemDown: boolean }
> = {
  태: { y: 44, hasFlat: false, stemDown: true },
  황: { y: 50, hasFlat: true, stemDown: true },
  무: { y: 56, hasFlat: true, stemDown: true },
  임: { y: 68, hasFlat: true, stemDown: true },
  중: { y: 74, hasFlat: true, stemDown: false },
};

const NOTE_LOOKUP = Object.fromEntries(
  DANSO_NOTES.map((note) => [note.id, note]),
) as Record<DansoYulmyeong, (typeof DANSO_NOTES)[number]>;

const STAFF_LINES = [44, 56, 68, 80, 92] as const;
const NOTES_PER_ROW = 8;
const ROW_HEIGHT = 136;
const LEFT_MARGIN = 68;
const COL_WIDTH = 72;

/**
 * 일반 오선보 SVG 뷰어:
 * 각 음표 위에 국악 율명(중·임·무·황·태)을 표시하고 duration >= 2박은 2분음표 형태로 표현합니다.
 */
export function StaffScoreView({
  score,
  activeCellIndex,
  beatProgress = 0,
  completedUpTo = -1,
  onSelectNote,
}: StaffScoreViewProps) {
  const rows: Array<typeof score.cells> = [];
  for (let i = 0; i < score.cells.length; i += NOTES_PER_ROW) {
    rows.push(score.cells.slice(i, i + NOTES_PER_ROW));
  }

  const svgWidth = LEFT_MARGIN + NOTES_PER_ROW * COL_WIDTH + 24;
  const svgHeight = Math.max(ROW_HEIGHT, rows.length * ROW_HEIGHT + 12);

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white p-3">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full min-w-[540px]"
        role="img"
        aria-label={`${score.title} 오선보`}
      >
        {rows.map((rowCells, rowIdx) => {
          const offsetY = rowIdx * ROW_HEIGHT;

          return (
            <g key={`row-${rowIdx}`} transform={`translate(0, ${offsetY})`}>
              {STAFF_LINES.map((lineY) => (
                <line
                  key={lineY}
                  x1={16}
                  y1={lineY}
                  x2={svgWidth - 16}
                  y2={lineY}
                  stroke="#a8a29e"
                  strokeWidth={1.2}
                />
              ))}

              <text
                x={24}
                y={84}
                fontSize={44}
                fill="#44403c"
                fontFamily="serif"
              >
                𝄞
              </text>

              {rowCells.map((cell, colIdx) => {
                const globalIndex = rowIdx * NOTES_PER_ROW + colIdx;
                const cx = LEFT_MARGIN + colIdx * COL_WIDTH + COL_WIDTH / 2;
                const isActive = activeCellIndex === globalIndex;
                const isCompleted =
                  completedUpTo >= 0 && globalIndex <= completedUpTo && !isActive;

                if (!cell.note) {
                  return (
                    <g key={globalIndex}>
                      <text
                        x={cx}
                        y={72}
                        textAnchor="middle"
                        fontSize={13}
                        fontWeight={700}
                        fill="#a8a29e"
                      >
                        쉼
                      </text>
                    </g>
                  );
                }

                const pos = STAFF_Y_MAP[cell.note];
                const meta = NOTE_LOOKUP[cell.note];
                const isHalfNote = cell.duration >= 2;
                const noteColor = isActive
                  ? '#059669'
                  : isCompleted
                    ? '#486336'
                    : '#1c1917';

                return (
                  <g
                    key={globalIndex}
                    onClick={() => onSelectNote?.(cell.note!, globalIndex)}
                    className="cursor-pointer"
                  >
                    {isActive && (
                      <>
                        <rect
                          x={cx - 25}
                          y={6}
                          width={50}
                          height={118}
                          rx={10}
                          fill="#d1fae5"
                          stroke="#10b981"
                          strokeWidth={1.5}
                        />
                        <rect
                          x={cx - 20}
                          y={117}
                          width={40 * Math.max(0.08, Math.min(1, beatProgress))}
                          height={3.5}
                          rx={2}
                          fill="#059669"
                        />
                      </>
                    )}

                    {/* 음표 위 국악 율명 */}
                    <text
                      x={cx}
                      y={24}
                      textAnchor="middle"
                      fontSize={16}
                      fontWeight={900}
                      fill={isActive ? '#047857' : '#394f2b'}
                    >
                      {cell.note}
                    </text>

                    {pos.hasFlat && (
                      <text
                        x={cx - 14}
                        y={pos.y + 5}
                        fontSize={14}
                        fontWeight={700}
                        fill={noteColor}
                      >
                        ♭
                      </text>
                    )}

                    {/* 음표 머리 (2박 이상은 속이 빈 2분음표 형태) */}
                    <ellipse
                      cx={cx}
                      cy={pos.y}
                      rx={7.2}
                      ry={5.2}
                      transform={`rotate(-18 ${cx} ${pos.y})`}
                      fill={isHalfNote ? '#ffffff' : noteColor}
                      stroke={noteColor}
                      strokeWidth={isHalfNote ? 2 : 0}
                    />

                    {/* 음표 기둥 */}
                    <line
                      x1={pos.stemDown ? cx - 6 : cx + 6}
                      y1={pos.y}
                      x2={pos.stemDown ? cx - 6 : cx + 6}
                      y2={pos.stemDown ? pos.y + 26 : pos.y - 26}
                      stroke={noteColor}
                      strokeWidth={1.8}
                    />

                    <text
                      x={cx}
                      y={110}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={600}
                      fill="#78716c"
                    >
                      {meta.westernNote}
                      {cell.label ? ` · ${cell.label}` : ''}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
