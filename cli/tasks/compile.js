const fs            = require('fs');
const path          = require('path');

const gulpWebpack    = require('webpack-stream');
const gutil          = require('gulp-util');

const {build} = require('./build');
const {clean} = require('./clean');

function task(cli, project) {

  cli.command('compile [environment]', 'Compile environments for distribution')
    .option('-s', '--serial', 'Run environments in serial (default is parallel)')
    .action(function (args, callback) {

      return clean(project, this, ['dist', 'lib'])
        .then(() => {
          let compilePromiseFactories = [];

          if (!args.environment || args.environment == 'server') {
            let serverCompile = build(project, this, 'server');
            compilePromiseFactories.push(() => serverCompile);
          }

          if (!args.environment || args.environment == 'browser') {
            compilePromiseFactories.push(() => compileBrowser(project, this));
          }

          if (args.options.s){
            //run promises in serial
            return compilePromiseFactories.reduce((prior, next) => {
              return prior.then(() => next());
            }, Promise.resolve()); // initial
          }

          return Promise.all(compilePromiseFactories.map(pf => pf()));
        });

    });

}

function compileBrowser(project, cli) {

  return new Promise((resolve, reject) => {

    cli.log('Compiling browser');

    const config = {
      webpackPath: path.resolve(__dirname, '../..', 'browser/webpack.prod.js'),
      destination: project.paths.destination.browser
    };

    const webpackConfig = require(config.webpackPath);

    webpackConfig.progress = true;

    return project.gulp.src('.')
      .pipe(gulpWebpack(webpackConfig, null, (err, stats) => {
        if (err) {
          throw new gutil.PluginError("webpack", err);
        }
        cli.log("[webpack]", stats.toString({
          chunkModules: false,
          colors: gutil.colors.supportsColor,
        }));
      }))
      .pipe(project.gulp.dest(config.destination))
      .on('finish', resolve)

  });

}

module.exports = {task};