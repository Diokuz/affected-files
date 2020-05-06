import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import minimatch from 'minimatch'
import { Options, ROptions, Filename } from './types'
import { pathToUnixPath } from './utils'
import debug from 'debug'

const DEFAULT_OPTIONS = {
  pattern: '**/*',
  absolute: false,
  cwd: pathToUnixPath(process.cwd()),
  missing: [],
  dot: false,
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  pmodified: [],
}

const log = debug('af:opts')
const maxBuffer = 64 * 1024 * 1024

type Arg = {
  mergeBase?: string
  modified?: string[]
  pmodified?: string[]
  cwd: string
}

function getModified({
  mergeBase = 'origin/master',
  modified,
  pmodified = [],
  cwd,
}: Arg): Filename[] {
  let mods

  if (modified) {
    // to abs path
    mods = modified
  } else {
    const staged = String(
      execSync('git diff --name-only --pretty=format: HEAD', { cwd, maxBuffer })
    )
      .trim()
      .split('\n')
      .filter((s) => s.length)
    const base = execSync(`git merge-base ${mergeBase} HEAD`, { cwd, maxBuffer })
      .toString()
      .trim()
    const cmd = `git log --name-only --pretty=format: HEAD ${base}..HEAD`

    log('base', base)
    log('cmd', cmd)

    const comitted = String(execSync(cmd, { cwd, maxBuffer }))
      .trim()
      .split('\n')
      .filter((s) => s.length)

    mods = staged.concat(comitted)
  }

  log('mods', mods)

  return mods
    .concat(pmodified)
    .map((f) => pathToUnixPath(path.resolve(cwd, f)))
    .filter((f) => fs.existsSync(f))
}

/**
 * Returns an array of all files in a directory (recursively), except explicitly ignored by git
 * @param cwd absolute path of directory where to search
 * @param argTracked use custom tracked and dont use git
 */
function getGitFiles(cwd: string, customFiles?: Filename[]): Filename[] {
  let gitFiles = customFiles

  if (!gitFiles) {
    const tracked = String(execSync(`git ls-files`, { cwd, maxBuffer })).trim()
    const untracked = String(
      execSync(`git ls-files --others --exclude-standard`, { cwd, maxBuffer })
    ).trim()

    gitFiles = (tracked + '\n' + untracked)
      .split('\n')
      .filter((s) => s.length)
      .map(absConvMap(true, cwd))
  }

  log('git files', gitFiles)

  return gitFiles.filter((f) => fs.existsSync(f))
}

function getOptions(apiOptions: Options): ROptions {
  let options = { ...DEFAULT_OPTIONS, ...apiOptions }
  let fileOptions: Options = {}
  try {
    const fn = pathToUnixPath(path.resolve(options.cwd as string, 'affected-files.config.js'))

    fileOptions = require(fn)
    log(`File config found`, fn, fileOptions)
  } catch (e) {
    log(`No config file detected`)
  }

  options = { ...DEFAULT_OPTIONS, ...fileOptions, ...apiOptions } as ROptions

  if (options.changed) {
    console.warn(`options.changed is deprecated, use options.modified instead`)
    options.modified = options.changed
    delete options.changed
  }

  log(`cwd`, options.cwd)

  // These operations are expensive, so, running them only for final options
  const modified = getModified(options)
  const allTracked = getGitFiles(options.cwd, options.tracked).filter((f) => {
    // Filtering out all files with unsupported extensions
    return options.extensions.find((e) => f.endsWith(e))
  })
  const result = { ...options, modified, allTracked } as ROptions

  const tracked = filterByPattern(allTracked, result.pattern, { cwd: result.cwd, dot: result.dot })
  const trackedSet = new Set(tracked)

  result.tracked = tracked
  result.trackedSet = trackedSet
  result.sources = filterByPattern(tracked, result.pattern, { cwd: result.cwd, dot: result.dot })

  log('tracked', result.tracked)
  log('sources', result.sources)
  log('pattern', result.pattern)

  result.missingSet = new Set(result.missing)

  if (result.modified) {
    log('custom modified detected', result.modified)
  }

  return result
}

export default getOptions

export function absConvMap(absolute: boolean, cwd: string) {
  return (f: Filename) => {
    const isAbsolutePath = pathToUnixPath(f) === pathToUnixPath(path.resolve(cwd, f))
    if (isAbsolutePath && !absolute) {
      return f.slice(cwd.length + 1)
    } else if (!isAbsolutePath && absolute) {
      return pathToUnixPath(path.resolve(cwd, f))
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
