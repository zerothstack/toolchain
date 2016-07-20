#! /usr/bin/env node

const vantage = require('@xiphiaz/vantage')();
const path    = require('path');
const fs      = require('fs');
const chalk   = require('chalk');

const {UbiquitsProject} = require('../project');
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

// extend the logger to prefix [ubiquits] when not in a task
const originalLog = vantage.log;
vantage.log       = function (...args) {
  args.unshift(chalk.white('[' + chalk.cyan('ubiquits') + ']'));
  originalLog.apply(this, args);
};

// define the delimiter
vantage
  .delimiter(chalk.green('ubiquits~$'));

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

    // test if command starts with u or ubiquits,
    // user probably doesn't realise they are already in the shell
    if (args.words.length && ['u', 'ubiquits'].indexOf(args.words[0]) >= 0) {
      if (args.words.length == 1) {
        return cb(chalk.red('You are already in the ubiquits shell!'));
      }
      let start = args.words.shift();
      this.log(chalk.yellow(`You are already in the ubiquits shell - you don't need to prefix your commands with '${start}'`));
      vantage.exec(args.words.join(' '));
      return cb();
    }

    this.log(chalk.red(`'${args.words.join(' ')}' is not a valid command.`));

    return Promise.reject('invalid_command');
  });

let project, defaultOnly = true;
// try to retrieve the user's configured project
try {
  project     = require(process.cwd() + '/ubiquits.js');
  defaultOnly = false
} catch (e) {
  // file missing
  if (e.code !== 'MODULE_NOT_FOUND') {
    vantage.log(chalk.red('Error found in your ubiquits.js file:'));
    throw e;
  }
  //create local project as fallback
  project = new UbiquitsProject(process.cwd());
}

// Load all the commands registered in the project
project.loadRegisteredCommands(vantage);

vantage.command('wot m8')
  .hidden()
  .action(function (a, c) {
    this.log(`'R U 'AVIN A GIGGLE, M8?'`);
    c()
  });

// check if only one arg eg `u` or `ubiquits`
if (process.argv.length <= 2) { //one arg, drop into shell

  vantage.show();
  // only output the banner when there is room
  if (process.stdout.columns > 68) {
    vantage.log(chalk.dim.white(banner('$ Command Line Interface')));
  }

  // check if empty directory
  if (!fs.readdirSync(process.cwd()).length) {
    vantage.exec('init -c');
  } else {
    defaultOnly && vantage.log(chalk.yellow(`Local ubiquits.js not found, only default commands will be available`));
    vantage.log(chalk.blue(`Loaded ${project.commandRegistry.length} commands. Type 'help' to see available commands`));
  }

} else { // more than one arg, just execute the command from the parent shell
  vantage.exec(process.argv.splice(2).join(' '))
    .catch((e) => {
      if (e === 'invalid_command') {
        return process.exit(127);
      }
      return process.exit(1);
    });
}




