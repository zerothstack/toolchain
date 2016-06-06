const vantage = require('vantage')();

function task(cli, project) {

  cli.command('cli', 'Jumps into runtime cli')
    .option('-p', '--port', 'Port number', [3001])
    .option('-h', '--host', 'Host address number', ['localhost'])
    .action(function (args, callback) {

      const port = args.options.p || 3001;
      const host = args.options.h || 'localhost';

      return cli.connect(host, port)
        .catch((err) => {
          this.log('Error connecting to remote cli', err);
          callback();
        });
    });

}

module.exports = {task};