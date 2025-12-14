-- Migration: Prevent multiple active matches per task
-- Fixes: F-001 - Race condition where multiple users can help same task

-- Add unique constraint for active matches (excluding cancelled)
-- Note: PostgreSQL partial unique indexes require a WHERE clause
CREATE UNIQUE INDEX unique_active_match_per_task 
ON matches (task_id) 
WHERE status != 'cancelled';

-- Add comment explaining the constraint
COMMENT ON INDEX unique_active_match_per_task IS 
'Prevents multiple active matches per task, ensuring only one helper can be matched to a task at a time';

