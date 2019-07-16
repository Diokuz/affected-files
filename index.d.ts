declare type Options = {
    changed?: string[];
    abs?: boolean;
};
export declare const DEFAULT_PATTERN = "./src/**/*";
declare function getAffectedFiles(pattern?: string, options?: Options): string[];
export default getAffectedFiles;
