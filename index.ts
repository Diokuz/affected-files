import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import glob from 'glob'
import debug from 'debug'
import minimatch from 'minimatch'
import filterDependent from 'filter-dependent'

const log = debug('af')

type Filename = string
type GlobPattern = string

interface Options {
  pattern?: string
  changed?: Filename[]
  abs?: boolean
  absolute?: boolean
  superleaves?: GlobPattern[]
  cwd?: string
}

interface ROptions extends Options {
  pattern: string
  cwd: string
}

export const DEFAULT_PATTERN = './src/**/*'
const DEFAULT_OPTIONS = {
  absolute: false,
  cwd: process.cwd(),
}

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

  return changed.filter((f) => fs.existsSync(f))
}

function getOptions(patternArg: string | Options, optionsArg?: Options): ROptions {
  let pattern = DEFAULT_PATTERN
  let realOptionsArg = optionsArg

  if (typeof patternArg === 'object') {
    realOptionsArg = patternArg
    pattern = patternArg.pattern || DEFAULT_PATTERN
  } else {
    pattern = patternArg
  }

  let options: ROptions = { pattern, ...DEFAULT_OPTIONS, ...realOptionsArg }

  let fileOptions: Options = {}

  try {
    const fn = path.resolve(options.cwd as string, 'affected-files.config.js')

    fileOptions = require(fn)
    log(`File config found`, fn, fileOptions)
  } catch (e) {
    log(`No config file detected`)
  }

  options = { pattern, ...DEFAULT_OPTIONS, ...fileOptions, ...realOptionsArg }

  return options
}

function publicGetAffectedFiles(patternArg: string | Options, optionsArg?: Options) {
  const options: ROptions = getOptions(patternArg, optionsArg)

  return getAffectedFiles(options)
}

function getAffectedFiles(options: ROptions): string[] {
  const { pattern, absolute, cwd } = options

  if (options.changed) {
    log('custom changed detected', options.changed)
  }

  const changed = getChanged(options.changed)

  log('pattern', pattern)

  const sources = glob.sync(pattern, { cwd, absolute: true })

  log('sources', sources)

  const affectedFiles = filterDependent(sources, changed)

  log('affectedFiles', affectedFiles)

  if (options.superleaves) {
    log('superleaves detected', options.superleaves)

    const superfiles = options.superleaves.reduce((acc: string[], sl: GlobPattern) => {
      const lfiles = glob.sync(sl, { absolute: true })

      acc = acc.concat(lfiles)

      return acc
    }, [])

    log('superfiles', superfiles)

    log(`checking superfiles to match pattern...`)

    superfiles.forEach((f) => {
      if (!minimatch(f, pattern)) {
        throw new Error(`Superfile "${f}" does not match against pattern "${pattern}"`)
      }
    })

    const superfilesSet = new Set(superfiles)
    const affectedSet = new Set(affectedFiles)

    for (let fn of superfilesSet) {
      if (affectedSet.has(fn)) {
        log(`Superleaf "${fn}" is affected, returning all files`, options.superleaves)

        return glob.sync(pattern, { absolute })
      }
    }

    log(`Superleaves not affected, returning only affected files`)
  }

  if (absolute === true) {
    return affectedFiles
  }

  // /abs/path/to/cwd/folder/1.js → folder/1.js
  return affectedFiles.map((f: string) => f.slice(cwd.length + 1))
}

export default publicGetAffectedFiles
