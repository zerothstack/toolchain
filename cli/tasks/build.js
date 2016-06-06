const sourcemaps = require('gulp-sourcemaps');
const typescript = require('gulp-typescript');
const merge2     = require('merge2');
const path       = require('path');

function task(cli, project) {

  cli.command('build [environment]', 'Builds typescript files')
    .action(function (args, callback) {

      return build(project, this, args.environemnt);
    });

}

function build(project, cli, context) {
  return new Promise((resolve, reject) => {

    let config = {};
    const allConfig = {
      source: [].concat(project.paths.source.all.ts, project.paths.source.all.definitions),
      destination: project.paths.destination.lib,
      tsConfig: project.paths.source.all.tsConfig
    };

    const serverConfig = {
      source: [].concat(project.paths.source.server.ts, project.paths.source.server.definitions),
      destination: project.paths.destination.server,
      tsConfig: project.paths.source.all.tsConfig
    };

    switch (context) {

      case 'server':
        config = serverConfig;
        break;
      default:
        config = allConfig;
    }

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

module.exports = {task, build};