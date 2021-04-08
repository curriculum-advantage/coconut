import webpack from 'webpack';

const config: webpack.Configuration = {
  entry: './src/index.ts',
  resolve: { extensions: ['.js', '.ts'] },
  output: {
    libraryTarget: 'umd',
    globalObject: 'this',
    library: 'coconut',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },
    ],
  },
};

export default config;
