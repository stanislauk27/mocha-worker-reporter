# Mocha Worker Reporter

Simple reporter, which works on the worker level.

# Installation

```bash
npm install mocha-worker-reporter
```

# Usage
## Only custom reporters
In mocha config file:
```javascript
const config = {
    reporter: 'mocha-worker-reporter',
    reporterOptions: {
        enabledWorkerReporters: [
            {
                reporterPath: PATH_TO_YOUR_REPORTER,
                reporterOptions: {
                    //any options your reporter needs
                },
                enabled: true
            },
            {
                reporterPath: PATH_TO_YOUR_REPORTER_2,
                reporterOptions: {
                    //any options your reporter needs
                },
                enabled: true
            },
        ]
    }
}
```

## Built-in reporters with custom
You need some additional soft, like mocha-multi-reporters

In mocha config file:

```javascript
const config = {
    reporter: 'mocha-multi-reporters',
    'reporter-option': ['configFile=./your_custom_config.json'],
}
```

your_custom_config.json

```json
{
    "reporterEnabled": "spec,mocha-worker-reporter",
    "mochaWorkerReporterReporterOptions": {
    "enabledWorkerReporters": [
        {
            "reporterPath": "PATH_TO_YOUR_REPORTER",
            "reporterOptions": {
            },
            "enabled": true
        }
    ]
    }
}
```

## Custom reporter
Custom reporter should implement the following interface

```typescript
{
    onRunBegin(): void;
    onSuiteBegin(suite);
    onSuiteEnd(suite);
    onTestBegin(test);
    onTestFail(test, err);
    onTestPending(test);
    onTestEnd(test);
    onHookBegin(hook);
    onHookEnd();
    done();
}
```
