const path = require("path");
const webpack = require('webpack');
const src = path.resolve(process.cwd(),'src');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const NoEmitOnErrorsPlugin = webpack.NoEmitOnErrorsPlugin;
const DefinePlugin = webpack.DefinePlugin;

module.exports = {
    context: src,
    entry: 'index.ts',
    output: {
        "path": path.resolve(__dirname,'release','bundles'),
        "filename": 'tsed-custom-ajv.umd.js',
        "library": 'tsed-custom-ajv',
        "libraryTarget": 'umd',
        "umdNamedDefine": true
    },
    externals: [
        nodeExternals()
    ],
    mode: "production",
    module: {
        rules: [
            {
                test: /\.ts$/,
                enforce: 'pre',
                exclude: [
                    /node_modules/
                ],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ["env", 
                                {
                                    "targets": {
                                    "node": "10"
                                    },
                                    "ignore": [
                                    "node_modules"
                                    ]
                                }
                                ]
                            ],
                            plugins:[
                                "transform-runtime",
                                "transform-async-to-generator",
                                "transform-class-properties",
                                "transform-object-rest-spread"
                            ]
                        }
                    },
                    {
                        loader: "awesome-typescript-loader",
                        options: {
                            useCache: false,
                            reportFiles: ["src/**/*.{ts,tsx}"],
                            configFileName: './tsconfig.json',
                            forceIsolatedModules: true
                        }
                    }
                ]
            }
        ]
    },
    resolve:{
        extensions: ['.ts'],
        modules: [path.resolve(__dirname,"node_modules"),src]
    },
    plugins: [
        new NoEmitOnErrorsPlugin(),
        new UglifyJsPlugin({ sourceMap: true }),
        new DefinePlugin({
            'ENV': { NODE_ENV: "'production'" }
        })
    ],
    node: {
        watch: false,
        global: true,
        process: true,
        crypto: 'empty',
        module: false,
        clearImmediate: false,
        setImmediate: false
    }
}
