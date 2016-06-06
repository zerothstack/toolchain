#! /usr/bin/env node

const vantage = require('vantage')();
const banner  = require('../cli/banner.js');
const path    = require('path');
const chalk   = require('chalk');
const {UbiquitsProject} = require('../project');
// const spawn  = require('child_process').spawn;


const originalLog = vantage.session.log;
vantage.session.log = function(...args){


  let prev = this._hist[this._hist.length - 1].split(' ').shift();
  const task = chalk.white('['+chalk.cyan(prev)+']');
  args.unshift(task);
  originalLog.apply(this, args);
};


vantage
  .delimiter(chalk.green('ubiquits~$'));

vantage
  .catch('[words...]', 'Catches incorrect commands')
  // .allowUnknownOptions()
  .action(function (args, cb) {
    this.log(chalk.red(args.words.join(' ') + ' is not a valid command.'));
    cb();
    // @todo implement parent shell fallthrough once https://github.com/dthree/vorpal/pull/144 is merged
    // need to have a better reduce to split the args appropriately when they have params
    // const options = Object.keys(args.options).map((option) => '-'+option);
    //
    // const cmd = spawn(args.words.shift(), args.words.concat(options));
    //
    // cmd.stdout.on('data', (data) => {
    //   console.log(`stdout: ${data}`);
    // });
    //
    // cmd.stderr.on('data', (data) => {
    //   console.log(`stderr: ${data}`);
    // });
    //
    // cmd.on('close', (code) => {
    //   this.log(`child process exited with code ${code}`);
    //   cb();
    // });
  });


vantage
  .command('foo', 'Outputs "bar".')
  .action(function (args, callback) {
    this.log('bar');
    callback();
  });

let project, defaultOnly = true;
try {
  project = require(process.cwd() + '/ubiquits.js');
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




