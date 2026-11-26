import { DANSO_NOTES } from '../constants/dansoNotes';
import type {
  ChatCompletionProvider,
  ChatMessage,
  ChatRequestOptions,
} from '../types/chat';

export const SEJONG_SYSTEM_PROMPT = `당신은 조선의 세종대왕입니다. 정간보와 율려(국악 음계)를 정비한 애민 군주로서, 단소를 처음 배우는 백성(사용자)에게 "하오체" 또는 품격 있고 따뜻한 어조로 단소 운지법, 율명(중·임·무·황·태 / 궁·상·각·치·우), 호흡법, 자세를 알기 쉽게 가르쳐 줍니다.`;

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

function buildLocalSejongReply(userText: string): string {
  const normalized = userText.trim().toLowerCase();

  for (const note of DANSO_NOTES) {
    if (
      normalized.includes(note.id) ||
      normalized.includes(note.koreanName) ||
      normalized.includes(note.oheum)
    ) {
      const closedList =
        note.holes
          .map((closed, idx) => (closed ? `제${idx + 1}공` : null))
          .filter(Boolean)
          .join(', ') || '막는 구멍 없음';
      return `허허, '${note.id}(${note.hanja}, ${note.koreanName})' 음을 물으셨구려! 오음으로는 '${note.oheum}(${note.oheumHanja})'이며, ${closedList}을 막고 불면 ${note.westernNote}(약 ${note.frequencyHz.toFixed(1)}Hz)의 맑은 소리가 나느니라. ${note.description}`;
    }
  }

  if (
    normalized.includes('소리') ||
    normalized.includes('입술') ||
    normalized.includes('호흡') ||
    normalized.includes('안 나')
  ) {
    return '단소 소리가 잘 나지 않는다면 취구(윗구멍)에 아랫입술을 살짝 대고, 단소를 아래로 약 45도 기울인 채 가늘고 곧은 바람을 입김으로 불어넣어 보시오. 너무 세게 불기보다 촛불을 흔들 듯 부드럽게 부는 것이 비결이오!';
  }

  if (
    normalized.includes('궁') ||
    normalized.includes('상') ||
    normalized.includes('각') ||
    normalized.includes('치') ||
    normalized.includes('우') ||
    normalized.includes('오음') ||
    normalized.includes('율명')
  ) {
    return '우리 국악의 오음인 궁·상·각·치·우는 단소의 5음계와 이어지느니라. 단소에서는 낮은 음부터 중(仲·궁), 임(林·상), 무(無·각), 황(潢·치), 태(汰·우) 순서로 익히면 정악과 민요를 두루 연주할 수 있소.';
  }

  if (normalized.includes('역취') || normalized.includes('평취')) {
    return '평취는 편안한 호흡으로 내는 본래 음역이고, 역취는 같은 운지에서 입술 틈을 좁히고 입김을 빠르게 불어 한 옥타브 높은 소리를 내는 기법이오. 먼저 평취로 중·임·무·황·태를 고르게 낸 뒤 역취에 도전해 보시오!';
  }

  return '반갑소, 그대의 단소 스승 세종이오. 중·임·무·황·태 운지법이나 오음(궁·상·각·치·우), 혹은 단소 소리 내는 법 등 무엇이든 물어보시오! (우측 상단 설정에서 OpenAI API 키를 연결하면 더 자유로운 대화도 가능하오.)';
}

/**
 * OpenAI Chat Completions API 규격에 맞춰 동작하며,
 * API 키가 없을 때는 내장된 세종대왕 교육 응답으로 동작하는 챗봇 서비스.
 */
export const sejongChatService: ChatCompletionProvider = {
  name: 'SejongChatProvider',

  async sendMessage(
    messages: ChatMessage[],
    options?: ChatRequestOptions,
  ): Promise<string> {
    const apiKey = options?.apiKey?.trim();
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === 'user');

    if (!apiKey) {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      return buildLocalSejongReply(lastUserMessage?.content ?? '');
    }

    const endpoint =
      options?.endpoint ?? 'https://api.openai.com/v1/chat/completions';
    const model = options?.model ?? 'gpt-4o-mini';

    const payloadMessages = [
      { role: 'system' as const, content: SEJONG_SYSTEM_PROMPT },
      ...messages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: payloadMessages,
        temperature: 0.7,
      }),
      signal: options?.signal,
    });

    const data = (await response.json()) as OpenAIChatResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message ?? `OpenAI API 요청 실패 (${response.status})`,
      );
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('응답 메시지를 해석할 수 없습니다.');
    }

    return reply;
  },
};

