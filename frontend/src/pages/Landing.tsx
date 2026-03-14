import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Mic, BarChart3, FileText, Zap } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'JD-Tailored Questions',
    desc: 'Paste any job description — we extract skills and build a targeted question set around your exact role.',
    color: 'text-teal',
    bg: 'bg-teal-soft',
    border: 'border-teal/20',
  },
  {
    icon: Mic,
    title: 'Voice Answer Support',
    desc: 'Speak naturally. Gemini transcribes your voice in real time and evaluates your spoken responses.',
    color: 'text-amber',
    bg: 'bg-amber-soft',
    border: 'border-amber/20',
  },
  {
    icon: BarChart3,
    title: 'Actionable Feedback',
    desc: 'Scored across four rubrics — technical, depth, clarity, confidence — with a full performance report.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
];

const stats = [
  { value: '4', label: 'Evaluation Rubrics' },
  { value: '12', label: 'Questions per Session' },
  { value: 'AI', label: 'Powered by Gemini' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-bg bg-mesh-teal flex flex-col relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 w-[700px] h-[700px] rounded-full bg-teal/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-amber/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center shadow-teal-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Cheta Interviewer AI</span>
        </div>
        <button
          onClick={() => navigate('/jd')}
          className="btn-primary text-sm px-4 py-2"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex badge gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Google Gemini
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight">
            Ace Your Next<br />
            <span className="text-gradient-teal">Technical Interview</span>
          </h1>

          <p className="text-lg md:text-xl text-surface-muted max-w-2xl mx-auto leading-relaxed">
            AI-generated questions tailored to your resume and job description.
            Speak your answers. Get scored. Improve faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/jd')}
              className="btn-primary text-base px-8 py-4 group"
            >
              Start Practice Interview
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-12 pt-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-gradient-teal">{s.value}</p>
                <p className="text-xs text-surface-muted font-medium mt-1 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Feature cards */}
      <section className="relative z-10 px-4 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card p-6 space-y-4 group hover:border-teal/25 transition-all duration-300">
              <div className={`w-11 h-11 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-white font-bold text-base">{f.title}</h3>
              <p className="text-surface-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
