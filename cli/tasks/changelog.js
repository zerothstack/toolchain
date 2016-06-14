const changelog = require('conventional-changelog');
const fs        = require('fs');

function task(cli, project) {

  cli.command('changelog', 'Generates changelogs')
    .action(function (args, callback) {
      return buildChangelog(project, this);
    });

}

function buildChangelog(project, cli) {
  cli.log('Generating changelog');
  return new Promise((resolve, reject) => {

    return changelog({
      preset: 'angular',
      releaseCount: 0
    })
      .pipe(fs.createWriteStream(project.resolvePath('CHANGELOG.md')))
      .on('end', resolve)
      .on('error', reject);

  });

}

module.exports = {task, buildChangelog};