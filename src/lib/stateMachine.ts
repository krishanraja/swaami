/**
 * State machine validation for task and match status transitions
 * Prevents invalid state transitions
 */

export const TASK_STATUS_TRANSITIONS: Record<string, string[]> = {
  'open': ['matched', 'cancelled'],
  'matched': ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': []
};

export const MATCH_STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['accepted', 'cancelled'],
  'accepted': ['arrived', 'cancelled'],
  'arrived': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': []
};

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  transitions: Record<string, string[]>
): boolean {
  const allowedTransitions = transitions[currentStatus];
  if (!allowedTransitions) {
    return false;
  }
  return allowedTransitions.includes(newStatus);
}

/**
 * Get error message for invalid transition
 */
export function getInvalidTransitionError(
  currentStatus: string,
  newStatus: string,
  entityType: 'task' | 'match' = 'task'
): string {
  return `Invalid ${entityType} status transition: ${currentStatus} → ${newStatus}`;
}

