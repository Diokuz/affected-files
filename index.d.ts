declare type Filename = string;
declare type GlobPattern = string;
declare type Options = {
    changed?: Filename[];
    abs?: boolean;
    superleaves?: GlobPattern[];
};
export declare const DEFAULT_PATTERN = "./src/**/*";
declare function getAffectedFiles(pattern?: string, options?: Options): string[];
export default getAffectedFiles;
