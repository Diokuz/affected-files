declare type Filename = string;
declare type GlobPattern = string;
interface Options {
    pattern?: string;
    changed?: Filename[];
    abs?: boolean;
    absolute?: boolean;
    superleaves?: GlobPattern[];
    cwd?: string;
}
export declare const DEFAULT_PATTERN = "./src/**/*";
declare function publicGetAffectedFiles(patternArg: string | Options, optionsArg?: Options): string[];
export default publicGetAffectedFiles;
