require('reflect-metadata');
require('source-map-support')
  .install();

const {websocketServer} = require('./websocketServer');

const Webpack = require('webpack');

const bootstrap = require(process.env.NODEMON_ENTRYPOINT).default;

module.exports = bootstrap.then(({server, logger}) => {

  const config   = require('../browser/webpack.dev.js');
  const compiler = new Webpack(config);

  const assets = {
    // webpack-dev-middleware options
    // See https://github.com/webpack/webpack-dev-middleware
    historyApiFallback: true,
    stats: 'minimal'
  };

  config.entry.app.unshift(require.resolve('webpack-dev-server/client/index.js') + '?http://localhost:3000/');

  let livereloadDriver;

  const serverType = server.constructor.name;

  switch (serverType) {
    case 'HapiServer':
      console.log('registering hapi driver');
      livereloadDriver = require('./hapiLivereload');
      break;
    case 'ExpressServer':
      console.log('registering express driver');
      livereloadDriver = require('./expressLivereload');
      break;
    default:
      throw new Error(`Unrecognised server type [${serverType}]`);
  }

  livereloadDriver.registerLivereload(server.getEngine(), compiler, assets);

  websocketServer(compiler)
    .installHandlers(server.getHttpServer(), {prefix: '/sockjs-node'});

  return server.start()
    .then(() => {
      logger.info('Server running at:', server.getHost());
      return server;
    });

});

