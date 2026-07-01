'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Custom hook wrapping the Web Speech API (SpeechRecognition).
 * Chrome-only. Falls back gracefully in unsupported browsers.
 *
 * Uses refs instead of state inside the recognition callbacks
 * to avoid stale closure bugs with auto-restart.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const { continuous = true, interimResults = true, lang = 'en-IN' } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const isListeningRef = useRef(false);

  // Keep the ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          transcriptRef.current += final;
          setTranscript(transcriptRef.current);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'aborted') {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Use ref (not state) to check if we should auto-restart
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore — may already be started
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [continuous, interimResults, lang]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      transcriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setInterimTranscript('');
    }
  }, []);

  const reset = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    start,
    stop,
    reset,
  };
}
