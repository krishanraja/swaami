/**
 * Timeout utility for async operations
 * Provides a proper timeout that actually rejects when time expires
 */

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout that actually rejects when time expires.
 * Unlike setTimeout-based patterns that only update UI state, this will
 * cause the Promise.race to reject, allowing catch blocks to execute.
 * 
 * @param promiseOrPromiseLike - The promise or PromiseLike to wrap (supports Supabase query builders)
 * @param ms - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs
 * @returns The result of the promise if it resolves before timeout
 * @throws TimeoutError if the promise doesn't resolve within the timeout
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await withTimeout(
 *     fetchUserProfile(),
 *     10000,
 *     "Profile fetch timed out. Please try again."
 *   );
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     // Handle timeout specifically
 *   }
 * }
 * ```
 */
export async function withTimeout<T>(
  promiseOrPromiseLike: Promise<T> | PromiseLike<T>,
  ms: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  // Convert PromiseLike to Promise to ensure full Promise interface
  const promise = Promise.resolve(promiseOrPromiseLike);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage, ms));
    }, ms);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Creates a timeout-wrapped version of a function.
 * Useful for wrapping async functions that should always have a timeout.
 * 
 * @param fn - The async function to wrap
 * @param ms - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs (or a function that generates it)
 * @returns A new function with the same signature but with timeout protection
 * 
 * @example
 * ```typescript
 * const fetchWithTimeout = withTimeoutWrapper(
 *   (userId: string) => supabase.from('profiles').select().eq('user_id', userId),
 *   10000,
 *   "Database query timed out"
 * );
 * ```
 */
export function withTimeoutWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  ms: number,
  errorMessage: string | ((...args: TArgs) => string)
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const message = typeof errorMessage === 'function' 
      ? errorMessage(...args) 
      : errorMessage;
    return withTimeout(fn(...args), ms, message);
  };
}

/**
 * Default timeout values for different operation types
 */
export const TIMEOUT_MS = {
  /** Quick operations like auth checks */
  FAST: 5000,
  /** Standard database operations */
  NORMAL: 10000,
  /** Slow operations like file uploads or complex queries */
  SLOW: 30000,
  /** Background operations that can take longer */
  BACKGROUND: 60000,
} as const;
