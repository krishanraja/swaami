/**
 * Swaami Diagnostics Library
 * 
 * Provides runtime validation, structured logging, and health checks
 * to prevent silent failures and aid in debugging production issues.
 * 
 * Usage:
 * - Import and call validateEnvironment() on app startup
 * - Use DiagnosticLogger for structured logging in critical paths
 * - Call checkDemoDataAvailability() to verify demo data state
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// Types
// ============================================================================

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface HealthCheckResult {
  overall: "healthy" | "degraded" | "unhealthy";
  checks: {
    supabase: DiagnosticResult;
    demoData: DiagnosticResult;
    auth: DiagnosticResult;
  };
  timestamp: string;
}

export interface TimingLog {
  operation: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  success?: boolean;
  error?: string;
}

// ============================================================================
// Environment Validation
// ============================================================================

const REQUIRED_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
] as const;

/**
 * Validates that all required environment variables are set.
 * Logs warnings for missing variables - does not throw.
 */
export function validateEnvironment(): DiagnosticResult {
  const missing: string[] = [];
  const present: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = import.meta.env[envVar];
    if (!value || value === "undefined" || value === "") {
      missing.push(envVar);
    } else {
      present.push(envVar);
    }
  }

  const success = missing.length === 0;
  const message = success
    ? `All ${REQUIRED_ENV_VARS.length} required environment variables are set`
    : `Missing environment variables: ${missing.join(", ")}`;

  if (!success) {
    console.error("[Diagnostics] Environment validation failed:", {
      missing,
      present,
    });
  } else {
    console.log("[Diagnostics] Environment validation passed");
  }

  return {
    success,
    message,
    details: { missing, present },
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Network Health Check
// ============================================================================

/**
 * Checks if Supabase is reachable before critical operations.
 * Uses a simple health check query with timeout.
 */
export async function checkSupabaseHealth(
  timeoutMs: number = 5000
): Promise<DiagnosticResult> {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Simple query to check connectivity
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    const durationMs = Math.round(performance.now() - startTime);

    if (error) {
      return {
        success: false,
        message: `Supabase query failed: ${error.message}`,
        details: { durationMs, error: error.message },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: `Supabase healthy (${durationMs}ms)`,
      details: { durationMs },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = err instanceof Error ? err.message : "Unknown error";

    return {
      success: false,
      message: message.includes("abort")
        ? `Supabase health check timed out after ${timeoutMs}ms`
        : `Supabase health check failed: ${message}`,
      details: { durationMs, error: message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Demo Data Availability Check
// ============================================================================

export interface DemoDataStatus {
  profileCount: number;
  taskCount: number;
  hasValidLocations: boolean;
  message: string;
}

/**
 * Checks if demo data is available and properly configured.
 * Returns counts and location validity status.
 */
export async function checkDemoDataAvailability(): Promise<DiagnosticResult> {
  const startTime = performance.now();

  try {
    // Count demo profiles
    const { count: profileCount, error: profileError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_demo", true);

    if (profileError) {
      return {
        success: false,
        message: `Failed to count demo profiles: ${profileError.message}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Count demo tasks with open status
    const { data: demoProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_demo", true);

    if (!demoProfiles || demoProfiles.length === 0) {
      return {
        success: false,
        message: "No demo profiles found. Run the seed-demo-users edge function.",
        details: { profileCount: 0, taskCount: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    const demoProfileIds = demoProfiles.map((p) => p.id);

    const { count: taskCount, error: taskError } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("owner_id", demoProfileIds)
      .eq("status", "open");

    if (taskError) {
      return {
        success: false,
        message: `Failed to count demo tasks: ${taskError.message}`,
        details: { profileCount },
        timestamp: new Date().toISOString(),
      };
    }

    // Check if tasks have valid locations
    const { data: tasksWithLocation } = await supabase
      .from("tasks")
      .select("id, location_lat, location_lng")
      .in("owner_id", demoProfileIds)
      .not("location_lat", "is", null)
      .not("location_lng", "is", null)
      .limit(1);

    const hasValidLocations = (tasksWithLocation?.length ?? 0) > 0;
    const durationMs = Math.round(performance.now() - startTime);

    const status: DemoDataStatus = {
      profileCount: profileCount ?? 0,
      taskCount: taskCount ?? 0,
      hasValidLocations,
      message:
        (taskCount ?? 0) > 0
          ? `Demo data ready: ${profileCount} profiles, ${taskCount} open tasks`
          : `Demo data incomplete: ${profileCount} profiles but no open tasks`,
    };

    const success = (profileCount ?? 0) > 0 && (taskCount ?? 0) > 0;

    if (!success) {
      console.warn("[Diagnostics] Demo data issue:", status);
    } else {
      console.log("[Diagnostics] Demo data check passed:", status);
    }

    return {
      success,
      message: status.message,
      details: { ...status, durationMs },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      message: `Demo data check failed: ${message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Auth Flow Timing Logger
// ============================================================================

class AuthFlowLogger {
  private timings: TimingLog[] = [];
  private flowStartTime: number | null = null;

  startFlow(): void {
    this.flowStartTime = performance.now();
    this.timings = [];
    console.log("[AuthFlow] Starting auth flow timing...");
  }

  startOperation(operation: string): TimingLog {
    const log: TimingLog = {
      operation,
      startTime: performance.now(),
    };
    this.timings.push(log);
    return log;
  }

  endOperation(log: TimingLog, success: boolean, error?: string): void {
    log.endTime = performance.now();
    log.durationMs = Math.round(log.endTime - log.startTime);
    log.success = success;
    log.error = error;

    const status = success ? "✓" : "✗";
    const errorMsg = error ? ` - ${error}` : "";
    console.log(
      `[AuthFlow] ${status} ${log.operation}: ${log.durationMs}ms${errorMsg}`
    );
  }

  endFlow(): void {
    if (!this.flowStartTime) return;

    const totalDuration = Math.round(performance.now() - this.flowStartTime);
    const failedOps = this.timings.filter((t) => !t.success);

    console.log("[AuthFlow] Flow complete:", {
      totalDurationMs: totalDuration,
      operations: this.timings.length,
      failed: failedOps.length,
      breakdown: this.timings.map((t) => ({
        op: t.operation,
        ms: t.durationMs,
        ok: t.success,
      })),
    });

    if (totalDuration > 5000) {
      console.warn(
        `[AuthFlow] SLOW: Auth flow took ${totalDuration}ms (target: <3000ms)`
      );
    }
  }

  getTimings(): TimingLog[] {
    return [...this.timings];
  }
}

export const authFlowLogger = new AuthFlowLogger();

// ============================================================================
// Diagnostic Logger (Structured)
// ============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

class DiagnosticLogger {
  private enabled: boolean;
  private buffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    // Enable in development or when explicitly set
    this.enabled =
      import.meta.env.DEV ||
      localStorage.getItem("swaami_diagnostics") === "true";
  }

  private log(
    level: LogLevel,
    component: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level,
      component,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Add to buffer for later retrieval
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    if (!this.enabled && level !== "error") return;

    const prefix = `[${component}]`;
    const logData = data ? [message, data] : [message];

    switch (level) {
      case "debug":
        console.debug(prefix, ...logData);
        break;
      case "info":
        console.log(prefix, ...logData);
        break;
      case "warn":
        console.warn(prefix, ...logData);
        break;
      case "error":
        console.error(prefix, ...logData);
        break;
    }
  }

  debug(component: string, message: string, data?: Record<string, unknown>): void {
    this.log("debug", component, message, data);
  }

  info(component: string, message: string, data?: Record<string, unknown>): void {
    this.log("info", component, message, data);
  }

  warn(component: string, message: string, data?: Record<string, unknown>): void {
    this.log("warn", component, message, data);
  }

  error(component: string, message: string, data?: Record<string, unknown>): void {
    this.log("error", component, message, data);
  }

  /**
   * Get all buffered log entries for debugging
   */
  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  /**
   * Export buffer as JSON for bug reports
   */
  exportLogs(): string {
    return JSON.stringify(this.buffer, null, 2);
  }

  /**
   * Enable/disable diagnostics at runtime
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      if (enabled) {
        localStorage.setItem("swaami_diagnostics", "true");
      } else {
        localStorage.removeItem("swaami_diagnostics");
      }
    } catch {
      // Ignore localStorage errors
    }
  }
}

export const diagnosticLogger = new DiagnosticLogger();

// ============================================================================
// Full Health Check
// ============================================================================

/**
 * Runs all health checks and returns aggregated status.
 * Call this from admin page or on-demand for debugging.
 */
export async function runFullHealthCheck(): Promise<HealthCheckResult> {
  const envCheck = validateEnvironment();
  const supabaseCheck = await checkSupabaseHealth();
  const demoDataCheck = await checkDemoDataAvailability();

  // Determine overall health
  let overall: HealthCheckResult["overall"] = "healthy";
  if (!envCheck.success || !supabaseCheck.success) {
    overall = "unhealthy";
  } else if (!demoDataCheck.success) {
    overall = "degraded";
  }

  return {
    overall,
    checks: {
      supabase: supabaseCheck,
      demoData: demoDataCheck,
      auth: envCheck, // Using env check as proxy for auth config
    },
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Run on app startup to validate environment and log any issues.
 * Non-blocking - just logs warnings.
 */
export function initDiagnostics(): void {
  console.log("[Diagnostics] Initializing...");
  validateEnvironment();

  // Async checks in background
  checkSupabaseHealth().then((result) => {
    if (!result.success) {
      console.warn("[Diagnostics] Supabase health check failed:", result.message);
    }
  });
}
