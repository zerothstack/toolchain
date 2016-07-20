const {pki} = require('node-forge');
const {rsa} = pki;
const fs  = require('fs-extra');
const jwt = require('jsonwebtoken');

function task(cli, project) {

  cli.command('key generate <owner>', 'Generate RSA keys')
    .option('-p, --password [password]', 'Password to encrypt the private key')
    .action(function (args, callback) {

      return generateKeyPair(this, args.password)
        .then((keys) => saveKeys(this, project, keys, args.owner));

    });

  cli.command('jwt <owner>', 'Generate JSON Web Token signed by <owner>')
    .action(function (args, callback) {

      return getSignedJwt(this, project, args.owner).then((token) => {
        this.log('JWT output follows');
        this.log(token);
      });

    });

}

function getKeyPaths(project, owner = 'server') {

  let destination = ['/keys', '/keys'];
  let names       = ['private', 'public'];

  switch (owner) {
    case 'admin':
      destination = ['/_private', '/keys/known_hosts'];
      names       = ['private', `${process.env.USER}-public`];
      break;
  }

  return {
    private: project.basePath + destination[0] + '/' + names[0] + '.pem',
    public: project.basePath + destination[1] + '/' + names[1] + '.pem',
  }

}

function generateKeyPair(cli, password = false) {

  return new Promise((resolve, reject) => {

    this.log('Generating RSA key pair, standby...');

    rsa.generateKeyPair({bits: 2048, workers: 2}, function (err, keypair) {
      if (err) {
        return reject(err);
      }
      return resolve(keypair);
    });

  }).then((keypair) => {
    cli.log('Encoding keys');
    const privateKeyPem = !password ? pki.privateKeyToPem(keypair.privateKey) : pki.encryptRsaPrivateKey(keypair.privateKey, 'password');
    const publicKey     = pki.setRsaPublicKey(keypair.privateKey.n, keypair.privateKey.e);
    const publicKeyPem  = pki.publicKeyToPem(publicKey);

    return {privateKeyPem, publicKeyPem};
  });

}

function saveKeys(cli, project, {privateKeyPem, publicKeyPem}, owner) {

  const paths = getKeyPaths(project, owner);

  cli.log('Writing keys to disk');
  fs.outputFileSync(paths.private, privateKeyPem);
  fs.outputFileSync(paths.public, publicKeyPem);

  return Promise.resolve(true);
}

function getSignedJwt(cli, project, owner) {

  cli.log(`Generating JWT signed by ${owner}`);
  const paths = getKeyPaths(project, owner);

  return new Promise((resolve, reject) => {

    fs.readFile(paths.private, 'utf8', (error, pem) => {

      if (error){
        return reject(error);
      }

      const token = jwt.sign({ username: process.env.USER }, pem, { algorithm: 'RS256'});

      return resolve(token);
    });

  });

}

module.exports = {task};