-- Add unique constraint for upsert to work correctly
-- This ensures each student can only have one response per scenario per access code
-- and allows the upsert operation to handle re-submissions gracefully

ALTER TABLE responses
ADD CONSTRAINT IF NOT EXISTS responses_unique_submission
UNIQUE (access_code_id, student_name, scenario_number);
