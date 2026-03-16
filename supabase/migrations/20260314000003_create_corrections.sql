-- Corrections table (central table for exam corrections)
CREATE TABLE IF NOT EXISTS corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid,
  activity_id uuid,
  original_image_url text,
  grading_mode text NOT NULL DEFAULT 'simple' CHECK (grading_mode IN ('simple', 'criterial')),
  transcription jsonb,
  grade numeric(3,1) CHECK (grade >= 0 AND grade <= 10),
  grade_label text,
  ai_feedback jsonb,
  ai_confidence text CHECK (ai_confidence IN ('alta', 'media', 'baja')),
  ai_flags text[] DEFAULT '{}',
  per_question_grades jsonb,
  criteria_referenced jsonb,
  is_reviewed boolean DEFAULT false,
  teacher_modified boolean DEFAULT false,
  gemini_raw_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own corrections"
  ON corrections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_corrections_user_id ON corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_corrections_student_id ON corrections(student_id);
CREATE INDEX IF NOT EXISTS idx_corrections_activity_id ON corrections(activity_id);
CREATE INDEX IF NOT EXISTS idx_corrections_created_at ON corrections(created_at DESC);

-- Criterion grades (breakdown for criterial mode)
CREATE TABLE IF NOT EXISTS criterion_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correction_id uuid NOT NULL REFERENCES corrections(id) ON DELETE CASCADE,
  criterion_code text NOT NULL,
  criterion_text text,
  grade numeric(3,1) CHECK (grade >= 0 AND grade <= 10),
  evidence text,
  weight numeric(3,2) DEFAULT 1.00
);

ALTER TABLE criterion_grades ENABLE ROW LEVEL SECURITY;

-- RLS via join to corrections (user owns the correction)
CREATE POLICY "Users can manage criterion grades for their corrections"
  ON criterion_grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM corrections c
      WHERE c.id = criterion_grades.correction_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corrections c
      WHERE c.id = criterion_grades.correction_id
      AND c.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_criterion_grades_correction ON criterion_grades(correction_id);
