var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var helpers = require('./helpers');

module.exports = {
  // @todo refactor to use paths defined in tasks.js (class UbiquitsProject)
  entry: {
    'polyfills': './src/browser/polyfills.ts',
    'vendor': './src/browser/vendor.ts',
    'app': ['./src/browser/main.ts'],
    'common': './src/common/index.ts',
  },

  resolve: {
    extensions: ['', '.js', '.ts'],
  },

  resolveLoader: {
    modulesDirectories: [
      "web_loaders",
      "web_modules",
      "node_loaders",
      "node_modules",
      //make sure to scan the toolchains packages if npm does not hoist them to be a flat tree
      // require.resolve('@ubiquits/toolchain/package.json').replace('package.json', 'node_modules')
      __dirname + '/node_modules'
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
        test: /\.json/,
        loader: 'raw'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'file?name=assets/[name].[hash].[ext]'
      },
      {
        test: /\.css$/,
        exclude: helpers.root('src', 'browser', 'app'),
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap')
      },
      {
        test: /\.css$/,
        include: helpers.root('src', 'browser', 'app'),
        loader: 'raw'
      }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'common', 'vendor', 'polyfills']
    }),
    // @todo refactor to use paths defined in tasks.js (class UbiquitsProject)
    new HtmlWebpackPlugin({
      template: 'src/browser/index.html'
    })
  ],

  ts: {
    configFileName: 'tsconfig.browser.json'
  },

  //list used core node modules so webpack doesn't complain
  node: {
    fs: "empty",
    net: "empty",
    dns: "empty"
  }
};
