require('reflect-metadata');
require('source-map-support').install();

const WebpackPlugin = require('hapi-webpack-plugin');
const path = require('path');
const Webpack = require('webpack');
const sockjs = require('sockjs');

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

config.entry.app.unshift(require.resolve('webpack-dev-server/client/index.js') + '?http://localhost:3000/');

/**
 * Register plugin and start server
 */
server.getEngine().register({
  register: WebpackPlugin,
  options: {compiler, assets, hot}
});

const sockServer = sockjs.createServer({
  // Limit useless logs
  log: (severity, line) => {
    if (severity === "error") {
      console.log(line);
    }
  }
});

let sockets = [];
let _stats = null;

let sockWrite = (sockets, type, data) => {
  console.log('writing to sockets', type, 'socket count: ', sockets.length);
  sockets.forEach(function (sock) {
    sock.write(JSON.stringify({
      type: type,
      data: data
    }));
  });
};

let _sendStats = (sockets, stats, force) => {

  if (!force && stats && (!stats.errors || stats.errors.length === 0) && stats.assets && stats.assets.every((asset) => !asset.emitted)) {
    return sockWrite(sockets, "still-ok");
  }

  sockWrite(sockets, "hash", stats.hash);
  if (stats.errors.length > 0) {
    sockWrite(sockets, "errors", stats.errors);
  } else if (stats.warnings.length > 0) {
    sockWrite(sockets, "warnings", stats.warnings);
  } else {
    sockWrite(sockets, "ok");
  }
};

sockServer.on('connection', (conn) => {

  sockets.push(conn);

  // Remove the connection when it's closed
  conn.on("close", () => {
    var connIndex = sockets.indexOf(conn);
    if (connIndex >= 0) {
      sockets.splice(connIndex, 1);
    }
  });

  if (!_stats) {
    return;
  }

  _sendStats([conn], _stats.toJson(), true);

});

let onInvalid = () => {
  console.log('invalid state detected');
  sockWrite(sockets, "invalid");
};

compiler.plugin('done', (stats) => {
  console.log('stats recieved');
  _sendStats(sockets, stats.toJson());
  _stats = stats;
});
// Listening for events

compiler.plugin("compile", onInvalid);
compiler.plugin("invalid", onInvalid);

sockServer.installHandlers(server.getEngine().listener, {prefix: '/sockjs-node'});

console.log('starting server', server.getEngine().info);

server.start().then(() => {
  logger.info('Server running at:', server.getEngine().info.uri);
});

module.exports = server;