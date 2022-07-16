/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
// const { compilerOptions } = require('./tsconfig')
// const { pathsToModuleNameMapper } = require('ts-jest/utils')

const babelConfig = require('./babel.config');

module.exports = {
  preset: 'ts-jest',
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleDirectories: [
    'node_modules'
  ],
  globals: {
    "ts-jest": {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  transformIgnorePatterns: [
    // "[/\\\\]node_modules[/\\\\](?!crypto-random-string|@emurgo/).+\\.js$",
    // "[/\\\\]node_modules[/\\\\](?!@emurgo/|@cardano-sdk/).+\\.js$",
    // "<rootDir>/node_modules/(?!lodash-es)",
    // "<rootDir>/node_modules/(?!es6-promisify)",
    // "<rootDir>/node_modules/(?!@b58-finance/)",
    "!node_modules/"
  ],
  moduleNameMapper: {
    "^@emurgo/cardano-serialization(.*)$": "<rootDir>/node_modules/@emurgo/cardano-serialization-lib-nodejs/cardano_serialization_lib.js",
    "^@emurgo/cardano-message-signing(.*)$": "<rootDir>/node_modules/@emurgo/cardano-message-signing-nodejs/cardano_message_signing.js",
    // "^@b58-finance/crypto-random-string$": "<rootDir>/node_modules/@b58-finance/crypto-random-string/index.js"
    // "ˆ@cardano-sdk/(.*)$": "<rootDir>/node_modules/@emurgo/$1/",
  },
};

// module.exports = {
  // transform: { 
  //   "^.+\\.(ts|tsx)?$": ['ts-jest'],
  //   "^.+\\.(js|jsx)?$": ['babel-jest'] 
  // },
  // globals: {
  //   extensionsToTreatAsEsm: ['.js'],
  //   'ts-jest': {
  //     useESM: true
  //   }
  // },

  // preset: 'ts-jest/presets/js-with-ts',

  // from https://stackoverflow.com/a/57916712/15076557
  // transformIgnorePatterns: [
  //   'node_modules/(?!(@emurgo))',
  //   '(?!(@cardano_serialization).*)'
  // ]
  // preset: 'ts-jest',
  // testEnvironment: 'node',
  // moduleDirectories: ['node_modules', 'src'],
  // transform: {"^./src/+\\.tsx?$": ['ts-jest']},
  // transform: { "^.+\\.(ts|tsx|js|jsx)?$": ['ts-jest'] },
  // transformIgnorePatterns: [
  //   "(?!@cardano-lib.*)"
  // ],
  // globals: {
  //   'ts-jest': {
  //     babelConfig: true,
  //   },
  // },
  // moduleNameMapper: {
  //   "^@emurgo/(.*)$": "<rootDir>/node_modules/@emurgo/$1/cardano_serialization_lib.js",
  // },
  // modulePaths: ["<rootDir>/node_modules/@emurgo/"]
// };