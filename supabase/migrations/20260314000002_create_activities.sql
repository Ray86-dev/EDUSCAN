-- Activities table (exam/assignment definitions linked to groups)
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  criteria_codes text[] DEFAULT '{}',
  curriculum_subject_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own activities"
  ON activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activities_group ON activities(group_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

-- Add foreign keys from corrections to activities and students
-- (deferred because corrections table may have been created without these FKs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'corrections_student_id_fkey'
  ) THEN
    ALTER TABLE corrections
      ADD CONSTRAINT corrections_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'corrections_activity_id_fkey'
  ) THEN
    ALTER TABLE corrections
      ADD CONSTRAINT corrections_activity_id_fkey
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL;
  END IF;
END $$;
