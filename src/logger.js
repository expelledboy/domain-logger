const fs = require('fs')

class Logger {
  constructor(configPath, loggerImplementation = console) {
    this.configPath = configPath
    this.logger = loggerImplementation
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
    const eventConfig = this.loadEventConfig(event)

    const utcTime = new Date().toISOString()

    const logEntry = {
      timestamp: utcTime,
      event,
    }

    const metadata = { ...this.metadata, ...data }

    if (eventConfig) {
      logEntry.message = this.formatMessage(eventConfig, metadata)

      logEntry.logLevel = eventConfig.log_level

      this.validateRequiredFields(eventConfig, metadata)
    } else {
      logEntry.configFile = this.configPath
      logEntry.logLevel = 'warn' // Use lowercase to match loggerStub methods

      this.logger.error(`Unknown event: ${event}`)
    }

    Object.assign(logEntry, metadata)

    const log = this.formatLogEntry(logEntry)

    this.validateTimestamp(log)

    this.logger[logEntry.logLevel](JSON.stringify(log, null, 0))
  }

  loadEventConfig(event) {
    const eventConfig = this.config[event]

    return {
      ...eventConfig,
      event,
      required_fields: [...(eventConfig.required_fields || []), 'trace_id'],
    }
  }

  formatMessage(eventConfig, metadata) {
    return eventConfig.format.replace(/{(\w+)}/g, (match, key) => {
      const value = metadata[key]

      if (value === undefined) {
        this.logger.error(
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
      this.logger.warn('Log entry has a timestamp in the future')
    }

    // example timestamp: 2024-10-15T11:30:43.803Z
    const timestampRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/

    if (!log.timestamp.match(timestampRegex)) {
      this.logger.warn('Log entry has a timestamp in the wrong format')
    }
  }

  validateRequiredFields(eventConfig, metadata) {
    if (eventConfig.required_fields) {
      eventConfig.required_fields.forEach((field) => {
        if (!metadata[field]) {
          this.logger.error(`Missing required field: ${field} for event: ${eventConfig.event}`)
        }
      })
    }
  }

  static create(configPath, loggerImplementation = console) {
    const loggerInstance = new Logger(configPath, loggerImplementation)
    const logFunction = (event, options) => loggerInstance.log(event, options)
    logFunction.addContext = (context) => loggerInstance.addContext(context)
    return logFunction
  }
}

module.exports = { Logger }
