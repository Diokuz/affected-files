"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const minimatch_1 = __importDefault(require("minimatch"));
const debug_1 = __importDefault(require("debug"));
exports.DEFAULT_PATTERN = '**/*';
const DEFAULT_OPTIONS = {
    absolute: false,
    cwd: process.cwd(),
    missing: [],
    dot: false,
};
const log = debug_1.default('af:opts');
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
function getTracked(cwd, argTracked) {
    let tracked = argTracked;
    if (!tracked) {
        tracked = String(child_process_1.execSync(`git ls-files`, { cwd }))
            .trim()
            .split('\n')
            .filter((s) => s.length)
            .map(absConvMap(true, cwd));
    }
    log('tracked', tracked);
    return tracked.filter((f) => fs_1.default.existsSync(f));
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
    log(`cwd`, options.cwd);
    // These operations are expensive, so, running them only for final options
    const changed = getChanged(options.mergeBase, options.changed);
    const tracked = getTracked(options.cwd, options.tracked);
    const trackedSet = new Set(tracked);
    const result = Object.assign({}, options, { changed, tracked, trackedSet });
    if (result.superleaves) {
        console.warn('deprecated options.superleaves detected, use options.usink instead');
        if (result.usink) {
            throw new Error(`Cannot operate both: with options.superleaves and options.sink! Use only options.sink.`);
        }
        result.usink = result.superleaves;
    }
    result.sources = filterByPattern(tracked, result.pattern, { cwd: result.cwd, dot: result.dot });
    log('sources', result.sources);
    log('pattern', result.pattern);
    result.missingSet = new Set(result.missing);
    if (result.changed) {
        log('custom changed detected', result.changed);
    }
    return result;
}
exports.default = getOptions;
function absConvMap(absolute, cwd) {
    return (f) => {
        if (f.startsWith('/') && !absolute) {
            return f.slice(cwd.length + 1);
        }
        else if (!f.startsWith('/') && absolute) {
            return path_1.default.resolve(cwd, f);
        }
        return f;
    };
}
exports.absConvMap = absConvMap;
function absConv(files, absolute, cwd) {
    return files.map(absConvMap(absolute, cwd));
}
exports.absConv = absConv;
function filterByPattern(files, pattern, { cwd, dot }) {
    log(`filterByPattern pattern="${pattern}", input`, files);
    const output = files
        .map(absConvMap(false, cwd))
        .filter((f) => {
        // log(`f`, f, pattern, minimatch(f, pattern, { dot }))
        return minimatch_1.default(f, pattern, { dot });
    })
        .map(absConvMap(true, cwd));
    log(`filterByPattern output`, output);
    return output;
}
exports.filterByPattern = filterByPattern;
