# domain-logger

> Logging that bridges product, implementation and support

### Benefits

By defining the events that you must log upfront, you are forced to think about what is important to log.

- Any relevant business events are described in one place, and are well understood.
- Being able to configure the log format allows support to provide better troubleshooting messages.
- If a log event is not configured, then it is not something of interest.
- If it is of interest, then having to configure it forces support to think about why it is important.

### Usage

1. Install the package

```bash
npm install domain-logger
```

2. Create a logger config file

```json
{
  "SIMPLE_EVENT": {
    "log_level": "info",
    "format": "Something happened"
  },
  "EVENT_WITH_FORMAT": {
    "log_level": "info",
    "format": "Some {detail} happened"
  },
  "EVENT_WITH_IMPORTANT_METADATA": {
    "log_level": "info",
    "format": "Important info",
    "required_fields": ["important_field"]
  }
}
```

3. Add the logger to your project

```javascript
const { Logger } = require('domain-logger')

const log = Logger.create('path/to/logger.config.json')

const main = async () => {
  log('SIMPLE_EVENT')
  log.addContext({ requestId: '123' })
  log('EVENT_WITH_FORMAT', { detail: 'important thing' })
  log('EVENT_WITH_IMPORTANT_METADATA', { important_field: 'important value' })
}

main()
```

4. Run your application

```bash
node ./main.js
```

You should see the logs in the console.

```
{"timestamp":"2024-05-02T12:00:00.000Z","event":"SIMPLE_EVENT","message":"Something happened"}
{"timestamp":"2024-05-02T12:00:00.000Z","event":"EVENT_WITH_FORMAT","message":"Some important thing happened","request_id":"123"}
{"timestamp":"2024-05-02T12:00:00.000Z","event":"EVENT_WITH_IMPORTANT_METADATA","message":"Important info","important_field":"important value","request_id":"123"}
```

5. Format for human consumption

This is useful to view logs during development.

```bash
node ./main.js | npm exec domain-logger -- --format=plain --logger-config=./logger.config.json
```

You should see the logs in the console.

```
2024-05-02T12:00:00.000Z [SIMPLE_EVENT] Something happened
2024-05-02T12:00:00.000Z [EVENT_WITH_FORMAT] Some important thing happened -- request_id=123
2024-05-02T12:00:00.000Z [EVENT_WITH_IMPORTANT_METADATA] Important info -- important_field="important value" request_id=123
```

### Behaviours

With the following logger config:

```json
{
  "AN_EVENT": {
    "log_level": "info",
    "format": "event"
  },
  "AN_ERROR": {
    "log_level": "error",
    "format": "an error occurred"
  },
  "EVENT_WITH_IMPORTANT_METADATA": {
    "log_level": "info",
    "format": "important info",
    "required_fields": ["important_field"]
  },
  "EVENT_WITH_FORMAT": {
    "log_level": "info",
    "format": "some {detail} happened"
  }
}
```

1. Will always log, but will warn for events that are not configured.

```
> log('UNCONFIGURED_EVENT')
Unknown event: UNCONFIGURED_EVENT
{"timestamp":"2024-10-16T07:16:56.811Z","event":"UNCONFIGURED_EVENT","config_file":"./logger.config.json","log_level":"warn"}
```

2. Will use the log level defined in the loggerconfig.

```
> log('AN_EVENT')
{"timestamp":"2024-10-16T07:21:03.730Z","event":"AN_EVENT","message":"event","log_level":"info"}
```

```
> log('AN_ERROR')
{"timestamp":"2024-10-16T07:21:03.730Z","event":"AN_ERROR","message":"an error occurred","log_level":"error"}
```

3. Will log the event with the configured format.

```
> log('EVENT_WITH_FORMAT', { detail: 'important thing' })
{"timestamp":"2024-10-16T07:21:43.684Z","event":"EVENT_WITH_FORMAT","message":"some important thing happened","log_level":"info","detail":"important thing"}
```

4. Will warn if any required metadata is missing.

```
> log('EVENT_WITH_IMPORTANT_METADATA')
Missing required field: important_field for event: EVENT_WITH_IMPORTANT_METADATA
{"timestamp":"2024-10-16T07:48:03.171Z","event":"EVENT_WITH_IMPORTANT_METADATA","message":"important info","log_level":"info"}
```

```
> log('EVENT_WITH_IMPORTANT_METADATA', { important_field: 'important value' })
{"timestamp":"2024-10-16T07:25:01.075Z","event":"EVENT_WITH_IMPORTANT_METADATA","message":"important info","log_level":"info","important_field":"important value"}
```

5. Will warn if the timestamp is in the future.

```
> const futureTimestamp = new Date(new Date().getTime() + 1000 \* 60).toISOString()
undefined
> log('AN_EVENT', { timestamp: futureTimestamp })
Log entry has a timestamp in the future
{"timestamp":"2024-10-16T07:27:11.395Z","event":"AN_EVENT","message":"event","log_level":"info"}
```
