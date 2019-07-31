"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const filter_dependent_1 = __importStar(require("filter-dependent"));
const options_1 = __importStar(require("./options"));
const log = debug_1.default('af');
function getAffectedSync(patternArg, optionsArg) {
    const options = options_1.default(patternArg, optionsArg);
    return getAffectedFilesSync(options);
}
exports.getAffectedSync = getAffectedSync;
function postprocess(affectedFiles, options) {
    const { pattern, allTracked, sources, absolute, dot, cwd } = options;
    if (typeof options.usink !== 'undefined') {
        log('usink detected', options.usink);
        const usinkFiles = options.usink.reduce((acc, sl) => {
            const lfiles = options_1.filterByPattern(allTracked, sl, { dot, cwd });
            acc = acc.concat(lfiles);
            return acc;
        }, []);
        log('usinkFiles', usinkFiles);
        log(`checking usinkFiles to match pattern...`);
        usinkFiles.forEach((f) => {
            const relf = f.slice(cwd.length + 1);
            if (!minimatch_1.default(relf, pattern, { dot })) {
                throw new Error(`usink file "${relf}" does not match against pattern "${pattern}"`);
            }
        });
        const usinkFilesSet = new Set(usinkFiles);
        const affectedSet = new Set(affectedFiles);
        for (let fn of usinkFilesSet) {
            if (affectedSet.has(fn)) {
                log(`usink file "${fn}" is affected, returning all sources files`);
                return options_1.absConv(sources, absolute, cwd);
            }
        }
        log(`usink not affected, returning only affected files`);
    }
    if (absolute === true) {
        return affectedFiles;
    }
    // /abs/path/to/cwd/folder/1.js → folder/1.js
    return affectedFiles.map((f) => f.slice(cwd.length + 1));
}
function getOnMiss({ missingSet, cwd }) {
    return (fn, dep) => {
        const relFn = fn.slice(cwd.length + 1); // `/root/dir/foo/fn.js` → `foo/fn.js`
        log('Checking unresolved dependency in missing', relFn, dep);
        if (missingSet.has(`${relFn} >>> ${dep}`) ||
            missingSet.has(`* >>> ${dep}`) ||
            missingSet.has(`${relFn} >>> *`) ||
            missingSet.has(`* >>> *`)) {
            log(`matched one of missing, return`);
            return;
        }
        console.error(`Failed to resolve "${dep}" in "${fn}". Fix it or add to 'missing'.`);
        throw new Error(`Failed to resolve "${dep}" in "${fn}"`);
    };
}
function getAffectedFilesSync(options) {
    const { sources, changed } = options;
    const affectedFiles = filter_dependent_1.filterDependentSync(sources, changed, {
        onMiss: getOnMiss(options),
    });
    log('affectedFiles', affectedFiles);
    return postprocess(affectedFiles, options);
}
function getAffectedFiles(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { sources, changed } = options;
        const affectedFiles = yield filter_dependent_1.default(sources, changed, {
            onMiss: getOnMiss(options),
        });
        log('affectedFiles', affectedFiles);
        return postprocess(affectedFiles, options);
    });
}
function getAffected(patternArg, optionsArg) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = options_1.default(patternArg, optionsArg);
        return getAffectedFiles(options);
    });
}
exports.getAffected = getAffected;
exports.default = getAffected;
