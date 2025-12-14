-- Migration: Create atomic help_with_task function
-- Fixes: F-002 - Non-atomic task matching operation

-- Create function to atomically create match and update task
CREATE OR REPLACE FUNCTION help_with_task(
  p_task_id UUID,
  p_helper_id UUID
) RETURNS TABLE(match_id UUID) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
  v_task_status TEXT;
BEGIN
  -- Check if task exists and is still open
  SELECT status INTO v_task_status
  FROM tasks
  WHERE id = p_task_id
  FOR UPDATE; -- Lock the row for update

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task_status != 'open' THEN
    RAISE EXCEPTION 'Task is no longer available (status: %)', v_task_status;
  END IF;

  -- Check if there's already an active match for this task
  IF EXISTS (
    SELECT 1 FROM matches 
    WHERE task_id = p_task_id 
    AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Task is already matched to another helper';
  END IF;

  -- Create match
  INSERT INTO matches (task_id, helper_id, status)
  VALUES (p_task_id, p_helper_id, 'accepted')
  RETURNING id INTO v_match_id;

  -- Update task status (atomic within transaction)
  UPDATE tasks 
  SET status = 'matched', helper_id = p_helper_id, updated_at = now()
  WHERE id = p_task_id;

  RETURN QUERY SELECT v_match_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION help_with_task(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION help_with_task IS 
'Atomically creates a match and updates task status. Prevents race conditions and ensures data consistency.';

