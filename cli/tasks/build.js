const sourcemaps     = require('gulp-sourcemaps');
const merge2         = require('merge2');
const path           = require('path');
const chalk           = require('chalk');
var spawn = require('child_process').spawn;

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

    let config = {};
    const allConfig = project.paths.source.all.tsConfig;
    const serverConfig = project.paths.source.server.tsConfig;

    switch (context) {

      case 'server':
        config = serverConfig;
        break;
      default:
        config = allConfig;
    }

    const cmd  = `tsc -p ${config} --pretty --skipLibCheck`;
    cli.log(cmd);
    const argArray = cmd.split(' ');

    const compiler      = spawn(argArray.shift(), argArray, {
      stdio: 'inherit'
    });

    compiler.on('close', (code) => {
      let color = 'red';
      if (code === 0) {
        color = 'green';
      }

      this.log(chalk[color](`typescript compiler exited with code ${code}`));
      resolve();
    });

    compiler.on('error', (code) => {
      this.log(chalk.red(`Failed to run '${args}'.\n${code}`));
      reject();
    });

  });

}

module.exports = {task, build};