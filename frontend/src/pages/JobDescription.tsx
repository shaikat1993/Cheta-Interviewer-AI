import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Loader2, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function JobDescription() {
  const navigate = useNavigate();
  const [jdText, setJdText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const wordCount = jdText.trim() ? jdText.trim().split(/\s+/).length : 0;
  const isEnabled = wordCount >= 10;

  const handleSubmit = async () => {
    if (!isEnabled) return;
    setIsSubmitting(true);
    setError('');
    try {
      const data = await api.submitJD(jdText);
      if (data.session_id) localStorage.setItem('sessionId', data.session_id);
      if (data.role) localStorage.setItem('jdRole', data.role);
      navigate('/upload');
    } catch {
      setError('Failed to submit Job Description. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg bg-mesh-teal flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-teal/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-fade-in-up space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-teal-soft border border-teal/20 items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7 text-teal" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Job Description
          </h1>
          <p className="text-surface-muted text-base max-w-md mx-auto">
            Paste the JD below. We'll extract required skills and tailor every question to the role.
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-5">
          <div className="relative">
            <textarea
              className="field h-60 resize-none text-sm leading-relaxed"
              placeholder="e.g. We are looking for a Senior React Developer with experience in Next.js, TypeScript, state management, and REST APIs..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
            <div className="absolute bottom-3 right-4 flex items-center gap-2">
              <span className={`text-xs font-medium ${!isEnabled && wordCount > 0 ? 'text-amber' : 'text-surface-muted'}`}>
                {wordCount} words
              </span>
              {!isEnabled && wordCount > 0 && (
                <span className="text-xs text-amber/70">(min 10)</span>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isEnabled || isSubmitting}
            className="btn-primary w-full py-3.5"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing JD...</>
            ) : (
              <><Zap className="w-4 h-4" /> Analyze & Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="step-active" />
          <div className="h-px w-8 bg-teal/30" />
          <div className="step-idle" />
          <div className="h-px w-8 bg-white/10" />
          <div className="step-idle" />
        </div>
      </div>
    </div>
  );
}
