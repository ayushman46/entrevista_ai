import { create } from 'zustand';

export interface TranscriptMessage {
  role: 'user' | 'ai';
  content: string;
}

interface InterviewState {
  transcript: TranscriptMessage[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  isAiSpeaking: boolean;
  isRecording: boolean;
  addTranscriptChunk: (role: 'user' | 'ai', chunk: string, isFinal?: boolean) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  setIsAiSpeaking: (speaking: boolean) => void;
  setIsRecording: (recording: boolean) => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  transcript: [],
  connectionStatus: 'disconnected',
  isAiSpeaking: false,
  isRecording: false,
  addTranscriptChunk: (role, chunk) => set((state) => {
    const newTranscript = [...state.transcript];
    
    // If it's the AI speaking, we might be receiving chunks of a sentence
    if (newTranscript.length > 0 && newTranscript[newTranscript.length - 1].role === role) {
      if (role === 'ai') {
        newTranscript[newTranscript.length - 1].content += (newTranscript[newTranscript.length - 1].content.endsWith(' ') ? '' : ' ') + chunk;
      } else {
         newTranscript[newTranscript.length - 1].content = chunk;
      }
    } else {
      newTranscript.push({ role, content: chunk });
    }
    return { transcript: newTranscript };
  }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setIsAiSpeaking: (speaking) => set({ isAiSpeaking: speaking }),
  setIsRecording: (recording) => set({ isRecording: recording }),
}));
