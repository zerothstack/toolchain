const tslint  = require('gulp-tslint');
const plumber = require('gulp-plumber');

function task(cli, project) {

  cli.command('lint', 'Run tslint on project files')
    .alias('tslint')
    .alias('eslint')
    .action(function (args, callback) {

      this.log('Linting files');
      project.gulp.src(project.paths.source.server.ts, {cwd: project.basePath})

        .pipe(plumber(callback))
        .pipe(tslint())
        .pipe(tslint.report('verbose'))
        .on('finish', () => {
          this.log('Done.');
          callback();
        });

    });

}

module.exports = {task};