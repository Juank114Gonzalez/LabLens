'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Backend does not stream yet.
 * This helper reveals text progressively for ChatGPT-like UX.
 * TODO(backend): replace with SSE/WebSocket token stream when available.
 */
export function useSimulatedStream() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const timerRef = useRef<number | null>(null);
  const stopRef = useRef(false);

  const stop = useCallback(() => {
    stopRef.current = true;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const start = useCallback((fullText: string) => {
    stop();
    stopRef.current = false;
    setStreamedText('');
    setIsStreaming(true);

    let index = 0;
    const step = () => {
      if (stopRef.current) {
        setIsStreaming(false);
        return;
      }

      index = Math.min(fullText.length, index + Math.max(2, Math.round(fullText.length / 80)));
      setStreamedText(fullText.slice(0, index));

      if (index >= fullText.length) {
        setIsStreaming(false);
        return;
      }

      timerRef.current = window.setTimeout(step, 16);
    };

    step();
  }, [stop]);

  return { streamedText, isStreaming, start, stop, setStreamedText };
}
