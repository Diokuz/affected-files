export declare type Filename = string;
export declare type GlobPattern = string;
export interface Options {
    pattern?: string;
    changed?: Filename[];
    abs?: boolean;
    absolute?: boolean;
    superleaves?: GlobPattern[];
    cwd?: string;
    missing?: string[];
    mergeBase?: string;
    tracked?: Filename[];
}
export interface ROptions extends Options {
    changed: Filename[];
    tracked: Filename[];
    pattern: string;
    cwd: string;
    missing: string[];
    absolute: boolean;
}
