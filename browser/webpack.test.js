module.exports = {
  devtool: 'inline-source-map',

  resolve: {
    extensions: ['', '.ts', '.js']
  },

  resolveLoader: {
    modulesDirectories: [
      "web_loaders",
      "web_modules",
      "node_loaders",
      "node_modules",
      "node_modules/@ubiquits/toolchain/node_modules"
    ],
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts'
      },
      {
        test: /\.html$/,
        loader: 'html'

      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'null'
      },
      {
        test: /\.css$/,
        loader: 'null'
      },
      {
        test: /karma-test-shim\.js$/,
        loader: 'string-replace',
        query: {
          search: '%working-dir%',
          replace: process.cwd()
        }
      }
    ],
    postLoaders: [
      { //delays coverage til after tests are run, fixing transpiled source coverage error
        test: /\.(js|ts)$/,
        exclude: /(node_modules)\//,
        loader: 'sourcemap-istanbul-instrumenter?force-sourcemap'
      }
    ]
  },

  ts: {
    configFileName: 'tsconfig.browser.json'
  }
};
