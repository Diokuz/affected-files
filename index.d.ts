declare type Filename = string;
declare type GlobPattern = string;
declare type Options = {
    pattern?: string;
    changed?: Filename[];
    abs?: boolean;
    absolute?: boolean;
    superleaves?: GlobPattern[];
};
export declare const DEFAULT_PATTERN = "./src/**/*";
declare function getAffectedFiles(patternArg: string | Options, optionsArg?: Options): string[];
export default getAffectedFiles;
