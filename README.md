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
  "SIMPLE_EVENT": { "log_level": "info", "format": "Something happened" },
  "EVENT_WITH_FORMAT": { "log_level": "info", "format": "Some {detail} happened" },
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
