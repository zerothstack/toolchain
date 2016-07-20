const git      = require('nodegit');
const filesize = require('filesize');
const path     = require('path');
const {spawn}       = require('child_process');

const {clean} = require('./clean');
const {buildDocs} = require('./doc');
const {buildTypedoc} = require('./typedoc');

function task(cli, project) {

  cli.command('deploy docs', 'Deploys documentation to git remote')
    .option('-r, --rebuild', 'Rebuild the documentation')
    .action(function (args, callback) {

      let buildPromise = (doBuild) => {

        if (!doBuild) {
          return Promise.resolve();
        }

        return clean(project, this, 'docs')
          .then(() => buildDocs(project, this))
          .then(() => buildTypedoc(project, this));
      };

      return buildPromise(args.options.rebuild)
        .then(() => gitDeploy(project, this, project.deploymentConfig.docs))

    });

}

/**
 * Deploy directory using git
 * @param project
 * @param cli
 * @param config
 * @returns {Promise}
 */
function gitDeploy(project, cli, config) {

  return new Promise((resolve, reject) => {

    const dir        = path.resolve(project.basePath, config.dir);
    const pkg        = require(project.basePath + '/package.json');
    const repoUrl    = pkg.repository.url.split(/\.git$|^git\+/).filter(p=>!!p).pop();
    const initBranch = 'deploy';

    let index, baseRepository, deployRepository, remote, author, indexId, commit;
    let noRemoteBranch = false;

    return git.Repository.open(project.basePath)
      .then((repo) => {
        baseRepository = repo;
        cli.log(`Finding last commit at ${project.basePath}`);
        return repo.getHeadCommit();
      })
      .then((c) => {
        commit             = c;
        const commitAuthor = commit.author();
        author             = git.Signature.now(commitAuthor.name(), commitAuthor.email());
        cli.log(`Retrieved commit details from parent: ${commitAuthor.name()} - ${commit.message()}`);
      })
      .then(() => {
        cli.log(`Initializing repo at ${dir}`);
        return git.Repository.initExt(dir, {
          initialHead: initBranch
        }).then(r => deployRepository = r);
      })
      .then(() => getRemoteRepo(cli, config, baseRepository, deployRepository).then(r => remote = r))
      .then(() => deployRepository.refreshIndex())
      .then((idx) => {
        index = idx;
        cli.log(`Adding files`);
        return index.addAll();
      })
      .then(() => {
        const totalFileSize = index.entries().reduce((sum, file) => sum + file.fileSize, 0);
        cli.log(`Added ${index.entryCount()} files totalling ${filesize(totalFileSize)}`);
        cli.log(`Writing tree`);
        return index.writeTree().then(oid => indexId = oid);
      })
      .then(() => {
        return fetchRemote(cli, config, remote, dir)
          .catch((e) => noRemoteBranch = true); //remote doesn't exist, create local branch
      })
      .then(() => {
        if (noRemoteBranch) {
          return commitOnHead(cli, config, deployRepository, commit, author, indexId, repoUrl)
        } else {
          return commitOnParent(cli, config, deployRepository, commit, author, indexId, repoUrl);
        }
      })
      .then((oid) => {
        return git.Commit.lookup(deployRepository, oid);
      })
      .then((commit) => {
        cli.log(`resetting head`);
        return git.Reset(deployRepository, commit, git.Reset.TYPE.HARD);
      })
      .then(() => pushChanges(cli, config, remote, dir))
      .then(() => {
        cli.log(`Push complete.`);
        resolve();
      }).catch((e) => {
        switch (e.message) {
          case 'no_changes':
            cli.log('No changes, exiting');
            break;
          default:
            throw reject(e);
        }
      });

  });

}

/**
 * Fetch the source from the remote
 * @param cli
 * @param config
 * @param dir
 * @returns {*}
 */
function fetchRemote(cli, config, remote, dir) {

  let certCheckCount = 0;

  cli.log(`fetching remote ${config.branch}`);
  return remote.fetch(config.branch, {
    callbacks: {
      certificateCheck: () => 1,
      credentials: (url, userName) => {
        if (certCheckCount >= 1) {
          throw new Error('Runaway certificate checking detected, aborting')
        }
        cli.log(`getting creds from agent url:${url} username:${userName}`);
        certCheckCount++;
        return git.Cred.sshKeyFromAgent(userName);
      },
      transferProgress: (progress) => {
        cli.log('progress: ', progress)
      }
    }
  })
    .catch((e) => {

      if (e.message !== 'Callback failed to initialize SSH credentials') {
        throw e;
      }

      cli.log('nodegit push failed, falling back to native shell');
      return promisedSpawn('git', ['fetch', remote.name(), config.branch], dir);
    })
}

/**
 * Push chaneges to the remote
 * @param cli
 * @param config
 * @param remote
 * @param dir
 * @returns {*}
 */
function pushChanges(cli, config, remote, dir) {

  cli.log('pushing changes');

  let certCheckCount = 0;

  return remote.push([`+HEAD:${config.branch}`], {
    callbacks: {
      certificateCheck: () => 1,
      credentials: (url, userName) => {
        if (certCheckCount >= 1) {
          throw new Error('Runaway certificate checking detected, aborting')
        }
        cli.log(`getting creds from agent url:${url} username:${userName}`);
        certCheckCount++;
        return git.Cred.sshKeyFromAgent(userName);
      },
      transferProgress: (progress) => {
        cli.log('progress: ', progress)
      }
    }
  }).catch((e) => {

    cli.log('nodegit push failed, falling back to native shell');
    return promisedSpawn('git', ['push', remote.name(), `HEAD:${config.branch}`], dir);

  });

}

/**
 * Promisifies the spawn command
 * @param command
 * @param args
 * @param cwd
 * @returns {Promise}
 */
function promisedSpawn(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, {
      cwd: cwd,
      stdio: [0, 1, 2]
    });

    cmd.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`child process exited with code ${code}`));
      }

      resolve();
    });

    cmd.on('error', (err) => {
      return reject(err);
    });
  });
}

function commitOnHead(cli, config, deployRepository, commit, author, indexId, repoUrl) {

  cli.log(`committing`);
  return deployRepository.createCommit("HEAD", author, author, `First Docs deploy: | ${commit.message()} - ${repoUrl}/commit/${commit.id()}`, indexId, []);
}

/**
 * Commit on top of the fetched parent branch
 * @param cli
 * @param config
 * @param deployRepository
 * @param commit
 * @param author
 * @param indexId
 * @param repoUrl
 * @returns {*}
 */
function commitOnParent(cli, config, deployRepository, commit, author, indexId, repoUrl) {

  let parentCommit;

  cli.log(`Checking out fetched remote branch ${config.remote}/${config.branch}`);
  return git.Branch.lookup(deployRepository, `${config.remote}/${config.branch}`, git.Branch.BRANCH.REMOTE)
    .then((ref) => {
      cli.log('Checking out branch ref and force-merging all changes');
      return deployRepository.checkoutRef(ref, {
        checkoutStrategy: git.Checkout.STRATEGY.ALLOW_CONFLICTS | git.Checkout.STRATEGY.USE_OURS
      });
    })
    .then(() => {
      cli.log('Finding head commit reference');
      return git.Reference.nameToId(deployRepository, "HEAD")
    })
    .then((head) => {
      cli.log('Retrievig commit object');
      return deployRepository.getCommit(head).then(parent => parentCommit = parent)
    })
    .then(() => {
      cli.log('Checking status');
      return deployRepository.getStatus()
        .then((statuses) => {
          if (statuses.length === 0) {
            throw new Error('no_changes');
          }
          // @todo resolve why the status is NEW for all with the allow conflict strategy
          cli.log(`${statuses.length} changes detected, committing and pushing them`);
        });
    })
    .then(() => {
      cli.log('Committing changes');
      return deployRepository.createCommit("HEAD", author, author, `Docs deploy: | ${commit.message()} - ${repoUrl}/commit/${commit.id()}`, indexId, [parentCommit]);
    });

}

/**
 * Get remote repository from config or parent, then register it against the deploy repo
 * @param cli
 * @param config
 * @param baseRepository
 * @param deployRepository
 * @returns {Promise<TResult>|Promise<U>|Promise.<TResult>}
 */
function getRemoteRepo(cli, config, baseRepository, deployRepository) {

  return Promise.resolve()
    .then(() => {
      if (!!config.repo) {
        cli.log(`creating configure repo remote`);
        return git.Remote.create(deployRepository, config.remote, config.repo);
      }

      cli.log(`retrieving remote url from parent repo`);
      return git.Remote.lookup(baseRepository, config.remote)
        .then((remote) => {
          cli.log(`found remote url ${remote.url()}`);

          if (remote.name() == 'origin' && config.branch == 'master') {
            throw new Error(`refusing to set remote to root origin and branch to master. You probably want to configure brance gh-pages or a different repo`);
          }

          if (remote.url().match(/@/)) { //check for @, assume ssl
            return git.Remote.create(deployRepository, remote.name(), remote.url());
          }

          const githubMatcher = /http[s]:\/\/github.com\/(.+?.git)/;

          let match = remote.url().match(githubMatcher);

          if (!match) {
            throw new Error('Non-github https url provided, could not translate to ssl remote. You will need to manually configure the remote setting');
          }

          let sslUrl = `git@github.com:${match[1]}`;

          cli.log(`HTTPS github remote url detected, translated to ssl url: ${sslUrl}`);

          return git.Remote.create(deployRepository, remote.name(), sslUrl);
        });
    }).then((remote) => {
      cli.log(`added remote: ${remote.name()} ${remote.url()}`);
      return remote;
    });

}

module.exports = {task, clean};