import { Options, ROptions, Filename } from './types';
export declare const DEFAULT_PATTERN = "**/*";
declare function getOptions(patternArg: string | Options, optionsArg?: Options): ROptions;
export default getOptions;
export declare function absConvMap(absolute: boolean, cwd: string): (f: string) => string;
export declare function absConv(files: Filename[], absolute: boolean, cwd: string): string[];
export declare function filterByPattern(files: Filename[], pattern: string, { cwd, dot }: {
    cwd: string;
    dot: boolean;
}): string[];
