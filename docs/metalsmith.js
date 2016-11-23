const Metalsmith         = require('metalsmith');
const markdown           = require('metalsmith-markdown');
const layouts            = require('@xiphiaz/metalsmith-layouts');
const permalinks         = require('metalsmith-permalinks');
const serve              = require('@xiphiaz/metalsmith-serve');
const watch              = require('@xiphiaz/metalsmith-watch');
const prism              = require('metalsmith-prism');
const collections        = require('metalsmith-collections');
const drafts             = require('metalsmith-drafts');
const define             = require('metalsmith-define');
const dateFormatter      = require('metalsmith-date-formatter');
const headingsidentifier = require('metalsmith-headings-identifier');
const headings           = require('@xiphiaz/metalsmith-headings');
const handlebars         = require('handlebars');
const util               = require('util');
const path               = require('path');
const fs                 = require('fs');
const _                  = require('lodash');
const marked             = require('marked');

const renderer = new marked.Renderer();

const original    = renderer.listitem;
renderer.listitem = function (text) {

  const checkboxMatcher = /\[([x\s])\]/i;
  const match           = text.match(checkboxMatcher);

  if (match) {
    text = text.replace(checkboxMatcher, (match, type) => {
      return type == ' ' ? '&#9744' : '&#9745';
    });

    return original.call(this, text)
      .replace('<li>', '<li class="checkbox">');
  }

  return original.call(this, text);
};

renderer.link = function (href, title, text) {
  var link = marked.Renderer.prototype.link.call(this, href, title, text);
  if (/^http/.exec(href)) {
    return link.replace('<a', '<a target="_blank" ');
  }
  return link;
};

handlebars.registerHelper('debug', (optionalValue) => {

  if (optionalValue) {
    return util.inspect(optionalValue, {depth: 10});
  }

  return util.inspect(this, {depth: 10});
});

handlebars.registerHelper('markdown', function (fileReference) {

  const fileContent = fs.readFileSync(path.resolve(this.rootPath, fileReference), 'utf8');
  return marked(fileContent, {renderer});
});

handlebars.registerHelper('ifEqual', function (a, b, opt) {

  let equal = _.isEqual(a, b);

  if (_.isString(opt)) {
    return equal ? opt : null;
  }
  //else block
  return equal ? opt.fn(this) : opt.inverse(this);
});

handlebars.registerHelper('ifIncludes', (a, b, str) => {
  return _.includes(a, b) ? str : null;
});

handlebars.registerHelper('author', (authorInput) => {
  let author = {};

  if (_.isObject(authorInput)) {
    author = authorInput;
  } else {
    [, author.name, , author.email, , author.url] = authorInput.split(/^(.*?)\s*(\<(.*)\>)?\s*(\((.*)\))?$/);
  }

  return `<a class="brown-text text-lighten-3" rel="author" href="${author.url}">${author.name}</a>`;
});

handlebars.registerHelper('ifHasSubnav', function (section, allCollections, options) {

  let collection = allCollections[section.path];

  if (collection) {
    return options.fn({collection, title: section.title});
  }
  return options.inverse(this);
});

const livereloadPort = 35729;

function run(metalsmith, doWatch, source, destination, port) {

  metalsmith
    .source(source)
    .destination(destination);

  let serverPlugin = null;
  let watchPlugin  = null;

  if (doWatch) {

    serverPlugin = serve({
      port: port,
      verbose: true,
      http_error_files: {
        404: "/404.html"
      }
    });

    watchPlugin = watch({
      paths: {
        "${source}/**/*": true
      },
      livereload: livereloadPort
    });

    metalsmith
      .use(watchPlugin)
      .use(serverPlugin);
  }

  return new Promise((resolve, reject) => {

    metalsmith.build((err, files) => {
      if (err) {
        throw err;
      }

      if (doWatch) {

        let shutdown = (cb) => {
          watchPlugin.close();
          serverPlugin.shutdown(cb);
        };

        return resolve(shutdown);
      }
      return resolve();
    });

  });
}

function config(pathConfig, meta, watching) {

  let defininitions = _.merge(meta, {
    pkg: require(pathConfig.root + '/package.json'),
    rootPath: pathConfig.root,
  });

  if (meta.social.github.star) {
    const githubMatcher = /github.com\/(.+?)\/([^#?\/]+)/;
    const matches       = defininitions.pkg.homepage.match(githubMatcher);

    if (matches) {
      meta.social.github.star = {
        repo: matches[1],
        user: matches[2],
      }
    }

  }

  if (watching) {
    defininitions.livereloadPort = livereloadPort;
  }

  let metalsmith = Metalsmith(pathConfig.base)
    .metadata({
      title: "Zeroth",
      description: "Documentation for the Zeroth framework",
    })
    .clean(true);

  return metalsmith
    .use(drafts())
    .use(define(defininitions))
    .use(markdown({
      langPrefix: 'language-',
      smartypants: true,
      renderer: renderer,
      tables: true
    }))
    .use(headings({selectors: ['h2', 'h3']}))
    .use(headingsidentifier())
    .use(prism({
      lineNumbers: true
    }))
    .use(collections({
      main: {
        sortBy: 'collectionSort',
      },
      guide: {
        sortBy: (a, b) => {
          return _.indexOf(_.sortBy([a, b], ['collectionSort', 'title']), a) == 1 ? 1 : -1;
        },
      },
      articles: {
        sortBy: 'date',
        reverse: true,
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