interface ScorePanelProps {
  technical: number;
  depth: number;
  clarity: number;
  confidence: number;
}

const metrics = [
  {
    key: 'technical' as const,
    label: 'Technical',
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.12)',
    glow: 'rgba(20,184,166,0.45)',
  },
  {
    key: 'depth' as const,
    label: 'Depth',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    glow: 'rgba(167,139,250,0.45)',
  },
  {
    key: 'clarity' as const,
    label: 'Clarity',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    glow: 'rgba(56,189,248,0.45)',
  },
  {
    key: 'confidence' as const,
    label: 'Confidence',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    glow: 'rgba(52,211,153,0.45)',
  },
];

export default function ScorePanel({ technical, depth, clarity, confidence }: ScorePanelProps) {
  const values = { technical, depth, clarity, confidence };
  const overall = Math.round((technical + depth + clarity + confidence) / 4);

  const overallColor =
    overall >= 70 ? '#14b8a6' : overall >= 45 ? '#f59e0b' : '#f87171';
  const overallLabel =
    overall >= 70 ? 'Excellent' : overall >= 45 ? 'Developing' : 'Needs Work';

  return (
    <div
      className="p-5 rounded-2xl space-y-5"
      style={{
        background: 'rgba(13,21,32,0.75)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>
            Live Metrics
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `rgba(${overallColor === '#14b8a6' ? '20,184,166' : overallColor === '#f59e0b' ? '245,158,11' : '248,113,113'},0.12)`,
            border: `1px solid ${overallColor}30`,
            color: overallColor,
          }}
        >
          {overall}/100
        </span>
      </div>

      {/* Overall score ring */}
      <div className="flex items-center gap-4">
        <div
          className="relative w-16 h-16 rounded-full flex flex-col items-center justify-center shrink-0"
          style={{
            background: `radial-gradient(circle, ${overallColor}15 0%, transparent 70%)`,
            border: `2px solid ${overallColor}30`,
            boxShadow: `0 0 20px ${overallColor}20`,
          }}
        >
          <span
            className="text-xl font-black leading-none"
            style={{ color: overallColor }}
          >
            {overall}
          </span>
          <span className="text-[9px] font-semibold" style={{ color: '#64748b' }}>
            /100
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none mb-1">{overallLabel}</p>
          <p className="text-xs" style={{ color: '#64748b' }}>Overall performance</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Individual metrics */}
      <div className="space-y-3.5">
        {metrics.map((m) => (
          <div key={m.key}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: m.color, boxShadow: `0 0 6px ${m.glow}` }}
                />
                <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>
                  {m.label}
                </span>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: m.color }}>
                {values[m.key]}%
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${values[m.key]}%`,
                  background: m.color,
                  boxShadow: values[m.key] > 0 ? `0 0 8px ${m.glow}` : 'none',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
