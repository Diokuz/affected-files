<h1 align="center">Affected files</h1>

Returns a list of files, which affected in current branch compared to target branch (origin/master by default).

## CLI

```sh
$ yarn afiles

pattern:  **/*
Affected files:

a.js
dependent-from-a.js
dependent-from--dependent-from-a.js

total: 3
```

## Explanation

Lets say you have a repo with files

```
a.js
dependent-from-a.js
dependent-from--dependent-from-a.js
not-dependent-from-a.js
```

If `a.js` was changed in your merge request, files `dependent-from-a.js` and `dependent-from--dependent-from-a.js` also _affected_. So, `affected-files` will return

```js
[ 'a.js', 'dependent-from-a.js', 'dependent-from--dependent-from-a.js' ]
```

## Extensions

`.js`, `.jsx`, `.ts`, `.tsx` are supported. Other extensions – not yet.

## Configuration

```js
import getAffected from 'affected-files'
// import { getAffectedSync } from 'affected-files'

const affected = await getAffected(options)
```

All options are optional.

| Option        | default           | description  |
| ------------- |:------------- |:----- |
| `pattern`      | `**/*` | Glob pattern of your source files. |
| `changed` | `git diff ...` | An array of changed files paths. By default it is evaluated from git diff relative to origin/master, but you could define custom _changed_ array. |
| `usink` | `[]` | An array of glob patterns of files, which considered as [universal sink](https://en.wikipedia.org/wiki/Universal_vertex) in dependency graph. That means, every tracked file in your repo is dependent from every usink file. For example, you need to build full storybook every time you have affected something in `./.storybook`. Then just use `getAffected(pattern, { usink: '.storybook/*' })`. Note: every _usink_ must match _pattern_ |
| `absolute` | `false` | If true, returns absolute paths of affected files, relative to options.cwd otherwise. |
| `cwd` | `process.cwd()` | Absolute path of cwd folder, where to find files. |
| `mergeBase` | `origin/master` | Branch or revision which will be used to take a git diff. |
| `tracked` | `git ls-tree ...` | An array of files, which would be used for dependency tree building. E.g. files in node_modules are not participating in dependency traversing. |
| `dot` | `false` | If true, includes folders and files, starts with dot. |
| `missing` | `[]` | An array of strings, which should not be resolved. For example, in most cases there is no need to resolve `react`. Used for perfprmance optimization. Also, it could be used in tuple form `filename.js ≥≥≥ ../dependency`, which disables `../dependency` resolving only in filename.js. |

## affected-files.config.js

Place this file in cwd, and export your options.

## Using in CI

1. `affected-files` uses git, so, be sure, git is available in docker image
2. `affected-files` uses origin/master revision to compare, so, be sure a) origin/master is exists on runner b) origin/master is up to date.

`git fetch && git rev-parse origin/master` – that cmd resolves all problems, or fail otherwise. Use it before using `affected-files`.

If git is not available only on some docker images, you could save affected list to file and use it everywhere in CI via [artifacts](https://docs.gitlab.com/ee/user/project/pipelines/job_artifacts.html).
