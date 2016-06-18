const path     = require('path');
const fs       = require('fs-extra');
const chalk    = require('chalk');
const git      = require('nodegit');
const init     = require('init-package-json');
const vinylFs  = require('vinyl-fs');
const filesize = require('filesize');
const {spawn}  = require('child_process');

function task(cli, project) {

  cli.command('init', 'Initializes new Ubiquits project')
    .option('-c', '--confirm', 'Confirm with the user if they want to initialize a new project')
    .option('-y', '--yes', 'Accept all defaults')
    .option('-s', '--skip-install', 'Skip installation')
    .action(function (args, callback) {

      const emptyDir = fs.readdirSync(process.cwd()).length === 0;

      const gitConf = git.Config.openDefault();

      const useDefaults = !!args.options.y;
      const skipInstall = !!args.options.s;

      let quickstartClonePromise = null;
      let configResponses        = null;
      let repo                   = null;

      return confirmInit(this, useDefaults, !!args.options.c, emptyDir)
        .then((res) => {
          quickstartClonePromise = cloneQuickstart(this);
          // we are explicitly not returning the promise here so the clone is non blocking
        })
        .then(() => getProjectConfig(this, useDefaults, gitConf))
        .then((responses) => {
          configResponses = responses;
          if (!repo) { //cloning quickstart is not complete
            this.log('Standby while the quickstart files download...');
          }
          //at this point we need the repo to be finished cloning
          return quickstartClonePromise
            .then(r => repo = r); //extract the repo var for later
        })
        .then(() => {

          this.log('Writing package.json', configResponses);
          return new Promise((resolve, reject) => {
            const initFile = path.resolve(__dirname, '..', 'npmInit.js');
            init(process.cwd(), initFile, {yes: true, responses: configResponses}, (err, data) => {
              // the data's already been written to {dir}/package.json
              // now you can do stuff with it
              if (err) {
                return reject(err);
              }
              return resolve(data);
            })
          });

        })
        .then(() => commitChanges(this, repo, `Initial commit of Ubiquits framework`, configResponses))
        .then(() => installDependencies(this, skipInstall))
        // @todo .then prompt whether to start watchers, start tour??
        .catch(e => {
          if (e.message == 'Cancelled') {
            return;
          }
          throw e;
        });

    });

}

function installDependencies(cli, skip) {

  if (skip) {
    cli.log('Skipping dependency install. You will need to do this manually with `npm install`');
    return Promise.resolve();
  }

  cli.log('Installing dependencies. This will take some time...');
  return new Promise((resolve, reject) => {
    const cmd = spawn('npm', ['install'], {
      cwd: process.cwd(),
      stdio: [0, 1, 2]
    });

    cmd.on('close', (code) => {
      if (code !== 0) {
        throw new Error(`child process exited with code ${code}`);
      }

      resolve();
    });

    cmd.on('error', (err) => {
      throw err;
    });
  });
}

function commitChanges(cli, repo, commitMessage, configResponses) {

  let index = null;

  cli.log(`refreshing index`);
  return repo.refreshIndex()
    .then((idx) => {
      index = idx;
      cli.log(`adding files`);
      return index.addAll();
    })
    .then(() => {

      const totalFileSize = index.entries()
        .reduce((sum, file) => sum + file.fileSize, 0);

      cli.log(`Added ${index.entryCount()} files totalling ${filesize(totalFileSize)}`);

      cli.log(`writing tree`);
      return index.writeTree();
    })
    .then((oid) => {
      cli.log(`committing`);
      let author = git.Signature.default(repo);
      if (!author) {
        author = git.Signature.now(configResponses.name, configResponses.email)
      }

      return repo.createCommit("HEAD", author, author, commitMessage, oid, []);
    })
    .then((oid) => {
      return git.Commit.lookup(repo, oid);
    })
    .then((commit) => {
      cli.log(`resetting head`);
      return git.Reset(repo, commit, git.Reset.TYPE.HARD);
    })
}

/**
 * Clone the quickstart into the current working directory
 * @param cli
 * @returns {*}
 */
function cloneQuickstart(cli) {
  cli.log('cloning quickstart...');
  const cwd     = process.cwd();
  const tmpDest = cwd + '/_tmp_quickstart';

  fs.emptyDirSync(tmpDest);
  return git.Clone("https://github.com/ubiquits/quickstart.git", tmpDest, {
    fetchOpts: {
      callbacks: {
        // github will fail cert check on some OSX machines this overrides that check
        certificateCheck: () => 1
      }
    }
  })
    .then(() => {

      return new Promise((resolve, reject) => {
        //delete the git history
        fs.removeSync(tmpDest + '/.git');

        //stream files into the current working directory, not overwriting any files
        vinylFs.src(tmpDest + '/**/*', {cwd: cwd, dot: true})
          .pipe(vinylFs.dest(cwd, {overwrite: false}))
          .on('end', () => {
            fs.removeSync(tmpDest);
            resolve();
          });
      });

    })
    .then(() => {
      return git.Repository.init(cwd, 0);
    });
}

function confirmInit(cli, forceAccept, doConfirm, emptyDir) {
  if (forceAccept) {
    return Promise.resolve();
  }
  return cli.prompt([
    {
      name: 'confirm',
      type: 'confirm',
      default: true,
      when: doConfirm,
      message: `Would you like to initialize a new project?`,
    },
    {
      name: 'confirm',
      type: 'confirm',
      default: true,
      when: (responses) => responses.confirm !== false && !emptyDir,
      message: `You are running initialize in a non-empty directory\n` +
      chalk.red(`All files in this directory will be removed! Are you sure you want to do that?`),
    }
  ])
    .then((response) => {
      if (!response.confirm) {
        throw new Error('Cancelled');
      }
      return response;
    });
}

/**
 * Prompt the user for configuration options
 * @returns {string|*}
 */
function getProjectConfig(cli, forceDefaults, gitConf) {

  const defaults = {
    projectName: path.basename(process.cwd()),
    keywords: 'ubiquits',
    name: gitConf.then(config => config.getString("user.name"))
      .catch(() => ''),
    description: "Test project",
    email: gitConf.then(config => config.getString("user.email"))
      .catch(() => ''),
    license: 'MIT',
    remote: false,
  };

  if (forceDefaults) {
    return promisedProperties(defaults);
  }

  return cli.prompt([
    {
      name: 'projectName',
      type: 'input',
      default: defaults.projectName,
      message: `What is your project called?`
    },
    {
      name: 'keywords',
      type: 'input',
      default: defaults.keywords,
      message: `Enter keywords (comma separated)`,
      filter: input => input.split(/[\s,]+/)
    },
    {
      name: 'name',
      type: 'input',
      default: function () {
        var done = this.async();
        defaults.email.then(done);
      },
      message: "What's your name?",
    },
    {
      name: 'description',
      type: 'input',
      message: "Describe your project",
      default: defaults.description
    },
    {
      name: 'email',
      type: 'input',
      default: function () {
        var done = this.async();
        defaults.email.then(done);
      },
      message: "What's your email?",
    },
    {
      name: 'license',
      type: 'list',
      message: "What license for the project?",
      default: defaults.license,
      choices: [
        {value: 'MIT', name: 'MIT License'},
        {value: 'ISC', name: 'ISC License'},
        {value: 'Apache-2.0', name: 'Apache License 2.0'},
        {value: 'BSD-2-Clause', name: 'BSD 2-clause "Simplified" License'},
        {value: 'BSD-3-Clause', name: 'BSD 3-clause "New" or "Revised" License'},
        'UNLICENSED',
        'other'
      ]
    },
    {
      name: 'license',
      type: 'input',
      message: "Enter your license",
      when: (responses) => responses.license == 'other'
    },
    {
      name: 'remote',
      type: 'confirm',
      message: "Configure remote repo?",
      default: true,
    },
    {
      name: 'remote',
      type: 'input',
      message: "Enter your remote repo e.g. git@github.com:username/repo.git",
      when: (responses) => responses.remote == true,
      default: function () {
        var done = this.async();
        getRemoteGit()
          .then(done)
          .catch(done);
      },
    },
  ]);
}

/**
 * Read the local .git dir to try find remote,
 * returns formatted for npm
 * @see https://github.com/npm/init-package-json/blob/master/default-input.js#L183 for origin source
 * @returns {Promise}
 */
function getRemoteGit() {
  return new Promise((resolve, reject) => {
    fs.readFile('.git/config', 'utf8', (error, gitConfig) => {
      if (error || !gitConfig) {
        return resolve();
      }
      gitConfig         = gitConfig.split(/\r?\n/);
      const remoteIndex = gitConfig.indexOf('[remote "origin"]');
      let repo          = null;
      if (remoteIndex !== -1) {
        repo = gitConfig[remoteIndex + 1];
        if (!repo.match(/^\s*url =/)) {
          repo = gitConfig[remoteIndex + 2];
        }
        if (!repo.match(/^\s*url =/)) {
          repo = null
        } else {
          repo = repo.replace(/^\s*url = /, '')
        }
      }

      if (repo && repo.match(/^git@github.com:/)) {
        repo = repo.replace(/^git@github.com:/, 'https://github.com/')
      }

      return resolve(repo);
    })
  })

}

function promisedProperties(object) {

  let promisedProperties = [];
  const objectKeys       = Object.keys(object);

  objectKeys.forEach((key) => promisedProperties.push(object[key]));

  return Promise.all(promisedProperties)
    .then((resolvedValues) => {
      return resolvedValues.reduce((resolvedObject, property, index) => {
        resolvedObject[objectKeys[index]] = property;
        return resolvedObject;
      }, object);
    });

}

module.exports = {task};