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
    .action(function (args, callback) {

      const emptyDir = fs.readdirSync(process.cwd()).length === 0;

      const gitConf = git.Config.openDefault();

      let quickstartClonePromise = null;
      let configResponses         = null;
      let repo                    = null;

      return confirmInit(this, !!args.options.c, emptyDir)
        .then((res) => {
          quickstartClonePromise = cloneQuickstart(this);
          // we are explicitly not returning the promise here so the clone is non blocking
        })
        .then(() => getProjectConfig(this, gitConf))
        .then((responses) => {
          configResponses = responses;
          if (!repo){ //cloning quickstart is not complete
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
        .then(() => commitChanges(this, repo, `Initial commit of Ubiquits framework`))
        .then(() => installDependencies(this))
        // @todo .then prompt whether to start watchers, start tour??
        .catch(e => {
          this.log(e.message);
          if (e.message == 'Cancelled') {
            return;
          }
          throw e;
        });

    });

}

function installDependencies(cli) {
  cli.log('Installing dependencies. This will take some time...');
  return new Promise((resolve, reject) => {
    const cmd = spawn('npm', ['install'], {
      cwd: process.cwd(),
      stdio: [0,1,2]
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

function commitChanges(cli, repo, commitMessage) {

  let index = null;

  cli.log(`refreshing index`);
  return repo.refreshIndex()
    .then((idx) => {
      index = idx;
      cli.log(`adding files`);
      return index.addAll();
    })
    .then(() => {

      const totalFileSize = index.entries().reduce((sum, file) => sum + file.fileSize, 0);

      cli.log(`Added ${index.entryCount()} files totalling ${filesize(totalFileSize)}`);

      cli.log(`writing tree`);
      return index.writeTree();
    })
    .then((oid) => {
      cli.log(`committing`);
      const author = git.Signature.default(repo);
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
        vinylFs.src(tmpDest + '/**/*', {cwd: cwd, dot:true})
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

function confirmInit(cli, doConfirm, emptyDir) {
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
    }])
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
function getProjectConfig(cli, gitConf) {
  return cli.prompt([
    {
      name: 'projectName',
      type: 'input',
      default: path.basename(process.cwd()),
      message: `What is your project called?`
    },
    {
      name: 'keywords',
      type: 'input',
      default: 'ubiquits',
      message: `Enter keywords (comma separated)`,
      filter: input => input.split(/[\s,]+/)
    },
    {
      name: 'name',
      type: 'input',
      default: function () {
        var done = this.async();

        gitConf
          .then(config => config.getString("user.name"))
          .then(done);
      },
      message: "What's your name?",
    },
    {
      name: 'description',
      type: 'input',
      message: "Describe your project",
      default: "Test project"
    },
    {
      name: 'email',
      type: 'input',
      default: function () {
        var done = this.async();

        gitConf
          .then(config => config.getString("user.email"))
          .then(done);
      },
      message: "What's your email?",
    },
    {
      name: 'license',
      type: 'list',
      message: "What license for the project?",
      default: 'MIT',
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
        getRemoteGit().then(done).catch(done);
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

module.exports = {task};