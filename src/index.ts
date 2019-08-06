import debug from 'debug'
import minimatch from 'minimatch'
import filterDependent, { filterDependentSync } from 'filter-dependent'
import getOptions, { absConv, filterByPattern } from './options'
import { Options, ROptions, GlobPattern } from './types'

const log = debug('af')
const plog = debug('af:profiler')

export function getAffectedSync(optionsArg: Options = {}) {
  const options: ROptions = getOptions(optionsArg)

  return getAffectedFilesSync(options)
}

function postprocess(
  affectedFiles: string[],
  options: ROptions
): { options: ROptions; affected: string[] } {
  const { pattern, allTracked, sources, absolute, dot, cwd } = options

  if (typeof options.usink !== 'undefined') {
    log('usink detected', options.usink)

    const usinkFiles = options.usink.reduce((acc: string[], sl: GlobPattern) => {
      const lfiles = filterByPattern(allTracked, sl, { dot, cwd })

      acc = acc.concat(lfiles)

      return acc
    }, [])

    log('usinkFiles', usinkFiles)

    log(`checking usinkFiles to match pattern...`)

    usinkFiles.forEach((f) => {
      const relf = f.slice(cwd.length + 1)

      if (!minimatch(relf, pattern, { dot })) {
        throw new Error(`usink file "${relf}" does not match against pattern "${pattern}"`)
      }
    })

    const usinkFilesSet = new Set(usinkFiles)
    const affectedSet = new Set(affectedFiles)

    for (let fn of usinkFilesSet) {
      if (affectedSet.has(fn)) {
        log(`usink file "${fn}" is affected, returning all sources files`)

        return { options, affected: absConv(sources, absolute, cwd) }
      }
    }

    log(`usink not affected, returning only affected files`)
  }

  if (absolute === true) {
    return { options, affected: affectedFiles }
  }

  return {
    options,
    // /abs/path/to/cwd/folder/1.js → folder/1.js
    affected: affectedFiles.map((f: string) => f.slice(cwd.length + 1)),
  }
}

function getOnMiss({ missingSet, cwd }: ROptions) {
  return (fn: string, dep: string) => {
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
  }
}

function getAffectedFilesSync(options: ROptions): string[] {
  const { sources, modified } = options

  const affectedFiles = filterDependentSync(sources, modified, {
    onMiss: getOnMiss(options),
    externals: options.missing,
  })

  log('affectedFiles', affectedFiles)

  return postprocess(affectedFiles, options).affected
}

async function getAffectedFiles(
  options: ROptions
): Promise<{ options: ROptions; affected: string[] }> {
  const { sources, modified } = options

  plog(`start filterDependent`)

  const affectedFiles = await filterDependent(sources, modified, {
    onMiss: getOnMiss(options),
    externals: options.missing,
  })

  plog(`end filterDependent`)

  log('affectedFiles', affectedFiles)

  return postprocess(affectedFiles, options)
}

export async function getAffected(optionsArg: Options = {}) {
  const options: ROptions = getOptions(optionsArg)
  const result = await getAffectedFiles(options)

  return result.affected
}

export async function getAffectedCli(optionsArg: Options = {}) {
  const options: ROptions = getOptions(optionsArg)

  return getAffectedFiles(options)
}

export default getAffected
