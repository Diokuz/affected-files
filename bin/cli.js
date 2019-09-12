#!/usr/bin/env node

const getAffectedCli = require('../lib').getAffectedCli
const pathToUnixPath = require('../lib/utils').pathToUnixPath

const modified = process.argv[2]

if (modified && modified.length > 0) {
  console.log('custom modified:', modified)
}

// https://misc.flogisoft.com/bash/tip_colors_and_formatting
const CH = '\033[0;32m' // green
const AF = '\033[0;31m' // red
const DE = '\033[0;39m'

async function run() {
  let result

  if (modified) {
    result = await getAffectedCli({ modified: [modified] })
  } else {
    result = await getAffectedCli()
  }

  const { options, affected } = result

  if (!affected.length) {
    console.log(`nothing found!`)
  } else {
    const cwd = pathToUnixPath(process.cwd())
    const legend = '(' + CH + 'modified' + DE + ', ' + AF + 'affected only' + DE + ')'
    const modifiedRel = options.modified.map(f => f.replace(cwd + '/', ''))
    const affectedRel = affected.map(f => f.replace(cwd + '/', ''))
    const modifiedRelSet = new Set(modifiedRel)
    const coloredAffected = affectedRel.map(a => {
      if (modifiedRelSet.has(a)) {
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
