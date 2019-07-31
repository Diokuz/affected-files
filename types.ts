export type Filename = string
export type GlobPattern = string

export interface Options {
  pattern?: string
  changed?: Filename[]
  abs?: boolean
  absolute?: boolean
  usink?: GlobPattern[]
  superleaves?: GlobPattern[] // deprecated
  cwd?: string
  missing?: string[]
  mergeBase?: string
  tracked?: Filename[]
  dot?: boolean
}

export interface ROptions extends Options {
  sources: Filename[]
  changed: Filename[]
  tracked: Filename[]
  trackedSet: Set<string>
  pattern: string
  cwd: string
  missing: string[]
  missingSet: Set<string>
  absolute: boolean
  dot: boolean
}
