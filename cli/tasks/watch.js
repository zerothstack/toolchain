const path    = require('path');
const nodemon = require('nodemon');
const chalk   = require('chalk');
const util    = require('util');
const _       = require('lodash');

const {build} = require('./build');
const {clean} = require('./clean');

function task(cli, project) {

  let runnerRef;
  const options = ['start', 'stop'];

  cli.command('watch [command]', 'Start watcher')
    .alias('w')
    .validate((args) => {

      switch (args.command) {
        case 'stop':
          if (!runnerRef) {
            return `Watcher is not running, run 'watch' or 'watch start' to start it`;
          }
          return true;
        case undefined:
        case 'run':
        case 'start':
          if (!!runnerRef) {
            return `Watcher is already running, run 'watch stop' to cancel`;
          }
          return true;
        default:
          return `Unrecognised option ${args.command}, should be one of [${options.join(', ')}]`;
      }
    })
    .action(function (args, callback) {

      switch (args.command) {
        case 'stop':
          runnerRef.emit('quit');
          runnerRef.on('exit', () => {
            callback();
          });
          runnerRef = null;
          return;
        case undefined:
        case 'run':
        case 'start':
          return clean(project, this, 'lib')
            .then(() => build(project, this, 'server'))
            .then(() => watchServer(project, this))
            .then((runner) => {
              runnerRef = runner;
            });
      }
    });

}

function watchServer(project, cli) {

  return new Promise((resolve, reject) => {

    const runner = nodemon({
      script: path.resolve(__dirname, '../..', 'server/localhost.js'),
      stdout: false,
      ext: 'js json ts',
      watch: [
        project.resolvePath('src/server'),
        project.resolvePath('src/common'),
      ],
      nodeArgs: [
        // ad-hoc debugging (doesn't allow debugging of bootstrap, but app will run with debugger off)
        '--debug=5858',
        // explicit debugging (app won't start until remote debugger connects)
        // '--debug-brk=5858',
        '--expose_debug_as=v8debug', //required for webstorm due to https://youtrack.jetbrains.com/issue/WEB-21717
      ],
      env: {
        'NODE_ENV': 'development',
        'NODEMON_ENTRYPOINT': project.resolvePath('./lib/server/main.js'),
        'FORCE_COLOR':true // force chalk to detect that colour is supported (it is!)
      },
      verbose: true
    });

    runner.on('change', () => {
      build(project, cli);
    });

    runner.on('exit', function () {
      cli.log('Watcher has quit');
    });

    // Forward log messages and stdin
    runner.on('log', (log) => {
      if (~log.message.indexOf('files triggering change check')) {
        runner.emit('change');
      }
      cli.log(chalk.blue('[nodemon]'), chalk.yellow(log.message));
    });

    runner.on('readable', function () {
      
      this.stdout.on('data', (chunk) => {
        let log = chunk.toString();
        if (_.includes(log, 'bundle is now VALID')) {
          cli.log('Returning control to user');
          resolve(runner);
        }
        cli.log(chalk.green('[server]'), log);
      });

      this.stderr.on('data', (chunk) => {
        let log = chunk.toString();
        cli.log(chalk.red('[server]'), log);
      });

    });

  });
}

module.exports = {task};