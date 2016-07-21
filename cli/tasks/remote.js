const {getSignedJwt} = require('./crypto');

function task(cli, project) {

  cli.command('remote', 'Connect to remote server cli')
    .option('-p --port <port>', 'Port number', [3001])
    .option('-h --host <host>', 'Host address number', ['localhost'])
    .action(function (args, callback) {

      const port = args.options.port || 3001;
      const host = args.options.host || 'localhost';

      return getSignedJwt(this, project, 'admin')
        .then(({jwt, publicKeyPath}) => cli.connect(host, port, {jwt, publicKeyPath}))
        .catch((err) => {
          this.log('Error connecting to remote cli:', err);
          callback();
        });
    });

}

module.exports = {task};