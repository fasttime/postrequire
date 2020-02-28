'use strict';

const { parallel, series, task } = require('gulp');

task
(
    'clean',
    async () =>
    {
        const { promises: { rmdir } } = require('fs');

        const paths = ['.nyc_output', 'coverage'];
        const options = { recursive: true };
        await Promise.all(paths.map(path => rmdir(path, options)));
    },
);

task
(
    'lint',
    () =>
    {
        const lint = require('@fasttime/gulp-lint');

        const stream =
        lint
        (
            {
                src: ['postrequire.{js,d.ts}', 'test/**/*.js'],
                envs: 'node',
                parserOptions: { project: 'tsconfig.json' },
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
