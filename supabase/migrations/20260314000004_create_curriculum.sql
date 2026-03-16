-- Curriculum subjects (parsed LOMLOE curriculum documents)
CREATE TABLE IF NOT EXISTS curriculum_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL,
  course text,
  subject_name text NOT NULL,
  source_filename text,
  parsed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parsed_at timestamptz DEFAULT now()
);

ALTER TABLE curriculum_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own curriculum subjects"
  ON curriculum_subjects FOR ALL
  USING (auth.uid() = parsed_by)
  WITH CHECK (auth.uid() = parsed_by);

-- Curriculum competencies (competencias especificas)
CREATE TABLE IF NOT EXISTS curriculum_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  sort_order int DEFAULT 0
);

ALTER TABLE curriculum_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage competencies for their subjects"
  ON curriculum_competencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM curriculum_subjects cs
      WHERE cs.id = curriculum_competencies.subject_id
      AND cs.parsed_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM curriculum_subjects cs
      WHERE cs.id = curriculum_competencies.subject_id
      AND cs.parsed_by = auth.uid()
    )
  );

-- Curriculum criteria (criterios de evaluacion)
CREATE TABLE IF NOT EXISTS curriculum_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id uuid NOT NULL REFERENCES curriculum_competencies(id) ON DELETE CASCADE,
  code text NOT NULL,
  full_code text,
  description text NOT NULL,
  descriptors text[] DEFAULT '{}',
  sort_order int DEFAULT 0
);

ALTER TABLE curriculum_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage criteria for their competencies"
  ON curriculum_criteria FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM curriculum_competencies cc
      JOIN curriculum_subjects cs ON cs.id = cc.subject_id
      WHERE cc.id = curriculum_criteria.competency_id
      AND cs.parsed_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM curriculum_competencies cc
      JOIN curriculum_subjects cs ON cs.id = cc.subject_id
      WHERE cc.id = curriculum_criteria.competency_id
      AND cs.parsed_by = auth.uid()
    )
  );

-- Add FK from activities to curriculum_subjects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'activities_curriculum_subject_id_fkey'
  ) THEN
    ALTER TABLE activities
      ADD CONSTRAINT activities_curriculum_subject_id_fkey
      FOREIGN KEY (curriculum_subject_id) REFERENCES curriculum_subjects(id) ON DELETE SET NULL;
  END IF;
END $$;
