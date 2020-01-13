export type Filename = string
export type GlobPattern = string

export interface Options {
  pattern?: string
  changed?: Filename[] // deprecated
  modified?: Filename[]
  abs?: boolean
  absolute?: boolean
  usink?: GlobPattern[]
  cwd?: string
  missing?: string[]
  mergeBase?: string
  tracked?: Filename[]
  dot?: boolean
  pmodified?: Filename[]
}

export interface ROptions extends Options {
  sources: Filename[]
  modified: Filename[]
  tracked: Filename[]
  trackedSet: Set<string>
  allTracked: Filename[]
  pattern: string
  cwd: string
  missing: string[]
  missingSet: Set<string>
  absolute: boolean
  dot: boolean
  extensions: string[]
  pmodified: Filename[]
}
