import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Home, Award, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api, ReportData } from '../services/api';
import jsPDF from 'jspdf';

export default function Report() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => { loadReport(); }, []);

  const loadReport = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId') || undefined;
      setReportData(await api.generateReport(sessionId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(20); doc.text('Cheta Interviewer AI — Report', 20, y); y += 12;
    doc.setFontSize(12); doc.text(`Overall Score: ${reportData.overall_score}/100`, 20, y); y += 10;
    doc.text(`Technical: ${reportData.technical}/100`, 25, y); y += 7;
    doc.text(`Depth: ${reportData.depth}/100`, 25, y); y += 7;
    doc.text(`Clarity: ${reportData.clarity}/100`, 25, y); y += 7;
    doc.text(`Confidence: ${reportData.confidence}/100`, 25, y); y += 12;
    doc.text('Key Strengths:', 20, y); y += 8;
    (reportData.strengths || []).forEach((s) => { doc.text(`• ${s}`, 25, y); y += 7; });
    y += 5;
    doc.text('Areas for Improvement:', 20, y); y += 8;
    (reportData.improvements || []).forEach((i) => { doc.text(`• ${i}`, 25, y); y += 7; });
    if (reportData.detailed_log?.length) {
      doc.addPage(); y = 20;
      doc.setFontSize(16); doc.text('Full Transcript & Feedback', 20, y); y += 10;
      doc.setFontSize(11);
      reportData.detailed_log.forEach((log) => {
        doc.text(`Q${log.question_number}: ${log.question}`, 20, y); y += 7;
        const lines = doc.splitTextToSize(`Answer: ${log.answer}`, 170);
        doc.text(lines, 20, y); y += lines.length * 6;
        doc.text(`Score: ${log.evaluation?.overall_rating || 0}/100`, 20, y); y += 6;
        if (log.evaluation?.improvements) {
          const fb = doc.splitTextToSize(`Feedback: ${log.evaluation.improvements}`, 170);
          doc.text(fb, 20, y); y += fb.length * 6;
        }
        y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }
    doc.save('interview-report.pdf');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="text-center space-y-5 animate-fade-in-up">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-teal border-t-transparent animate-spin shadow-teal-sm" />
          </div>
          <p className="text-white font-semibold tracking-wide">Synthesizing Report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="card p-10 text-center space-y-4">
          <p className="text-red-400 font-medium">Failed to load report</p>
          <button onClick={() => navigate('/')} className="btn-secondary">Return Home</button>
        </div>
      </div>
    );
  }

  const radarData = [
    { skill: 'Overall', score: reportData.overall_score },
    { skill: 'Technical', score: reportData.technical },
    { skill: 'Response', score: reportData.depth },
    { skill: 'Communication', score: reportData.clarity },
    { skill: 'Confidence', score: reportData.confidence },
  ];

  const barData = reportData.skills_analysis?.length > 1
    ? reportData.skills_analysis.slice(1)
    : radarData.slice(1);

  const scoreCards = [
    { label: 'Overall Score', value: reportData.overall_score, color: 'text-white', bg: 'bg-white/8', border: 'border-white/15', icon: Award },
    { label: 'Technical', value: reportData.technical, color: 'text-teal', bg: 'bg-teal-soft', border: 'border-teal/20', icon: TrendingUp },
    { label: 'Response', value: reportData.depth, color: 'text-amber', bg: 'bg-amber-soft', border: 'border-amber/20', icon: TrendingUp },
    { label: 'Clarity', value: reportData.clarity, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: TrendingUp },
    { label: 'Confidence', value: reportData.confidence, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-surface-bg py-10 px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-teal/4 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-amber/4 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Interview Report</h1>
            <p className="text-surface-muted mt-1">Full performance analysis &amp; feedback</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDownload} className="btn-secondary text-sm px-4 py-2">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={() => navigate('/')} className="btn-primary text-sm px-4 py-2">
              <Home className="w-4 h-4" /> Home
            </button>
          </div>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up">
          {scoreCards.map((s) => (
            <div key={s.label} className="card p-5 flex flex-col justify-between gap-4 hover:border-teal/20 transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-surface-muted font-semibold uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}<span className="text-base font-medium text-surface-muted">/100</span></p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="card p-6">
            <h3 className="text-xs font-bold text-surface-muted uppercase tracking-widest mb-6">Skills Consistency</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#374151' }} />
                  <Radar dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xs font-bold text-surface-muted uppercase tracking-widest mb-6">Score Breakdown</h3>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 20, left: -20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="skill"
                    tick={(props: { x: number; y: number; payload: { value: string } }) => {
                      const { x, y, payload } = props;
                      const words = payload.value.split(/\s+/);
                      const lines: string[] = [];
                      let cur = '';
                      words.forEach((w) => {
                        if ((cur + ' ' + w).length > 14 && cur) { lines.push(cur.trim()); cur = w; }
                        else { cur += (cur ? ' ' : '') + w; }
                      });
                      if (cur) lines.push(cur.trim());
                      return (
                        <g transform={`translate(${x},${y})`}>
                          {lines.slice(0, 3).map((l, i) => (
                            <text key={i} x={0} y={14 + i * 13} textAnchor="middle" fill="#6b7280" fontSize={11}>{l}</text>
                          ))}
                        </g>
                      );
                    }}
                    axisLine={false} tickLine={false} interval={0} height={60}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="score" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Strengths & improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="card p-6 border-l-4 border-l-emerald-500 space-y-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Key Strengths</h3>
            </div>
            <ul className="space-y-3">
              {(reportData.strengths || ['Clear communication', 'Good technical knowledge', 'Confident delivery']).map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-surface-text leading-relaxed">
                  <div className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-xs font-bold">✓</div>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 border-l-4 border-l-amber space-y-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber" />
              <h3 className="text-sm font-bold text-amber uppercase tracking-wider">Focus Areas</h3>
            </div>
            <ul className="space-y-3">
              {(reportData.improvements || ['Add specific examples', 'Expand technical detail', 'Structure answers clearly']).map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-surface-text leading-relaxed">
                  <div className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-amber-soft border border-amber/25 flex items-center justify-center text-amber text-xs font-bold">→</div>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Transcript */}
        {reportData.detailed_log && reportData.detailed_log.length > 0 && (
          <div className="space-y-5 animate-fade-in-up">
            <h3 className="text-xl font-bold text-white tracking-tight">Full Transcript &amp; Feedback</h3>
            {reportData.detailed_log.map((log, idx) => (
              <div key={idx} className="card p-5 space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-xl bg-teal-soft border border-teal/25 flex items-center justify-center shrink-0">
                    <span className="text-teal font-bold text-xs">Q{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-surface-muted uppercase tracking-wider mb-1">AI Interviewer · {log.skill}</p>
                    <p className="text-white text-sm leading-relaxed">{log.question}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-surface-muted font-bold text-xs">A</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-surface-muted uppercase tracking-wider mb-1">Your Answer</p>
                    <p className="text-surface-muted text-sm leading-relaxed italic border-l-2 border-white/10 pl-3">{log.answer}</p>
                  </div>
                </div>

                <div className="pl-11 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal uppercase tracking-wider">Score</span>
                    <span className="text-sm font-black text-white bg-teal-soft border border-teal/25 px-2 py-0.5 rounded-lg">{log.evaluation?.overall_rating || 0}/100</span>
                  </div>
                  {log.evaluation?.improvements && (
                    <p className="text-sm text-surface-text leading-relaxed">
                      <span className="font-semibold text-teal">Feedback:</span> {log.evaluation.improvements}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
