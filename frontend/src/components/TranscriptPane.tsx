import React, { useEffect, useRef } from 'react';
import { useInterviewStore } from '../store/interviewStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TranscriptPane = () => {
  const transcript = useInterviewStore(state => state.transcript);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div ref={scrollRef} className="flex-1 w-full max-w-4xl mx-auto overflow-y-auto p-4 space-y-6">
      {transcript.map((msg, i) => (
        <div key={i} className={cn(
          "flex w-full",
          msg.role === 'user' ? "justify-end" : "justify-start"
        )}>
          <div className={cn(
            "max-w-[80%] p-4 rounded-[32px] border-2 border-vast text-lg leading-relaxed shadow-none",
            msg.role === 'user' ? "bg-lavender text-vast" : "bg-cream text-vast"
          )}>
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
};
