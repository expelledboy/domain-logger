const fs = require('fs')
const { Logger } = require('./logger.js')

jest.mock('fs')

describe('Logger', function () {
  var logger

  var consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
  var consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

  var configPath = 'path/to/config.json'

  var configContent = JSON.stringify({
    SIMPLE_EVENT: { log_level: 'info', format: 'Something happened' },
    EVENT_WITH_FORMAT: { log_level: 'info', format: 'Some {detail} happened' },
  })

  beforeEach(function () {
    // Mock fs.readFileSync to return the desired config content
    fs.readFileSync = jest.fn().mockReturnValue(configContent)
    logger = new Logger(configPath, console)
  })

  afterEach(function () {
    jest.clearAllMocks()
  })

  it('should validate configuration on initialization', function () {
    expect(function () {
      new Logger(configPath, console)
    }).not.toThrow()

    fs.readFileSync.mockReturnValue(
      JSON.stringify({ INVALID_CONFIG: { format: 'Missing log level' } }),
    )
    expect(function () {
      new Logger(configPath, console)
    }).toThrow('Invalid config for event: INVALID_CONFIG')
  })

  it('should throw an error for invalid log entry config', function () {
    fs.readFileSync.mockReturnValue(
      JSON.stringify({ INVALID_CONFIG: { format: 'Missing log level' } }),
    )
    expect(function () {
      new Logger(configPath, console)
    }).toThrow('Invalid config for event: INVALID_CONFIG')
  })

  it('should add context correctly', function () {
    logger.addContext({ userId: 123 })
    logger.log('SIMPLE_EVENT')
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.objectContaining({ user_id: 123 }))
  })

  it('should log messages with correct format', function () {
    logger.addContext({ detail: 'important thing' })
    logger.log('EVENT_WITH_FORMAT')
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Some important thing happened' }),
    )
  })

  it('should warn if timestamp is in the future', function () {
    var futureDate = new Date(Date.now() + 10000).toISOString()

    logger.log('SIMPLE_EVENT', { timestamp: futureDate })

    expect(consoleWarnSpy).toHaveBeenCalledWith('Log entry has a timestamp in the future')

    // but still log the message
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Something happened' }),
    )
  })

  it('should warn if timestamp format is incorrect', function () {
    var invalidTimestamp = '2024-10-15 11:30:43'

    logger.log('SIMPLE_EVENT', { timestamp: invalidTimestamp })
    expect(consoleWarnSpy).toHaveBeenCalledWith('Log entry has a timestamp in the wrong format')

    // but still log the message
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Something happened' }),
    )
  })

  it('has a simple interface using the create method', function () {
    const log = Logger.create(configPath, console)

    log.addContext({ requestId: '123' })
    log('SIMPLE_EVENT')

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Something happened', request_id: '123' }),
    )
  })
})
