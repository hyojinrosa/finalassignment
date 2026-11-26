export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface ChatRequestOptions {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  signal?: AbortSignal;
}

export interface ChatCompletionProvider {
  readonly name: string;
  sendMessage: (
    messages: ChatMessage[],
    options?: ChatRequestOptions,
  ) => Promise<string>;
}

