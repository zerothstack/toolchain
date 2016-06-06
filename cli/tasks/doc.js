
function task(cli, project) {

  cli.command('doc', 'Build documentation files')
    .action(function (args, callback) {

      return buildDocs(project, this);
    });

}

function buildDocs(project, cli, context) {
  return new Promise((resolve, reject) => {

    cli.log('@todo run metalsmith (watch)');
    resolve();

  });

}

module.exports = {task};