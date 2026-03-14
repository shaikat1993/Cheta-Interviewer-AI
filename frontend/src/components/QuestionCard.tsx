interface QuestionCardProps {
  question: string;
  isThinking?: boolean;
  role?: string;
}

export default function QuestionCard({ question, isThinking, role = 'HR Interviewer' }: QuestionCardProps) {
  return (
    <div className="flex flex-col h-full justify-center items-center space-y-8 w-full animate-fade-in-up px-4">

      {/* Avatar section */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative inline-flex items-center justify-center">

          {/* Animated outer ring */}
          <div
            className={`absolute inset-[-10px] rounded-full transition-all duration-700 ${
              isThinking
                ? 'border-2 border-amber-400/40 animate-pulse-slow'
                : 'border border-[#14b8a6]/20'
            }`}
          />

          {/* Mid glow ring */}
          <div
            className={`absolute inset-[-4px] rounded-full border transition-all duration-500 ${
              isThinking ? 'border-amber-400/25' : 'border-[#14b8a6]/15'
            }`}
          />

          {/* Avatar body */}
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: isThinking
                ? 'radial-gradient(135deg, #1c1a0f 0%, #111827 100%)'
                : 'radial-gradient(135deg, #0d2020 0%, #0f172a 100%)',
              border: isThinking
                ? '1px solid rgba(251,191,36,0.2)'
                : '1px solid rgba(20,184,166,0.2)',
              boxShadow: isThinking
                ? '0 0 32px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'
                : '0 0 32px rgba(20,184,166,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* AI icon */}
            <svg
              className="w-11 h-11 transition-colors duration-500"
              style={{ color: isThinking ? 'rgba(251,191,36,0.7)' : 'rgba(20,184,166,0.75)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>

            {/* Thinking overlay */}
            {isThinking && (
              <div className="absolute inset-0 rounded-full bg-amber-400/8 animate-pulse" />
            )}
          </div>

          {/* Status dot */}
          <div
            className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#07090e] transition-all duration-500 ${
              isThinking ? 'bg-amber-400' : 'bg-[#14b8a6]'
            }`}
            style={{
              boxShadow: isThinking
                ? '0 0 10px rgba(251,191,36,0.7)'
                : '0 0 10px rgba(20,184,166,0.7)',
            }}
          />
        </div>

        {/* Name & role */}
        <div className="text-center">
          <p className="text-white font-semibold text-base tracking-tight leading-none mb-1.5">
            AI Interviewer
          </p>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(20,184,166,0.08)',
              border: '1px solid rgba(20,184,166,0.2)',
              color: '#5eead4',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]"
              style={{ boxShadow: '0 0 6px rgba(20,184,166,0.8)' }}
            />
            {role}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-32 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(20,184,166,0.3), transparent)' }} />

      {/* Question */}
      <div className="max-w-3xl w-full text-center min-h-[100px] flex items-center justify-center">
        {isThinking ? (
          <div
            className="flex items-center gap-4 px-7 py-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#94a3b8' }}>
              Processing
            </span>
            <div className="flex gap-1.5 items-center">
              {[0, 160, 320].map((delay) => (
                <div
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <h2
            className="text-2xl md:text-[2.2rem] text-white font-semibold leading-relaxed tracking-tight animate-fade-in"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
          >
            &ldquo;{question}&rdquo;
          </h2>
        )}
      </div>
    </div>
  );
}
