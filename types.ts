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
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  THINKING = 'gemini-2.5-flash-thinking' // Custom alias for handling thinking config
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