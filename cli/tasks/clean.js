const rimraf   = require('gulp-rimraf');
const _        = require('lodash');
const plumber  = require('gulp-plumber');
const inquirer = require('inquirer');

const options = ['coverage', 'lib', 'dist', 'docs'];

function task(cli, project) {

  cli.command('clean [dir]', 'Removes directories')
    .action(function (args, callback) {

      let directoryPromise;

      if (args.dir && _.includes(options, args.dir)) {
        directoryPromise = Promise.resolve({directory: args.dir});
      } else {
        directoryPromise = inquirer.prompt([{
          name: 'directory',
          type: 'list',
          message: 'Which directory?',
          choices: () => {

            let userOptions = options.map((dir) => {
              return {
                value: dir,
                name: `${dir} [${project.paths.destination[dir]}]`,
              };
            });

            userOptions.push({
              value: 'all',
              name: '(All of the above)'
            });

            return userOptions;
          }
        }]);
      }

      return directoryPromise.then((prompt) => clean(project, this, prompt.directory))

    });

}

function clean(project, cli, dir) {
  return new Promise((resolve, reject) => {

    let directory;

    if (_.isArray(dir)){
      directory = dir.map((key) => project.paths.destination[key]);
    } else if (dir == 'all') {
      directory = options.map((key) => project.paths.destination[key]);
    } else {
      directory = project.paths.destination[dir];
    }

    cli.log('Removing directory', directory);

    project.gulp.src(directory, {read: false, cwd: project.basePath})
      .pipe(plumber(reject))
      .pipe(rimraf())
      .on('finish', () => {
        cli.log('Done.');
        resolve();
      });

  });

}

module.exports = {task, clean};