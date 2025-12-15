/**
 * Retry utility for database operations
 * Implements exponential backoff with jitter
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  retryableErrors: [
    'network',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'connection',
  ],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorString = errorMessage || '';
  
  return retryableErrors.some(pattern => errorString.includes(pattern.toLowerCase()));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  const delay = Math.min(exponentialDelay, options.maxDelayMs);
  // Add jitter (±20%)
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        break;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, opts);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry a Supabase operation with exponential backoff
 */
export async function retrySupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  return retry(async () => {
    const result = await operation();
    
    // If there's an error, throw it so retry can catch it
    if (result.error) {
      throw new Error(result.error.message || 'Database operation failed');
    }
    
    return result;
  }, {
    ...options,
    retryableErrors: [
      ...(options.retryableErrors || DEFAULT_OPTIONS.retryableErrors),
      'violates row-level security',
      'connection',
      'timeout',
    ],
  });
}

