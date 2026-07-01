'use client';

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isRecording: boolean;
}

export default function WaveformVisualizer({ isRecording }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isRecording) {
      // Cleanup
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      // Draw flat line
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
      return;
    }

    let mounted = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
          if (!mounted || !canvasRef.current) return;
          animationRef.current = requestAnimationFrame(draw);

          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          analyser.getByteTimeDomainData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Gradient stroke
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(0.5, '#6366f1');
          gradient.addColorStop(1, '#3b82f6');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();

          const sliceWidth = canvas.width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }

          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }

        draw();
      } catch (err) {
        console.error('Microphone access error:', err);
      }
    }

    init();

    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isRecording]);

  return (
    <div className="w-full h-16 rounded-xl overflow-hidden bg-surface-50/50 border border-surface-200">
      <canvas
        ref={canvasRef}
        width={600}
        height={64}
        className="w-full h-full"
      />
    </div>
  );
}
