<h1 align="center">Affected files</h1>

Returns a list of js/ts(x) files, which _affected_ in current branch compared to _mergeBase_ (origin/master by default).

## CLI

```sh
$ npm run afiles
// or
$ yarn afiles

Affected files: (modified, **affected only**)

  **__tests__/common.spec.ts**
  affected-files.config.js
  bin/cli.js
  src/index.ts
  src/options.ts
  src/types.ts

total: 6

Done in 0.82s.
```

## Explanation

Lets say you have a repo with files

```
a.js
dependent-from-a.js
dependent-from--dependent-from-a.js
not-dependent-from-a.js
```

If `a.js` was _modified_ in your merge request, files `dependent-from-a.js` and `dependent-from--dependent-from-a.js` also _affected_. So, `affected-files` will return

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
| `mergeBase` | `origin/master` | Branch or revision which will be used to take a git diff. |
| `cwd` | `process.cwd()` | Absolute path of cwd folder, where to find files. |
| `missing` | `[]` | An array of strings, which should not be resolved. For example, in most cases there is no need to resolve `react`. Used for perfprmance optimization. Also, it could be used in tuple form `filename.js ≥≥≥ ../dependency`, which disables `../dependency` resolving only in filename.js. |
| `pattern`      | `**/*` | Glob pattern of your source files. |
| `modified` | `git diff ...` | An array of modified files paths. By default it is evaluated from git ls-files relative to mergeBase, but you could define custom _modified_ array. |
| `usink` | `[]` | An array of glob patterns of files, which considered as [universal sink](https://en.wikipedia.org/wiki/Universal_vertex) in dependency graph. That means, every tracked file in your repo is dependent from every usink file. For example, you need to build full storybook every time you have affected something in `./.storybook`. Then just use `getAffected(pattern, { usink: '.storybook/*' })`. Note: every _usink_ must match _pattern_ |
| `tracked` | `git ls-tree ...` | An array of files, which would be used for dependency tree building. E.g. files in node_modules are not participating in dependency traversing. Note: by default untracked but non-ignored files are included. |
| `absolute` | `false` | If true, returns absolute paths of affected files, relative to options.cwd otherwise. |
| `dot` | `false` | If true, includes folders and files, starts with dot. |
| `pmodified` | `[]` | Permanently modified files. An array of filenames, which must be considered as modified. Note: files, dependent from _pmodified_-files, will be also considered as _affected_ permanently. Also, _pmodified_-files are taken only from _tracked_-files. |

## affected-files.config.js

Place this file in the project root folder (cwd), and export your options.

### Get all dependent files from single file

```sh
yarn afiles src/options.ts

custom modified: src/options.ts
affected files (modified, **affected only**):

  **__tests__/common.spec.ts**
  src/index.ts
  src/options.ts

total: 3
```

## Using in CI

1. `affected-files` uses git, so, be sure, git is available in docker image
2. `affected-files` uses origin/master revision to compare, so, be sure a) origin/master is exists on runner b) origin/master is up to date.

`git fetch && git rev-parse origin/master` – that cmd resolves all problems, or fail otherwise. Use it before using `affected-files`.

If git is not available only on some docker images, you could save affected list to file and use it everywhere in CI via [artifacts](https://docs.gitlab.com/ee/user/project/pipelines/job_artifacts.html).
