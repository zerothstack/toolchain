const webpackMiddleware = require('webpack-dev-middleware');



function registerLivereload(serverEngine, compiler, assets) {

  serverEngine.use(webpackMiddleware(compiler, assets));

}

module.exports = {registerLivereload};