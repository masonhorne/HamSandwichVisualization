const path = require('path');

module.exports = {
	entry: './script.ts',
	mode: 'development',
	watch: true,
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
};