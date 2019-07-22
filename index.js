"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const glob_1 = __importDefault(require("glob"));
const debug_1 = __importDefault(require("debug"));
const filter_dependent_1 = __importDefault(require("filter-dependent"));
const log = debug_1.default('af');
exports.DEFAULT_PATTERN = './src/**/*';
function getChanged(argChanged) {
    if (argChanged) {
        // to abs path
        return argChanged.map((f) => path_1.default.resolve(f));
    }
    const staged = String(child_process_1.execSync('git diff --name-only --pretty=format: HEAD'))
        .trim()
        .split('\n')
        .filter((s) => s.length);
    const base = child_process_1.execSync('git merge-base origin/master HEAD')
        .toString()
        .trim();
    const cmd = `git log --name-only --pretty=format: HEAD ^${base}`;
    log('base', base);
    log('cmd', cmd);
    const comitted = String(child_process_1.execSync(cmd))
        .trim()
        .split('\n')
        .filter((s) => s.length);
    const changed = staged.concat(comitted).map((f) => path_1.default.resolve(f));
    log('changed', changed);
    return changed.filter((f) => fs_1.default.existsSync(f));
}
function getAffectedFiles(pattern = exports.DEFAULT_PATTERN, options = {}) {
    if (options.changed) {
        log('custom changed detected', options.changed);
    }
    const changed = getChanged(options.changed);
    log('pattern', pattern);
    const sources = glob_1.default.sync(pattern);
    log('sources', sources);
    const affectedFiles = filter_dependent_1.default(sources, changed);
    log('affectedFiles', affectedFiles);
    if (options.superleaves) {
        log('superleaves detected', options.superleaves);
        const superfiles = options.superleaves.reduce((acc, sl) => {
            const lfiles = glob_1.default.sync(sl, { absolute: true });
            acc = acc.concat(lfiles);
            return acc;
        }, []);
        log('superfiles', superfiles);
        const superfilesSet = new Set(superfiles);
        const affectedSet = new Set(affectedFiles);
        for (let fn of superfilesSet) {
            if (affectedSet.has(fn)) {
                log(`Superleaf "${fn}" is affected, returning all files`, options.superleaves);
                return glob_1.default.sync(pattern, { absolute: options.abs });
            }
        }
        log(`Superleaves not affected, returning only affected files`);
    }
    if (options.abs === true) {
        return affectedFiles;
    }
    // /abs/path/to/cwd/folder/1.js → folder/1.js
    return affectedFiles.map((f) => f.slice(process.cwd().length + 1));
}
exports.default = getAffectedFiles;
//# sourceMappingURL=index.js.map