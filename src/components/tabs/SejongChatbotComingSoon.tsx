import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Construction,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

/**
 * 국악 이론 & 챗봇 화면 (판소리 할아버지 명창 grandpa.png 프로필 + 준비 중 안내).
 */
export function SejongChatbotComingSoon() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border-2 border-rose-200 bg-gradient-to-b from-rose-50/70 via-white to-amber-50/60 p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-1 shadow-xs">
            <img
              src="/grandpa.png"
              alt="판소리 할아버지 명창 선생님"
              className="h-12 w-12 object-contain drop-shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-stone-900">
                국악 이론 스승 &amp; 세종대왕 챗봇
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
                <Construction className="h-3 w-3" />
                현재 준비 중
              </span>
            </div>
            <p className="text-xs text-stone-500">
              판소리 명창 할아버지와 세종대왕님께 국악 역사와 단소 이론을 배우는 공간이에요.
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
          AI 국악 선생님과의 대화가 곧 열립니다!
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-600 sm:text-sm">
          현재는 OpenAI API 연동 및 단소 이론·정간보 맞춤 답변 기능을 준비 중입니다.
          <br />
          다음 업데이트에서 명창 할아버지와 세종대왕님께 직접 질문하실 수 있어요.
        </p>
      </div>

      {/* 이론 선생님 프로필 미리보기 */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <MessageCircle className="h-4 w-4 text-rose-500" />
          <span>예정된 대화 인터페이스 구조</span>
        </div>

        <div className="mt-3 space-y-2.5 text-xs">
          <div className="flex items-center gap-3 rounded-xl bg-amber-50/80 px-3.5 py-2.5 text-stone-700">
            <img
              src="/grandpa.png"
              alt="명창 할아버지 프로필"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div>
              <strong className="text-amber-900">판소리 명창 할아버지:</strong>{' '}
              허허, 단소는 다섯 구멍으로 하늘과 땅의 다섯 음(중·임·무·황·태)을
              담아내는 소박하면서도 깊은 악기란다.
            </div>
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
