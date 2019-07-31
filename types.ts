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
  changed: Filename[]
  tracked: Filename[]
  pattern: string
  cwd: string
  missing: string[]
  absolute: boolean
  dot: boolean
}
