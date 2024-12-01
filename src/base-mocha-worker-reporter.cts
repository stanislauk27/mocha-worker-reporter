import Mocha from 'mocha';

const parallelBufferedReporter = require('mocha/lib/nodejs/reporters/parallel-buffered.js');

const {
    EVENT_TEST_BEGIN,
    EVENT_TEST_FAIL,
    EVENT_TEST_END,
    EVENT_TEST_PENDING,
    EVENT_SUITE_BEGIN,
    EVENT_SUITE_END,
    EVENT_RUN_BEGIN,
    EVENT_HOOK_BEGIN,
    EVENT_HOOK_END,
} = Mocha.Runner.constants;

// Uncaught errors from worker reporters can cause freeze of the worker.
const handleError = event => {
    try {
        event();
    } catch (e) {
        console.log('Worker event failed:', e);
    }
};

async function promiseWithTimeout(promises, timeout) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(reject, timeout);
        Promise.allSettled(promises)
            .then(resolve)
            .catch(reject)
            .finally(() => {
                clearTimeout(timer);
            });
    });
}

/**
 * Usually ParallelBuffered reporter is used to gather report for the main process, but in current concept worker reporters
 * are responsible for actual reporting.
 */
class BaseMochaWorkerReporter extends parallelBufferedReporter {
    private readonly reporters = [];

    constructor(runner, options) {
        super(runner, options);
        let reporters;
        try {
            reporters = JSON.parse(process.env.ENABLED_MOCHA_WORKER_REPORTERS);
        } catch (e) {
            throw Error('Reporters are not defined. Set process.env.ENABLED_MOCHA_WORKER_REPORTERS: ' + e?.message);
        }

        const enabledReporters = reporters.filter(reporter => reporter.enabled);
        for (const {reporterPath, reporterOptions} of enabledReporters) {
            if (!reporterPath || !reporterOptions) throw Error(`reporterPath, reporterOptions should be defined in reporter: ${JSON.stringify(enabledReporters)}`);
            const instance = require(reporterPath).default;
            const reporter = new instance(runner, reporterOptions);
            this.reporters.push(reporter);
            this.registerListeners(reporter, runner);
        }
    }

    registerListeners(reporter, runner) {
        runner.on(EVENT_RUN_BEGIN, () => handleError(() => reporter.onRunBegin()));
        runner.on(EVENT_SUITE_BEGIN, suite => handleError(() => reporter.onSuiteBegin(suite)));
        runner.on(EVENT_SUITE_END, suite => handleError(() => reporter.onSuiteEnd(suite)));
        runner.on(EVENT_TEST_BEGIN, test => handleError(() => reporter.onTestBegin(test)));
        runner.on(EVENT_TEST_FAIL, (test, err) => handleError(() => reporter.onTestFail(test, err)));
        runner.on(EVENT_TEST_PENDING, test => handleError(() => reporter.onTestPending(test)));
        runner.on(EVENT_TEST_END, test => handleError(() => reporter.onTestEnd(test)));
        runner.on(EVENT_HOOK_BEGIN, hook => handleError(() => reporter.onHookBegin(hook)));
        runner.on(EVENT_HOOK_END, () => handleError(() => reporter.onHookEnd()));
    }

    // Wait until worker reporters finish their job or timeout
    async done(failures, exit) {
        try {
            await promiseWithTimeout(
                this.reporters.map(reporter => reporter.done()),
                10 * 1000,
            );
        } catch (e) {
            console.log('Not all reports were finished in worker.' + e);
        }
        super.done(failures, exit);
    }
}


export = BaseMochaWorkerReporter;
