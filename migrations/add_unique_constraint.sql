-- Add unique constraint for upsert to work correctly
-- This ensures each student can only have one response per scenario per access code
-- and allows the upsert operation to handle re-submissions gracefully
-- NOTE: Run this only once. If constraint already exists, skip this.

ALTER TABLE responses
ADD CONSTRAINT responses_unique_submission
UNIQUE (access_code_id, student_name, scenario_number);
