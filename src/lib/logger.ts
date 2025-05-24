import pino from 'pino'
import fs from 'fs'
import path from 'path'

const isDev = process.env.NODE_ENV !== 'production'
const logDir = path.resolve(process.cwd(), 'logs')
if (isDev && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isDev
    ? {
        transport: {
          targets: [
            {
              target: 'pino/file',
              options: { destination: path.join(logDir, 'app.log'), mkdir: true }
            },
            {
              target: 'pino-pretty',
              options: { colorize: true }
            }
          ]
        }
      }
    : {}), // Em produção, não usa transport
  base: {
    env: process.env.NODE_ENV,
    service: 'crypto-trading-platform'
  },
  timestamp: pino.stdTimeFunctions.isoTime
})

export default logger 