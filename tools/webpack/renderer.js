const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");

const rules = [
  {
    test: /\.[jt]sx?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [['@babel/preset-react', { development: inDev() }], '@babel/preset-typescript'],
      },
    },
  },
  {
    test: /\.css$/i,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { url: false } },
    ],
  },
  {
    test: /\.s[ac]ss$/i,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader' },
      { loader: 'sass-loader' },
    ],
  },
]

function inDev() {
  return process.env.NODE_ENV == 'development';
}

const copyPlugins = [
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve('src/assets'),
        to: path.resolve('.webpack/renderer/assets'),
      }
    ]
  })
];

const plugins = [
  ...(inDev() ? [new webpack.HotModuleReplacementPlugin()] : []),
  ...copyPlugins,
];

module.exports = {
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  module: {
    rules,
  },
  plugins,
  devtool: 'inline-source-map',
};
