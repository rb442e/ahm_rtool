'use strict';

const gulp = require('gulp');
const env = require('gulp-env');
const eslint = require('gulp-eslint');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const del = require('del');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');

/**
 * Found an interesting bug using gulp, jasmine and express. If any any of the test involves express
 * middleware that calls "next(err);", then gulp hangs after the jasmine tests finish.
 *
 * A workaround is adding a event handler for gulp 'stop' event
 *
 */
/*
const isWatching = false;

gulp.on('stop', function () {
    if (!isWatching) {
        process.nextTick(function () {
            process.exit(0);
        });
    }
});
*/

//-----------------------------------------------------------------------------
// Code Quality
//-----------------------------------------------------------------------------
gulp.task('lint', function () {
    return gulp.src(['./*.js', 'lib/**/*.js'], { base: './' })
        .pipe(eslint())
        //.pipe(eslint.format())
        .pipe(eslint.format('node_modules/eslint-formatter-pretty'));
});
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Unit Testing
//-----------------------------------------------------------------------------
gulp.task('set-unit-testing-env', function () {
    env({
        vars: {
            NODE_ENV: 'unit-testing',
            unit_testing: true,
            integration_testing: false
        }
    });
});

gulp.task('unit-test', ['set-unit-testing-env'], function () {
    return gulp.src(['test/**/*.test.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec'
        }));
});
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Unit Testing Code Coverage
//-----------------------------------------------------------------------------
gulp.task('pre-coverage-test', function () {
    //return gulp.src(['app.js', 'lib/**/*.js', '!lib/**/*.test.js'])
    return gulp.src(['app.js', 'lib/**/*.js'])
    // Covering files
        .pipe(istanbul({
            includeUntested: true
        }))
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());
});

gulp.task('test-coverage', ['set-unit-testing-env', 'pre-coverage-test'], function () {
    return gulp.src(['test/**/*.test.js'])
        .pipe(mocha({
            reporter: 'spec'
        }))
        // Creating the reports after tests ran
        .pipe(istanbul.writeReports())
        // Enforce a coverage of at least 90%
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 50 } }));
});
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Integration Testing
//-----------------------------------------------------------------------------
gulp.task('set-integration-testing-env', function () {
    env({
        vars: {
            NODE_ENV: 'integration-testing',
            unit_testing: false,
            integration_testing: true
        }
    });
});

gulp.task('integration-test', ['set-integration-testing-env'], function () {
    return gulp.src(['test/integration/*.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec'
        }));
});
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Build App
//-----------------------------------------------------------------------------
gulp.task('clean-dist', function () {
    return del(['dist/*']);
});

gulp.task('create-tarball', ['clean-dist'], function () {

    gulp.src(['app.js', 'ca-apm-probe.json', 'process.json',
        'config/**/*.json', 'lib/**/*.*', 'node_modules/**/*.*',
    ], { base: '.' })
        .pipe(tar('search-api.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('dist'));
});

