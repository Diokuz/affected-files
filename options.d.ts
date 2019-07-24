import { Options, ROptions, Filename } from './types';
export declare const DEFAULT_PATTERN = "**/*";
declare function getOptions(patternArg: string | Options, optionsArg?: Options): ROptions;
export default getOptions;
export declare function absConv(files: Filename[], absolute: boolean, cwd: string): string[];
