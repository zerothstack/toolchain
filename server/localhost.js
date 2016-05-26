require('reflect-metadata');

const WebpackPlugin = require('hapi-webpack-plugin');
const Webpack = require('webpack');

const api = require(process.env.NODEMON_ENTRYPOINT);

const server = api.server;
const logger = api.logger;

const config = require('../browser/webpack.dev.js');
const compiler = new Webpack(config);

const assets = {
  // webpack-dev-middleware options
  // See https://github.com/webpack/webpack-dev-middleware
  historyApiFallback: true,
  stats: 'minimal'
};

const hot = {
  // webpack-hot-middleware options
  // See https://github.com/glenjamin/webpack-hot-middleware
};

/**
 * Register plugin and start server
 */
server.getEngine().register({
  register: WebpackPlugin,
  options: {compiler, assets, hot}
});

console.log('starting server', server.getEngine().info);

server.start().then(() => {
  logger.info('Server running at:', server.getEngine().info.uri);
});

module.exports = server;