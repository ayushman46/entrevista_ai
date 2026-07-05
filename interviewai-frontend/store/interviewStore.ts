import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ResumeData, InterviewQuestion, FinalReport, InterviewStatus, RoleType
} from "@/types/interview";

interface InterviewStore {
  // Resume state
  resumeId: string | null;
  resumeData: ResumeData | null;
  interviewTopics: string[];

  // Interview state
  interviewId: string | null;
  status: InterviewStatus;
  role: RoleType;
  candidateName: string;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  totalPlanned: number;

  // Report
  finalReport: FinalReport | null;

  // Actions
  setResume: (id: string, data: ResumeData, topics: string[]) => void;
  setRole: (role: RoleType) => void;
  setCandidateName: (name: string) => void;
  startInterview: (id: string, firstQuestion: string, topic: string, total: number, audioUrl?: string) => void;
  addQuestion: (question: string, topic: string, expectedConcepts: string[], audioUrl?: string) => void;
  recordAnswer: (index: number, answer: string, evaluation?: EvaluationResult) => void;
  setQuestionIndex: (index: number) => void;
  setStatus: (status: InterviewStatus) => void;
  setFinalReport: (report: FinalReport) => void;
  reset: () => void;
}

const initialState = {
  resumeId: null,
  resumeData: null,
  interviewTopics: [],
  interviewId: null,
  status: "idle" as InterviewStatus,
  role: "sde_intern" as RoleType,
  candidateName: "",
  currentQuestionIndex: 0,
  questions: [],
  totalPlanned: 6,
  finalReport: null,
};

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      ...initialState,
      setResume: (id, data, topics) =>
        set({ resumeId: id, resumeData: data, interviewTopics: topics }),
      setRole: (role) => set({ role }),
      setCandidateName: (candidateName) => set({ candidateName }),
      startInterview: (id, firstQuestion, topic, total, audioUrl) =>
        set({
          interviewId: id,
          status: "active",
          totalPlanned: total,
          questions: [{ question: firstQuestion, topic, audioUrl }],
          currentQuestionIndex: 0,
        }),
      addQuestion: (question, topic, expectedConcepts, audioUrl) =>
        set((state) => ({
          questions: [...state.questions, { question, topic, expectedConcepts, audioUrl }],
        })),
      recordAnswer: (index, answer, evaluation) =>
        set((state) => ({
          questions: state.questions.map((q, i) =>
            i === index ? { ...q, answer, evaluation } : q
          ),
        })),
      setQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      setStatus: (status) => set({ status }),
      setFinalReport: (report) => set({ finalReport: report, status: "completed" }),
      reset: () => set(initialState),
    }),
    {
      name: "interviewai-session",
      partialize: (state) => ({
        resumeId: state.resumeId,
        interviewId: state.interviewId,
        role: state.role,
        candidateName: state.candidateName,
        questions: state.questions,
        status: state.status,
        currentQuestionIndex: state.currentQuestionIndex,
      }),
    }
  )
);
