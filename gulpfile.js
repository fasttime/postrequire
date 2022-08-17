'use strict';

const { parallel, series, task } = require('gulp');

task
(
    'clean',
    async () =>
    {
        const { rm } = require('fs/promises');

        const options = { force: true, recursive: true };
        await rm('coverage', options);
    },
);

task
(
    'lint',
    async () =>
    {
        const { lint } = require('@fasttime/lint');

        await
        lint
        (
            {
                src:
                [
                    'postrequire.{js,d.ts}',
                    'test/**/*.js',
                    '!test/modules/import-postrequire.js',
                    '!test/modules/malformed.js',
                ],
                envs: 'node',
                parserOptions: { project: 'tsconfig.json' },
            },
            {
                src: ['gulpfile.js', 'test/modules/import-postrequire.js'],
                jsVersion: 2020,
                envs: 'node',
            },
        );
    },
);

task
(
    'test',
    async () =>
    {
        const { default: c8js } = await import('c8js');
        const mochaPath = require.resolve('mocha/bin/mocha');
        await c8js
        (
            mochaPath,
            ['--check-leaks', 'test/**/*.spec.js'],
            {
                reporter: ['html', 'text-summary'],
                useC8Config: false,
                watermarks:
                {
                    branches:   [90, 100],
                    functions:  [90, 100],
                    lines:      [90, 100],
                    statements: [90, 100],
                },
            },
        );
    },
);

task('default', series(parallel('clean', 'lint'), 'test'));
