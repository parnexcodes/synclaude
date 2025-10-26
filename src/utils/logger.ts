export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level: LogLevel;
  verbose?: boolean;
  quiet?: boolean;
}

export class Logger {
  private level: LogLevel;
  private verbose: boolean;
  private quiet: boolean;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.verbose = options.verbose || false;
    this.quiet = options.quiet || false;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.quiet && level !== 'error') {
      return false;
    }

    if (this.verbose) {
      return true;
    }

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): [string, ...any[]] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (args.length > 0) {
      return [`${prefix} ${message}`, ...args];
    }

    return [`${prefix} ${message}`];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      const [formattedMessage, ...formattedArgs] = this.formatMessage('debug', message, ...args);
      console.debug(formattedMessage, ...formattedArgs);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const [formattedMessage, ...formattedArgs] = this.formatMessage('info', message, ...args);
      console.info(formattedMessage, ...formattedArgs);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      const [formattedMessage, ...formattedArgs] = this.formatMessage('warn', message, ...args);
      console.warn(formattedMessage, ...formattedArgs);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const [formattedMessage, ...formattedArgs] = this.formatMessage('error', message, ...args);
      console.error(formattedMessage, ...formattedArgs);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  setQuiet(quiet: boolean): void {
    this.quiet = quiet;
  }
}

let globalLogger: Logger | null = null;

export function setupLogging(verbose = false, quiet = false): void {
  let level: LogLevel = 'info';

  if (quiet) {
    level = 'error';
  } else if (verbose) {
    level = 'debug';
  }

  globalLogger = new Logger({ level, verbose, quiet });
}

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger({ level: 'info' });
  }
  return globalLogger;
}

// Export convenience functions
export const logger = getLogger();

export const log = {
  debug: (message: string, ...args: any[]) => getLogger().debug(message, ...args),
  info: (message: string, ...args: any[]) => getLogger().info(message, ...args),
  warn: (message: string, ...args: any[]) => getLogger().warn(message, ...args),
  error: (message: string, ...args: any[]) => getLogger().error(message, ...args),
};