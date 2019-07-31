export declare type Filename = string;
export declare type GlobPattern = string;
export interface Options {
    pattern?: string;
    changed?: Filename[];
    abs?: boolean;
    absolute?: boolean;
    usink?: GlobPattern[];
    superleaves?: GlobPattern[];
    cwd?: string;
    missing?: string[];
    mergeBase?: string;
    tracked?: Filename[];
    dot?: boolean;
}
export interface ROptions extends Options {
    sources: Filename[];
    changed: Filename[];
    tracked: Filename[];
    trackedSet: Set<string>;
    allTracked: Filename[];
    pattern: string;
    cwd: string;
    missing: string[];
    missingSet: Set<string>;
    absolute: boolean;
    dot: boolean;
    extensions: string[];
}
