const path           = require('path');
const vinylFs        = require('vinyl-fs');
const metalsmithTask = require('../../docs/metalsmith');

const {clean} = require('./clean');

function task(cli, project) {

  let shutdownCallback = null;

  const options = ['build', 'watch', 'start'];

  cli.command('docs <command>', 'Build [and watch] documentation files')
    .alias('doc')
    .autocomplete(options)
    .validate((args) => {

      switch (args.command) {
        case 'build':
          return true;
        case 'stop':
          if (!shutdownCallback) {
            return `Watcher is not running, run 'doc watch' to start it`;
          }
          return true;
        case undefined:
        case 'watch':
          if (!!shutdownCallback) {
            return `Watcher is already running, run 'doc stop' to cancel`;
          }
          return true;
        default:
          return `Unrecognised option ${args.command}, should be one of [${options.join(', ')}]`;
      }
    })
    .action(function (args, callback) {

      switch (args.command) {
        case 'stop':
          shutdownCallback(() => {
            callback('Watcher halted');
            shutdownCallback = null;
          });
          return;
        case 'build':
        case 'watch':
          return clean(project, this, 'docs')
            .then(() => buildDocs(project, this, args.command))
            .then((shutdown) => {
              shutdownCallback = shutdown;
              if (shutdown) {
                cli.log(`Doc watcher started. Run 'doc stop' to stop the watch server`);
              }
            });
      }
    });

}

function buildDocs(project, cli, task) {

  const isWatch = task === 'watch';

  const config = metalsmithTask.config(project.paths.source.docs, isWatch);
  const source = path.resolve(project.basePath, project.paths.source.docs.base);
  const dest   = path.resolve(project.basePath, project.paths.destination.docs);

  return metalsmithTask.run(config, isWatch, source, dest)
    .then((shutdown) => {

      return new Promise((resolve, reject) => {

        cli.log('Copying doc assets from toolchain');

        vinylFs.src('docs/assets/**/*', {cwd: path.resolve(__dirname, '../..')})
          .pipe(vinylFs.dest(dest + '/assets', {overwrite: false}))
          .on('end', () => {
            resolve();
          });
      }).then(() => shutdown);

    });

}

module.exports = {task, buildDocs};