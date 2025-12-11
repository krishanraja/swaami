/**
 * Centralized logging utility for Swaami
 * Provides structured logging with levels, context, and timestamps
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  sessionId?: string;
}

// Generate a session ID for tracking
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const formatLog = (entry: LogEntry): string => {
  const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
};

const createLogEntry = (level: LogLevel, message: string, context?: LogContext): LogEntry => ({
  level,
  message,
  context,
  timestamp: new Date().toISOString(),
  sessionId,
});

export const logger = {
  debug: (message: string, context?: LogContext) => {
    const entry = createLogEntry('debug', message, context);
    console.log(formatLog(entry));
    return entry;
  },

  info: (message: string, context?: LogContext) => {
    const entry = createLogEntry('info', message, context);
    console.info(formatLog(entry));
    return entry;
  },

  warn: (message: string, context?: LogContext) => {
    const entry = createLogEntry('warn', message, context);
    console.warn(formatLog(entry));
    return entry;
  },

  error: (message: string, context?: LogContext) => {
    const entry = createLogEntry('error', message, context);
    console.error(formatLog(entry));
    return entry;
  },

  critical: (message: string, context?: LogContext) => {
    const entry = createLogEntry('critical', message, context);
    console.error(`🚨 CRITICAL: ${formatLog(entry)}`);
    return entry;
  },

  // Track user actions
  action: (action: string, details?: LogContext) => {
    return logger.info(`User action: ${action}`, { ...details, type: 'user_action' });
  },

  // Track API calls
  api: (method: string, endpoint: string, details?: LogContext) => {
    return logger.info(`API ${method} ${endpoint}`, { ...details, type: 'api_call' });
  },

  // Track errors with stack traces
  exception: (error: Error, context?: LogContext) => {
    return logger.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
      type: 'exception',
    });
  },

  getSessionId: () => sessionId,
};

export default logger;
