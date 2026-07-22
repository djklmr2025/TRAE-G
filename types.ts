export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface VirtualFile {
  name: string;
  language: string;
  content: string;
  path: string;
}

export enum GeminiModel {
  FLASH = 'arkaios',
  PRO = 'arkaios',
  THINKING = 'arkaios'
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentModel: GeminiModel;
  apiKey: string | undefined;
}

export interface EditorState {
  files: VirtualFile[];
  activeFile: VirtualFile | null;
}
