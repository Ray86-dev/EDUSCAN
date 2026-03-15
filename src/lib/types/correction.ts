export interface TranscriptionItem {
  question_number: number;
  question_text: string;
  student_answer: string;
  legibility: "clara" | "parcial" | "ilegible";
}

export interface AIFeedback {
  strengths: string[];
  improvements: string[];
  advice: string;
}

export type GradeLabel =
  | "Insuficiente"
  | "Suficiente"
  | "Bien"
  | "Notable"
  | "Sobresaliente";

export type AIConfidence = "alta" | "media" | "baja";

export interface CorrectionResult {
  transcription: TranscriptionItem[];
  grade: number;
  grade_label: GradeLabel;
  ai_feedback: AIFeedback;
  ai_confidence: AIConfidence;
  ai_flags: string[];
  per_question_grades?: {
    question_number: number;
    grade: number;
    max_grade: number;
    reasoning: string;
  }[];
}

export interface CorrectionRow {
  id: string;
  user_id: string;
  student_id: string | null;
  activity_id: string | null;
  original_image_url: string;
  grading_mode: "simple" | "criterial";
  transcription: TranscriptionItem[];
  grade: number;
  grade_label: GradeLabel;
  ai_feedback: AIFeedback;
  ai_confidence: AIConfidence;
  ai_flags: string[];
  criteria_referenced: unknown;
  is_reviewed: boolean;
  gemini_raw_response: string | null;
  created_at: string;
  updated_at: string;
}
