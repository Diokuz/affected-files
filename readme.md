Returns a list of files, which affected in current branch compared to target branch (origin/master by default).

## Example

Lets say you have a repo with files

```
a.js
b.js
c.js
d.js
```

Let `a.js` and `b.js` be dependent from `d.js`.

If `d.js` was changed in your merge request, files `a.js` and `b.js` also _affected_. So, `affected-files` will return

```js
[ 'a.js', 'b.js', 'd.js' ]
```

> note: removed files are not accounted, since it breaks a require chain.

## Extensions

`.js`, `.jsx`, `.ts`, `.tsx` are supported. Other extensions – not yet.

## API

```js
import getAffected from 'affected-files'

const affected = getAffected(pattern | options [, options])
```

| Option        | default           | description  |
| ------------- |:------------- |:----- |
| `pattern`      | `./src/**/*.js` | Glob pattern of your source files. Could be defined either as a first argument, or as a _pattern_ property of option object, which became first argument in that case (getAffected(pattern, options) or getAffected({ pattern, ...options })are equal). |
| `changed` | `git diff ...` | An array of changed files paths. By default it is evaluated from git diff relative to origin/master, but you could define custom _changed_ array. |
| `superleaves` | `[]` | An array of glob patterns of files, which considered as superleaves. That means, every js/ts files in your repo is dependent from every superleaf. For example, you need to build full storybook every time you have changed something in `./.storybook`. Then just use `getAffected(pattern, { superleaves: '.storybook/*' })`. Note: every _superfile_ must match _pattern_ |
| `absolute` | `false` | If true, returns absolute paths of affected files, relative to options.cwd otherwise. |
| `cwd` | `process.cwd()` | Absolute path of cwd folder, where to find files. |
| `mergeBase` | `origin/master` | Branch or revision which will be used to take a git diff. |

## affected-files.config.js

Place this file in cwd, and export your default options (including _pattern_).

## CLI

```sh
$ yarn afiles 'src/**/*.js'

pattern:  src/**/*.js
Affected files:
src/index.js
src/foo.js
src/bar.js
```

## Using in CI

1. `affected-files` uses git, so, be sure, git is available in docker image
2. `affected-files` uses origin/master revision to compare, so, be sure a) origin/master is exists on runner b) origin/master is up to date.

`git fetch && git rev-parse origin/master` – that cmd resolves all problems, or fail otherwise. Use it before using `affected-files`.

If git is not available only on some docker images, you could save affected list to file and use it everywhere in CI via [artifacts](https://docs.gitlab.com/ee/user/project/pipelines/job_artifacts.html).
