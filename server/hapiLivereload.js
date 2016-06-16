const WebpackPlugin = require('hapi-webpack-plugin');


function registerLivereload(serverEngine, compiler, assets) {

  serverEngine.register({
    register: WebpackPlugin,
    options: {compiler, assets}
  });

}

module.exports = {registerLivereload};