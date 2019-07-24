import debug from 'debug'
import minimatch from 'minimatch'
import filterDependent from 'filter-dependent'
import getOptions, { absConv, filterByPattern } from './options'
import { Options, ROptions, GlobPattern } from './types'

const log = debug('af')

function publicGetAffectedFiles(patternArg: string | Options, optionsArg?: Options) {
  const options: ROptions = getOptions(patternArg, optionsArg)

  return getAffectedFiles(options)
}

function getAffectedFiles(options: ROptions): string[] {
  const { pattern, absolute, cwd, missing, tracked, changed, dot } = options
  log('tracked', tracked)
  log('pattern', pattern)
  const trackedSet = new Set(tracked)
  const missingSet = new Set(missing)

  if (options.changed) {
    log('custom changed detected', options.changed)
  }

  const sources = filterByPattern(tracked, pattern, { cwd, dot })
  log('sources', sources)

  const affectedFiles = filterDependent(sources, changed, {
    onMiss: (fn, dep) => {
      const relFn = fn.slice(cwd.length + 1) // `/root/dir/foo/fn.js` → `foo/fn.js`
      log('Checking unresolved dependency in missing', relFn, dep)

      if (
        missingSet.has(`${relFn} >>> ${dep}`) ||
        missingSet.has(`* >>> ${dep}`) ||
        missingSet.has(`${relFn} >>> *`) ||
        missingSet.has(`* >>> *`)
      ) {
        log(`matched one of missing, return`)
        return
      }

      console.error(`Failed to resolve "${dep}" in "${fn}". Fix it or add to 'missing'.`)
      throw new Error(`Failed to resolve "${dep}" in "${fn}"`)
    },
  })

  log('affectedFiles', affectedFiles)

  if (options.superleaves) {
    log('superleaves detected', options.superleaves)

    const superfiles = options.superleaves
      .reduce((acc: string[], sl: GlobPattern) => {
        const lfiles = filterByPattern(tracked, sl, { dot, cwd })

        acc = acc.concat(lfiles)

        return acc
      }, [])
      .filter((f) => trackedSet.has(f))

    log('superfiles', superfiles)

    log(`checking superfiles to match pattern...`)

    superfiles.forEach((f) => {
      const relf = f.slice(cwd.length + 1)

      if (!minimatch(relf, pattern, { dot })) {
        throw new Error(`Superfile "${relf}" does not match against pattern "${pattern}"`)
      }
    })

    const superfilesSet = new Set(superfiles)
    const affectedSet = new Set(affectedFiles)

    for (let fn of superfilesSet) {
      if (affectedSet.has(fn)) {
        log(`Superleaf "${fn}" is affected, returning all sources files`)

        return absConv(sources, absolute, cwd)
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
