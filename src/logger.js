const fs = require('fs')

class Logger {
  constructor(configPath, logger = console) {
    this.configPath = configPath
    this.logger = logger
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    this.metadata = {}
    this.validateConfig()
  }

  validateConfig() {
    for (const event in this.config) {
      const eventConfig = this.config[event]

      // check if all events have a log_level and format
      if (!eventConfig.log_level || !eventConfig.format) {
        throw new Error(`Invalid config for event: ${event}`)
      }

      // check if log_level exists on logger
      if (!this.logger[eventConfig.log_level]) {
        throw new Error(`Invalid log level: ${eventConfig.log_level}`)
      }
    }
  }

  addContext(context) {
    this.metadata = { ...this.metadata, ...context }
  }

  log(event, data = {}) {
    const eventConfig = this.config[event]

    const utcTime = new Date().toISOString()

    const logEntry = {
      timestamp: utcTime,
      event,
    }

    const metadata = { ...this.metadata, ...data }

    if (eventConfig) {
      logEntry.message = this.formatMessage(eventConfig, metadata)
      logEntry.logLevel = eventConfig.log_level
    } else {
      logEntry.message = event
      logEntry.configFile = this.configPath
      logEntry.logLevel = 'error' // Use lowercase to match loggerStub methods
    }

    Object.assign(logEntry, metadata)

    const log = this.formatLogEntry(logEntry)

    this.validateTimestamp(log)

    this.logger[logEntry.logLevel](log) // Use logEntry.logLevel
  }

  formatMessage(eventConfig, metadata) {
    return eventConfig.format.replace(/{(\w+)}/g, (match, key) => {
      const value = metadata[key]

      if (value === undefined) {
        console.error(
          `Failed to format message for event '${eventConfig.name}' ~ missing required parameter '${key}'`,
        )
      }

      return value || match
    })
  }

  formatLogEntry(logEntry) {
    // convert all keys to snake_case
    const snakeCaseLogEntry = Object.keys(logEntry).reduce((acc, key) => {
      acc[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = logEntry[key]
      return acc
    }, {})

    return snakeCaseLogEntry
  }

  validateTimestamp(log) {
    if (new Date(log.timestamp) > new Date()) {
      console.warn('Log entry has a timestamp in the future')
    }

    // example timestamp: 2024-10-15T11:30:43.803Z
    const timestampRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/

    if (!log.timestamp.match(timestampRegex)) {
      console.warn('Log entry has a timestamp in the wrong format')
    }
  }

  static create(configPath, console) {
    const loggerInstance = new Logger(configPath, console)
    const logFunction = (event, options) => loggerInstance.log(event, options)
    logFunction.addContext = (context) => loggerInstance.addContext(context)
    return logFunction
  }
}

module.exports = { Logger }
