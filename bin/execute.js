#! /usr/bin/env node

const vantage = require('@xiphiaz/vantage')();
const banner  = require('../cli/banner.js');
const path    = require('path');
const chalk   = require('chalk');
const {UbiquitsProject} = require('../project');
const spawn   = require('child_process').spawn;

const originalLog = vantage.ui.log;
vantage.ui.log    = function (...args) {

  const cmd = this.parent._command;

  if (cmd) {
    const task = chalk.white('[' + chalk.cyan(cmd.command.split(' ').shift()) + ']');
    args.unshift(task);
  }

  originalLog.apply(this, args);
};

vantage
  .delimiter(chalk.green('ubiquits~$'));

vantage
  .catch('[words...]', 'Catches incorrect commands')
  // .allowUnknownOptions()
  .action(function (args, cb) {
    this.log(chalk.red(`'${args.words.join(' ')}' is not a valid command.`));
    cb();
  });

vantage
  .command('foo', 'Outputs "bar".')
  .action(function (args, callback) {
    this.log('bar');
    callback();
  });

vantage
  .mode('sh', 'Use parent shell')
  .alias('$')
  .action(function (args, callback) {

    const argArray = args.split(' ');
    const cmd = spawn(argArray.shift(), argArray);

    cmd.stdout.on('data', (data) => {
      this.log(`stdout: ${data}`);
    });

    cmd.stderr.on('data', (data) => {
      this.log(`stderr: ${data}`);
    });

    cmd.on('close', (code) => {
      if (code === 0) {
        code = chalk.green(code);
      } else {
        code = chalk.red(code);
      }

      this.log(`child process exited with code ${code}`);
      callback();
    });

    cmd.on('error', (code) => {
      this.log(chalk.red(`Failed to run '${args}'.\n${code}`));
      callback();
    });

  });

let project, defaultOnly = true;
try {
  project     = require(process.cwd() + '/ubiquits.js');
  defaultOnly = false
} catch (e) {
  project = new UbiquitsProject(path.resolve(__dirname, '..'));
}

project.loadRegisteredCommands(vantage);

if (process.argv.length <= 2) {

  vantage.show();
  if (process.stdout.columns > 68) {
    vantage.log(chalk.bold.gray(banner(chalk.white('$ Command Line Interface'))));
  }

  defaultOnly && vantage.log(chalk.yellow(`Local ubiquits.js not found, only default commands will be available`));
  vantage.log(chalk.blue(`Loaded ${project.commandRegistry.length} commands. Type 'help' to see available commands`));

} else {
  vantage.parse(process.argv);
}




