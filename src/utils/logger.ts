/**
 * Development-only logger utility
 * In production, all logging is disabled to reduce noise and improve performance
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args)
    }
  },

  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args)
    }
  },
}
