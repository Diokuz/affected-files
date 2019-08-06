import path from 'path'
// @ts-ignore
import getAffected, { getAffectedSync } from '../src'

const af = getAffectedSync
const afa = getAffected

describe('Basic', () => {
  const fix = ['__tests__', '__fixtures__', 'basic']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])

  it('Must return affected files', () => {
    const changed = [ path.resolve(cwd, 'changed.js') ]
    const result = af({ changed, cwd })
    expect(result).toEqual([
      'affected.js',
      'changed.js',
    ])
  })

  it('Must return affected files', async () => {
    const changed = [ path.resolve(cwd, 'changed.js') ]
    const result = await afa({ changed, cwd })
    expect(result).toEqual([
      'affected.js',
      'changed.js',
    ])
  })

  it('Must return affected files abs paths', () => {
    const changed = [
      path.resolve(cwd, 'changed.js')
    ]

    const result = af({ changed, absolute: true, cwd })
    expect(result).toEqual([
      path.resolve(cwd, 'affected.js'),
      path.resolve(cwd, 'changed.js'),
    ])
  })

  it('Must return affected files, options.pattern', () => {
    const changed = [ path.resolve(cwd, 'changed.js') ]
    const result = af({ pattern: 'cha*.js', changed, cwd })
    expect(result).toEqual([
      // 'affected.js',
      'changed.js',
    ])
  })
})

describe('usink', () => {
  const fix = ['__tests__', '__fixtures__', 'usink']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])

  it('Must include all patterned files if usink is changed', () => {
    const usink = ['a.js']
    const changed = [path.resolve(cwd, 'a.js')]
    const result = af({ changed, usink, cwd })
    expect(result).toEqual([
      'a.js',
      'foo/b.js',
    ])
  })

  it('Must not include file with wrong extension', () => {
    const usink = ['a.js']
    const changed = [path.resolve(cwd, 'a.js')]
    const result = af({ changed, usink, cwd })
    expect(result).toEqual([
      'a.js',
      'foo/b.js',
      // 'some.thing',
    ])
  })

  it('Must not throw when all usink are matched against pattern', () => {
    const usink = ['a.js']
    expect(() => af({ changed: [], cwd, usink })).not.toThrow()
  })

  it('Must throw when one usink not matched against pattern', () => {
    const usink = ['a.js']
    expect(() => af({ pattern: 'foo/*.js', changed: [], cwd, usink })).toThrow()
  })

  it('Must not fail when usink is absolute path', () => {
    const usink = ['a.js']
    expect(() => af({ changed: [], cwd, usink, absolute: true }))
      .not.toThrow()
  })
})

describe('Config file', () => {
  const fix = ['__tests__', '__fixtures__', 'config-file']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])

  it('Must return affected files according to config-file pattern', () => {
    const changed = [ path.resolve(cwd, 'x-changed.js') ]
    const result = af({ changed, cwd })
    expect(result).toEqual([
      'x-affected.js',
      'x-changed.js',
    ])
  })

  it('Must return affected files according to config-file pattern', async () => {
    const changed = [ path.resolve(cwd, 'x-changed.js') ]
    const result = await afa({ changed, cwd })
    expect(result).toEqual([
      'x-affected.js',
      'x-changed.js',
    ])
  })
})

describe('options.missing', () => {
  const fix = ['__tests__', '__fixtures__', 'missing']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])
  const changed = [ path.resolve(cwd, 'changed.js') ]

  it('Must not fail if missing file is described', () => {
    const missing = [ 'affected.js >>> missing-library' ]
    expect(() => af({ changed, cwd, missing })).not.toThrow()
  })

  it('Must throw if missing filename is not matched', () => {
    const missing = [ 'foobar.js >>> missing-library' ]
    expect(() => af({ changed, cwd, missing })).toThrow()
  })

  it('Must not throw if filename is described as *', () => {
    const missing = [ '* >>> missing-library' ]
    expect(() => af({ changed, cwd, missing })).not.toThrow()
  })

  it('Must not throw if library is described as *', () => {
    const missing = [ 'affected.js >>> *' ]
    expect(() => af({ changed, cwd, missing })).not.toThrow()
  })

  it('Must not throw if wildcard', () => {
    const missing = [ '* >>> *' ]
    expect(() => af({ changed, cwd, missing })).not.toThrow()
  })
})

describe('options.tracked', () => {
  const fix = ['__tests__', '__fixtures__', 'gitignore']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])
  const changed = [ path.resolve(cwd, 'changed.js') ]
  const tracked = [
    path.resolve(cwd, 'changed.js'),
    path.resolve(cwd, 'affected.js'),
    path.resolve(cwd, 'not-affected.js'),
    // gitignored
    // path.resolve(cwd, 'ignored-affected.js'),
    // path.resolve(cwd, 'ignored-usink.js'),
  ]

  it('Must not include ignored files', () => {
    const result = af({ changed, cwd, tracked })

    expect(result).toEqual(['changed.js', 'affected.js'])
  })

  it('Must not account for ignored (not tracked) usink', () => {
    const usink = ['ignored-usink.js']
    const changed = [path.resolve(cwd, 'ignored-usink.js')]
    const result = af({ changed, cwd, tracked, usink })
    expect(result).toEqual([])
  })

  it('Must account for not-ignored usink', () => {
    const usink = ['ignored-usink.js']
    const localTracked = [
      ...tracked,
      path.resolve(cwd, 'ignored-usink.js'), // add ignored to tracked
    ]
    const changed = [path.resolve(cwd, 'ignored-usink.js')]
    const result = af({ changed, cwd, tracked: localTracked, usink })
    expect(result).toEqual(['changed.js', 'affected.js', 'not-affected.js', 'ignored-usink.js'])
  })

  it('Must account for affected (not changed) usink', () => {
    const usink = ['affected.js']
    const result = af({ changed, cwd, tracked, usink })
    expect(result).toEqual(['changed.js', 'affected.js', 'not-affected.js'])
  })
})
