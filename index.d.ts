import { Options } from './types';
export declare function getAffectedSync(patternArg: string | Options, optionsArg?: Options): string[];
export declare function getAffected(patternArg: string | Options, optionsArg?: Options): Promise<string[]>;
export default getAffected;
