import { Award, RotateCcw, Target, X } from 'lucide-react';
import type { JangdanPreset, JangguStroke } from '../../constants/jangdanPresets';
import type { DansoYulmyeong } from '../../types/danso';

export interface NoteOutcome {
  yulmyeong: DansoYulmyeong;
  groupIndex: number;
  stroke: JangguStroke;
  result: 'excellent' | 'good' | 'miss';
}

interface RhythmReportModalProps {
  isOpen: boolean;
  scoreTitle: string;
  jangdan: JangdanPreset;
  totalScore: number;
  maxCombo: number;
  outcomes: NoteOutcome[];
  onRetry: () => void;
  onClose: () => void;
}

const ORDINAL_LABELS = ['첫 번째 박', '두 번째 박', '세 번째 박', '네 번째 박'] as const;

function buildWeaknessFeedback(
  jangdan: JangdanPreset,
  outcomes: NoteOutcome[],
): string {
  const misses = outcomes.filter((o) => o.result === 'miss');
  if (outcomes.length === 0) {
    return '연주 기록이 아직 없어요. 게임을 시작해 박자에 맞춰 연주해 보세요!';
  }
  if (misses.length === 0) {
    return `완벽해! ${jangdan.name} 장단의 모든 박자와 율명을 한 번도 틀리지 않고 정확히 연주했어!`;
  }

  // 가장 많이 틀린 장단 박자(묶음) 찾기
  const groupMissCounts = new Map<number, number>();
  const strokeMissCounts = new Map<string, number>();
  const noteMissCounts = new Map<DansoYulmyeong, number>();

  for (const miss of misses) {
    groupMissCounts.set(
      miss.groupIndex,
      (groupMissCounts.get(miss.groupIndex) ?? 0) + 1,
    );
    const strokeName = miss.stroke ?? '빈 박';
    strokeMissCounts.set(
      `${miss.groupIndex}:${strokeName}`,
      (strokeMissCounts.get(`${miss.groupIndex}:${strokeName}`) ?? 0) + 1,
    );
    noteMissCounts.set(
      miss.yulmyeong,
      (noteMissCounts.get(miss.yulmyeong) ?? 0) + 1,
    );
  }

  let worstGroupIdx = 0;
  let worstGroupCount = -1;
  for (const [gIdx, count] of groupMissCounts.entries()) {
    if (count > worstGroupCount) {
      worstGroupCount = count;
      worstGroupIdx = gIdx;
    }
  }

  // 해당 묶음에서 가장 자주 틀린 구음(덩/쿵/따) 또는 그 묶음 내 대표 구음 찾기
  let worstStroke: string | null = null;
  let worstStrokeCount = -1;
  for (const [key, count] of strokeMissCounts.entries()) {
    const [gStr, sName] = key.split(':');
    if (Number(gStr) === worstGroupIdx && count > worstStrokeCount) {
      worstStrokeCount = count;
      worstStroke = sName;
    }
  }

  if (!worstStroke || worstStroke === '빈 박') {
    const fallbackStroke = jangdan.groups[worstGroupIdx]?.steps.find(
      (s) => s.stroke !== null,
    )?.stroke;
    worstStroke = fallbackStroke ?? '박자';
  }

  let worstNote: DansoYulmyeong = misses[0].yulmyeong;
  let worstNoteCount = -1;
  for (const [note, count] of noteMissCounts.entries()) {
    if (count > worstNoteCount) {
      worstNoteCount = count;
      worstNote = note;
    }
  }

  const groupOrdinal =
    ORDINAL_LABELS[worstGroupIdx] ?? `${worstGroupIdx + 1}번째 박`;

  return `너는 ${jangdan.name} 장단의 ${groupOrdinal}(${worstStroke})에서 자주 틀려! 특히 '${worstNote}' 노트가 내려올 때 조금 더 박자에 집중해 보자.`;
}

export function RhythmReportModal({
  isOpen,
  scoreTitle,
  jangdan,
  totalScore,
  maxCombo,
  outcomes,
  onRetry,
  onClose,
}: RhythmReportModalProps) {
  if (!isOpen) return null;

  const excellentCount = outcomes.filter((o) => o.result === 'excellent').length;
  const goodCount = outcomes.filter((o) => o.result === 'good').length;
  const missCount = outcomes.filter((o) => o.result === 'miss').length;
  const accuracy =
    outcomes.length > 0
      ? Math.round(((excellentCount + goodCount) / outcomes.length) * 100)
      : 0;

  const feedbackText = buildWeaknessFeedback(jangdan, outcomes);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="리듬 게임 결과 리포트"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-bamboo-700 to-bamboo-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Award className="h-6 w-6 text-amber-300" />
            <div>
              <h3 className="text-base font-bold">연주 결과 리포트</h3>
              <p className="text-xs text-bamboo-100">
                {scoreTitle} · {jangdan.name} ({jangdan.meter})
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="리포트 닫기"
            onClick={onClose}
            className="rounded-lg p-1 text-bamboo-100 hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* 핵심 요약 점수 */}
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-stone-50 p-3.5 text-center">
            <div>
              <p className="text-[11px] font-medium text-stone-500">총점</p>
              <p className="text-2xl font-black text-amber-600">{totalScore}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-500">정확도</p>
              <p className="text-2xl font-black text-emerald-600">
                {accuracy}%
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-500">최고 콤보</p>
              <p className="text-2xl font-black text-sky-600">{maxCombo}</p>
            </div>
          </div>

          {/* 판정 분포 */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 py-2">
              <span className="block font-semibold text-emerald-700">
                훌륭해요
              </span>
              <span className="text-base font-extrabold text-emerald-800">
                {excellentCount}회
              </span>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 py-2">
              <span className="block font-semibold text-sky-700">좋아요</span>
              <span className="text-base font-extrabold text-sky-800">
                {goodCount}회
              </span>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 py-2">
              <span className="block font-semibold text-rose-700">아쉬워요</span>
              <span className="text-base font-extrabold text-rose-800">
                {missCount}회
              </span>
            </div>
          </div>

          {/* 약점 분석 피드백 */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Target className="h-4 w-4 text-amber-700" />
              <span>맞춤 학습 피드백</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-stone-800">
              “{feedbackText}”
            </p>
          </div>

          {/* 장단 묶음별 정확도 그래프 */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-stone-700">
              장단 박자 묶음별 성공률
            </p>
            <div className="space-y-1.5">
              {jangdan.groups.map((group, gIdx) => {
                const groupItems = outcomes.filter(
                  (o) => o.groupIndex === gIdx,
                );
                const hitItems = groupItems.filter((o) => o.result !== 'miss');
                const rate =
                  groupItems.length > 0
                    ? Math.round((hitItems.length / groupItems.length) * 100)
                    : 100;

                return (
                  <div key={group.groupLabel} className="text-xs">
                    <div className="flex justify-between text-[11px] text-stone-600">
                      <span>{group.groupLabel}</span>
                      <span className="font-semibold">
                        {groupItems.length > 0
                          ? `${rate}% (${hitItems.length}/${groupItems.length})`
                          : '노트 없음'}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full ${
                          rate >= 80
                            ? 'bg-emerald-500'
                            : rate >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-xl bg-bamboo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-bamboo-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              다시 도전하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

