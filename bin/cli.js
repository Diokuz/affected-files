#!/usr/bin/env node

const getAffectedCli = require('../lib').getAffectedCli

const pattern = process.argv[2] || '**/*'

console.log('pattern: ', pattern)

if (pattern.length > 0 && pattern.indexOf('*') === -1) {
  console.log('No asterisk found. Forgot to add quotes around pattern?')
}

// https://misc.flogisoft.com/bash/tip_colors_and_formatting
const CH = '\033[0;32m' // green
const AF = '\033[0;31m' // red
const DE = '\033[0;39m'

async function run() {
  const { options, affected } = await getAffectedCli({ pattern })

  if (!affected.length) {
    console.log(`nothing found!`)
  } else {
    const legend = '(' + CH + 'changed' + DE + ', ' + AF + 'affected only' + DE + ')'
    const changedRel = options.changed.map(f => f.replace(process.cwd() + '/', ''))
    const affectedRel = affected.map(f => f.replace(process.cwd() + '/', ''))
    const changedRelSet = new Set(changedRel)
    const coloredAffected = affectedRel.map(a => {
      if (changedRelSet.has(a)) {
        return CH + a + DE
      }

      return AF + a + DE
    })

    console.log(
      `affected files ${legend}:\n\n `,
      coloredAffected.join('\n  '),
      DE,
      `\n\ntotal: ${affectedRel.length}\n`
    )
  }
}

run().catch(e => {
  process.exitCode = 1
  console.error(e.message)
  console.error(`failed to get affected files`)
})
