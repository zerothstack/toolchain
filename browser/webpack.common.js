const webpack           = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const helpers           = require('./helpers');
const path              = require('path');
const fs                = require('fs');
const dotenv            = require('dotenv');
const _                 = require('lodash');

//read the env file
const file    = fs.readFileSync(path.resolve(process.cwd(), '.env'));
const allVars = dotenv.parse(file);
const globals = _.reduce(allVars, (exportVars, value, key) => {
  if (_.startsWith(key, 'PUBLIC_')) {
    exportVars[key.replace(/^PUBLIC_/, '')] = JSON.stringify(value);
  }
  return exportVars;
}, {});

console.log('exporting vars', globals);

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
      path.resolve(__dirname, '..', 'node_modules')
    ]
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
    }),
    new webpack.DefinePlugin({
      'process.env': globals
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
