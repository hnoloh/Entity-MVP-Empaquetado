export type ChatOwnerType = 'enti' | 'grupo';

export interface ChatOwner {
  type: ChatOwnerType;
  id: string;
}

// Minimal structure for history as required by FIA-001
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  owner: ChatOwner;
  history: ChatMessage[];
}
