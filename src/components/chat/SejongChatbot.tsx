import { useEffect, useRef, useState } from 'react';
import { KeyRound, Send, Sparkles, X } from 'lucide-react';
import { sejongChatService } from '../../services/sejongChatService';
import type { ChatMessage } from '../../types/chat';

const QUICK_PROMPTS = [
  '중(仲) 운지법 알려줘',
  '단소 소리가 잘 안 나요',
  '궁·상·각·치·우가 뭔가요?',
] as const;

function SejongAvatarIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 익선관 (왕의 관모) */}
      <path
        d="M18 22C18 13 24 8 32 8C40 8 46 13 46 22H18Z"
        fill="#1E293B"
      />
      <rect x="14" y="18" width="8" height="4" rx="2" fill="#334155" />
      <rect x="42" y="18" width="8" height="4" rx="2" fill="#334155" />
      <rect x="19" y="21" width="26" height="3" rx="1.5" fill="#D97706" />

      {/* 얼굴 */}
      <circle cx="32" cy="33" r="13" fill="#FDE6C4" />
      {/* 눈썹과 인자한 눈 */}
      <path
        d="M24 30C25.5 29 27.5 29 29 30"
        stroke="#451A03"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M35 30C36.5 29 38.5 29 40 30"
        stroke="#451A03"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="26.5" cy="33" r="1.5" fill="#1C1917" />
      <circle cx="37.5" cy="33" r="1.5" fill="#1C1917" />

      {/* 수염 & 미소 */}
      <path
        d="M27 38C29 40.5 35 40.5 37 38"
        stroke="#92400E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M25 39C26 45 29 49 32 50C35 49 38 45 39 39"
        fill="#334155"
        opacity="0.9"
      />
      <path
        d="M29 38.5C30.8 39.8 33.2 39.8 35 38.5"
        stroke="#FDE6C4"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* 곤룡포 */}
      <path
        d="M15 58C15 50 22 46 32 46C42 46 49 50 49 58H15Z"
        fill="#B91C1C"
      />
      <circle cx="32" cy="53" r="3.5" fill="#F59E0B" />
    </svg>
  );
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content:
      '반갑소! 나는 그대의 단소 공부를 돕는 세종이오. 운지법이나 율명, 소리 내는 법이 궁금하다면 무엇이든 물어보시오.',
    createdAt: Date.now(),
  },
];

export function SejongChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState('');

  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendUserMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const replyText = await sejongChatService.sendMessage(nextMessages, {
        apiKey: openAiApiKey || undefined,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : '답변을 불러오지 못했습니다.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `미안하오, 잠시 문제가 생겼소: ${errMsg}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed right-4 bottom-24 z-40 sm:right-6">
      {/* 채팅창 팝오버 */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="세종대왕 단소 도우미 채팅"
          className="mb-3 flex h-[450px] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl sm:w-96"
        >
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between bg-gradient-to-r from-red-800 via-red-700 to-amber-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/90 p-0.5 shadow-inner">
                <SejongAvatarIcon className="h-9 w-9" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold">세종대왕 AI 스승</h2>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
                    {openAiApiKey.trim() ? 'OpenAI 연결됨' : '기본 도우미'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-100">
                  정간보 · 운지 · 호흡 질의응답
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                title="OpenAI API 설정"
                onClick={() => setShowApiConfig((prev) => !prev)}
                className="rounded-lg p-1.5 text-amber-100 transition-colors hover:bg-white/15 hover:text-white"
              >
                <KeyRound className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="채팅창 닫기"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-amber-100 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* OpenAI API Key 입력 서랍 (선택 사항) */}
          {showApiConfig && (
            <div className="border-b border-amber-100 bg-amber-50/70 px-3.5 py-2.5 text-xs">
              <label className="block font-semibold text-stone-700">
                OpenAI API Key (선택 · 메모리 내에만 유지)
              </label>
              <input
                type="password"
                value={openAiApiKey}
                onChange={(e) => setOpenAiApiKey(e.target.value)}
                placeholder="sk-... 입력 시 OpenAI API로 답변"
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-600"
              />
            </div>
          )}

          {/* 메시지 목록 */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-hanji/60 p-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'rounded-br-xs bg-bamboo-600 text-white'
                        : 'rounded-bl-xs border border-amber-200/80 bg-white text-stone-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-xs border border-amber-200/80 bg-white px-3.5 py-2 text-xs text-stone-500">
                  세종대왕께서 생각을 가다듬고 계시오...
                </div>
              </div>
            )}
            <div ref={listEndRef} />
          </div>

          {/* 추천 질문 칩 */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-stone-100 bg-white px-3 py-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendUserMessage(prompt)}
                className="shrink-0 rounded-full border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* 입력 폼 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendUserMessage(inputValue);
            }}
            className="flex items-center gap-2 border-t border-stone-200 bg-white p-2.5"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="세종대왕께 단소 질문하기..."
              className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs outline-none focus:border-bamboo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              aria-label="메시지 전송"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bamboo-600 text-white transition-colors hover:bg-bamboo-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* 화면 구석 세종대왕 캐릭터 플로팅 아이콘 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="세종대왕 AI 도우미 열기"
        className="group flex items-center gap-2.5 rounded-full border-2 border-amber-400 bg-gradient-to-br from-red-800 to-amber-700 p-2 pr-4 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 shadow-inner">
          <SejongAvatarIcon className="h-10 w-10" />
        </span>
        <span className="text-left">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-200">
            <Sparkles className="h-3 w-3" />
            AI 단소 스승
          </span>
          <span className="block text-xs font-bold">세종대왕</span>
        </span>
      </button>
    </div>
  );
}

