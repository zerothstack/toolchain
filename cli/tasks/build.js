const sourcemaps = require('gulp-sourcemaps');
const merge2     = require('merge2');
const chalk      = require('chalk');
var spawn        = require('child_process').spawn;
const babel      = require('gulp-babel');
const plumber      = require('gulp-plumber');
const fs         = require('fs-extra');
const preset2015 = require('babel-preset-es2015');

const {clean} = require('./clean');

function task(cli, project) {

  cli.command('build [environment]', 'Builds typescript files')
    .action(function (args, callback) {

      return clean(project, this, ['lib'])
        .then(() => build(project, this, args.environment));
    });

}

function build(project, cli, context) {
  return new Promise((resolve, reject) => {

    let config         = {};
    const allConfig    = project.paths.source.all.tsConfig;
    const serverConfig = project.paths.source.server.tsConfig;

    switch (context) {

      case 'server':
        config = serverConfig;
        break;
      default:
        config = allConfig;
    }

    const cmd = `tsc -p ${config} --pretty --diagnostics`;
    cli.log(cmd);
    const argArray = cmd.split(' ');

    const compiler = spawn(argArray.shift(), argArray, {
      stdio: 'inherit'
    });

    compiler.on('close', (code) => {
      let color = 'red';
      if (code === 0) {
        color = 'green';
      }

      cli.log(chalk[color](`typescript compiler exited with code ${code}`));

      if (code !== 0) {
        return reject(code);
      }

      /**
       * Begin ES6 transpilation hack
       * This is a hack to deal with the breaking change in the DI which does not allow for the use
       * of ES6 classes. When the issue is resolved, remove the following section and just resolve()
       * @see https://github.com/angular/angular/issues/7740
       */
      const configJson = require(config);

      const compileTarget = configJson.compilerOptions.outDir+'/**/*.js';
      cli.log(`transpiling files with babel (TEMPORARY). [${project.basePath}/${compileTarget}]`);

      project.gulp.src(compileTarget, {cwd: project.basePath})
        .pipe(plumber(reject))
        .pipe(babel({
          presets: [preset2015]
        }))
        .pipe(project.gulp.dest(data => data.base)) // replace original file
        .on('end', () => {
          cli.log(`transpilation complete`);
          resolve();
        });

      /**
       * End ES6 transpilation hack
       */

    });

    compiler.on('error', (code) => {
      cli.log(chalk.red(`Failed to run '${args}'.\n${code}`));
      reject();
    });

  });

}

module.exports = {task, build};