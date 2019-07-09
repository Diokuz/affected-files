const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const glob = require('glob')
const debug = require('debug')
const filterDependent = require('filter-dependent')

const log = debug('af')

type Options = {
  changed?: string[]
}

function getChanged(): string[] {
  const staged = String(execSync('git diff --name-only --pretty=format: HEAD'))
    .trim()
    .split('\n')
    .filter((s) => s.length)
  const base = execSync('git merge-base origin/master HEAD')
    .toString()
    .trim()
  const cmd = `git log --name-only --pretty=format: HEAD ^${base}`

  log('base', base)
  log('cmd', cmd)

  const comitted = String(execSync(cmd))
    .trim()
    .split('\n')
    .filter((s) => s.length)
  const changed = staged.concat(comitted).map((f) => path.resolve(f))

  log('changed', changed)

  return changed
}

function getAffectedFiles(pattern: string = './src/**/*', options: Options = {}): string[] {
  const changed = options.changed || getChanged()
  const sources = glob.sync(pattern)

  log('sources', sources)

  const affectedFiles = filterDependent(sources, changed)

  log('affectedFiles', affectedFiles)

  return affectedFiles
}

module.exports = getAffectedFiles
