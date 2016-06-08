const git      = require('nodegit');
const filesize = require('filesize');
const path     = require('path');
const {spawn}       = require('child_process');

const {clean} = require('./clean');
const {buildDocs} = require('./doc');
const {buildTypedoc} = require('./typedoc');

function task(cli, project) {

  cli.command('deploy docs', 'Deploys documentation to git remote')
    .option('-r', '--rebuild', 'Rebuild the documentation')
    .action(function (args, callback) {

      let buildPromise = (doBuild) => {

        if (!doBuild) {
          return Promise.resolve();
        }

        return clean(project, this, 'docs')
          .then(() => buildDocs(project, this))
          .then(() => buildTypedoc(project, this));
      };

      return buildPromise(args.options.r)
        .then(() => gitDeploy(project, this, project.deploymentConfig.docs))

    });

}

function gitDeploy(project, cli, config) {

  return new Promise((resolve) => {


  const dir     = path.resolve(project.basePath, config.dir);
  const pkg     = require(project.basePath + '/package.json');
  const repoUrl = pkg.repository.url.split(/\.git$|^git\+/).filter(p=>!!p).pop();

  let index, baseRepository, repository, author, commit;



  return git.Repository.open(project.basePath)
    .then((repo) => {
      baseRepository = repo;
      cli.log(`finding last commit at ${project.basePath}`);
      return repo.getHeadCommit();
    })
    .then((c) => {
      commit = c;
      author = commit.author();
      cli.log(`Found commit: ${author.name()} - ${commit.message()}`);
    })
    .then(() => {
      cli.log(`Initializing repo at ${dir}`);
      return git.Repository.init(dir, 0);
    })
    .then((repo) => {
      repository = repo;
      cli.log(`refreshing index`);
      return repo.refreshIndex();
    })
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
      return repository.createCommit("HEAD", author, author, `Docs deploy: | ${commit.message()} - ${repoUrl}/commit/${commit.id()}`, oid, []);
    })
    .then(() => {
      if (!!config.repo) {
        cli.log(`creating configure repo remote`);
        return git.Remote.create(repository, config.remote, config.repo);
      }

      cli.log(`retrieving remote url from parent repo`);
      return git.Remote.lookup(baseRepository, config.remote)
        .then((remote) => {
          cli.log(`found remote url ${remote.url()}`);

          if (remote.name() == 'origin' && config.branch == 'master') {
            throw new Error(`refusing to set remote to root origin and branch to master. You probably want to configure brance gh-pages or a different repo`);
          }

          return git.Remote.create(repository, remote.name(), remote.url());
        });
    })
    .then((remote) => {
      cli.log(`added remote: ${remote.name()} ${remote.url()}`);
      cli.log(`pushing`);

      let certCheckCount = 0;

      return remote.push([`+refs/heads/master:refs/heads/${config.branch}`], {
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
        return new Promise((resolve, reject) => {
          const cmd = spawn('git', ['push', remote.name(), `HEAD:${config.branch}`, '-f'], {
            cwd: dir,
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

      });
    })
    .then(() => {
      cli.log(`Push complete.`);
      resolve();
    });


  });

}

module.exports = {task, clean};