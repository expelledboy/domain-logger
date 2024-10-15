// Provided the json output from stdin, format log entries for human consumption
// Usage: <cmd> | node index.js --format=plain --logger-config=./logger.config.json

const fs = require('node:fs')
const { createInterface } = require('readline')

const keyToCamelCase = (key) => {
  return key.replace('--', '').replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

const parseArgs = () => {
  const args = {}
  for (const arg of process.argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=')
      const keyCamelCase = keyToCamelCase(key)
      args[keyCamelCase] = value
    }
  }

  return args
}

const validateArgs = (args) => {
  if (!args.format) {
    console.error('Format is required')
    process.exit(1)
  }

  if (!args.loggerConfig) {
    console.error('Logger config is required')
    process.exit(1)
  }

  if (!fs.existsSync(args.loggerConfig)) {
    console.error(`Logger config file not found: ${args.loggerConfig}`)
    process.exit(1)
  }

  if (args.format !== 'plain') {
    console.error('Unknown format: ' + args.format)
    process.exit(1)
  }
}

const stripColors = (text) => {
  return text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2})*)?[mGKH]/g, '')
}

const formatLogEntry = (loggerConfig, logEntry) => {
  const { timestamp, event, message, ...rest } = logEntry

  const argsUsedInMessage = (loggerConfig[event].format.match(/\{(\w+)\}/g) || []).map((arg) =>
    arg.replace(/[{}]/g, ''),
  )

  const args = Object.entries(rest)
    .filter(([key, _value]) => !argsUsedInMessage.includes(key))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(' ')

  return `${timestamp} [${event}] ${message}${args ? ` -- ${args}` : ''}`
}

const main = async () => {
  const args = parseArgs()

  validateArgs(args)

  const loggerConfig = JSON.parse(fs.readFileSync(args.loggerConfig, 'utf8'))

  const rl = createInterface({
    input: process.stdin,
    terminal: true,
  })

  for await (const line of rl) {
    const plainText = stripColors(line)
    try {
      const logEntry = JSON.parse(plainText)
      console.log(formatLogEntry(loggerConfig, logEntry))
    } catch (error) {
      console.log(line)
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  keyToCamelCase,
  parseArgs,
  validateArgs,
  formatLogEntry,
  stripColors,
}
