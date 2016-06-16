const sockjs = require('sockjs');

function websocketServer(compiler) {

  const sockServer = sockjs.createServer({
    // Limit useless logs
    log: (severity, line) => {
      if (severity === "error") {
        console.log(line);
      }
    }
  });

  let sockets = [];
  let _stats  = null;

  let sockWrite = (sockets, type, data) => {
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
    console.log('stats received');
    _sendStats(sockets, stats.toJson());
    _stats = stats;
  });

// Listening for events
  compiler.plugin("compile", onInvalid);
  compiler.plugin("invalid", onInvalid);

  return sockServer;

}

module.exports = {websocketServer};