#! /usr/bin/env node

const vorpal = require('vorpal')();
const banner = require('../cli/banner.js');
const path = require('path');
const chalk = require('chalk');
const UbiquitsProject = require('../project').UbiquitsProject;
// const spawn  = require('child_process').spawn;



vorpal
  .delimiter(chalk.green('ubiquits~$'));

vorpal
  .command('foo', 'Outputs "bar".')
  .action(function (args, callback) {
    this.log('bar');
    callback();
  });

vorpal
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


let project;
try {
  project = require(process.cwd() + '/ubiquitsfile.js');
} catch(e){
  vorpal.log(chalk.yellow(`Local ubiquitsfile.js not found, default commands only will be available`));
  project = new UbiquitsProject(path.resolve(__dirname, '..'));
}

project.loadRegisteredCommands(vorpal);

if (process.argv.length <= 2) {

  vorpal.show();
  if (process.stdout.columns > 68) {
    vorpal.log(chalk.bold.gray(banner(chalk.white('$ Command Line Interface'))));
  }

  const helpTimeout = setTimeout(() => {
    vorpal.log(`Stuck? To get a list of available commands, type 'help'`);
    vorpal.ui.input('help');
  }, 2000);

  vorpal.on('keypress', () => {
    if (vorpal.ui.input().length > 0){
      clearTimeout(helpTimeout);
    }
  });

} else {
  vorpal.parse(process.argv);
}




