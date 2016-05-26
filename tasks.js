'use strict';

const path = require('path');
const _ = require('lodash');
const gulp = require('gulp-help')(require('gulp'));
const rimraf = require('gulp-rimraf');
const tslint = require('gulp-tslint');
const istanbul = require('gulp-istanbul');
const sourcemaps = require('gulp-sourcemaps');
const typescript = require('gulp-typescript');
const merge2 = require('merge2');
const jasmine = require('gulp-jasmine');
const SpecReporter = require('jasmine-spec-reporter');
const remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
const fs = require('fs');
const merge = require('gulp-merge-json');
const nodemon = require('nodemon');
const gulpWebpack = require('webpack-stream');
const gutil = require('gulp-util');
const KarmaServer = require('karma').Server;
const prettyTime = require('pretty-hrtime');
const chalk = require('chalk');
const runSequence = require('run-sequence');
const tap = require('gulp-tap');
const cp = require('child_process');

class UbiquitsProject {

  constructor(basePath, paths) {

    this.gulp = gulp;
    this.basePath = basePath;

    this.paths = _.merge({
      source: {
        server: {
          tsConfig: this.basePath + '/tsconfig.server.json',
          ts: [
            './src/server/**/*.ts',
            './src/common/**/*.ts',
          ],
          definitions: [
            './typings/**/*.d.ts',
            '!./typings/index.d.ts',
            '!./typings/**/core-js/*.d.ts',
          ]
        },
        browser: {
          tsConfig: this.basePath + '/tsconfig.browser.json',
          ts: [
            './src/browser/**/*.ts',
            './src/common/**/*.ts',
          ],
          definitions: [
            './typings/**/*.d.ts',
            '!./typings/index.d.ts',
          ]
        },
        all: {
          tsConfig: this.basePath + '/tsconfig.json',
          ts: [
            './src/browser/**/*.ts',
            './src/common/**/*.ts',
            './src/server/**/*.ts',
          ],
          definitions: [
            './typings/**/*.d.ts',
            '!./typings/index.d.ts',
            '!./typings/**/core-js/*.d.ts',
          ]
        },
      },
      destination: {
        lib: './lib',
        dist: './dist',
        coverage: './coverage',
        server: 'lib/server',
        browser: 'dist/browser',
      }
    }, paths);

  }

  registerTask(name, help, task, dependencies) {
    return this.gulp.task(name, help, dependencies || [], task);
  }

  clean(paths) {

    return () => this.gulp.src(paths, {read: false, cwd: this.basePath})
      .pipe(rimraf())
  }

  tslint(paths) {

    return () => this.gulp.src(paths, {cwd: this.basePath})
      .pipe(tslint())
      .pipe(tslint.report('verbose'))
  }

  compileTs(paths) {

    return () => {
      const tsProject = typescript.createProject(paths.tsConfig);
      let tsResult = this.gulp.src(paths.source, {cwd: this.basePath, base: './src'})
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject));

      return merge2([ // Merge the two output streams, so this task is finished when the IO of both operations are done.
        tsResult.dts
          .pipe(this.gulp.dest(paths.destination)),
        tsResult.js
          .pipe(sourcemaps.write('.', {sourceRoot: this.basePath}))
          .pipe(this.gulp.dest(paths.destination))
      ]);
    }
  }

  instrument(paths) {

    return () => this.gulp.src(paths, {cwd: this.basePath})
    // Covering files
      .pipe(istanbul())
      // Force `require` to return covered files
      .pipe(istanbul.hookRequire());
  }

  jasmine(paths) {

    return () => {
      Error.stackTraceLimit = Infinity;

      require('core-js');
      require('reflect-metadata');
      require('zone.js/dist/zone-node');

      return gulp.src(paths.source, {cwd: this.basePath})
        .pipe(tap((file) => {
          this.log(chalk.blue('[jasmine]'), chalk.cyan('loading path:', file.path));
        }))
        .pipe(jasmine({
            reporter: new SpecReporter({
              displayFailuresSummary: false
            })
          })
        )
        // Creating the reports after tests ran
        .pipe(istanbul.writeReports({
          dir: paths.coverage,
          reporters: ['json']
        }));

    }

  }

  remapCoverage(paths) {

    return () => {

      return gulp.src(paths.source, {cwd: this.basePath})
        .pipe(merge('summary.json'))
        .pipe(remapIstanbul({
          reports: {
            'json': this.resolvePath('./coverage/summary/coverage.json'),
            'html': this.resolvePath('./coverage/summary/html-report'),
            'text': this.resolvePath('./coverage/summary/text-summary', true),
            'lcovonly': this.resolvePath('./coverage/summary/lcov.info')
          }
        })).on('end', () => {
          this.log(fs.readFileSync(this.resolvePath('./coverage/summary/text-summary')).toString());
        });
    }

  }

  nodemon(config) {

    return () => {

      const runner = nodemon({
        script: config.entryPoint,
        'ext': 'js json ts',
        watch: [
          this.resolvePath('src/server'),
          this.resolvePath('src/common'),
        ],
        nodeArgs: [
          // ad-hoc debugging (doesn't allow debugging of bootstrap, but app will run with debugger off)
          '--debug=5858'
          // explicit debugging (app won't start until remote debugger connects)
          // '--debug-brk=5858'
        ],
        env: {
          'NODE_ENV': 'development',
          'NODEMON_ENTRYPOINT': this.resolvePath('./lib/server/server/main.js')
        },
        verbose: true
      });

      runner.on('change', () => {
        this.runSync(config.tasks);
      });

      // Forward log messages and stdin
      runner.on('log', (log) => {
        if (~log.message.indexOf('files triggering change check')) {
          runner.emit('change');
        }
        this.log(chalk.blue('[nodemon]'), chalk.yellow(log.message));
      });
    }

  }

  resolvePath(pathString, relative) {
    const normalized = path.normalize(this.basePath + '/' + pathString);
    if (!relative) {
      return normalized;
    }
    return path.relative(this.basePath, normalized);
  }

  webpack(config) {

    return () => {

      const webpackConfig = require(config.webpackPath);

      webpackConfig.progress = true;

      return gulp.src('.')
        .pipe(gulpWebpack(webpackConfig, null, (err, stats) => {
          if (err) {
            throw new gutil.PluginError("webpack", err);
          }
          this.log("[webpack]", stats.toString({
            chunkModules: false,
            colors: gutil.colors.supportsColor,
          }));
        }))
        .pipe(gulp.dest(config.destination));
    }

  }

  registerDefaultTasks() {

    this.registerTask('clean:lib', 'removes the lib directory', this.clean(this.paths.destination.lib));
    this.registerTask('clean:coverage', 'removes the coverage directory', this.clean(this.paths.destination.coverage));
    this.registerTask('clean:dist', 'removes the dist directory', this.clean(this.paths.destination.dist));

    this.registerTask('clean', 'lib & coverage directories', null, ['clean:lib', 'clean:coverage','clean:dist']);

    this.registerTask('tslint', 'lint files', this.tslint(this.paths.source.server.ts));

    this.registerTask('build:server', 'compile API files', this.compileTs({
      source: [].concat(this.paths.source.server.ts, this.paths.source.server.definitions),
      destination: this.paths.destination.server,
      tsConfig: this.paths.source.all.tsConfig
    }), ['clean:lib']);

    this.registerTask('instrument:server', 'instrument server files', this.instrument(this.paths.destination.server + '/**/*.js'));

    this.registerTask('test:server', 'run server tests', (callback) => {
      runSequence('build:server', 'instrument:server', 'jasmine:server', callback);
    });

    this.registerTask('test', 'run all tests', (callback) => {
      runSequence('test:server', 'test:browser', 'coverage:remap', callback);
    }, ['clean']);

    this.registerTask('jasmine:server', 'run server spec files', this.jasmine({
      source: [this.paths.destination.server + '/**/*.js', '!' + this.paths.destination.server + '/**/bootstrap.js'],
      coverage: this.paths.destination.coverage + '/server/js'
    }));

    this.registerTask('coverage:remap', 'remap coverage files to typescript sources', this.remapCoverage({
      source: [
        this.resolvePath('./coverage/browser/js/coverage-final.json'),
        this.resolvePath('./coverage/server/js/coverage-final.json'),
      ],
      coverage: this.paths.destination.coverage
    }));

    this.registerTask('watch', 'watch all files with nodemon', this.nodemon({
      entryPoint: __dirname + '/server/localhost.js',
      tasks: ['build:server']
    }), ['build:server']);

    this.registerTask('test:browser', 'test browser', (done) => {

      new KarmaServer({
        configFile: __dirname + '/browser/karma.conf.js',
        basePath: this.basePath,
        singleRun: true,
      }, done).start();
    });

    this.registerTask('compile:browser', 'compile browser', this.webpack({
      webpackPath: './browser/webpack.prod.js',
      destination: this.paths.destination.browser
    }), ['clean:dist']);

    this.registerTask('build', 'build files', this.compileTs({
      source: [].concat(this.paths.source.all.ts, this.paths.source.all.definitions),
      destination: this.paths.destination.lib,
      tsConfig: this.paths.source.all.tsConfig
    }), ['clean:lib']);

    this.registerTask('compile', 'compile all files', null, ['compile:browser', 'build:server']);

    return this;
  }

  start(args) {
    this.logEvents(this.gulp);
    this.gulp.start.apply(this.gulp, args);
  }

  runSync(tasks) {
    this.log(chalk.blue(`Running tasks synchronously: [${tasks.join(', ')}]`));
    cp.spawnSync('u', tasks, { stdio: [0, 1, 2] });
  }

  logEvents(gulpInst) {

    gulpInst.on('task_start', (e) => {
      this.log('Starting', '\'' + chalk.cyan(e.task) + '\'...');
    });

    gulpInst.on('task_stop', (e) => {
      var time = prettyTime(e.hrDuration);
      this.log(
        'Finished', '\'' + chalk.cyan(e.task) + '\'',
        'after', chalk.magenta(time)
      );
    });

    gulpInst.on('task_err', (e) => {
      var msg = this.formatError(e);
      var time = prettyTime(e.hrDuration);
      this.log(
        '\'' + chalk.cyan(e.task) + '\'',
        chalk.red('errored after'),
        chalk.magenta(time)
      );
      this.log(msg);
    });

    gulpInst.on('task_not_found', (err) => {
      this.log(
        chalk.red('Task \'' + err.task + '\' is not configured in your ubiquits project')
      );
      this.log('Please check the documentation for proper ubiquits.js project config');
      process.exit(1);
    });
  }

  log() {
    gutil.log.apply(this, arguments);
  }

  formatError(e) {
    if (!e.err) {
      return e.message;
    }

    // PluginError
    if (typeof e.err.showStack === 'boolean') {
      return e.err.toString();
    }

    // Normal error
    if (e.err.stack) {
      return e.err.stack;
    }

    // Unknown (string, number, etc.)
    return new Error(String(e.err)).stack;
  }

}

module.exports = {UbiquitsProject};
