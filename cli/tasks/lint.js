const tslint = require('gulp-tslint');

function task(cli, project) {

  cli.command('lint', 'Run tslint on project files')
    .alias('tslint')
    .alias('eslint')
    .action(function (args, callback) {

      this.log('Linting files');

      project.gulp.src(project.paths.source.server.ts, {cwd: project.basePath})

        .pipe(tslint())
        .pipe(tslint.report('verbose'))
        .on('finish', () => {
          this.log('Done.');
          callback();
        })
        .on('error', (e) => {
          callback();
        });

    });

}

module.exports = {task};