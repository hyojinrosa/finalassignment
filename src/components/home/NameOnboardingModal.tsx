import { useState } from 'react';
import { Music2, Sparkles } from 'lucide-react';

interface NameOnboardingModalProps {
  isOpen: boolean;
  initialName?: string;
  onSubmitName: (name: string) => void;
  onCancel?: () => void;
}

/**
 * 첫 실행 시 학생의 이름을 입력받아 localStorage에 저장하는 파스텔톤 환영 입력창.
 */
export function NameOnboardingModal({
  isOpen,
  initialName = '',
  onSubmitName,
  onCancel,
}: NameOnboardingModalProps) {
  const [nameInput, setNameInput] = useState(initialName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onSubmitName(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사용자 이름 등록"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 via-white to-rose-50/70 p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md">
            <Music2 className="h-8 w-8" />
          </div>

          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <Sparkles className="h-3.5 w-3.5" />
            Finger Hero 단소 교실
          </span>

          <h2 className="mt-3 text-xl font-black text-stone-900">
            안녕! 너의 이름을 알려줄래?
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
            이름을 입력하면 연습한 곡과 리듬 게임 최고 점수가
            <br />이 브라우저에 차곡차곡 저장될 거야!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="text"
            autoFocus
            maxLength={16}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="이름 또는 별명 입력 (예: 지민)"
            className="w-full rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 text-center text-sm font-bold text-stone-900 outline-none transition-colors focus:border-emerald-400"
          />

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-2xl border border-stone-200 bg-white py-3 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-extrabold text-white shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              단소 연주 시작하기!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
