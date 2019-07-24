import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { Options, ROptions, Filename } from './types'
import debug from 'debug'

export const DEFAULT_PATTERN = '**/*'
const DEFAULT_OPTIONS = {
  absolute: false,
  cwd: process.cwd(),
  missing: [],
}

const log = debug('af')

function getChanged(mergeBase: string = 'origin/master', argChanged?: Filename[]): Filename[] {
  if (argChanged) {
    // to abs path
    return argChanged.map((f) => path.resolve(f))
  }

  const staged = String(execSync('git diff --name-only --pretty=format: HEAD'))
    .trim()
    .split('\n')
    .filter((s) => s.length)
  const base = execSync(`git merge-base ${mergeBase} HEAD`)
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

function getTracked(argTracked?: Filename[]): Filename[] {
  let tracked = argTracked

  if (!tracked) {
    tracked = String(execSync('git ls-tree --full-tree -r --name-only HEAD'))
      .trim()
      .split('\n')
      .filter((s) => s.length)
  }

  log('tracked', tracked)

  return tracked.map((f) => path.resolve(f))
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

  let options = { pattern, ...DEFAULT_OPTIONS, ...realOptionsArg }

  let fileOptions: Options = {}

  try {
    const fn = path.resolve(options.cwd as string, 'affected-files.config.js')

    fileOptions = require(fn)
    log(`File config found`, fn, fileOptions)
  } catch (e) {
    log(`No config file detected`)
  }

  options = { pattern, ...DEFAULT_OPTIONS, ...fileOptions, ...realOptionsArg }

  // These operations are expensive, so, running them only for final options
  const changed = getChanged(options.mergeBase, options.changed)
  const tracked = getTracked(options.tracked)

  return { ...options, changed, tracked }
}

export default getOptions

export function absConv(files: Filename[], absolute: boolean, cwd: string) {
  return files.map((f) => {
    if (f.startsWith('/') && !absolute) {
      return f.slice(cwd.length + 1)
    } else if (!f.startsWith('/') && absolute) {
      return path.resolve(cwd, f)
    }

    return f
  })
}
