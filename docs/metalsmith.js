const Metalsmith = require('metalsmith');
const markdown   = require('metalsmith-markdown');
const layouts    = require('@xiphiaz/metalsmith-layouts');
const permalinks = require('metalsmith-permalinks');
const serve      = require('metalsmith-serve');
const watch      = require('@xiphiaz/metalsmith-watch');
const prism      = require('metalsmith-prism');
const copy       = require('metalsmith-copy');

function run(metalsmith, source, destination, callback) {
  console.log('source, destination', source, destination);
  metalsmith
    .source(source)
    .destination(destination)
    .build(function (err, files) {
      if (err) {
        throw err;
      }
      callback();
    });
}

function config(task, pathConfig) {

  let metalsmith = Metalsmith(pathConfig.base)
    .metadata({
      title: "Ubiquits",
      description: "Documentation for the Ubiquits framework",
    })
    .clean(true);

  if (task === 'watch') {
    metalsmith
      .use(watch({
        paths: {
          "${source}/**/*": true
        },
        livereload: true
      }))
      .use(serve({
        port: 8081,
        verbose: true,
        http_error_files: {
          404: "/404/index.html"
        }
      }));
  }

  return metalsmith
    .use(markdown({langPrefix: 'language-'}))
    .use(prism({
      lineNumbers: true
    }))
    .use(permalinks())
    .use(layouts({
      engine: 'handlebars',
      directory: pathConfig.templates,
      directoryFallback: __dirname + '/templates',
      partials: pathConfig.partials,
      partialsFallback: __dirname + '/templates/partials'
    }))
    .use(copy({
      pattern: './static/*',
      directory: 'static'
    }));
}

module.exports = {run, config};