import path from 'path'
// @ts-ignore
import af from '../index.ts'

describe('Basic', () => {
  const fix = ['__tests__', '__fixtures__', 'basic']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])

  it('Must return affected files', () => {
    const changed = [ path.resolve(cwd, 'changed.js') ]
    const result = af('**/__fixtures__/basic/**/*.js', { changed })
    expect(result).toEqual([
      '__tests__/__fixtures__/basic/affected.js',
      '__tests__/__fixtures__/basic/changed.js',
    ])
  })

  it('Must return affected files abs paths', () => {
    const changed = [
      path.resolve(cwd, 'changed.js')
    ]

    const result = af('**/__fixtures__/basic/**/*.js', { changed, absolute: true })
    expect(result).toEqual([
      path.resolve('__tests__/__fixtures__/basic/affected.js'),
      path.resolve('__tests__/__fixtures__/basic/changed.js'),
    ])
  })

  it('Must return affected files, options.pattern', () => {
    const changed = [ path.resolve(cwd, 'changed.js') ]
    const result = af({ pattern: '**/__fixtures__/basic/**/*.js', changed })
    expect(result).toEqual([
      '__tests__/__fixtures__/basic/affected.js',
      '__tests__/__fixtures__/basic/changed.js',
    ])
  })
})

describe('Superleaves', () => {
  const fix = ['__tests__', '__fixtures__', 'superleaves']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])

  it('Must include all files if superleaf is changed', () => {
    const superleaves = [
      path.resolve(cwd, 'a.js')
    ]
    const changed = superleaves
    const result = af('**/superleaves/**/*.js', { changed, superleaves })
    expect(result).toEqual([
      '__tests__/__fixtures__/superleaves/a.js',
      '__tests__/__fixtures__/superleaves/foo/b.js',
    ])
  })

  it('Must not throw when all superleaves are matched against pattern', () => {
    const superleaves = [
      path.resolve(cwd, 'a.js')
    ]
    expect(() => af('**/*.js', { changed: [], superleaves })).not.toThrow()
  })

  it('Must throw when one superleaf not matched against pattern', () => {
    const superleaves = [
      path.resolve(cwd, 'a.js')
    ]
    expect(() => af('foo/*.js', { changed: [], superleaves })).toThrow()
  })
})

describe('Config file', () => {
  const fix = ['__tests__', '__fixtures__', 'config-file']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])

  it('Must return affected files according to config pattern', () => {
    const changed = [ path.resolve(cwd, 'changed.js') ]
    const result = af({ changed, cwd })
    expect(result).toEqual([
      'affected.js',
    ])
  })
})

describe.only('options.missing', () => {
  const fix = ['__tests__', '__fixtures__', 'missing']
  const cwd = path.resolve(process.cwd(), fix[0], fix[1], fix[2])
  const pattern = '**/*.js'
  const changed = [ path.resolve(cwd, 'changed.js') ]

  it('Must not fail if missing file is described', () => {
    const missing = [ 'affected.js >>> missing-library' ]
    expect(() => af({ pattern, changed, cwd, missing })).not.toThrow()
  })

  it('Must throw if missing filename is not matched', () => {
    const missing = [ 'foobar.js >>> missing-library' ]
    expect(() => af({ pattern, changed, cwd, missing })).toThrow()
  })

  it('Must not throw if filename is described as *', () => {
    const missing = [ '* >>> missing-library' ]
    expect(() => af({ pattern, changed, cwd, missing })).not.toThrow()
  })
})