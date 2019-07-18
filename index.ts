import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import glob from 'glob'
import debug from 'debug'
import filterDependent from 'filter-dependent'

const log = debug('af')

type Filename = string
type GlobPattern = string

type Options = {
  changed?: Filename[],
  abs?: boolean,
  superleaves?: GlobPattern[],
}

export const DEFAULT_PATTERN = './src/**/*'

function getChanged(argChanged?: Filename[]): string[] {
  if (argChanged) {
    // to abs path
    return argChanged.map((f) => path.resolve(f))
  }

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

  return changed.filter(f => fs.existsSync(f))
}


function getAffectedFiles(pattern: string = DEFAULT_PATTERN, options: Options = {}): string[] {
  if (options.changed) {
    log('custom changed detected', options.changed)
  }

  const changed = getChanged(options.changed)

  log('pattern', pattern)

  const sources = glob.sync(pattern)

  log('sources', sources)

  const affectedOnlyFiles = filterDependent(sources, changed)
  const affectedFiles = Array.from(new Set(changed.concat(affectedOnlyFiles)))

  log('affectedFiles', affectedFiles)

  if (options.superleaves) {
    log('superleaves detected', options.superleaves)

    const superfiles = options.superleaves.reduce((acc: string[], sl: GlobPattern) => {
      const lfiles = glob.sync(sl, { absolute: true })

      acc = acc.concat(lfiles)

      return acc
    }, [])

    log('superfiles', superfiles)

    const superfilesSet = new Set(superfiles)
    const affectedSet = new Set(affectedFiles)

    for (let fn of superfilesSet) {
      if (affectedSet.has(fn)) {
        log(`Superleaf "${fn}" is affected, returning all files`, options.superleaves)

        return glob.sync(pattern, { absolute: options.abs })
      }
    }

    log(`Superleaves not affected, returning only affected files`)
  }

  if (options.abs === true) {
    return affectedFiles
  }

  // /abs/path/to/cwd/folder/1.js → folder/1.js
  return affectedFiles.map((f: string) => f.slice(process.cwd().length + 1))
}

export default getAffectedFiles
