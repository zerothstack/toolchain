#! /usr/bin/env node

const vantage = require('@xiphiaz/vantage')();
const path    = require('path');
const fs      = require('fs');
const chalk   = require('chalk');
const spawn   = require('child_process').spawn;

const {UbiquitsProject} = require('../project');
const banner = require('../cli/banner.js');

const originalSessionLog = vantage.ui.log;
vantage.ui.log           = function (...args) {

  //sometimes there is no parent, like when executing from parent shell
  if (this.parent) {

    const cmd = this.parent._command;

    if (cmd) {
      const task = chalk.white('[' + chalk.cyan(cmd.command.split(' ').shift()) + ']');
      args.unshift(task);
    }

  }

  originalSessionLog.apply(this, args);
};

const originalLog = vantage.log;
vantage.log       = function (...args) {

  args.unshift(chalk.white('[' + chalk.cyan('ubiquits') + ']'));

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
  .mode('sh', 'Use parent shell')
  .alias('$')
  .action(function (args, callback) {

    const argArray = args.split(' ');
    const cmd      = spawn(argArray.shift(), argArray, {
      stdio: [0, 1, 2]
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
  if (e.code !== 'MODULE_NOT_FOUND') {
    vantage.log(chalk.red('Error found in your ubiquits.js file:'));
    throw e;
  }
  //create local project as fallback
  project = new UbiquitsProject(process.cwd());
}

project.loadRegisteredCommands(vantage);

if (process.argv.length <= 2) {

  vantage.show();
  if (process.stdout.columns > 68) {
    vantage.log(chalk.bold.gray(banner(chalk.white('$ Command Line Interface'))));
  }

  //check if empty directory
  if (!fs.readdirSync(process.cwd()).length) {
    vantage.exec('init -c');
  } else {
    defaultOnly && vantage.log(chalk.yellow(`Local ubiquits.js not found, only default commands will be available`));
    vantage.log(chalk.blue(`Loaded ${project.commandRegistry.length} commands. Type 'help' to see available commands`));
  }

} else {
  vantage.parse(process.argv);
}




