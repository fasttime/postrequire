'use strict';

const { parallel, series, task } = require('gulp');

task
(
    'clean',
    async () =>
    {
        const del = require('del');

        await del(['.nyc_output', 'coverage']);
    },
);

task
(
    'lint',
    () =>
    {
        const lint = require('gulp-fasttime-lint');

        const stream =
        lint
        (
            {
                src: ['postrequire.js', 'test/**/*.js'],
                envs: 'node',
            },
            {
                src: 'gulpfile.js',
                envs: 'node',
                parserOptions: { ecmaVersion: 9 },
            },
        );
        return stream;
    },
);

task
(
    'test',
    callback =>
    {
        const { fork } = require('child_process');

        const { resolve } = require;
        const nycPath = resolve('nyc/bin/nyc');
        const mochaPath = resolve('mocha/bin/mocha');
        const forkArgs =
        [
            '--reporter=html',
            '--reporter=text-summary',
            '--',
            mochaPath,
            '--check-leaks',
            '--globals=__coverage__',
            'test/**/*.spec.js',
        ];
        const childProcess = fork(nycPath, forkArgs);
        childProcess.on('exit', code => callback(code && 'Test failed'));
    },
);

task('default', series(parallel('clean', 'lint'), 'test'));
