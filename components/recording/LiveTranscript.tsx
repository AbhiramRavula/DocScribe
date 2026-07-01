'use client';

import { useEffect, useRef } from 'react';

interface LiveTranscriptProps {
  transcript: string;
  interimText: string;
  isRecording: boolean;
}

export default function LiveTranscript({
  transcript,
  interimText,
  isRecording,
}: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new text arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        {isRecording && <span className="recording-dot" />}
        <h3 className="text-sm font-semibold text-surface-700">
          {isRecording ? 'Live Transcript' : 'Transcript'}
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scroll rounded-xl bg-white/50 border border-surface-200 p-4 text-sm leading-relaxed text-surface-700"
      >
        {!transcript && !interimText && (
          <p className="text-surface-400 italic">
            {isRecording
              ? 'Listening... start speaking to see the transcript.'
              : 'Transcript will appear here once recording starts.'}
          </p>
        )}

        {transcript && (
          <span>{transcript}</span>
        )}

        {interimText && (
          <span className="text-surface-400 italic">{interimText}</span>
        )}
      </div>
    </div>
  );
}
