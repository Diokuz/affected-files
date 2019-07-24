"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const debug_1 = __importDefault(require("debug"));
exports.DEFAULT_PATTERN = '**/*';
const DEFAULT_OPTIONS = {
    absolute: false,
    cwd: process.cwd(),
    missing: [],
};
const log = debug_1.default('af');
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
function getTracked(argTracked) {
    let tracked = argTracked;
    if (!tracked) {
        tracked = String(child_process_1.execSync('git ls-tree --full-tree -r --name-only HEAD'))
            .trim()
            .split('\n')
            .filter((s) => s.length);
    }
    log('tracked', tracked);
    return tracked.map((f) => path_1.default.resolve(f));
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
    // These operations are expensive, so, running them only for final options
    const changed = getChanged(options.mergeBase, options.changed);
    const tracked = getTracked(options.tracked);
    return Object.assign({}, options, { changed, tracked });
}
exports.default = getOptions;
function absConv(files, absolute, cwd) {
    return files.map((f) => {
        if (f.startsWith('/') && !absolute) {
            return f.slice(cwd.length + 1);
        }
        else if (!f.startsWith('/') && absolute) {
            return path_1.default.resolve(cwd, f);
        }
        return f;
    });
}
exports.absConv = absConv;
