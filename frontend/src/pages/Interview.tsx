import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, TrendingUp, Lightbulb, Zap } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import AudioRecorder from '../components/AudioRecorder';
import ScorePanel from '../components/ScorePanel';
import { api, SubmitAnswerResponse } from '../services/api';

const TIPS = [
  { t: 'Pause first', d: 'Take 2–3 seconds to collect your thoughts before answering.' },
  { t: 'Use STAR', d: 'Situation → Task → Action → Result for behavioral questions.' },
  { t: 'Be precise', d: 'Mention specific tools, metrics, or outcomes from real experience.' },
  { t: 'Speak clearly', d: 'AI evaluates pacing and tone. Steady wins over rushed.' },
];

export default function Interview() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState('Generating question...');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState('');
  const [scores, setScores] = useState({ technical: 0, depth: 0, clarity: 0, confidence: 0 });
  const [improvement, setImprovement] = useState('');
  const [showImprovement, setShowImprovement] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [latestScore, setLatestScore] = useState(0);
  const [lastTranscript, setLastTranscript] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const jdRole = localStorage.getItem('jdRole') || 'HR Interviewer';

  const playAudio = (b64: string) => {
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(`data:audio/mp3;base64,${b64}`);
    audioRef.current = a;
    a.play().catch(() => {});
  };

  useEffect(() => {
    const q = localStorage.getItem('firstQuestion');
    const a = localStorage.getItem('firstAudio');
    if (q) setCurrentQuestion(q);
    if (a) setTimeout(() => playAudio(a), 800);
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    setShowImprovement(false);
    try {
      const sessionId = localStorage.getItem('sessionId') || undefined;
      const res = await api.transcribeAudio(blob, sessionId);
      setPendingTranscript(res.transcript);
      setIsVerifying(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitVerifiedAnswer = async () => {
    setIsVerifying(false);
    setIsThinking(true);
    try {
      const sessionId = localStorage.getItem('sessionId') || undefined;
      const res: SubmitAnswerResponse = await api.submitAnswer(pendingTranscript, sessionId);

      setTimeout(() => {
        setScores({ technical: res.technical, depth: res.depth, clarity: res.clarity, confidence: res.confidence });
        setLatestScore(res.final_score);
        setShowScorePopup(true);
        setTimeout(() => setShowScorePopup(false), 3500);
        setImprovement(res.improvement);
        setShowImprovement(true);
        setLastTranscript(pendingTranscript);

        setTimeout(() => {
          setCurrentQuestion(res.next_question);
          setQuestionNumber((p) => p + 1);
          setIsThinking(false);
          setPendingTranscript('');
          if (res.audio_base64) playAudio(res.audio_base64);
        }, 1200);
      }, 1200);
    } catch (e) {
      console.error(e);
      setIsThinking(false);
    }
  };

  const progress = Math.min((questionNumber / 10) * 100, 100);
  const overallScore = Math.round(
    (scores.technical + scores.depth + scores.clarity + scores.confidence) / 4
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#07090e' }}>

      {/* Background ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            top: '-10%', right: '-5%',
            width: '480px', height: '480px',
            background: 'radial-gradient(circle, rgba(20,184,166,0.055) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '5%', left: '-8%',
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '40%', left: '45%',
            width: '300px', height: '300px',
            background: 'radial-gradient(circle, rgba(245,158,11,0.025) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-3.5"
        style={{
          background: 'rgba(7,9,14,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Left: live badge + timer + role */}
        <div className="flex items-center gap-4">
          {/* Live badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
              style={{ boxShadow: '0 0 6px rgba(239,68,68,0.7)' }}
            />
            <span className="text-xs font-bold text-red-400 tracking-wider">LIVE</span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Timer */}
          <span
            className="font-mono text-sm font-semibold tabular-nums"
            style={{ color: '#94a3b8' }}
          >
            {fmt(elapsedTime)}
          </span>

          {/* Divider */}
          <div className="h-4 w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Role */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Zap className="w-3 h-3" style={{ color: '#14b8a6' }} />
            <span className="text-xs font-medium" style={{ color: '#64748b' }}>{jdRole}</span>
          </div>
        </div>

        {/* Center: question counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#64748b' }}>
            Question
          </span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-md tabular-nums"
            style={{
              background: 'rgba(20,184,166,0.1)',
              border: '1px solid rgba(20,184,166,0.2)',
              color: '#14b8a6',
            }}
          >
            {Math.min(questionNumber, 10)} / 10
          </span>
        </div>

        {/* Right: end button */}
        <button
          onClick={() => navigate('/report')}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
          }}
        >
          <X className="w-4 h-4" />
          End
        </button>
      </header>

      {/* ── Progress bar ── */}
      <div className="relative z-10 px-6 pt-4 pb-1">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-widest w-6" style={{ color: '#475569' }}>
            Q{questionNumber}
          </span>
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(to right, #0d9488, #14b8a6)',
                boxShadow: '0 0 10px rgba(20,184,166,0.5)',
                transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>
          <span className="text-[11px] font-bold tabular-nums w-8 text-right" style={{ color: '#475569' }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 container mx-auto px-4 py-5 flex flex-col lg:flex-row gap-5 max-w-7xl">

        {/* Left column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Question card */}
          <div
            className="flex-1 rounded-2xl p-8 flex items-center justify-center min-h-[340px]"
            style={{
              background: 'rgba(13,21,32,0.6)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <QuestionCard question={currentQuestion} isThinking={isThinking} role={jdRole} />
          </div>

          {/* Recording / Verify area */}
          <div
            className="rounded-2xl p-6 min-h-[180px] flex flex-col justify-center"
            style={{
              background: 'rgba(13,21,32,0.6)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            {isVerifying ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ background: '#14b8a6', boxShadow: '0 0 8px rgba(20,184,166,0.6)' }}
                  />
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>
                    Verify Transcript
                  </p>
                </div>
                <textarea
                  className="field resize-none min-h-[88px] text-sm"
                  value={pendingTranscript}
                  onChange={(e) => setPendingTranscript(e.target.value)}
                  placeholder="Edit your answer if needed..."
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { setIsVerifying(false); setPendingTranscript(''); }}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Retake
                  </button>
                  <button
                    onClick={submitVerifiedAnswer}
                    disabled={!pendingTranscript.trim() || isThinking}
                    className="btn-primary text-sm px-5 py-2"
                  >
                    Confirm &amp; Submit
                  </button>
                </div>
              </div>
            ) : (
              <AudioRecorder onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />
            )}
          </div>

          {/* Improvement tip */}
          <div
            className={`transition-all duration-500 overflow-hidden ${
              showImprovement ? 'max-h-36 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div
              className="rounded-2xl p-4 flex gap-4"
              style={{
                background: 'rgba(20,184,166,0.06)',
                border: '1px solid rgba(20,184,166,0.18)',
                boxShadow: '0 2px 16px rgba(20,184,166,0.08)',
              }}
            >
              <div
                className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.2)' }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: '#14b8a6' }} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#14b8a6' }}>
                  Growth Tip
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{improvement}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">

          {/* Score panel */}
          <ScorePanel
            technical={scores.technical}
            depth={scores.depth}
            clarity={scores.clarity}
            confidence={scores.confidence}
          />

          {/* Interview tips */}
          <div
            className="rounded-2xl p-5 flex-1"
            style={{
              background: 'rgba(13,21,32,0.6)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <Lightbulb className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>
                Interview Tips
              </h3>
            </div>

            <ul className="space-y-2.5">
              {TIPS.map((tip) => (
                <li
                  key={tip.t}
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-xs font-semibold text-white mb-0.5">{tip.t}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{tip.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Score popup ── */}
      {showScorePopup && (
        <div
          className="fixed top-[72px] right-5 rounded-2xl p-5 flex items-center gap-4 max-w-[280px] animate-fade-in-up z-50"
          style={{
            background: 'rgba(13,21,32,0.92)',
            border: '1px solid rgba(20,184,166,0.25)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(20,184,166,0.1)',
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#64748b' }}>
              Answer Score
            </p>
            <p className="text-sm text-white leading-snug truncate">
              &ldquo;{lastTranscript}&rdquo;
            </p>
          </div>
          <div
            className="w-14 h-14 shrink-0 rounded-full flex flex-col items-center justify-center"
            style={{
              background: `radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)`,
              border: `2px solid ${latestScore >= 70 ? 'rgba(20,184,166,0.5)' : latestScore >= 45 ? 'rgba(245,158,11,0.5)' : 'rgba(248,113,113,0.5)'}`,
              boxShadow: `0 0 16px ${latestScore >= 70 ? 'rgba(20,184,166,0.25)' : latestScore >= 45 ? 'rgba(245,158,11,0.25)' : 'rgba(248,113,113,0.25)'}`,
            }}
          >
            <span
              className="text-xl font-black leading-none tabular-nums"
              style={{
                color: latestScore >= 70 ? '#14b8a6' : latestScore >= 45 ? '#f59e0b' : '#f87171',
              }}
            >
              {latestScore}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
