import pino from 'pino'
import fs from 'fs'
import path from 'path'

// Garante que a pasta de logs existe
const logDir = path.resolve(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
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
  },
  base: {
    env: process.env.NODE_ENV,
    service: 'crypto-trading-platform'
  },
  timestamp: pino.stdTimeFunctions.isoTime
})

export default logger 