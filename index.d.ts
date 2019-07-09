declare const fs: any;
declare const path: any;
declare const execSync: any;
declare const glob: any;
declare const debug: any;
declare const filterDependent: any;
declare const log: any;
declare type Options = {
    changed?: string[];
};
declare function getChanged(): string[];
declare function getAffectedFiles(pattern?: string, options?: Options): string[];
