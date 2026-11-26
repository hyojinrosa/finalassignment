import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Construction,
  Crown,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

/**
 * 세종대왕 AI 챗봇 화면 (현재 준비 중 안내 + 향후 OpenAI 메시지 인터페이스 구조 표시).
 */
export function SejongChatbotComingSoon() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border-2 border-rose-200 bg-gradient-to-b from-rose-50/70 via-white to-amber-50/60 p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400 text-white shadow-sm">
            <Crown className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-stone-900">
                세종대왕 AI 챗봇
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
                <Construction className="h-3 w-3" />
                현재 준비 중
              </span>
            </div>
            <p className="text-xs text-stone-500">
              정간보를 만드신 세종대왕님께 단소 연주법을 물어보는 공간이에요.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" />
          메인 메뉴로
        </button>
      </div>

      {/* 준비 중 안내 카드 */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-amber-500" />
        <h3 className="mt-2 text-base font-extrabold text-stone-900">
          세종대왕 AI 스승님이 곧 찾아옵니다!
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-600 sm:text-sm">
          현재는 OpenAI API 연동 및 단소 맞춤 답변 기능을 준비 중입니다.
          <br />
          다음 업데이트를 통해 세종대왕님과 직접 대화하며 단소를 배워보실 수 있어요.
        </p>
      </div>

      {/* 컴포넌트 구조 미리보기 */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <MessageCircle className="h-4 w-4 text-rose-500" />
          <span>예정된 대화 인터페이스 구조</span>
        </div>

        <div className="mt-3 space-y-2.5 text-xs">
          <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-stone-700">
            <strong className="text-rose-700">세종대왕:</strong> 반갑소! 단소의
            중·임·무·황·태 운지나 호흡법 중 궁금한 것이 있으면 물어보시오.
          </div>
          <div className="ml-auto max-w-[75%] rounded-xl bg-emerald-50 px-3.5 py-2.5 text-right text-stone-700">
            <strong className="text-emerald-700">학생:</strong> 무(無) 음정은 어떤
            구멍을 막고 불어야 하나요?
          </div>
        </div>
      </div>
    </section>
  );
}
