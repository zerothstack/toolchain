#! /usr/bin/env node

const vantage = require('vantage')();
const path    = require('path');
const fs      = require('fs');
const chalk   = require('chalk');

const {ZerothProject} = require('../project');
const banner = require('../cli/banner.js');

// extend the logger to prefix [<task>]
const originalSessionLog = vantage.ui.log;
vantage.ui.log           = function (...args) {

  //sometimes there is no parent, like when executing from parent shell
  if (this.parent) {
    const cmd = this.parent._command;
    if (cmd) {
      const task = chalk.white('[' + chalk.cyan(cmd.command.split(' ')
          .shift()) + ']');
      args.unshift(task);
    }
  }
  originalSessionLog.apply(this, args);
};

// extend the logger to prefix [zeroth] when not in a task
const originalLog = vantage.log;
vantage.log       = function (...args) {
  args.unshift(chalk.white('[' + chalk.cyan('zeroth') + ']'));
  originalLog.apply(this, args);
};

// define the delimiter
vantage
  .delimiter(chalk.green('zeroth~$'));

// catch any invalid commands
vantage
  .catch('[words...]', 'Catches incorrect commands')
  // .allowUnknownOptions()
  .action(function (args, cb) {

    //no args, just exit
    if (!args.words) {
      return cb();
    }

    //'end' ending tour
    if (args.words.length && ['end'].indexOf(args.words[0]) >= 0) {
      return cb();
    }

    // test if command starts with u or zeroth,
    // user probably doesn't realise they are already in the shell
    if (args.words.length && ['u', 'zeroth'].indexOf(args.words[0]) >= 0) {
      if (args.words.length == 1) {
        return cb(chalk.red('You are already in the zeroth shell!'));
      }
      let start = args.words.shift();
      this.log(chalk.yellow(`You are already in the zeroth shell - you don't need to prefix your commands with '${start}'`));
      vantage.exec(args.words.join(' '));
      return cb();
    }

    this.log(chalk.red(`'${args.words.join(' ')}' is not a valid command.`));

    return Promise.reject('invalid_command');
  });

let project, defaultOnly = true;
// try to retrieve the user's configured project
try {
  project     = require(process.cwd() + '/zeroth.js');
  defaultOnly = false
} catch (e) {
  // file missing
  if (e.code !== 'MODULE_NOT_FOUND') {
    vantage.log(chalk.red('Error found in your zeroth.js file:'));
    throw e;
  }
  //create local project as fallback
  project = new ZerothProject(process.cwd());
}

// check if only one arg eg `z` or `zeroth`
if (process.argv.length <= 2) { //one arg, drop into shell

  vantage.show();
  vantage.log(chalk.dim.white(banner('$ Command Line Interface')));

  vantage.log(chalk.blue(`Loading project commands, standby...`));
  // command load deferred until after show to make cli appear quicker
  project.loadRegisteredCommands(vantage);

  // check if empty directory
  if (!fs.readdirSync(process.cwd()).length) {
    vantage.exec('init -c');
  } else {
    defaultOnly && vantage.log(chalk.yellow(`Local zeroth.js not found, only default commands will be available`));
    vantage.log(chalk.blue(`Loaded ${project.commandRegistry.length} commands. Type 'help' to see available commands`));
  }

} else { // more than one arg, just execute the command from the parent shell
  project.loadRegisteredCommands(vantage);
  vantage.exec(process.argv.splice(2).join(' '))
    .catch((e) => {
      if (e === 'invalid_command') {
        return process.exit(127);
      }
      return process.exit(1);
    });
}
