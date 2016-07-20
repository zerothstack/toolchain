function task(cli, project) {

  cli.command('cli', 'Jumps into runtime cli')
    .option('-p --port <port>', 'Port number', [3001])
    .option('-h --host <host>', 'Host address number', ['localhost'])
    .option('-a --auth <credentials>', 'Auth details')
    .action(function (args, callback) {

      const port = args.options.port || 3001;
      const host = args.options.host || 'localhost';

      return cli.connect(host, port, {
        auth: args.options.auth,
      })
        .catch((err) => {
          this.log('Error connecting to remote cli:', err);
          callback();
        });
    });

}

module.exports = {task};