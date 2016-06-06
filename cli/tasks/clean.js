const rimraf = require('gulp-rimraf');
const _      = require('lodash');

module.exports = (cli, project) => {

  cli.command('clean [dir]', 'Removes directories')
    .autocomplete(['lib', 'coverage', 'dist'])
    .action(function (args, callback) {

      const options = ['coverage', 'lib', 'dist'];

      let directoryPromise;

      if (args.dir && _.includes(options, args.dir)){
        directoryPromise = Promise.resolve({directory:args.dir});
      }else {
        directoryPromise = this.prompt([{
          name: 'directory',
          type: 'list',
          message: 'Which directory?',
          choices: () => {

            let userOptions = options.map((dir) => {
              return {
                value: project.paths.destination[dir],
                name: `${dir} [${project.paths.destination[dir]}]`,
              };
            });

            userOptions.push({
              value: userOptions.map(option => option.value),
              name: '(All of the above)'
            });

            return userOptions;
          }
        }]);
      }

      directoryPromise.then((prompt) => {

        this.log('Removing directory', prompt.directory);
        project.gulp.src(prompt.directory, {read: false, cwd: project.basePath})
          .pipe(rimraf())
          .on('finish', () => {
            this.log('Done.');
            callback();
          });
      })

    });

};