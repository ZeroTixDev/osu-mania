'use strict';

const paths = require('./paths');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
   mode: 'development',
   devtool: 'inline-source-map',
   devServer: {
      historyApiFallback: true,
      contentBase: paths.src,
      open: true,
      compress: true,
      port: 8080,
   },
});
