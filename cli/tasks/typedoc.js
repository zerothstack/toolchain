const sourcemaps = require('gulp-sourcemaps');
const typescript = require('gulp-typescript');
const merge2     = require('merge2');
const path       = require('path');
const typedoc    = require('gulp-typedoc');
const _          = require('lodash');
const plumber  = require('gulp-plumber');

function task(cli, project) {

  cli.command('typedoc', 'Builds typescript documentation')
    .alias('tsdoc')
    .action(function (args, callback) {

      return buildTypedoc(project, this);
    });

}

function buildTypedoc(project, cli) {
  return new Promise((resolve, reject) => {

    cli.log('Building typescript documentation');

    const config = _.merge(require(project.paths.source.all.tsConfig).compilerOptions, {
      // TypeScript options (see typescript docs)
      // module: "commonjs",
      // target: "es5",
      // includeDeclarations: true,

      // Output options (see typedoc docs)
      out: project.paths.destination.docs + '/typedoc',
      // json: this.paths.destination.docs + '/api.json',

      // TypeDoc options (see typedoc docs)
      // name: "my-project",
      readme: 'none',
      theme: path.resolve(__dirname, '../..', 'docs/api'),
      // plugins: ["my", "plugins"],
      ignoreCompilerErrors: true, //@todo remove when tsdoc properly supports ts@2.0
      version: true,
    });

    // remove sourceRoot as it breaks tsdoc for some reason
    delete config.sourceRoot;

    project.gulp
      .src(["src/**/*.ts", '!**/*.spec.ts'])
      .pipe(plumber(reject))
      .pipe(typedoc(_.omit(config, [
        'sourceMap',
        'removeComments',
        'declaration',
      ])))
      .on('finish', resolve);

  });

}

module.exports = {task, buildTypedoc};