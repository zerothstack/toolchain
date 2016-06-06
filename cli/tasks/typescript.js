const sourcemaps = require('gulp-sourcemaps');
const typescript = require('gulp-typescript');
const merge2     = require('merge2');
const path       = require('path');

function task(cli, project) {

  cli.command('build [env]', 'Builds typescript files')
    .action(function (args, callback) {

      return buildServer(project, this);

    });

}

function buildServer(project, cli) {
  return new Promise((resolve, reject) => {
    let config = {
      source: [].concat(project.paths.source.server.ts, project.paths.source.server.definitions),
      destination: project.paths.destination.server,
      tsConfig: project.paths.source.all.tsConfig
    };

    cli.log('Building ts', config);

    const tsProject = typescript.createProject(config.tsConfig);
    const tsResult  = project.gulp.src(config.source, {
      cwd: project.basePath,
      base: project.paths.source.base
    })
      .pipe(sourcemaps.init())
      .pipe(typescript(tsProject));

    merge2([ // Merge the two output streams, so this task is finished when the IO of both operations are done.
      tsResult.dts
        .pipe(project.gulp.dest(config.destination)),
      tsResult.js
        .pipe(sourcemaps.write('.', {sourceRoot: path.resolve(project.basePath, project.paths.source.base)}))
        .pipe(project.gulp.dest(config.destination))
    ]).on('finish', resolve);
  });

}

module.exports = {task, buildServer};