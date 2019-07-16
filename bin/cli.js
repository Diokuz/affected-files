#!/usr/bin/env node

const getAffectedFiles = require('..').default

const pattern = process.argv[2] || ''

console.log('pattern: ', pattern)

if (pattern.indexOf('*') === -1) {
  console.log('No asterisk found. Forgot to add quotes around pattern?')
}

const files = getAffectedFiles(pattern)

if (!files.length) {
  console.log(`Nothing found!`)
} else {
  console.log('Affected files:\n', files.join('\n'))
}
