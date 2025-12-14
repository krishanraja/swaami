import { useState, useCallback } from "react";

/**
 * Hook for retrying failed operations with exponential backoff
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
) {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async () => {
    setError(null);
    setRetryCount(0);
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        setRetrying(i > 0);
        const result = await fn();
        setRetrying(false);
        return result;
      } catch (err) {
        setRetryCount(i + 1);
        if (i === maxRetries - 1) {
          const finalError = err instanceof Error ? err : new Error('Operation failed');
          setError(finalError);
          setRetrying(false);
          throw finalError;
        }
        setRetrying(true);
        // Exponential backoff: delay * 2^i
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }, [fn, maxRetries, delay]);

  const reset = useCallback(() => {
    setError(null);
    setRetrying(false);
    setRetryCount(0);
  }, []);

  return { execute, retrying, error, retryCount, reset };
}

