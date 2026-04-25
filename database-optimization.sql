-- Database Optimization for Live Student Dashboard
-- This script adds indexes, materialized views, and triggers for optimal performance

-- 1. Add composite index for efficient student completion tracking
CREATE INDEX IF NOT EXISTS idx_responses_student_completion
ON responses(access_code_id, scenario_number);

-- 2. Add index for created_at sorting in live feed
CREATE INDEX IF NOT EXISTS idx_responses_created_at
ON responses(created_at DESC);

-- 3. Create materialized view for student status tracking (refreshes efficiently)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_status AS
SELECT
  access_code_id,
  student_name,
  COUNT(DISTINCT scenario_number) as completed_scenarios,
  MAX(created_at) as last_activity,
  CASE
    WHEN COUNT(DISTINCT scenario_number) = 5 THEN 'completed'
    ELSE 'active'
  END as status
FROM responses
GROUP BY access_code_id, student_name;

-- 4. Create unique index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_student_status
ON mv_student_status(access_code_id, student_name);

-- 5. Function to refresh materialized view concurrently
CREATE OR REPLACE FUNCTION refresh_student_status()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_status;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-refresh after response insert
CREATE OR REPLACE FUNCTION trigger_refresh_student_status()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_status;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-refresh materialized view
DROP TRIGGER IF EXISTS trg_refresh_student_status ON responses;
CREATE TRIGGER trg_refresh_student_status
AFTER INSERT ON responses
FOR EACH ROW
EXECUTE FUNCTION trigger_refresh_student_status();