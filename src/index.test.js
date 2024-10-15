const fs = require('fs')

const {
  keyToCamelCase,
  parseArgs,
  validateArgs,
  formatLogEntry,
  stripColors,
} = require('./index.js')

describe('CLI', () => {
  let consoleErrorMock
  let processExitMock
  let fsExistsSyncMock
  let fsReadFileSyncMock

  beforeEach(() => {
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(function () {})
    processExitMock = jest.spyOn(process, 'exit').mockImplementation(function () {})
    fsExistsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    fsReadFileSyncMock = jest.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        SIMPLE_EVENT: {
          format: 'Something happened',
          log_level: 'info',
        },
        EVENT_WITH_FORMAT: {
          format: 'Some {detail} happened',
          log_level: 'info',
        },
      }),
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('keyToCamelCase', () => {
    it('should convert a key to camel case', function () {
      expect(keyToCamelCase('--some-key')).toBe('someKey')
    })
  })

  describe('parseArgs', () => {
    it('should parse command line arguments correctly', function () {
      process.argv = ['node', 'index.js', '--format=plain', '--logger-config=./logger.config.json']
      const args = parseArgs()
      expect(args).toEqual({
        format: 'plain',
        loggerConfig: './logger.config.json',
      })
    })
  })

  describe('validateArgs', () => {
    it('should exit if format is missing', function () {
      validateArgs({})
      expect(consoleErrorMock).toHaveBeenCalledWith('Format is required')
      expect(processExitMock).toHaveBeenCalledWith(1)
    })

    it('should exit if loggerConfig is missing', function () {
      validateArgs({ format: 'plain' })
      expect(consoleErrorMock).toHaveBeenCalledWith('Logger config is required')
      expect(processExitMock).toHaveBeenCalledWith(1)
    })

    it('should exit if loggerConfig file does not exist', function () {
      fsExistsSyncMock.mockReturnValue(false)
      validateArgs({ format: 'plain', loggerConfig: './logger.config.json' })
      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Logger config file not found: ./logger.config.json',
      )
      expect(processExitMock).toHaveBeenCalledWith(1)
    })

    it('should exit if format is unknown', function () {
      validateArgs({ format: 'unknown', loggerConfig: './logger.config.json' })
      expect(consoleErrorMock).toHaveBeenCalledWith('Unknown format: unknown')
      expect(processExitMock).toHaveBeenCalledWith(1)
    })
  })

  describe('stripColors', () => {
    it('should remove ANSI color codes from text', function () {
      const coloredText = '\x1B[31mRed Text\x1B[0m'
      const plainText = stripColors(coloredText)
      expect(plainText).toBe('Red Text')
    })
  })

  describe('formatLogEntry', () => {
    it('should format log entry correctly', function () {
      const loggerConfig = {
        SIMPLE_EVENT: { format: 'Something happened' },
      }
      const logEntry = {
        timestamp: '2024-10-15T11:30:43.803Z',
        event: 'SIMPLE_EVENT',
        message: 'Something happened',
      }
      const formattedEntry = formatLogEntry(loggerConfig, logEntry)
      expect(formattedEntry).toBe('2024-10-15T11:30:43.803Z [SIMPLE_EVENT] Something happened')
    })

    it('should format log entry correctly with additional arguments', function () {
      const loggerConfig = {
        EVENT_WITH_FORMAT: { format: 'Some {detail} happened' },
      }
      const logEntry = {
        timestamp: '2024-10-15T11:30:43.803Z',
        event: 'EVENT_WITH_FORMAT',
        message: 'Some detail happened',
        detail: 'detail',
        extraArg: 'extraValue',
      }
      const formattedEntry = formatLogEntry(loggerConfig, logEntry)
      expect(formattedEntry).toBe(
        '2024-10-15T11:30:43.803Z [EVENT_WITH_FORMAT] Some detail happened -- extraArg="extraValue"',
      )
    })
  })
})
