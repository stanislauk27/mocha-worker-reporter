import Mocha from 'mocha';
import path from 'path';

const unflattenMochaConfig = (config) => {
    const reporters = config['reporterOptions.enabledWorkerReporters.reporterPath'];
    const getValueFromPossibleArray = (field, index) => Array.isArray(field) ? field[index] : field;
    (Array.isArray(reporters) ? reporters : [reporters]).forEach((reporterPath, index) => {
        config.reporterOptions = config.reporterOptions ?? {};
        config.reporterOptions.enabledWorkerReporters = config.reporterOptions.enabledWorkerReporters ?? [];
        config.reporterOptions.enabledWorkerReporters.push(
            {
                reporterPath,
                reporterOptions: {
                    targetDir: getValueFromPossibleArray(config['reporterOptions.enabledWorkerReporters.reporterOptions.targetDir'], index),
                    showEpilogue: getValueFromPossibleArray(config['reporterOptions.enabledWorkerReporters.reporterOptions.showEpilogue'], index),
                    showHooks: getValueFromPossibleArray(config['reporterOptions.enabledWorkerReporters.reporterOptions.showHooks'], index),
                },
                enabled: getValueFromPossibleArray(config['reporterOptions.enabledWorkerReporters.enabled'], index),
            }
        )
    })
    return config;
}


/**
 * Actual Mocha reporter, which has a duty to register worker reporters (base-mocha-worker-reporter.ts)
 */
class WorkerReporterStarter extends Mocha.reporters.Base {
    constructor(runner, options) {
        super(runner, options);
        options = unflattenMochaConfig(JSON.parse(JSON.stringify(options)));
        if (!options || !options.reporterOptions || !options.reporterOptions.enabledWorkerReporters) {
            throw Error(`options.reporterOptions should be defined with enabledWorkerReporters, but was ${JSON.stringify(options)}`);
        }
        let reporterPath;
        if (options.reporterOptions.reporterPath) {
            reporterPath = path.resolve(process.cwd(), options.reporterOptions.reporterPath);
        } else {
            reporterPath = path.resolve(__dirname, './base-mocha-worker-reporter.cjs');
        }
        runner.workerReporter(reporterPath);
        process.env.ENABLED_MOCHA_WORKER_REPORTERS = JSON.stringify(options.reporterOptions.enabledWorkerReporters);
    }
}

export default WorkerReporterStarter;
