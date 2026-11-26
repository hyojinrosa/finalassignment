import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Mic, MicOff } from 'lucide-react';
import { DANSO_NOTES } from '../../constants/dansoNotes';
import type { UseAudioPitchReturn } from '../../hooks/useAudioPitch';
import type { HoleStates } from '../../types/danso';
import { matchNoteByHoles } from '../../utils/fingeringDetection';
import { RealtimeFingeringRecognizer } from '../practice/RealtimeFingeringRecognizer';

interface PracticeTabProps {
  audioPitch: UseAudioPitchReturn;
  onCameraActiveChange: (isActive: boolean) => void;
}

export function PracticeTab({
  audioPitch,
  onCameraActiveChange,
}: PracticeTabProps) {
  const [targetNoteId, setTargetNoteId] = useState(DANSO_NOTES[0].id);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [coveredHoles, setCoveredHoles] = useState<HoleStates>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const { isListening, analysis, error: micError, startListening, stopListening } =
    audioPitch;

  useEffect(() => {
    onCameraActiveChange(isCameraActive);
  }, [isCameraActive, onCameraActiveChange]);

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setIsCameraActive(active);
  }, []);

  const handleCoveredHolesChange = useCallback((holes: HoleStates) => {
    setCoveredHoles(holes);
  }, []);

  const targetNote =
    DANSO_NOTES.find((note) => note.id === targetNoteId) ?? DANSO_NOTES[0];

  const fingeringMatchedNote = matchNoteByHoles(coveredHoles);
  const isFingeringMatched = targetNote.holes.every(
    (closed, idx) => closed === coveredHoles[idx],
  );
  const isPitchMatched =
    analysis.matchedNote?.id === targetNote.id &&
    analysis.centsOff !== null &&
    Math.abs(analysis.centsOff) <= 35;

  const isPerfect = isFingeringMatched && isPitchMatched;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* 왼쪽: 실시간 운지 인식 컴포넌트 */}
      <div className="lg:col-span-7">
        <RealtimeFingeringRecognizer
          onCameraActiveChange={handleCameraActiveChange}
          onCoveredHolesChange={handleCoveredHolesChange}
        />
      </div>

      {/* 오른쪽: 목표 율명 & 통합 피드백 (운지 + 음정) */}
      <div className="flex flex-col gap-5 lg:col-span-5">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900">목표 율명 선택</h3>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {DANSO_NOTES.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setTargetNoteId(note.id)}
                className={`rounded-xl border py-2.5 text-center text-sm font-bold transition-colors ${
                  note.id === targetNoteId
                    ? 'border-bamboo-600 bg-bamboo-600 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="block">{note.id}</span>
                <span className="block text-[10px] font-medium opacity-80">
                  {note.oheum}({note.oheumHanja})
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">
            목표: {targetNote.koreanName} · 오음 {targetNote.oheum}({targetNote.oheumHanja}) ·{' '}
            {targetNote.westernNote} ({targetNote.frequencyHz.toFixed(1)} Hz) · 막아야 할 지공{' '}
            {targetNote.holes
              .map((closed, idx) => (closed ? `${idx + 1}공` : null))
              .filter(Boolean)
              .join(', ') || '없음(모두 열기)'}
          </p>
        </div>

        {/* 운지 & 음정 동시 판정 카드 */}
        <div
          className={`rounded-2xl border p-5 shadow-sm transition-colors ${
            isPerfect
              ? 'border-emerald-400 bg-emerald-50/70'
              : 'border-stone-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">실시간 통합 판정</h3>
            {isPerfect && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
                완벽합니다!
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div
              className={`rounded-xl border p-3 ${
                isFingeringMatched
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-stone-200 bg-stone-50 text-stone-600'
              }`}
            >
              <p className="font-medium">손가락 운지</p>
              <p className="mt-1 text-base font-bold">
                {isFingeringMatched
                  ? '일치'
                  : fingeringMatchedNote
                    ? `${fingeringMatchedNote.id} 운지`
                    : '조정 중'}
              </p>
            </div>

            <div
              className={`rounded-xl border p-3 ${
                isPitchMatched
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-stone-200 bg-stone-50 text-stone-600'
              }`}
            >
              <p className="font-medium">마이크 음정</p>
              <p className="mt-1 text-base font-bold">
                {isPitchMatched
                  ? '정확함'
                  : analysis.matchedNote
                    ? `${analysis.matchedNote.id} (${analysis.centsOff ?? 0}c)`
                    : '대기 중'}
              </p>
            </div>
          </div>
        </div>

        {/* 마이크 피치 검출 요약 카드 */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                실시간 음정 분석 (YIN Algorithm)
              </h3>
              <p className="text-xs text-stone-500">
                Web Audio API + YIN 기반 주파수 및 율명 매핑
              </p>
            </div>
            <button
              type="button"
              onClick={isListening ? stopListening : () => void startListening()}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-colors ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  마이크 중지
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  마이크 시작
                </>
              )}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-4 text-center">
            <div>
              <p className="text-xs font-medium text-stone-500">서양 음명</p>
              <p className="mt-1 text-3xl font-extrabold text-stone-900">
                {analysis.westernNote ? analysis.westernNote.fullName : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">국악 오음 · 율명</p>
              <p
                className={`mt-1 text-3xl font-extrabold ${
                  isPitchMatched ? 'text-emerald-600' : 'text-bamboo-700'
                }`}
              >
                {analysis.gugakNote
                  ? `${analysis.gugakNote.oheum} · ${analysis.gugakNote.yulmyeong.id}`
                  : '—'}
              </p>
            </div>
          </div>

          <p className="mt-2.5 text-center text-xs text-stone-500">
            {analysis.frequencyHz
              ? `${analysis.frequencyHz.toFixed(1)} Hz · 신뢰도 ${Math.round(analysis.clarity * 100)}%`
              : '단소 소리를 입력하면 하단 대형 모니터에도 실시간 표시됩니다.'}
          </p>

          {micError && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {micError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
