import type { AnswerResponse, InterviewStartResponse, FinalReport, ResumeUploadResponse } from "@/types/interview";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API request failed");
  }
  return res.json();
}

export const api = {
  async uploadResume(file: File): Promise<ResumeUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/resume/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Resume upload failed");
    return res.json();
  },

  async startInterview(resumeId: string, role: string, candidateName: string): Promise<InterviewStartResponse> {
    return request<InterviewStartResponse>("/interview/start", {
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId, role, candidate_name: candidateName }),
    });
  },

  async submitAnswer(interviewId: string, questionIndex: number, answerText: string): Promise<AnswerResponse> {
    return request<AnswerResponse>("/interview/answer", {
      method: "POST",
      body: JSON.stringify({
        interview_id: interviewId,
        question_index: questionIndex,
        answer_text: answerText,
      }),
    });
  },

  async getInterview(interviewId: string): Promise<any> {
    return request<any>(`/interview/${interviewId}`);
  },

  async completeInterview(interviewId: string): Promise<FinalReport> {
    return request<FinalReport>(`/interview/complete/${interviewId}`, { method: "POST" });
  },

  async resumeInterview(interviewId: string): Promise<any> {
    return request<any>(`/interview/resume/${interviewId}`, { method: "POST" });
  },

  async getAnalytics(interviewId: string): Promise<any> {
    return request<any>(`/report/${interviewId}/analytics`);
  },
};
