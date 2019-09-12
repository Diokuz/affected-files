## 4.1.3

- Windows support

## 4.1.0

- add `options.modified` alias for `options.changed`
- CLI now accepts first argument as one `modified` file, not `pattern`

## 4.0.0

- breaking: getAffected has only one argument now. Change `getAffected(pattern, options)` to `getAffected({ ...options, pattern })`.
- breaking: remove option `superleaves` in flavour of option `usink`
- better colorful cli

## 3.3.0

- Add `missing` option.
- Remove options `externals` and `dontResolve`.

## 3.1.0

- tracked files now filtered by 1) pattern 2) extensions → speed up `afiles`

## 3.0.0

- breaking: default exported function is async now
- getAffectedSync moved to named export

## 2.10.0

- rename `options.superleaves` to `options.usink`, mark `options.superleaves` as deprecated
