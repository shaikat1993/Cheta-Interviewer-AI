import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { api, ResumeUploadResponse } from '../services/api';

export default function Upload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState<ResumeUploadResponse | null>(null);
  const [error, setError] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = (f: File) => {
    const valid = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!valid.includes(f.type)) { setError('Please upload a PDF or DOCX file'); return; }
    setFile(f);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const sessionId = localStorage.getItem('sessionId') || undefined;
      if (!sessionId) { setError('Missing session. Please submit a Job Description first.'); setUploading(false); return; }
      const data = await api.uploadResume(file, sessionId);
      setUploadData(data);
      if (data.first_question) localStorage.setItem('firstQuestion', data.first_question);
      if (data.first_audio) localStorage.setItem('firstAudio', data.first_audio);
      if (data.tts_duration !== undefined) localStorage.setItem('firstTtsDuration', String(data.tts_duration));
    } catch {
      setError('Failed to upload resume. Ensure your session is active.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg bg-mesh-teal flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-teal/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber/4 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl animate-fade-in-up space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Upload Resume</h1>
          <p className="text-surface-muted">We'll cross-reference your experience with the JD to tailor your interview</p>
        </div>

        {!uploadData ? (
          <div className="card p-6 space-y-5">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer
                ${isDragging ? 'border-teal bg-teal-soft' : 'border-white/10 hover:border-teal/40 hover:bg-white/[0.02]'}`}
            >
              <input type="file" id="file-upload" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center gap-4 cursor-pointer">
                {file ? (
                  <>
                    <FileText className="w-14 h-14 text-teal animate-float" />
                    <div className="text-center">
                      <p className="text-white font-semibold">{file.name}</p>
                      <p className="text-surface-muted text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <UploadIcon className="w-7 h-7 text-surface-muted" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-white font-semibold">Drag & drop your resume</p>
                      <p className="text-surface-muted text-sm">or click to browse</p>
                      <div className="flex gap-2 justify-center pt-2">
                        {['PDF', 'DOCX'].map((t) => (
                          <span key={t} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-surface-muted font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
            )}

            {file && (
              <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full py-3.5">
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Resume...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Extract Skills & Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in-up">
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-4 pb-5 border-b border-white/[0.07]">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Resume Analyzed</h2>
                  <p className="text-surface-muted text-sm">Profile linked to your session</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-surface-muted uppercase tracking-widest mb-3">Extracted Skills</p>
                <div className="flex flex-wrap gap-2">
                  {uploadData.skills.length > 0 ? (
                    uploadData.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-teal-soft border border-teal/25 text-teal text-sm font-medium">{skill}</span>
                    ))
                  ) : (
                    <span className="text-surface-muted text-sm italic">Skills extracted. Ready to begin.</span>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => navigate('/interview')} className="btn-primary w-full py-3.5 text-base">
              Begin Interview <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <div className="step-done" />
          <div className="h-px w-8 bg-teal/60" />
          <div className="step-active" />
          <div className="h-px w-8 bg-white/10" />
          <div className="step-idle" />
        </div>
      </div>
    </div>
  );
}
