import type { ChatMessage } from '../blocks';
import type { AIError } from '../provider';

export type ChatStatus =
  | 'success'
  | 'error'
  | 'idle'
  | 'transmitting'
  | 'loading';

export type ChatContext = {
  messages: ChatMessage[];
  status: ChatStatus;
  error: AIError | null;
  images: File[];
  abortController: AbortController | null;
  currentSessionId: string | null;
  currentChatBlockId: string | null;
};
