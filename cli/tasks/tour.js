const chalk = require('chalk');
const _     = require('lodash');

function task(cli, project) {

  cli.command('tour', 'Runs command tour')
    .hidden()
    .action(function (args, callback) {

      callback();

      getTour(cli, this)();

    });

}

function getTour(cli, session) {

  return buildTour(cli, session, [
    {
      name: 'Get help',
      init: () => {
        session.log(chalk.blue('Starting tour. To exit, type `end` at any time'));
        session.log( chalk.inverse.white('To start with, type `help` to see what commands are available'));
      },
      onInput: (e, cb) => {
        if (e === "help") {
          session.log(chalk.inverse.green('Above are all of the available commands you can execute.'));
          cb();
        } else {
          session.log(chalk.inverse.yellow("Whoa there! That's not help - type `help` to continue the tour"));
        }
      }
    },
    {
      name: 'Start server and watch files for changes',
      init: () => {
        session.log( chalk.inverse.white('Now lets start the project running. Type `watch`.'));
      },
      onInput: (e, cb) => {
        if (e === "watch") {
          // @todo pull the host & port from config somewhere or ideally directly from the
          // server if a reference can be gained from nodemon
          session.log(chalk.inverse.green('The watchers are running now, open your browser to http://localhost:3000 to see your project in action'));
          cb();
        } else {
          session.log(chalk.inverse.yellow("Type `watch` to continue the tour"));
        }
      }
    },
    {
      name: 'Enter runtime cli',
      init: () => {
        session.log( chalk.inverse.white('Now that the server is running, lets jump into it\'s runtime cli. Type `cli`.'));
      },
      onInput: (e, cb) => {
        if (e === "cli") {
          session.log(chalk.inverse.green('This is the CLI for the server runtime'));
          cb();
        } else {
          session.log(chalk.inverse.yellow("Type `cli` to continue the tour"));
        }
      }
    },
    {
      name: 'Get help for runtime',
      init: () => {
        session.log( chalk.inverse.white('Type `help` to see the new set of options that are available at runtime.'));
      },
      onInput: (e, cb) => {
        if (e === "help") {
          session.log(chalk.inverse.green('Above are all of the available commands you can execute.'));
          cb();
        } else {
          session.log(chalk.inverse.yellow("Whoa there! That's not help - type `help` to continue the tour"));
        }
      }
    },
    {
      name: 'Output registered routes',
      init: () => {
        session.log( chalk.inverse.white('Type `routes` to see a table of routes that have been registered'));
      },
      onInput: (e, cb) => {
        if (e === "routes") {
          cb();
        } else {
          session.log(chalk.inverse.yellow("Whoa there! That's not routes - type `routes` to continue the tour"));
        }
      }
    },
    {
      name: 'Exit back to toolchain cli',
      init: () => {
        session.log( chalk.inverse.white('To exit the server runtime, type `exit`'));
      },
      onInput: (e, cb) => {
        if (e === "exit") {
          cb();
        } else {
          session.log(chalk.inverse.yellow("Whoa there! That's not exit - type `exit` to continue the tour"));
        }
      }
    },
    {
      name: 'Start documentation watcher',
      init: () => {
        session.log( chalk.inverse.white('Now to the documentation generator. Type `doc watch` to start the watchers'));
      },
      onInput: (e, cb) => {
        if (e === "doc watch") {
          session.log(chalk.inverse.green('Now the watchers are running and watching the files in ./doc. Go to localhost:8080 to see the documentation page'));
          cb();
        } else {
          session.log(chalk.inverse.yellow("Whoa there! That's not doc watch - type `doc watch` to continue the tour"));
        }
      }
    },
    {
      init: () => {
        session.log( chalk.inverse.white('That\'s it for the tour, over to you to explore and discover the other commands like `test`'));
      }
    }
  ]);

}

function makeListener(steps, stack, cli, session) {

  let step = steps[stack.length];

  let checklist = steps.reduce((cl, step, index) => {
    if (!step.name) {
      return cl;
    }

    let line = `${index + 1}. ${step.name} `;

    if (index > stack.length) {
      line = chalk.cyan(line);
    }

    if (index < stack.length) {
      line = chalk.gray(line);
    }

    if (index === stack.length) {
      line = chalk.underline(line);
    }

    return cl + line + '\n';

  }, 'Tour Checklist:\n');

  session.log(checklist);
  
  step.init();

  let listener = (e) => {

    if (e && e.command === 'end') {
      session.log(chalk.dim.white('Your tour has ended.'));
      cli.removeListener(`client_command_executed`, stack[stack.length - 1]);
      return;
    }

    if (step.onInput) {

      if (e === undefined || _.startsWith(e.command, 'init')) {
        return;
      }

      step.onInput(e.command, () => {
        cli.removeListener(`client_command_executed`, stack[stack.length - 1]);
        if (steps.length > stack.length) {
          makeListener(steps, stack, cli, session);
        }
      });
      
    } else {
      cli.removeListener(`client_command_executed`, stack[stack.length - 1]);
      if (steps.length > stack.length) {
        makeListener(steps, stack, cli, session);
      }
    }

  };
  cli.on(`client_command_executed`, listener);
  stack.push(listener);
  return listener;
}

function buildTour(cli, session, steps) {

  let stepStack = [];

  return makeListener(steps, stepStack, cli, session);
}

module.exports = {task, getTour};