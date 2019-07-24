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
const minimatch_1 = __importDefault(require("minimatch"));
const filter_dependent_1 = __importDefault(require("filter-dependent"));
const log = debug_1.default('af');
exports.DEFAULT_PATTERN = './src/**/*';
const DEFAULT_OPTIONS = {
    absolute: false,
    cwd: process.cwd(),
    missing: [],
};
function getChanged(mergeBase = 'origin/master', argChanged) {
    if (argChanged) {
        // to abs path
        return argChanged.map((f) => path_1.default.resolve(f));
    }
    const staged = String(child_process_1.execSync('git diff --name-only --pretty=format: HEAD'))
        .trim()
        .split('\n')
        .filter((s) => s.length);
    const base = child_process_1.execSync(`git merge-base ${mergeBase} HEAD`)
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
function getOptions(patternArg, optionsArg) {
    let pattern = exports.DEFAULT_PATTERN;
    let realOptionsArg = optionsArg;
    if (typeof patternArg === 'object') {
        realOptionsArg = patternArg;
        pattern = patternArg.pattern || exports.DEFAULT_PATTERN;
    }
    else {
        pattern = patternArg;
    }
    let options = Object.assign({ pattern }, DEFAULT_OPTIONS, realOptionsArg);
    let fileOptions = {};
    try {
        const fn = path_1.default.resolve(options.cwd, 'affected-files.config.js');
        fileOptions = require(fn);
        log(`File config found`, fn, fileOptions);
    }
    catch (e) {
        log(`No config file detected`);
    }
    options = Object.assign({ pattern }, DEFAULT_OPTIONS, fileOptions, realOptionsArg);
    return options;
}
function publicGetAffectedFiles(patternArg, optionsArg) {
    const options = getOptions(patternArg, optionsArg);
    return getAffectedFiles(options);
}
function getAffectedFiles(options) {
    const { pattern, absolute, cwd, missing } = options;
    const missingSet = new Set(missing);
    if (options.changed) {
        log('custom changed detected', options.changed);
    }
    const changed = getChanged(options.mergeBase, options.changed);
    log('pattern', pattern);
    const sources = glob_1.default.sync(pattern, { cwd, absolute: true });
    log('sources', sources);
    const affectedFiles = filter_dependent_1.default(sources, changed, {
        onMiss: (fn, dep) => {
            const relFn = fn.slice(cwd.length + 1); // `/root/dir/foo/fn.js` → `foo/fn.js`
            log('Checking unresolved dependency in missing', relFn, dep);
            if (missingSet.has(`${relFn} >>> ${dep}`) || missingSet.has(`* >>> ${dep}`)) {
                return;
            }
            console.error(`Failed to resolve "${dep}" in "${fn}". Fix it or add to 'missing'.`);
            throw new Error(`Failed to resolve "${dep}" in "${fn}"`);
        },
    });
    log('affectedFiles', affectedFiles);
    if (options.superleaves) {
        log('superleaves detected', options.superleaves);
        const superfiles = options.superleaves.reduce((acc, sl) => {
            const lfiles = glob_1.default.sync(sl, { absolute: true });
            acc = acc.concat(lfiles);
            return acc;
        }, []);
        log('superfiles', superfiles);
        log(`checking superfiles to match pattern...`);
        superfiles.forEach((f) => {
            const relf = f.slice(cwd.length + 1);
            if (!minimatch_1.default(relf, pattern)) {
                throw new Error(`Superfile "${relf}" does not match against pattern "${pattern}"`);
            }
        });
        const superfilesSet = new Set(superfiles);
        const affectedSet = new Set(affectedFiles);
        for (let fn of superfilesSet) {
            if (affectedSet.has(fn)) {
                log(`Superleaf "${fn}" is affected, returning all files`, options.superleaves);
                return glob_1.default.sync(pattern, { absolute });
            }
        }
        log(`Superleaves not affected, returning only affected files`);
    }
    if (absolute === true) {
        return affectedFiles;
    }
    // /abs/path/to/cwd/folder/1.js → folder/1.js
    return affectedFiles.map((f) => f.slice(cwd.length + 1));
}
exports.default = publicGetAffectedFiles;
//# sourceMappingURL=index.js.map