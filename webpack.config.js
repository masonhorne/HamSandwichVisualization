const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	entry: './script.ts',
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ],
	},
	output: {
		filename: 'script.js',
		path: __dirname,
	},
	optimization: {
		minimize: true,
		minimizer: [
		  new TerserPlugin({
			extractComments: false,
		  }),
		],
	},
};