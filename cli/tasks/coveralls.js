const fs      = require('fs');
const path = require('path');
const chalk = require('chalk');
const coveralls = require('coveralls');

function task(cli, project) {

  cli.command('coveralls', 'Sends coverage data back to coveralls')
    .action(function (args, callback) {

      return sendCoverage(project, this);
    });

}

function sendCoverage(project, cli) {
  return new Promise((resolve, reject) => {

    try {
      const input = fs.readFileSync(path.resolve(project.basePath, project.paths.destination.coverage, 'summary/lcov.info'), 'utf8');

      coveralls.handleInput(input, function (err) {
        if (err) {
          throw err;
        }
        resolve();
      });

    } catch (e) {
      if (e.code == 'ENOENT') {
        cli.log(chalk.red(`Could not find summary coverage data at ${e.path}. Have you run "test"?`));
      }
      throw e;
    }

  });

}

module.exports = {task, sendCoverage};