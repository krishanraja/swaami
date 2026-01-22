/**
 * Retry utility for database operations
 * Implements exponential backoff with jitter
 */

import { getAdaptiveRetryConfig, getNetworkQuality } from './networkDetection';

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

/**
 * Network-aware retry with exponential backoff
 * Adapts retry strategy based on current network quality
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  const config = getAdaptiveRetryConfig();
  const { quality } = getNetworkQuality();

  console.log(`[Retry] Starting ${operationName} (network: ${quality}, max retries: ${config.maxRetries})`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();

      if (attempt > 0) {
        console.log(`[Retry] ${operationName} succeeded on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        console.error(`[Retry] ${operationName} failed after ${config.maxRetries + 1} attempts:`, lastError);
        throw lastError;
      }

      // Calculate exponential backoff delay with jitter
      const exponentialDelay = config.initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
      const delay = Math.min(exponentialDelay + jitter, config.maxDelay);

      console.warn(`[Retry] ${operationName} failed on attempt ${attempt + 1}, retrying in ${Math.round(delay)}ms...`, lastError.message);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Session-aware operation wrapper
 * Automatically handles session expiry errors and triggers refresh
 */
export async function withSessionRefresh<T>(
  operation: () => Promise<T>,
  refreshSession: () => Promise<boolean>,
  onSessionExpired?: () => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    // Check if this is a session/auth error
    const isSessionError = 
      errorMessage.includes('jwt') ||
      errorMessage.includes('token') ||
      errorMessage.includes('session') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401') ||
      errorMessage.includes('expired');
    
    if (isSessionError) {
      // Try to refresh the session
      const refreshed = await refreshSession();
      
      if (refreshed) {
        // Retry the operation with fresh session
        return await operation();
      } else {
        // Session refresh failed
        onSessionExpired?.();
        throw new Error('Session expired. Please sign in again.');
      }
    }
    
    // Not a session error, re-throw
    throw error;
  }
}

