'use strict'

module.exports = {
  testMatch: [
    '<rootDir>/__tests__/*.spec.(js|ts)',
  ],

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  moduleFileExtensions: [
    'json',
    'js',
    'ts'
  ],

  testEnvironment: 'node',
}
