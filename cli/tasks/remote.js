const {getSignedJwt} = require('./crypto');

function task(cli, project) {

  const vantage = cli.find('vantage');
  if (vantage) {
    vantage.remove();
  }

  cli.command('remote', 'Connect to remote server cli')
    .option('-p --port <port>', 'Port number', [3001])
    .option('-h --host <host>', 'Host address number', ['localhost'])
    .action(function (args, callback) {

      const port = args.options.port || 3001;
      const host = args.options.host || 'localhost';

      console.log('passing in columns', process.stdout.columns);

      return getSignedJwt(this, project, 'admin')
        .then(({jwt, publicKeyPath}) => cli.connect(host, port, {
          jwt,
          publicKeyPath,
          columns: process.stdout.columns
        }))
        .catch((err) => {
          this.log('Error connecting to remote cli:', err);
          callback();
        });
    });

}

module.exports = {task};