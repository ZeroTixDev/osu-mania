'use strict';

const paths = require('./paths');
const WebpackBar = require('webpackbar');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const plugins = [
   new HtmlWebpackPlugin({
      hash: true,
      title: 'lol',
      template: paths.src + '/template.html',
      filename: './index.html',
      minify: {
         removeComments: true,
         collapseWhitespace: true,
      },
   }),
   new CleanWebpackPlugin(),
   new WebpackBar(),
];
module.exports = {
   entry: [paths.src + '/index.js'],
   mode: 'development',
   devtool: 'source-map',
   output: {
      filename: '[name].[contenthash].js',
      path: paths.build,
      publicPath: '/',
   },
   module: {
      rules: [
         {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
         },
         {
            test: /\.(png|jp(e*)g|svg)$/,
            use: [
               {
                  loader: 'url-loader',
                  options: {
                     limit: 8000, // Convert images < 8kb to base64 strings
                     name: 'images/[hash]-[name].[ext]',
                  },
               },
            ],
         },
         {
            test: /\.(ogg|mp3|wav|mpe?g)$/i,
            loader: 'file-loader',
            options: {
               name: 'sounds/[hash]-[name].[ext]',
            },
         },
      ],
   },
   plugins,
};
