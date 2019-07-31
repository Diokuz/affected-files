#!/usr/bin/env node

const getAffectedFiles = require('..').default

const pattern = process.argv[2] || '**/*'

console.log('pattern: ', pattern)

if (pattern.length > 0 && pattern.indexOf('*') === -1) {
  console.log('No asterisk found. Forgot to add quotes around pattern?')
}

async function run() {
  const files = await getAffectedFiles(pattern)
  
  if (!files.length) {
    console.log(`Nothing found!`)
  } else {
    console.log('Affected files:\n\n', files.join('\n'), `\n\ntotal: ${files.length}`)
  }
}

run().catch(e => {
  process.exitCode = 1
  console.error(`failed to get affected files`)
})