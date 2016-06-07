const path           = require('path');
const vinylFs        = require('vinyl-fs');
const metalsmithTask = require('../../docs/metalsmith');

function task(cli, project) {

  cli.command('doc <task>', 'Build documentation files')
    .action(function (args, callback) {

      // @todo add watch stop functionality
      return buildDocs(project, this, args.task);
    });

}

function buildDocs(project, cli, task) {
  return new Promise((resolve, reject) => {

    const config = metalsmithTask.config(task, project.paths.source.docs);
    const source = path.resolve(project.basePath, project.paths.source.docs.base);
    const dest   = path.resolve(project.basePath, project.paths.destination.docs);

    metalsmithTask.run(config, source, dest, () => {

      cli.log('copying assets');

      vinylFs.src('docs/assets/**/*', {cwd: path.resolve(__dirname, '../..')})
        .pipe(vinylFs.dest(dest + '/assets', {overwrite: false}))
        .on('end', () => {
          resolve();
        });
    });

  });

}

module.exports = {task, buildDocs};