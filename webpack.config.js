const webpack = require('webpack');
const path = require('path');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: [
    "./lib"
  ],
  output: {
    filename: "build.js",
    path: path.resolve(__dirname, './client/build'),
    publicPath: './build'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader?sourceMap'],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              attrs: [':data-src']
            }
          }
        ]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [ 'file-loader?name=/images/[name]-[hash].[ext]' ],

      }
    ]
  },
  mode: 'development',
  plugins: [new UglifyJSPlugin()],
  resolve: {
      alias: {
         handlebars: 'handlebars/dist/handlebars.min.js'
      }
  },
  externals: {
    'backbone': 'Backbone',
    'bootstrap': 'bootstrap',
    'jquery': 'jQuery',
    'L': 'leaflet',
    'moment': 'moment',
    'underscore': 'underscore',
    'raphael': 'Raphael',
    'window.L': 'leaflet',
    '$': 'jQuery'
  }
};
