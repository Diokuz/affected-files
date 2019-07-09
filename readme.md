Returns a list of files, which affected in current branch compared to target branch (origin/master by default).

## Example

Lets say you have a repo with files `a.js`, `b.js`, `c.js` and `d.js`. Let `a.js` and `b.js` be dependent from `d.js`. If `d.js` was changed in your merge request, files `a.js` and `b.js` also _affected_. So, `affected-files` will return you an array of `[ 'a.js', 'b.js', 'd.js' ]`.

> note: removed files are not considered, since it breaks a require chain.

## Extensions

`.js`, `.jsx`, `.ts`, `.tsx` are supported. Other extensions not yet.

## API

```js
import getAffected from 'affected-files'

const affected = getAffected(pattern, options)
```

where

`pattern` (optional) – glob pattern of your source files, `./src/**/*.js` by default.

`options.changed` (optional) – an array of changed files paths. By default it is evaluated from git diff relative to origin/master, but you could define custom _changed_ array.
