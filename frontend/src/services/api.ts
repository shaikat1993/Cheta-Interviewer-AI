/**
 * services/api.ts
 * 
 * Centralized API singleton for communication with the FastAPI backend.
 * Provides strongly annotated TS interfaces and wrapper functions for all endpoints.
 */
/// <reference types="vite/client" />
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface ResumeUploadResponse {
  skills: string[];
  experience_level: string;
  session_id?: string;
  first_question?: string;
  first_audio?: string;
  tts_duration?: number;
}

export interface TranscribeAudioResponse {
  transcript: string;
  stt_duration?: number;
}

export interface SubmitAnswerResponse {
  final_score: number;
  technical: number;
  depth: number;
  clarity: number;
  confidence: number;
  improvement: string;
  next_question: string;
  audio_base64?: string;
  tts_duration?: number;
  evaluation_duration?: number;
}

export interface ReportData {
  overall_score: number;
  technical: number;
  depth: number;
  clarity: number;
  confidence: number;
  skills_analysis: Array<{ skill: string; score: number }>;
  improvements: string[];
  strengths: string[];
  detailed_log?: Array<{
    question_number: number;
    skill: string;
    question: string;
    answer: string;
    evaluation: { overall_rating?: number; improvements?: string; [key: string]: unknown };
  }>;
}

export const api = {
  /**
   * Initializes a session by analyzing the provided Job Description.
   */
  async submitJD(jdText: string): Promise<{ session_id: string; role?: string; company?: string }> {
    const response = await fetch(`${API_BASE_URL}/submit-jd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jd: jdText }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit Job Description');
    }

    return response.json();
  },

  /**
   * Uploads the candidate's parsed resume buffer to attach it to the session.
   * Returns the initial interview question and its synthesized audio.
   */
  
  async uploadResume(file: File, sessionId?: string): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await fetch(`${API_BASE_URL}/upload-resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload resume');
    }

    return response.json();
  },

  /**
   * Sends the user's recorded audio blob to the backend Whisper service 
   * to get an accurate text transcript.
   */
  async transcribeAudio(audioBlob: Blob, sessionId?: string): Promise<TranscribeAudioResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'answer.wav');
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await fetch(`${API_BASE_URL}/transcribe-audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }

    return response.json();
  },

  /**
   * Submits the confirmed text answer for LLM evaluation.
   * Returns the score and the *next* context-aware question.
   */
  async submitAnswer(transcript: string, sessionId?: string): Promise<SubmitAnswerResponse> {
    const formData = new FormData();
    formData.append('transcript', transcript);
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await fetch(`${API_BASE_URL}/submit-answer`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }

    return response.json();
  },

  /**
   * Generates the final performance report containing aggregated graph metrics,
   * detailed QA logs, and constructive feedback.
   */
  async generateReport(sessionId?: string): Promise<ReportData> {
    const url = sessionId
      ? `${API_BASE_URL}/generate-report?session_id=${sessionId}`
      : `${API_BASE_URL}/generate-report`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return response.json();
  },
};
