#!/usr/bin/env node

const getAffectedFiles = require('..')
const argv = require('yargs').argv

const pattern = argv._[0]

const files = getAffectedFiles(pattern)

console.log(files.join('\n'))
