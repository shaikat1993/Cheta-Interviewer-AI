import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => Promise<void>;
  isProcessing: boolean;
}

export default function AudioRecorder({ onRecordingComplete, isProcessing }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const analyzeAudio = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    setAudioLevel(data.reduce((a, b) => a + b) / data.length / 255);
    if (isRecording) animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await onRecordingComplete(new Blob(audioChunksRef.current, { type: 'audio/wav' }));
      };

      recorder.start();
      setIsRecording(true);
      analyzeAudio();
    } catch (e) {
      console.error('Microphone error:', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const BAR_COUNT = 36;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Waveform */}
      <div className="flex items-center justify-center gap-[3px] h-12 w-56">
        {[...Array(BAR_COUNT)].map((_, i) => {
          const center = BAR_COUNT / 2;
          const distFromCenter = Math.abs(i - center) / center;
          const baseH = 12 - distFromCenter * 6;
          const liveH = isRecording
            ? Math.max(baseH, Math.random() * audioLevel * 120 + baseH)
            : baseH;
          return (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: '2.5px',
                height: `${liveH}%`,
                transitionDuration: isRecording ? '80ms' : '300ms',
                background: isRecording
                  ? `rgba(20,184,166,${0.4 + audioLevel * 0.6})`
                  : 'rgba(255,255,255,0.1)',
                boxShadow: isRecording && audioLevel > 0.2 ? '0 0 4px rgba(20,184,166,0.5)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Mic button with pulse ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring when recording */}
        {isRecording && (
          <>
            <div
              className="absolute rounded-full animate-ping"
              style={{
                inset: '-12px',
                border: '1px solid rgba(239,68,68,0.25)',
                animationDuration: '1.5s',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                inset: '-6px',
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.04)',
              }}
            />
          </>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={
            isRecording
              ? {
                  background: 'rgba(239,68,68,0.15)',
                  border: '1.5px solid rgba(239,68,68,0.5)',
                  color: '#f87171',
                  boxShadow: '0 0 28px rgba(239,68,68,0.25)',
                }
              : {
                  background: 'rgba(20,184,166,0.1)',
                  border: '1.5px solid rgba(20,184,166,0.4)',
                  color: '#14b8a6',
                  boxShadow: '0 0 20px rgba(20,184,166,0.2)',
                }
          }
        >
          {isProcessing ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : isRecording ? (
            <Square className="w-6 h-6 fill-current" />
          ) : (
            <Mic className="w-7 h-7" />
          )}
        </button>
      </div>

      {/* Status */}
      <div className="h-5 flex items-center justify-center">
        {isProcessing ? (
          <span className="flex items-center gap-2 text-xs font-medium" style={{ color: '#14b8a6' }}>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] animate-pulse"
              style={{ boxShadow: '0 0 6px rgba(20,184,166,0.8)' }}
            />
            Transcribing &amp; analyzing…
          </span>
        ) : isRecording ? (
          <span className="flex items-center gap-2 text-xs font-medium" style={{ color: '#f87171' }}>
            <span
              className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"
            />
            Recording — click to stop
          </span>
        ) : (
          <span className="text-xs font-medium" style={{ color: '#64748b' }}>
            Click microphone to begin
          </span>
        )}
      </div>
    </div>
  );
}
