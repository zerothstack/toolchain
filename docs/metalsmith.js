const Metalsmith    = require('metalsmith');
const markdown      = require('metalsmith-markdown');
const layouts       = require('@xiphiaz/metalsmith-layouts');
const permalinks    = require('metalsmith-permalinks');
const serve         = require('metalsmith-serve');
const watch         = require('@xiphiaz/metalsmith-watch');
const prism         = require('metalsmith-prism');
const collections   = require('metalsmith-collections');
const define        = require('metalsmith-define');
const dateFormatter = require('metalsmith-date-formatter');
const headings      = require('metalsmith-headings');
const handlebars    = require('handlebars');
const util          = require('util');
const _             = require('lodash');

handlebars.registerHelper('debug', (optionalValue) => {

  if (optionalValue) {
    return util.inspect(optionalValue, {depth: 10});
  }

  return util.inspect(this, {depth: 10});
});

handlebars.registerHelper('ifEqual', (a, b, str) => {
  return _.isEqual(a, b) ? str : null;
});

handlebars.registerHelper('ifIncludes', (a, b, str) => {
  return _.includes(a, b) ? str : null;
});

handlebars.registerHelper('ifHasSubnav', function (section, allCollections, options) {

  let collection = allCollections[section.path];

  if (collection) {
    return options.fn({collection, title: section.title});
  }
  return options.inverse(this);
});

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
          404: "/404.html"
        }
      }));
  }

  return metalsmith
    .use(define({
      pkg: require(pathConfig.root + '/package.json'),
    }))
    .use(markdown({langPrefix: 'language-'}))
    .use(headings({selectors: ['h2', 'h3']}))
    .use(prism({
      lineNumbers: true
    }))
    .use(collections({
      main: {
        sortBy: 'collectionSort',
      },
      guide: {
        sortBy: 'collectionSort',
      }
    }))
    .use(permalinks({relative: false}))
    .use(dateFormatter())
    .use(layouts({
      engine: 'handlebars',
      directory: pathConfig.templates,
      directoryFallback: __dirname + '/templates',
      partials: pathConfig.partials,
      partialsFallback: __dirname + '/templates/partials',
      exposeConsolidate: (requires) => {
        requires.handlebars = handlebars;
      }
    }));
}

module.exports = {run, config};