const path = require('path');
const webpackMerge = require('webpack-merge');

var commonConfig = {
  copyConfigs: {
    src: ['{{SRC}}/config.json'],
    dest: '{{WWW}}'
  }
};

const ionicConfig = require(path.join(process.env.IONIC_APP_SCRIPTS_DIR, 'config', 'copy.config.js'));

module.exports = webpackMerge(
  ionicConfig,
  commonConfig
);
