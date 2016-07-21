const {pki} = require('node-forge');
const {rsa} = pki;
const fs       = require('fs-extra');
const jwt      = require('jsonwebtoken');
const inquirer = require('inquirer');

function task(cli, project) {

  const owners = ['admin', 'server'];

  cli.command('key generate <owner>', 'Generate RSA keys')
    .autocomplete(owners)
    .validate((args) => {
      if (owners.includes(args.owner)) {
        return true;
      }
      return `<owner> must be one of [${owners.join(', ')}]. '${args.owner}' given`;
    })
    .option('-p, --password [password]', 'Password to encrypt the private key')
    .action(function (args, callback) {

      return generateKeyPair(this, args.options.password, args.owner)
        .then((keys) => saveKeys(this, project, keys, args.owner));

    });

  cli.command('jwt <owner>', 'Generate JSON Web Token signed by <owner>')
    .autocomplete(owners)
    .action(function (args, callback) {

      return getSignedJwt(this, project, args.owner)
        .then(({jwt}) => {
          this.log('JWT output follows');
          this.log(jwt);
        });

    });

}

function getKeyPaths(project, owner = 'server') {

  let destination = ['/keys', '/keys'];
  let names       = ['private.key', 'public.pub'];

  switch (owner) {
    case 'admin':
      destination = ['/_private', '/keys/known_hosts'];
      names       = [`${process.env.USER}-private.key`, `${process.env.USER}-public.pub`];
      break;
  }

  return {
    private: project.basePath + destination[0] + '/' + names[0],
    public: project.basePath + destination[1] + '/' + names[1],
  };

}

function generateKeyPair(cli, password = false, owner = 'server') {

  if (!!password && owner == 'server') {
    this.log('Keys cannot be encrypted for the server key-pair');
    return Promise.reject();
  }

  return Promise.resolve(password)
    .then((password) => {
      if (!!password) {
        return password;
      }

      let repeatAttempts = 0;

      return inquirer.prompt([
        {
          name: 'usePassword',
          type: 'confirm',
          message: 'Do you want to password encrypt your private key?\nYou will need to enter it every time you connect to the server',
          default: false,
        },
        {
          name: 'password',
          type: 'password',
          message: 'Enter private key password',
          when: ({usePassword}) => usePassword,
          validate: (input) => {
            if (input.length < 6) {
              return "Password must be at least 6 characters in length";
            }

            promptedPassword = input;

            return true;
          }
        },
        {
          name: 'passwordRepeat',
          type: 'password',
          message: 'Repeat your password',
          when: ({usePassword}) => usePassword,
          validate: (input, answers) => {
            repeatAttempts++;
            if (input !== answers.password) {

              if (repeatAttempts == 3) {
                return true;
              }

              return `Passwords do not match! ${3 - repeatAttempts} attempts remaining`;
            }

            return true;
          }
        }
      ])
        .then(({usePassword, password, passwordRepeat}) => {
          if (!usePassword) {
            return false;
          }

          if (password !== passwordRepeat) {
            cli.log('Passwords could not be matched, exiting key generation.');
            return Promise.reject('password was not matched');
          }
          return password;
        });
    })
    .then((password) => {
      return new Promise((resolve, reject) => {

        this.log(`Generating RSA key pair for '${owner}', standby...`);

        rsa.generateKeyPair({bits: 2048, workers: 2}, function (err, keypair) {
          if (err) {
            return reject(err);
          }
          return resolve({keypair, password});
        });

      });
    })
    .then(({keypair, password}) => {
      cli.log('Encoding keys');
      const privateKeyPem = !password ? pki.privateKeyToPem(keypair.privateKey) : pki.encryptRsaPrivateKey(keypair.privateKey, password);
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

  cli.log(`Private key saved to ${paths.private}`);
  cli.log(`Public key saved to ${paths.public}`);

  return Promise.resolve(true);
}

function getSignedJwt(cli, project, owner) {

  cli.log(`Generating JWT signed by ${owner}`);
  const paths = getKeyPaths(project, owner);

  return new Promise((resolve, reject) => {

    fs.readFile(paths.private, 'utf8', (error, pem) => {

      if (error) {
        return reject(`Keys do not exist for ${owner}. You will need to run 'key generate ${owner}' to create the key pair`);
      }

      return resolve(pem);
    });

  })
    .then((pem) => {

      if (pem.includes('BEGIN ENCRYPTED PRIVATE KEY')) {

        return inquirer.prompt([
          {
            name: 'password',
            type: 'password',
            message: 'Enter private key passphrase',
            validate: (input) => {
              if (!input) {
                return "This private key is encrypted, you must enter a password";
              }

              try {
                const privateKey = pki.decryptRsaPrivateKey(pem, input);
                if (privateKey) {
                  return true;
                }
              } catch (e) {
              }

              return 'Incorrect password';
            }
          }
        ])
          .then(({password}) => {
            const privateKey = pki.decryptRsaPrivateKey(pem, password);
            return pki.privateKeyToPem(privateKey);
          });
      }

      return Promise.resolve(pem)

    })
    .then((pem) => {
      const token = jwt.sign(
        {
          username: process.env.USER
        },
        pem,
        {
          algorithm: 'RS256',
        });

      return {
        jwt:token,
        publicKeyPath: paths.public.replace(project.basePath, '.')
      };
    });

}

module.exports = {task, getSignedJwt};