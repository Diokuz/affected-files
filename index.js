"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const minimatch_1 = __importDefault(require("minimatch"));
const filter_dependent_1 = __importDefault(require("filter-dependent"));
const options_1 = __importStar(require("./options"));
const log = debug_1.default('af');
function publicGetAffectedFiles(patternArg, optionsArg) {
    const options = options_1.default(patternArg, optionsArg);
    return getAffectedFiles(options);
}
function getAffectedFiles(options) {
    const { pattern, absolute, cwd, missing, tracked, changed, dot } = options;
    log('tracked', tracked);
    const trackedSet = new Set(tracked);
    const missingSet = new Set(missing);
    if (options.changed) {
        log('custom changed detected', options.changed);
    }
    log('pattern', pattern);
    const sources = options_1.filterByPattern(tracked, pattern, { cwd, dot });
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
        const superfiles = options.superleaves
            .reduce((acc, sl) => {
            const lfiles = options_1.filterByPattern(tracked, sl, { dot, cwd });
            acc = acc.concat(lfiles);
            return acc;
        }, [])
            .filter((f) => trackedSet.has(f));
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
                log(`Superleaf "${fn}" is affected, returning all sources files`);
                return options_1.absConv(sources, absolute, cwd);
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
