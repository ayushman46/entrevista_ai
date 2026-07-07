"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVAD } from "../../../hooks/useVAD";
import { useInterviewSocket } from "../../../hooks/useInterviewSocket";
import { useInterviewStore } from "../../../store/interviewStore";
import { WaveformIndicator } from "../../../components/WaveformIndicator";
import { TranscriptPane } from "../../../components/TranscriptPane";

export default function InterviewRoom() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { sendAudio } = useInterviewSocket(sessionId);
  const { connectionStatus, isAiSpeaking, setIsRecording } = useInterviewStore();
  const [micActive, setMicActive] = useState(false);

  const vad = useVAD((audio) => {
    // Send audio buffer to backend when speech ends
    sendAudio(audio);
  });

  useEffect(() => {
    setMicActive(vad.userSpeaking);
    setIsRecording(vad.userSpeaking);
  }, [vad.userSpeaking, setIsRecording]);

  const endInterview = () => {
    router.push(`/report/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8 flex flex-col">
      <div className="flex-1 bg-vast text-cream rounded-[40px] md:rounded-[80px] p-6 md:p-12 flex flex-col relative overflow-hidden border-2 border-vast">
        
        {/* Header / Status bar */}
        <div className="flex items-center justify-between z-10 w-full mb-8">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-3xl">Interview Room</h2>
            <div className="px-4 py-1.5 rounded-full border-2 border-vast bg-forest text-cream text-sm font-bold flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-500'}`}></div>
              {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
            </div>
          </div>
          
          <button 
            onClick={endInterview}
            className="bg-cream text-vast px-6 py-2 rounded-xl font-bold border-2 border-vast hover:bg-cream/90 transition-colors"
          >
            End Interview
          </button>
        </div>

        {/* Status Badge centered */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <div className="bg-forest text-cream px-6 py-2 rounded-full border-2 border-vast font-bold tracking-wide shadow-none">
            {isAiSpeaking ? 'AI is speaking' : (micActive ? 'Listening...' : 'Thinking...')}
          </div>
          {vad.loading && (
            <div className="text-xs text-lavender font-bold">VAD is Loading (downloading models)...</div>
          )}
          {vad.errored && (
            <div className="text-xs text-red-400 font-bold bg-vast p-2 rounded">
              VAD Error: {vad.errored || "Failed to load VAD. Check console."}
              <button onClick={() => vad.start()} className="ml-2 underline">Retry</button>
            </div>
          )}
          {!vad.loading && !vad.errored && !vad.listening && (
            <button onClick={() => vad.start()} className="text-xs text-ember font-bold bg-vast p-2 rounded">
              Mic not listening! Click to start.
            </button>
          )}
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative z-0 mt-4">
          <TranscriptPane />
        </div>

        {/* Mic Indicator Fixed to Bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <WaveformIndicator isActive={micActive || isAiSpeaking} colorClass={micActive ? 'bg-ember' : 'bg-forest'} />
        </div>
      </div>
    </div>
  );
}
