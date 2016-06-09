const spawn = require('child_process').spawn;
const chalk = require('chalk');

function task(cli, project) {

  cli.mode('sh', 'Use parent shell')
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

}

module.exports = {task};