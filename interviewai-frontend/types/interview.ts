export interface ResumeData {
  name: string;
  email: string;
  skills: string[];
  technologies: string[];
  projects: Array<{ name: string; description: string; tech_stack: string[] }>;
  experience: Array<{ company: string; role: string; duration: string }>;
  summary: string;
}

export interface ResumeUploadResponse {
  resume_id: string;
  resume_data: ResumeData;
  interview_topics: string[];
  message: string;
}

export type RoleType =
  | "sde_intern"
  | "frontend_developer"
  | "backend_developer"
  | "fullstack_developer"
  | "data_analyst";

export interface InterviewStartResponse {
  interview_id: string;
  first_question: string;
  topic: string;
  difficulty: string;
  total_planned_questions: number;
}

export interface EvaluationResult {
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  answer_quality: "Excellent" | "Good" | "Fair" | "Poor";
  missing_concepts: string[];
  follow_up_required: boolean;
  difficulty_change: "increase" | "maintain" | "decrease";
  topic: string;
  next_question: string;
  feedback: string;
}

export interface AnswerResponse {
  evaluation: EvaluationResult;
  interview_complete: boolean;
  next_question: string | null;
  question_index: number;
}

export interface InterviewQuestion {
  question: string;
  topic: string;
  answer?: string;
  evaluation?: EvaluationResult;
  expectedConcepts?: string[];
}

export interface FinalReport {
  interview_id: string;
  candidate_name: string;
  role: string;
  date: string;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  strengths: string[];
  weaknesses: string[];
  learning_roadmap: string[];
  hiring_recommendation: string;
  summary: string;
  pdf_url?: string;
}

export type InterviewStatus = "idle" | "uploading" | "planning" | "active" | "evaluating" | "completed";
