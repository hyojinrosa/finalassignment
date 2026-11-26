import { useState } from 'react';
import { Award, Edit3, RotateCcw, Settings, Trash2, X } from 'lucide-react';
import {
  MILESTONE_BADGES,
  type UserProgressData,
} from '../../utils/userProgressStorage';

interface SettingsModalProps {
  isOpen: boolean;
  progress: UserProgressData;
  onEditName: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function SettingsModal({
  isOpen,
  progress,
  onEditName,
  onResetProgress,
  onClose,
}: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="설정 메뉴"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 to-rose-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Settings className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                설정 및 학습 데이터 관리
              </h3>
              <p className="text-xs text-stone-600">
                프로필, 배지 기준 및 데이터 초기화
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="설정 닫기"
            onClick={() => {
              setConfirmReset(false);
              onClose();
            }}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* 사용자 프로필 요약 */}
          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
            <div>
              <p className="text-[11px] font-semibold text-stone-500">
                현재 학습자
              </p>
              <p className="text-sm font-extrabold text-stone-900">
                {progress.userName || '등록된 이름 없음'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditName();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-amber-50"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-600" />
              이름 변경
            </button>
          </div>

          {/* 배지 획득 기준 안내 */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Award className="h-4 w-4 text-amber-600" />
              <span>배지 획득 기준</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs">
              {MILESTONE_BADGES.map((badge) => {
                const earned = badge.isEarned(progress);
                return (
                  <li
                    key={badge.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-stone-700">
                      {badge.label}
                    </span>
                    <span
                      className={`text-[11px] ${
                        earned
                          ? 'font-bold text-emerald-600'
                          : 'text-stone-500'
                      }`}
                    >
                      {earned ? '획득 완료!' : badge.description}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 학습 데이터 초기화 (테스트용) */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold text-rose-900">
                  학습 데이터 초기화
                </h4>
                <p className="mt-0.5 text-[11px] leading-relaxed text-rose-700">
                  이름, 리듬 게임 최고 점수, 연습한 곡, 배지 기록이 모두
                  삭제되고 처음 상태로 돌아갑니다.
                </p>
              </div>
              <Trash2 className="h-5 w-5 shrink-0 text-rose-500" />
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                학습 데이터 초기화
              </button>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-xl border border-stone-300 bg-white py-2 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmReset(false);
                    onResetProgress();
                    onClose();
                  }}
                  className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  정말 초기화하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
