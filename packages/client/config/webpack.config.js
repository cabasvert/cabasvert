const path = require('path');
const webpackMerge = require('webpack-merge');
var webpack = require('webpack');
var rxPaths = require('rxjs/_esm5/path-mapping')();

const environmentVariables = [
  'NODE_ENV',
  'IONIC_ENV'
];

console.log('Building with environment:');
environmentVariables.forEach(function (variable) {
  console.log('  - ' + variable + '=' + process.env[variable]);
});

var devLoaders = [
  {
    test: /\.json$/,
    loader: 'json-loader'
  },
  {
    test: /\.ts$/,
    exclude: /(node_modules|bower_components)/,
    loader: [
      {
        loader: 'babel-loader',
        options: {
          plugins: [
            [
              require('babel-plugin-transform-imports'),
              {
                "rxjs/operators": {
                  "transform": function (importName) {
                    return 'rxjs/operators/' + importName;
                  },
                  preventFullImport: true,
                  skipDefaultConversion: true
                }
              }
            ]
          ]
        }
      },
      {
        loader: process.env.IONIC_WEBPACK_LOADER
      }
    ]
  }
];

var prodLoaders = [
  {
    test: /\.json$/,
    loader: 'json-loader'
  },
  {
    test: /\.js$/,
    loader: [
      {
        loader: process.env.IONIC_CACHE_LOADER
      },
      {
        loader: '@angular-devkit/build-optimizer/webpack-loader',
        options: {
          sourceMap: true
        }
      }
    ]
  },
  {
    test: /\.ts$/,
    loader: [
      {
        loader: process.env.IONIC_CACHE_LOADER
      },
      {
        loader: '@angular-devkit/build-optimizer/webpack-loader',
        options: {
          sourceMap: true
        }
      },
      {
        loader: 'babel-loader',
        options: {
          plugins: [
            [
              require('babel-plugin-transform-imports'),
              {
                "rxjs/operators": {
                  "transform": function (importName) {
                    return 'rxjs/operators/' + importName;
                  },
                  preventFullImport: true,
                  skipDefaultConversion: true
                }
              }
            ]
          ]
        }
      },
      {
        loader: process.env.IONIC_WEBPACK_LOADER
      }
    ]
  }
];

function makeConfig(loaders) {
  return {
    plugins: [
      new webpack.EnvironmentPlugin(environmentVariables)
    ],
    resolve: {
      alias: rxPaths
    },
    module: {
      loaders: loaders
    }
  };
}

var commonConfig = {
  dev: makeConfig(devLoaders),
  prod: makeConfig(prodLoaders)
};

const ionicConfig = require(path.join(process.env.IONIC_APP_SCRIPTS_DIR, 'config', 'webpack.config.js'));

ionicConfig.dev.module.loaders = [];
ionicConfig.prod.module.loaders = [];

module.exports = webpackMerge(
  ionicConfig,
  commonConfig
);
