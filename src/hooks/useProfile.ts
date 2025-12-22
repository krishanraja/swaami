import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { retrySupabaseOperation } from "@/lib/retry";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  neighbourhood: string | null;
  radius: number;
  skills: string[];
  availability: string;
  credits: number;
  tasks_completed: number;
  reliability_score: number;
  trust_tier: "tier_0" | "tier_1" | "tier_2" | null;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
}

// Type guard for Supabase-like error objects
interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
}

function isSupabaseError(err: unknown): err is SupabaseErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('code' in err || 'message' in err || 'details' in err)
  );
}

// Extended Error type with code property
interface ErrorWithCode extends Error {
  code?: string;
}

// Timeout wrapper for async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), timeoutMs)
    ),
  ]);
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  initialDelayMs: number
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's the last attempt, throw
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      const delay = initialDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error("Retry failed");
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // KEY FIX: Depend on stable values, not user object reference
  // This prevents refetching when onAuthStateChange fires with same user but new object
  const userId = user?.id;
  const userDisplayName = user?.user_metadata?.display_name as string | null | undefined;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Retry logic with exponential backoff: 3 attempts with 1s, 2s, 4s delays
        const profileData = await retryWithBackoff(async () => {
          const { data, error } = await withTimeout(
            supabase
              .from("profiles")
              .select("*")
              .eq("user_id", userId)
              .single(),
            10000 // 10 second timeout
          );

          // If profile not found (PGRST116 = no rows returned), try to create it
          if (error && error.code === "PGRST116") {
            // Profile doesn't exist - create it as fallback
            // This handles race condition where trigger hasn't run yet
            const { data: newProfile, error: createError } = await withTimeout(
              supabase
                .from("profiles")
                .insert({
                  user_id: userId,
                  display_name: userDisplayName || null,
                })
                .select()
                .single(),
              10000
            );

            if (createError) {
              // If creation fails, it might be a race condition - wait a bit and retry fetch
              await new Promise(resolve => setTimeout(resolve, 500));
              // Retry the fetch (will be caught by retry logic)
              throw new Error("Profile not found, creation pending");
            }

            return newProfile;
          }

          if (error) {
            throw error;
          }

          return data;
        }, 3, 1000); // 3 attempts, 1s initial delay

        setProfile(profileData);
        setError(null);
      } catch (err) {
        // Extract Supabase error structure properly
        let errorMessage = "Failed to load profile";
        let errorCode: string | undefined;
        
        console.error("Profile fetch error:", err);
        
        if (isSupabaseError(err)) {
          errorCode = err.code;
          errorMessage = err.message || err.details || errorMessage;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        } else {
          errorMessage = String(err) || errorMessage;
        }
        
        const error: ErrorWithCode = new Error(errorMessage);
        if (errorCode) {
          error.code = errorCode;
        }
        
        setError(error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, userDisplayName]); // Depend on stable values, not user object

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { error: new Error("No profile") };

    // Use optimistic locking with updated_at check
    const result = await retrySupabaseOperation(async () => {
      return await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .eq("updated_at", profile.updated_at) // Optimistic locking
        .select()
        .single();
    }, {
      maxAttempts: 3,
      initialDelayMs: 200,
      retryableErrors: ['network', 'timeout', 'connection'],
    });

    if (!result.error && result.data) {
      setProfile(result.data);
    }

    return result;
  };

  // Function to manually refetch profile (useful after updates)
  const refetch = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single(),
        10000
      );

      if (error) throw error;
      setProfile(data);
      setError(null);
    } catch (err) {
      let errorMessage = "Failed to refetch profile";
      let errorCode: string | undefined;
      
      console.error("Refetch error:", err);
      
      if (isSupabaseError(err)) {
        errorCode = err.code;
        errorMessage = err.message || err.details || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = String(err) || errorMessage;
      }
      
      const error: ErrorWithCode = new Error(errorMessage);
      if (errorCode) {
        error.code = errorCode;
      }
      
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, updateProfile, refetch };
}
