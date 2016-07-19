const _        = require('lodash');
const inquirer = require('inquirer');
const fs       = require('fs-extra');

const options = ['coverage', 'lib', 'dist', 'docs'];

function task(cli, project) {

  cli.command('clean [dir]', 'Clears directories')
    .action(function (args, callback) {

      let directoryPromise;

      if (args.dir && _.includes(options, args.dir)) {
        directoryPromise = Promise.resolve({directory: args.dir});
      } else {
        directoryPromise = inquirer.prompt([
          {
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
          }
        ]);
      }

      return directoryPromise.then((prompt) => clean(project, this, prompt.directory))

    });

}

function clean(project, cli, dir) {

  let directories;

  if (_.isArray(dir)) {
    directories = dir.map((key) => project.paths.destination[key]);
  } else if (dir == 'all') {
    directories = options.map((key) => project.paths.destination[key]);
  } else {
    directories = [project.paths.destination[dir]];
  }

  cli.log('Cleaning directories', directories);

  const emptyPromises = directories.map((dir) => {
    return new Promise((resolve, reject) => {
      fs.emptyDir(dir, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      })
    });
  });

  return Promise.all(emptyPromises);
}

module.exports = {task, clean};