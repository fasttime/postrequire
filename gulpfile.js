'use strict';

const { parallel, series, task } = require('gulp');

task
(
    'clean',
    async () =>
    {
        const { promises: { rmdir } } = require('fs');

        await rmdir('coverage', { recursive: true });
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
                rules: { 'spaced-comment': ['error', 'always', { exceptions: ['/'] }] },
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
        const c8Path = resolve('c8/bin/c8');
        const mochaPath = resolve('mocha/bin/mocha');
        const forkArgs =
        [
            '--reporter=html',
            '--reporter=text-summary',
            mochaPath,
            '--check-leaks',
            'test/**/*.spec.js',
        ];
        const childProcess = fork(c8Path, forkArgs);
        childProcess.on('exit', code => callback(code && 'Test failed'));
    },
);

task('default', series(parallel('clean', 'lint'), 'test'));
