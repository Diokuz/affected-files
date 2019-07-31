import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import minimatch from 'minimatch'
import { Options, ROptions, Filename } from './types'
import debug from 'debug'

export const DEFAULT_PATTERN = '**/*'
const DEFAULT_OPTIONS = {
  absolute: false,
  cwd: process.cwd(),
  missing: [],
  dot: false,
}

const log = debug('af:opts')

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

function getTracked(cwd: string, argTracked?: Filename[]): Filename[] {
  let tracked = argTracked

  if (!tracked) {
    tracked = String(execSync(`git ls-files`, { cwd }))
      .trim()
      .split('\n')
      .filter((s) => s.length)
      .map(absConvMap(true, cwd))
  }

  log('tracked', tracked)

  return tracked.filter((f) => fs.existsSync(f))
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

  log(`cwd`, options.cwd)

  // These operations are expensive, so, running them only for final options
  const changed = getChanged(options.mergeBase, options.changed)
  const tracked = getTracked(options.cwd as string, options.tracked)
  const trackedSet = new Set(tracked)
  const result = { ...options, changed, tracked, trackedSet } as ROptions

  if (result.superleaves) {
    console.warn('deprecated options.superleaves detected, use options.usink instead')

    if (result.usink) {
      throw new Error(
        `Cannot operate both: with options.superleaves and options.sink! Use only options.sink.`
      )
    }

    result.usink = result.superleaves
  }

  result.sources = filterByPattern(tracked, result.pattern, { cwd: result.cwd, dot: result.dot })

  log('sources', result.sources)
  log('pattern', result.pattern)

  result.missingSet = new Set(result.missing)

  if (result.changed) {
    log('custom changed detected', result.changed)
  }

  return result
}

export default getOptions

export function absConvMap(absolute: boolean, cwd: string) {
  return (f: Filename) => {
    if (f.startsWith('/') && !absolute) {
      return f.slice(cwd.length + 1)
    } else if (!f.startsWith('/') && absolute) {
      return path.resolve(cwd, f)
    }

    return f
  }
}

export function absConv(files: Filename[], absolute: boolean, cwd: string) {
  return files.map(absConvMap(absolute, cwd))
}

export function filterByPattern(
  files: Filename[],
  pattern: string,
  { cwd, dot }: { cwd: string; dot: boolean }
) {
  log(`filterByPattern pattern="${pattern}", input`, files)

  const output = files
    .map(absConvMap(false, cwd))
    .filter((f) => {
      // log(`f`, f, pattern, minimatch(f, pattern, { dot }))
      return minimatch(f, pattern, { dot })
    })
    .map(absConvMap(true, cwd))

  log(`filterByPattern output`, output)

  return output
}
