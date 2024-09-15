import { Configuration } from 'webpack'
import * as NodePolyfillPlugin from 'node-polyfill-webpack-plugin'

export default {
  plugins: [
    new NodePolyfillPlugin({
      additionalAliases: ['process', 'crypto', 'stream', 'vm'],
    }),
  ],
} as Configuration
