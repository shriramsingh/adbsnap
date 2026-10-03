"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/detect-libc/lib/process.js
var require_process = __commonJS({
  "node_modules/detect-libc/lib/process.js"(exports2, module2) {
    "use strict";
    var isLinux = () => process.platform === "linux";
    var report = null;
    var getReport = () => {
      if (!report) {
        if (isLinux() && process.report) {
          const orig = process.report.excludeNetwork;
          process.report.excludeNetwork = true;
          report = process.report.getReport();
          process.report.excludeNetwork = orig;
        } else {
          report = {};
        }
      }
      return report;
    };
    module2.exports = { isLinux, getReport };
  }
});

// node_modules/detect-libc/lib/filesystem.js
var require_filesystem = __commonJS({
  "node_modules/detect-libc/lib/filesystem.js"(exports2, module2) {
    "use strict";
    var fs8 = require("fs");
    var LDD_PATH = "/usr/bin/ldd";
    var SELF_PATH = "/proc/self/exe";
    var MAX_LENGTH = 2048;
    var readFileSync = (path9) => {
      const fd = fs8.openSync(path9, "r");
      const buffer2 = Buffer.alloc(MAX_LENGTH);
      const bytesRead = fs8.readSync(fd, buffer2, 0, MAX_LENGTH, 0);
      fs8.close(fd, () => {
      });
      return buffer2.subarray(0, bytesRead);
    };
    var readFile = (path9) => new Promise((resolve, reject) => {
      fs8.open(path9, "r", (err, fd) => {
        if (err) {
          reject(err);
        } else {
          const buffer2 = Buffer.alloc(MAX_LENGTH);
          fs8.read(fd, buffer2, 0, MAX_LENGTH, 0, (_, bytesRead) => {
            resolve(buffer2.subarray(0, bytesRead));
            fs8.close(fd, () => {
            });
          });
        }
      });
    });
    module2.exports = {
      LDD_PATH,
      SELF_PATH,
      readFileSync,
      readFile
    };
  }
});

// node_modules/detect-libc/lib/elf.js
var require_elf = __commonJS({
  "node_modules/detect-libc/lib/elf.js"(exports2, module2) {
    "use strict";
    var interpreterPath = (elf) => {
      if (elf.length < 64) {
        return null;
      }
      if (elf.readUInt32BE(0) !== 2135247942) {
        return null;
      }
      if (elf.readUInt8(4) !== 2) {
        return null;
      }
      if (elf.readUInt8(5) !== 1) {
        return null;
      }
      const offset = elf.readUInt32LE(32);
      const size = elf.readUInt16LE(54);
      const count = elf.readUInt16LE(56);
      for (let i = 0; i < count; i++) {
        const headerOffset = offset + i * size;
        const type = elf.readUInt32LE(headerOffset);
        if (type === 3) {
          const fileOffset = elf.readUInt32LE(headerOffset + 8);
          const fileSize = elf.readUInt32LE(headerOffset + 32);
          return elf.subarray(fileOffset, fileOffset + fileSize).toString().replace(/\0.*$/g, "");
        }
      }
      return null;
    };
    module2.exports = {
      interpreterPath
    };
  }
});

// node_modules/detect-libc/lib/detect-libc.js
var require_detect_libc = __commonJS({
  "node_modules/detect-libc/lib/detect-libc.js"(exports2, module2) {
    "use strict";
    var childProcess = require("child_process");
    var { isLinux, getReport } = require_process();
    var { LDD_PATH, SELF_PATH, readFile, readFileSync } = require_filesystem();
    var { interpreterPath } = require_elf();
    var cachedFamilyInterpreter;
    var cachedFamilyFilesystem;
    var cachedVersionFilesystem;
    var command = "getconf GNU_LIBC_VERSION 2>&1 || true; ldd --version 2>&1 || true";
    var commandOut = "";
    var safeCommand = () => {
      if (!commandOut) {
        return new Promise((resolve) => {
          childProcess.exec(command, (err, out) => {
            commandOut = err ? " " : out;
            resolve(commandOut);
          });
        });
      }
      return commandOut;
    };
    var safeCommandSync = () => {
      if (!commandOut) {
        try {
          commandOut = childProcess.execSync(command, { encoding: "utf8" });
        } catch (_err) {
          commandOut = " ";
        }
      }
      return commandOut;
    };
    var GLIBC = "glibc";
    var RE_GLIBC_VERSION = /LIBC[a-z0-9 \-).]*?(\d+\.\d+)/i;
    var MUSL = "musl";
    var isFileMusl = (f) => f.includes("libc.musl-") || f.includes("ld-musl-");
    var familyFromReport = () => {
      const report = getReport();
      if (report.header && report.header.glibcVersionRuntime) {
        return GLIBC;
      }
      if (Array.isArray(report.sharedObjects)) {
        if (report.sharedObjects.some(isFileMusl)) {
          return MUSL;
        }
      }
      return null;
    };
    var familyFromCommand = (out) => {
      const [getconf, ldd1] = out.split(/[\r\n]+/);
      if (getconf && getconf.includes(GLIBC)) {
        return GLIBC;
      }
      if (ldd1 && ldd1.includes(MUSL)) {
        return MUSL;
      }
      return null;
    };
    var familyFromInterpreterPath = (path9) => {
      if (path9) {
        if (path9.includes("/ld-musl-")) {
          return MUSL;
        } else if (path9.includes("/ld-linux-")) {
          return GLIBC;
        }
      }
      return null;
    };
    var getFamilyFromLddContent = (content) => {
      content = content.toString();
      if (content.includes("musl")) {
        return MUSL;
      }
      if (content.includes("GNU C Library")) {
        return GLIBC;
      }
      return null;
    };
    var familyFromFilesystem = async () => {
      if (cachedFamilyFilesystem !== void 0) {
        return cachedFamilyFilesystem;
      }
      cachedFamilyFilesystem = null;
      try {
        const lddContent = await readFile(LDD_PATH);
        cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
      } catch (e) {
      }
      return cachedFamilyFilesystem;
    };
    var familyFromFilesystemSync = () => {
      if (cachedFamilyFilesystem !== void 0) {
        return cachedFamilyFilesystem;
      }
      cachedFamilyFilesystem = null;
      try {
        const lddContent = readFileSync(LDD_PATH);
        cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
      } catch (e) {
      }
      return cachedFamilyFilesystem;
    };
    var familyFromInterpreter = async () => {
      if (cachedFamilyInterpreter !== void 0) {
        return cachedFamilyInterpreter;
      }
      cachedFamilyInterpreter = null;
      try {
        const selfContent = await readFile(SELF_PATH);
        const path9 = interpreterPath(selfContent);
        cachedFamilyInterpreter = familyFromInterpreterPath(path9);
      } catch (e) {
      }
      return cachedFamilyInterpreter;
    };
    var familyFromInterpreterSync = () => {
      if (cachedFamilyInterpreter !== void 0) {
        return cachedFamilyInterpreter;
      }
      cachedFamilyInterpreter = null;
      try {
        const selfContent = readFileSync(SELF_PATH);
        const path9 = interpreterPath(selfContent);
        cachedFamilyInterpreter = familyFromInterpreterPath(path9);
      } catch (e) {
      }
      return cachedFamilyInterpreter;
    };
    var family = async () => {
      let family2 = null;
      if (isLinux()) {
        family2 = await familyFromInterpreter();
        if (!family2) {
          family2 = await familyFromFilesystem();
          if (!family2) {
            family2 = familyFromReport();
          }
          if (!family2) {
            const out = await safeCommand();
            family2 = familyFromCommand(out);
          }
        }
      }
      return family2;
    };
    var familySync2 = () => {
      let family2 = null;
      if (isLinux()) {
        family2 = familyFromInterpreterSync();
        if (!family2) {
          family2 = familyFromFilesystemSync();
          if (!family2) {
            family2 = familyFromReport();
          }
          if (!family2) {
            const out = safeCommandSync();
            family2 = familyFromCommand(out);
          }
        }
      }
      return family2;
    };
    var isNonGlibcLinux = async () => isLinux() && await family() !== GLIBC;
    var isNonGlibcLinuxSync = () => isLinux() && familySync2() !== GLIBC;
    var versionFromFilesystem = async () => {
      if (cachedVersionFilesystem !== void 0) {
        return cachedVersionFilesystem;
      }
      cachedVersionFilesystem = null;
      try {
        const lddContent = await readFile(LDD_PATH);
        const versionMatch = lddContent.match(RE_GLIBC_VERSION);
        if (versionMatch) {
          cachedVersionFilesystem = versionMatch[1];
        }
      } catch (e) {
      }
      return cachedVersionFilesystem;
    };
    var versionFromFilesystemSync = () => {
      if (cachedVersionFilesystem !== void 0) {
        return cachedVersionFilesystem;
      }
      cachedVersionFilesystem = null;
      try {
        const lddContent = readFileSync(LDD_PATH);
        const versionMatch = lddContent.match(RE_GLIBC_VERSION);
        if (versionMatch) {
          cachedVersionFilesystem = versionMatch[1];
        }
      } catch (e) {
      }
      return cachedVersionFilesystem;
    };
    var versionFromReport = () => {
      const report = getReport();
      if (report.header && report.header.glibcVersionRuntime) {
        return report.header.glibcVersionRuntime;
      }
      return null;
    };
    var versionSuffix = (s) => s.trim().split(/\s+/)[1];
    var versionFromCommand = (out) => {
      const [getconf, ldd1, ldd2] = out.split(/[\r\n]+/);
      if (getconf && getconf.includes(GLIBC)) {
        return versionSuffix(getconf);
      }
      if (ldd1 && ldd2 && ldd1.includes(MUSL)) {
        return versionSuffix(ldd2);
      }
      return null;
    };
    var version2 = async () => {
      let version3 = null;
      if (isLinux()) {
        version3 = await versionFromFilesystem();
        if (!version3) {
          version3 = versionFromReport();
        }
        if (!version3) {
          const out = await safeCommand();
          version3 = versionFromCommand(out);
        }
      }
      return version3;
    };
    var versionSync2 = () => {
      let version3 = null;
      if (isLinux()) {
        version3 = versionFromFilesystemSync();
        if (!version3) {
          version3 = versionFromReport();
        }
        if (!version3) {
          const out = safeCommandSync();
          version3 = versionFromCommand(out);
        }
      }
      return version3;
    };
    module2.exports = {
      GLIBC,
      MUSL,
      family,
      familySync: familySync2,
      isNonGlibcLinux,
      isNonGlibcLinuxSync,
      version: version2,
      versionSync: versionSync2
    };
  }
});

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports2, module2) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports2, module2) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports2, module2) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = exports2.re = [];
    var safeRe = exports2.safeRe = [];
    var src = exports2.src = [];
    var safeSrc = exports2.safeSrc = [];
    var t = exports2.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports2, module2) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports2, module2) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports2, module2) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var isPrereleaseIdentifier = (prerelease, identifier) => {
      const identifiers = identifier.split(".");
      if (identifiers.length > prerelease.length) {
        return false;
      }
      for (let i = 0; i < identifiers.length; i++) {
        if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) {
          return false;
        }
      }
      return true;
    };
    var SemVer = class _SemVer {
      constructor(version2, options) {
        options = parseOptions(options);
        if (version2 instanceof _SemVer) {
          if (version2.loose === !!options.loose && version2.includePrerelease === !!options.includePrerelease) {
            return version2;
          } else {
            version2 = version2.version;
          }
        } else if (typeof version2 !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version2}".`);
        }
        if (version2.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version2, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version2.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version2}`);
        }
        this.raw = version2;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (isPrereleaseIdentifier(this.prerelease, identifier)) {
                const prereleaseBase = this.prerelease[identifier.split(".").length];
                if (isNaN(prereleaseBase)) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version2, options, throwErrors = false) => {
      if (version2 instanceof SemVer) {
        return version2;
      }
      try {
        return new SemVer(version2, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse;
  }
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/semver/functions/valid.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var valid = (version2, options) => {
      const v = parse(version2, options);
      return v ? v.version : null;
    };
    module2.exports = valid;
  }
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/semver/functions/clean.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var clean = (version2, options) => {
      const s = parse(version2.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module2.exports = clean;
  }
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/semver/functions/inc.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version2, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version2 instanceof SemVer ? version2.version : version2,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module2.exports = inc;
  }
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/semver/functions/diff.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module2.exports = diff;
  }
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/semver/functions/major.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module2.exports = major;
  }
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/semver/functions/minor.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module2.exports = minor;
  }
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/semver/functions/patch.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module2.exports = patch;
  }
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/semver/functions/prerelease.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version2, options) => {
      const parsed = parse(version2, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module2.exports = prerelease;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/semver/functions/rcompare.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module2.exports = rcompare;
  }
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/semver/functions/compare-loose.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module2.exports = compareLoose;
  }
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/semver/functions/compare-build.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module2.exports = compareBuild;
  }
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/semver/functions/sort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module2.exports = sort;
  }
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/semver/functions/rsort.js"(exports2, module2) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module2.exports = rsort;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports2, module2) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version2, options) => {
      if (version2 instanceof SemVer) {
        return version2;
      }
      if (typeof version2 === "number") {
        version2 = String(version2);
      }
      if (typeof version2 !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version2.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version2)) && (!match || match.index + match[0].length !== version2.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module2.exports = coerce;
  }
});

// node_modules/semver/functions/truncate.js
var require_truncate = __commonJS({
  "node_modules/semver/functions/truncate.js"(exports2, module2) {
    "use strict";
    var parse = require_parse();
    var constants = require_constants();
    var SemVer = require_semver();
    var truncate = (version2, truncation, options) => {
      if (!constants.RELEASE_TYPES.includes(truncation)) {
        return null;
      }
      const clonedVersion = cloneInputVersion(version2, options);
      return clonedVersion && doTruncation(clonedVersion, truncation);
    };
    var cloneInputVersion = (version2, options) => {
      const versionStringToParse = version2 instanceof SemVer ? version2.version : version2;
      return parse(versionStringToParse, options);
    };
    var doTruncation = (version2, truncation) => {
      if (isPrerelease(truncation)) {
        return version2.version;
      }
      version2.prerelease = [];
      switch (truncation) {
        case "major":
          version2.minor = 0;
          version2.patch = 0;
          break;
        case "minor":
          version2.patch = 0;
          break;
      }
      return version2.format();
    };
    var isPrerelease = (type) => {
      return type.startsWith("pre");
    };
    module2.exports = truncate;
  }
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/semver/internal/lrucache.js"(exports2, module2) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports2, module2) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        range = range.replace(BUILDSTRIPRE, "");
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache2.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache2.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version2) {
        if (!version2) {
          return false;
        }
        if (typeof version2 === "string") {
          try {
            version2 = new SemVer(version2, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version2, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache2 = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      src,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        if (invalidXRangeOrder(M, m, p)) {
          return comp;
        }
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version2, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version2)) {
          return false;
        }
      }
      if (version2.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version2.major && allowed.minor === version2.minor && allowed.patch === version2.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports2, module2) {
    "use strict";
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version2) {
        debug("Comparator.test", version2, this.options.loose);
        if (this.semver === ANY || version2 === ANY) {
          return true;
        }
        if (typeof version2 === "string") {
          try {
            version2 = new SemVer(version2, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version2, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var satisfies = (version2, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version2);
    };
    module2.exports = satisfies;
  }
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/semver/ranges/to-comparators.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module2.exports = toComparators;
  }
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/semver/ranges/max-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions2, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions2.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module2.exports = maxSatisfying;
  }
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/semver/ranges/min-satisfying.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions2, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions2.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module2.exports = minSatisfying;
  }
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/semver/ranges/min-version.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module2.exports = minVersion;
  }
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/semver/ranges/valid.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module2.exports = validRange;
  }
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/semver/ranges/outside.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version2, range, hilo, options) => {
      version2 = new SemVer(version2, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version2, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version2, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version2, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module2.exports = outside;
  }
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/semver/ranges/gtr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var gtr = (version2, range, options) => outside(version2, range, ">", options);
    module2.exports = gtr;
  }
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/semver/ranges/ltr.js"(exports2, module2) {
    "use strict";
    var outside = require_outside();
    var ltr = (version2, range, options) => outside(version2, range, "<", options);
    module2.exports = ltr;
  }
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/semver/ranges/intersects.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module2.exports = intersects;
  }
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/semver/ranges/simplify.js"(exports2, module2) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module2.exports = (versions2, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions2.sort((a, b) => compare(a, b, options));
      for (const version2 of v) {
        const included = satisfies(version2, range, options);
        if (included) {
          prev = version2;
          if (!first) {
            first = version2;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/semver/ranges/subset.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !c.test(gt.semver)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !c.test(lt.semver)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module2.exports = subset;
  }
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/semver/index.js"(exports2, module2) {
    "use strict";
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var truncate = require_truncate();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module2.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      truncate,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/@img/colour/color.cjs
var require_color = __commonJS({
  "node_modules/@img/colour/color.cjs"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export2(index_exports, {
      default: () => index_default
    });
    module2.exports = __toCommonJS2(index_exports);
    var colors = {
      aliceblue: [240, 248, 255],
      antiquewhite: [250, 235, 215],
      aqua: [0, 255, 255],
      aquamarine: [127, 255, 212],
      azure: [240, 255, 255],
      beige: [245, 245, 220],
      bisque: [255, 228, 196],
      black: [0, 0, 0],
      blanchedalmond: [255, 235, 205],
      blue: [0, 0, 255],
      blueviolet: [138, 43, 226],
      brown: [165, 42, 42],
      burlywood: [222, 184, 135],
      cadetblue: [95, 158, 160],
      chartreuse: [127, 255, 0],
      chocolate: [210, 105, 30],
      coral: [255, 127, 80],
      cornflowerblue: [100, 149, 237],
      cornsilk: [255, 248, 220],
      crimson: [220, 20, 60],
      cyan: [0, 255, 255],
      darkblue: [0, 0, 139],
      darkcyan: [0, 139, 139],
      darkgoldenrod: [184, 134, 11],
      darkgray: [169, 169, 169],
      darkgreen: [0, 100, 0],
      darkgrey: [169, 169, 169],
      darkkhaki: [189, 183, 107],
      darkmagenta: [139, 0, 139],
      darkolivegreen: [85, 107, 47],
      darkorange: [255, 140, 0],
      darkorchid: [153, 50, 204],
      darkred: [139, 0, 0],
      darksalmon: [233, 150, 122],
      darkseagreen: [143, 188, 143],
      darkslateblue: [72, 61, 139],
      darkslategray: [47, 79, 79],
      darkslategrey: [47, 79, 79],
      darkturquoise: [0, 206, 209],
      darkviolet: [148, 0, 211],
      deeppink: [255, 20, 147],
      deepskyblue: [0, 191, 255],
      dimgray: [105, 105, 105],
      dimgrey: [105, 105, 105],
      dodgerblue: [30, 144, 255],
      firebrick: [178, 34, 34],
      floralwhite: [255, 250, 240],
      forestgreen: [34, 139, 34],
      fuchsia: [255, 0, 255],
      gainsboro: [220, 220, 220],
      ghostwhite: [248, 248, 255],
      gold: [255, 215, 0],
      goldenrod: [218, 165, 32],
      gray: [128, 128, 128],
      green: [0, 128, 0],
      greenyellow: [173, 255, 47],
      grey: [128, 128, 128],
      honeydew: [240, 255, 240],
      hotpink: [255, 105, 180],
      indianred: [205, 92, 92],
      indigo: [75, 0, 130],
      ivory: [255, 255, 240],
      khaki: [240, 230, 140],
      lavender: [230, 230, 250],
      lavenderblush: [255, 240, 245],
      lawngreen: [124, 252, 0],
      lemonchiffon: [255, 250, 205],
      lightblue: [173, 216, 230],
      lightcoral: [240, 128, 128],
      lightcyan: [224, 255, 255],
      lightgoldenrodyellow: [250, 250, 210],
      lightgray: [211, 211, 211],
      lightgreen: [144, 238, 144],
      lightgrey: [211, 211, 211],
      lightpink: [255, 182, 193],
      lightsalmon: [255, 160, 122],
      lightseagreen: [32, 178, 170],
      lightskyblue: [135, 206, 250],
      lightslategray: [119, 136, 153],
      lightslategrey: [119, 136, 153],
      lightsteelblue: [176, 196, 222],
      lightyellow: [255, 255, 224],
      lime: [0, 255, 0],
      limegreen: [50, 205, 50],
      linen: [250, 240, 230],
      magenta: [255, 0, 255],
      maroon: [128, 0, 0],
      mediumaquamarine: [102, 205, 170],
      mediumblue: [0, 0, 205],
      mediumorchid: [186, 85, 211],
      mediumpurple: [147, 112, 219],
      mediumseagreen: [60, 179, 113],
      mediumslateblue: [123, 104, 238],
      mediumspringgreen: [0, 250, 154],
      mediumturquoise: [72, 209, 204],
      mediumvioletred: [199, 21, 133],
      midnightblue: [25, 25, 112],
      mintcream: [245, 255, 250],
      mistyrose: [255, 228, 225],
      moccasin: [255, 228, 181],
      navajowhite: [255, 222, 173],
      navy: [0, 0, 128],
      oldlace: [253, 245, 230],
      olive: [128, 128, 0],
      olivedrab: [107, 142, 35],
      orange: [255, 165, 0],
      orangered: [255, 69, 0],
      orchid: [218, 112, 214],
      palegoldenrod: [238, 232, 170],
      palegreen: [152, 251, 152],
      paleturquoise: [175, 238, 238],
      palevioletred: [219, 112, 147],
      papayawhip: [255, 239, 213],
      peachpuff: [255, 218, 185],
      peru: [205, 133, 63],
      pink: [255, 192, 203],
      plum: [221, 160, 221],
      powderblue: [176, 224, 230],
      purple: [128, 0, 128],
      rebeccapurple: [102, 51, 153],
      red: [255, 0, 0],
      rosybrown: [188, 143, 143],
      royalblue: [65, 105, 225],
      saddlebrown: [139, 69, 19],
      salmon: [250, 128, 114],
      sandybrown: [244, 164, 96],
      seagreen: [46, 139, 87],
      seashell: [255, 245, 238],
      sienna: [160, 82, 45],
      silver: [192, 192, 192],
      skyblue: [135, 206, 235],
      slateblue: [106, 90, 205],
      slategray: [112, 128, 144],
      slategrey: [112, 128, 144],
      snow: [255, 250, 250],
      springgreen: [0, 255, 127],
      steelblue: [70, 130, 180],
      tan: [210, 180, 140],
      teal: [0, 128, 128],
      thistle: [216, 191, 216],
      tomato: [255, 99, 71],
      turquoise: [64, 224, 208],
      violet: [238, 130, 238],
      wheat: [245, 222, 179],
      white: [255, 255, 255],
      whitesmoke: [245, 245, 245],
      yellow: [255, 255, 0],
      yellowgreen: [154, 205, 50]
    };
    for (const key in colors) Object.freeze(colors[key]);
    var color_name_default = Object.freeze(colors);
    var reverseNames = /* @__PURE__ */ Object.create(null);
    for (const name in color_name_default) {
      if (Object.hasOwn(color_name_default, name)) {
        reverseNames[color_name_default[name]] = name;
      }
    }
    var cs = {
      to: {},
      get: {}
    };
    cs.get = function(string2) {
      const prefix = string2.slice(0, 3).toLowerCase();
      let value;
      let model;
      switch (prefix) {
        case "hsl": {
          value = cs.get.hsl(string2);
          model = "hsl";
          break;
        }
        case "hwb": {
          value = cs.get.hwb(string2);
          model = "hwb";
          break;
        }
        default: {
          value = cs.get.rgb(string2);
          model = "rgb";
          break;
        }
      }
      if (!value) {
        return null;
      }
      return { model, value };
    };
    cs.get.rgb = function(string2) {
      if (!string2) {
        return null;
      }
      const abbr = /^#([a-f\d]{3,4})$/i;
      const hex = /^#([a-f\d]{6})([a-f\d]{2})?$/i;
      const rgba = /^rgba?\(\s*([+-]?(?:\d*\.)?\d+(?:e\d+)?)(?=[\s,])\s*(?:,\s*)?([+-]?(?:\d*\.)?\d+(?:e\d+)?)(?=[\s,])\s*(?:,\s*)?([+-]?(?:\d*\.)?\d+(?:e\d+)?)\s*(?:[\s,|/]\s*([+-]?(?:\d*\.)?\d+(?:e\d+)?)(%?)\s*)?\)$/i;
      const per = /^rgba?\(\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/i;
      const keyword = /^(\w+)$/;
      let rgb = [0, 0, 0, 1];
      let match;
      let i;
      let hexAlpha;
      if (match = string2.match(hex)) {
        hexAlpha = match[2];
        match = match[1];
        for (i = 0; i < 3; i++) {
          const i2 = i * 2;
          rgb[i] = Number.parseInt(match.slice(i2, i2 + 2), 16);
        }
        if (hexAlpha) {
          rgb[3] = Number.parseInt(hexAlpha, 16) / 255;
        }
      } else if (match = string2.match(abbr)) {
        match = match[1];
        hexAlpha = match[3];
        for (i = 0; i < 3; i++) {
          rgb[i] = Number.parseInt(match[i] + match[i], 16);
        }
        if (hexAlpha) {
          rgb[3] = Number.parseInt(hexAlpha + hexAlpha, 16) / 255;
        }
      } else if (match = string2.match(rgba)) {
        for (i = 0; i < 3; i++) {
          rgb[i] = Number.parseFloat(match[i + 1]);
        }
        if (match[4]) {
          rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
        }
      } else if (match = string2.match(per)) {
        for (i = 0; i < 3; i++) {
          rgb[i] = Math.round(Number.parseFloat(match[i + 1]) * 2.55);
        }
        if (match[4]) {
          rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
        }
      } else if (match = string2.toLowerCase().match(keyword)) {
        if (match[1] === "transparent") {
          return [0, 0, 0, 0];
        }
        if (!Object.hasOwn(color_name_default, match[1])) {
          return null;
        }
        rgb = color_name_default[match[1]].slice();
        rgb[3] = 1;
        return rgb;
      } else {
        return null;
      }
      for (i = 0; i < 3; i++) {
        rgb[i] = clamp(rgb[i], 0, 255);
      }
      rgb[3] = clamp(rgb[3], 0, 1);
      return rgb;
    };
    cs.get.hsl = function(string2) {
      if (!string2) {
        return null;
      }
      const hsl = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[,|/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;
      const match = string2.match(hsl);
      if (match) {
        const alpha = Number.parseFloat(match[4]);
        const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
        const s = clamp(Number.parseFloat(match[2]), 0, 100);
        const l = clamp(Number.parseFloat(match[3]), 0, 100);
        const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
        return [h, s, l, a];
      }
      return null;
    };
    cs.get.hwb = function(string2) {
      if (!string2) {
        return null;
      }
      const hwb = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*[\s,]\s*([+-]?[\d.]+)%\s*[\s,]\s*([+-]?[\d.]+)%\s*(?:[\s,]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;
      const match = string2.match(hwb);
      if (match) {
        const alpha = Number.parseFloat(match[4]);
        const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
        const w = clamp(Number.parseFloat(match[2]), 0, 100);
        const b = clamp(Number.parseFloat(match[3]), 0, 100);
        const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
        return [h, w, b, a];
      }
      return null;
    };
    cs.to.hex = function(...rgba) {
      return "#" + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : "");
    };
    cs.to.rgb = function(...rgba) {
      return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ")" : "rgba(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ", " + rgba[3] + ")";
    };
    cs.to.rgb.percent = function(...rgba) {
      const r = Math.round(rgba[0] / 255 * 100);
      const g = Math.round(rgba[1] / 255 * 100);
      const b = Math.round(rgba[2] / 255 * 100);
      return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + r + "%, " + g + "%, " + b + "%)" : "rgba(" + r + "%, " + g + "%, " + b + "%, " + rgba[3] + ")";
    };
    cs.to.hsl = function(...hsla) {
      return hsla.length < 4 || hsla[3] === 1 ? "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)" : "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, " + hsla[3] + ")";
    };
    cs.to.hwb = function(...hwba) {
      let a = "";
      if (hwba.length >= 4 && hwba[3] !== 1) {
        a = ", " + hwba[3];
      }
      return "hwb(" + hwba[0] + ", " + hwba[1] + "%, " + hwba[2] + "%" + a + ")";
    };
    cs.to.keyword = function(...rgb) {
      return reverseNames[rgb.slice(0, 3)];
    };
    function clamp(number_, min, max) {
      return Math.min(Math.max(min, number_), max);
    }
    function hexDouble(number_) {
      const string_ = Math.round(number_).toString(16).toUpperCase();
      return string_.length < 2 ? "0" + string_ : string_;
    }
    var color_string_default = cs;
    var reverseKeywords = {};
    for (const key of Object.keys(color_name_default)) {
      reverseKeywords[color_name_default[key]] = key;
    }
    var convert = {
      rgb: { channels: 3, labels: "rgb" },
      hsl: { channels: 3, labels: "hsl" },
      hsv: { channels: 3, labels: "hsv" },
      hwb: { channels: 3, labels: "hwb" },
      cmyk: { channels: 4, labels: "cmyk" },
      xyz: { channels: 3, labels: "xyz" },
      lab: { channels: 3, labels: "lab" },
      oklab: { channels: 3, labels: ["okl", "oka", "okb"] },
      lch: { channels: 3, labels: "lch" },
      oklch: { channels: 3, labels: ["okl", "okc", "okh"] },
      hex: { channels: 1, labels: ["hex"] },
      keyword: { channels: 1, labels: ["keyword"] },
      ansi16: { channels: 1, labels: ["ansi16"] },
      ansi256: { channels: 1, labels: ["ansi256"] },
      hcg: { channels: 3, labels: ["h", "c", "g"] },
      apple: { channels: 3, labels: ["r16", "g16", "b16"] },
      gray: { channels: 1, labels: ["gray"] }
    };
    var conversions_default = convert;
    var LAB_FT = (6 / 29) ** 3;
    function srgbNonlinearTransform(c) {
      const cc = c > 31308e-7 ? 1.055 * c ** (1 / 2.4) - 0.055 : c * 12.92;
      return Math.min(Math.max(0, cc), 1);
    }
    function srgbNonlinearTransformInv(c) {
      return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
    }
    for (const model of Object.keys(convert)) {
      if (!("channels" in convert[model])) {
        throw new Error("missing channels property: " + model);
      }
      if (!("labels" in convert[model])) {
        throw new Error("missing channel labels property: " + model);
      }
      if (convert[model].labels.length !== convert[model].channels) {
        throw new Error("channel and label counts mismatch: " + model);
      }
      const { channels, labels } = convert[model];
      delete convert[model].channels;
      delete convert[model].labels;
      Object.defineProperty(convert[model], "channels", { value: channels });
      Object.defineProperty(convert[model], "labels", { value: labels });
    }
    convert.rgb.hsl = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const delta = max - min;
      let h;
      let s;
      switch (max) {
        case min: {
          h = 0;
          break;
        }
        case r: {
          h = (g - b) / delta;
          break;
        }
        case g: {
          h = 2 + (b - r) / delta;
          break;
        }
        case b: {
          h = 4 + (r - g) / delta;
          break;
        }
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      const l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert.rgb.hsv = function(rgb) {
      let rdif;
      let gdif;
      let bdif;
      let h;
      let s;
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const v = Math.max(r, g, b);
      const diff = v - Math.min(r, g, b);
      const diffc = function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };
      if (diff === 0) {
        h = 0;
        s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        switch (v) {
          case r: {
            h = bdif - gdif;
            break;
          }
          case g: {
            h = 1 / 3 + rdif - bdif;
            break;
          }
          case b: {
            h = 2 / 3 + gdif - rdif;
            break;
          }
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [
        h * 360,
        s * 100,
        v * 100
      ];
    };
    convert.rgb.hwb = function(rgb) {
      const r = rgb[0];
      const g = rgb[1];
      let b = rgb[2];
      const h = convert.rgb.hsl(rgb)[0];
      const w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert.rgb.oklab = function(rgb) {
      const r = srgbNonlinearTransformInv(rgb[0] / 255);
      const g = srgbNonlinearTransformInv(rgb[1] / 255);
      const b = srgbNonlinearTransformInv(rgb[2] / 255);
      const lp = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      const mp = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      const sp = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
      const aa = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
      const bb = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
      return [l * 100, aa * 100, bb * 100];
    };
    convert.rgb.cmyk = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const k = Math.min(1 - r, 1 - g, 1 - b);
      const c = (1 - r - k) / (1 - k) || 0;
      const m = (1 - g - k) / (1 - k) || 0;
      const y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
    }
    convert.rgb.keyword = function(rgb) {
      const reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      let currentClosestDistance = Number.POSITIVE_INFINITY;
      let currentClosestKeyword;
      for (const keyword of Object.keys(color_name_default)) {
        const value = color_name_default[keyword];
        const distance = comparativeDistance(rgb, value);
        if (distance < currentClosestDistance) {
          currentClosestDistance = distance;
          currentClosestKeyword = keyword;
        }
      }
      return currentClosestKeyword;
    };
    convert.keyword.rgb = function(keyword) {
      return [...color_name_default[keyword]];
    };
    convert.rgb.xyz = function(rgb) {
      const r = srgbNonlinearTransformInv(rgb[0] / 255);
      const g = srgbNonlinearTransformInv(rgb[1] / 255);
      const b = srgbNonlinearTransformInv(rgb[2] / 255);
      const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
      const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
      const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
      return [x * 100, y * 100, z * 100];
    };
    convert.rgb.lab = function(rgb) {
      const xyz = convert.rgb.xyz(rgb);
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.hsl.rgb = function(hsl) {
      const h = hsl[0] / 360;
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      let t3;
      let value;
      if (s === 0) {
        value = l * 255;
        return [value, value, value];
      }
      const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const t1 = 2 * l - t2;
      const rgb = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          value = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          value = t2;
        } else if (3 * t3 < 2) {
          value = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          value = t1;
        }
        rgb[i] = value * 255;
      }
      return rgb;
    };
    convert.hsl.hsv = function(hsl) {
      const h = hsl[0];
      let s = hsl[1] / 100;
      let l = hsl[2] / 100;
      let smin = s;
      const lmin = Math.max(l, 0.01);
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      const v = (l + s) / 2;
      const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert.hsv.rgb = function(hsv) {
      const h = hsv[0] / 60;
      const s = hsv[1] / 100;
      let v = hsv[2] / 100;
      const hi = Math.floor(h) % 6;
      const f = h - Math.floor(h);
      const p = 255 * v * (1 - s);
      const q = 255 * v * (1 - s * f);
      const t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0: {
          return [v, t, p];
        }
        case 1: {
          return [q, v, p];
        }
        case 2: {
          return [p, v, t];
        }
        case 3: {
          return [p, q, v];
        }
        case 4: {
          return [t, p, v];
        }
        case 5: {
          return [v, p, q];
        }
      }
    };
    convert.hsv.hsl = function(hsv) {
      const h = hsv[0];
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const vmin = Math.max(v, 0.01);
      let sl;
      let l;
      l = (2 - s) * v;
      const lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert.hwb.rgb = function(hwb) {
      const h = hwb[0] / 360;
      let wh = hwb[1] / 100;
      let bl = hwb[2] / 100;
      const ratio = wh + bl;
      let f;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      const i = Math.floor(6 * h);
      const v = 1 - bl;
      f = 6 * h - i;
      if ((i & 1) !== 0) {
        f = 1 - f;
      }
      const n = wh + f * (v - wh);
      let r;
      let g;
      let b;
      switch (i) {
        default:
        case 6:
        case 0: {
          r = v;
          g = n;
          b = wh;
          break;
        }
        case 1: {
          r = n;
          g = v;
          b = wh;
          break;
        }
        case 2: {
          r = wh;
          g = v;
          b = n;
          break;
        }
        case 3: {
          r = wh;
          g = n;
          b = v;
          break;
        }
        case 4: {
          r = n;
          g = wh;
          b = v;
          break;
        }
        case 5: {
          r = v;
          g = wh;
          b = n;
          break;
        }
      }
      return [r * 255, g * 255, b * 255];
    };
    convert.cmyk.rgb = function(cmyk) {
      const c = cmyk[0] / 100;
      const m = cmyk[1] / 100;
      const y = cmyk[2] / 100;
      const k = cmyk[3] / 100;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.rgb = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      let r;
      let g;
      let b;
      r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
      g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
      b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
      r = srgbNonlinearTransform(r);
      g = srgbNonlinearTransform(g);
      b = srgbNonlinearTransform(b);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.lab = function(xyz) {
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.xyz.oklab = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      const lp = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
      const mp = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
      const sp = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
      const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
      const a = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
      const b = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
      return [l * 100, a * 100, b * 100];
    };
    convert.oklab.oklch = function(oklab) {
      return convert.lab.lch(oklab);
    };
    convert.oklab.xyz = function(oklab) {
      const ll = oklab[0] / 100;
      const a = oklab[1] / 100;
      const b = oklab[2] / 100;
      const l = (0.999999998 * ll + 0.396337792 * a + 0.215803758 * b) ** 3;
      const m = (1.000000008 * ll - 0.105561342 * a - 0.063854175 * b) ** 3;
      const s = (1.000000055 * ll - 0.089484182 * a - 1.291485538 * b) ** 3;
      const x = 1.227013851 * l - 0.55779998 * m + 0.281256149 * s;
      const y = -0.040580178 * l + 1.11225687 * m - 0.071676679 * s;
      const z = -0.076381285 * l - 0.421481978 * m + 1.58616322 * s;
      return [x * 100, y * 100, z * 100];
    };
    convert.oklab.rgb = function(oklab) {
      const ll = oklab[0] / 100;
      const aa = oklab[1] / 100;
      const bb = oklab[2] / 100;
      const l = (ll + 0.3963377774 * aa + 0.2158037573 * bb) ** 3;
      const m = (ll - 0.1055613458 * aa - 0.0638541728 * bb) ** 3;
      const s = (ll - 0.0894841775 * aa - 1.291485548 * bb) ** 3;
      const r = srgbNonlinearTransform(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
      const g = srgbNonlinearTransform(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
      const b = srgbNonlinearTransform(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
      return [r * 255, g * 255, b * 255];
    };
    convert.oklch.oklab = function(oklch) {
      return convert.lch.lab(oklch);
    };
    convert.lab.xyz = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let x;
      let y;
      let z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      const y2 = y ** 3;
      const x2 = x ** 3;
      const z2 = z ** 3;
      y = y2 > LAB_FT ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > LAB_FT ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > LAB_FT ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert.lab.lch = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let h;
      const hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      const c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert.lch.lab = function(lch) {
      const l = lch[0];
      const c = lch[1];
      const h = lch[2];
      const hr = h / 360 * 2 * Math.PI;
      const a = c * Math.cos(hr);
      const b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert.rgb.ansi16 = function(args, saturation = null) {
      const [r, g, b] = args;
      let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert.hsv.ansi16 = function(args) {
      return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
    };
    convert.rgb.ansi256 = function(args) {
      const r = args[0];
      const g = args[1];
      const b = args[2];
      if (r >> 4 === g >> 4 && g >> 4 === b >> 4) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert.ansi16.rgb = function(args) {
      args = args[0];
      let color2 = args % 10;
      if (color2 === 0 || color2 === 7) {
        if (args > 50) {
          color2 += 3.5;
        }
        color2 = color2 / 10.5 * 255;
        return [color2, color2, color2];
      }
      const mult = (Math.trunc(args > 50) + 1) * 0.5;
      const r = (color2 & 1) * mult * 255;
      const g = (color2 >> 1 & 1) * mult * 255;
      const b = (color2 >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert.ansi256.rgb = function(args) {
      args = args[0];
      if (args >= 232) {
        const c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      let rem;
      const r = Math.floor(args / 36) / 5 * 255;
      const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      const b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert.rgb.hex = function(args) {
      const integer2 = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
      const string2 = integer2.toString(16).toUpperCase();
      return "000000".slice(string2.length) + string2;
    };
    convert.hex.rgb = function(args) {
      const match = args.toString(16).match(/[a-f\d]{6}|[a-f\d]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      let colorString = match[0];
      if (match[0].length === 3) {
        colorString = [...colorString].map((char) => char + char).join("");
      }
      const integer2 = Number.parseInt(colorString, 16);
      const r = integer2 >> 16 & 255;
      const g = integer2 >> 8 & 255;
      const b = integer2 & 255;
      return [r, g, b];
    };
    convert.rgb.hcg = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(Math.max(r, g), b);
      const min = Math.min(Math.min(r, g), b);
      const chroma = max - min;
      let hue;
      const grayscale2 = chroma < 1 ? min / (1 - chroma) : 0;
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale2 * 100];
    };
    convert.hsl.hcg = function(hsl) {
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
      let f = 0;
      if (c < 1) {
        f = (l - 0.5 * c) / (1 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert.hsv.hcg = function(hsv) {
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const c = s * v;
      let f = 0;
      if (c < 1) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert.hcg.rgb = function(hcg) {
      const h = hcg[0] / 360;
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      if (c === 0) {
        return [g * 255, g * 255, g * 255];
      }
      const pure = [0, 0, 0];
      const hi = h % 1 * 6;
      const v = hi % 1;
      const w = 1 - v;
      let mg = 0;
      switch (Math.floor(hi)) {
        case 0: {
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        }
        case 1: {
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        }
        case 2: {
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        }
        case 3: {
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        }
        case 4: {
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        }
        default: {
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
        }
      }
      mg = (1 - c) * g;
      return [
        (c * pure[0] + mg) * 255,
        (c * pure[1] + mg) * 255,
        (c * pure[2] + mg) * 255
      ];
    };
    convert.hcg.hsv = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      let f = 0;
      if (v > 0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert.hcg.hsl = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const l = g * (1 - c) + 0.5 * c;
      let s = 0;
      if (l > 0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert.hcg.hwb = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert.hwb.hcg = function(hwb) {
      const w = hwb[1] / 100;
      const b = hwb[2] / 100;
      const v = 1 - b;
      const c = v - w;
      let g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert.apple.rgb = function(apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert.rgb.apple = function(rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert.gray.rgb = function(args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert.gray.hsl = function(args) {
      return [0, 0, args[0]];
    };
    convert.gray.hsv = convert.gray.hsl;
    convert.gray.hwb = function(gray) {
      return [0, 100, gray[0]];
    };
    convert.gray.cmyk = function(gray) {
      return [0, 0, 0, gray[0]];
    };
    convert.gray.lab = function(gray) {
      return [gray[0], 0, 0];
    };
    convert.gray.hex = function(gray) {
      const value = Math.round(gray[0] / 100 * 255) & 255;
      const integer2 = (value << 16) + (value << 8) + value;
      const string2 = integer2.toString(16).toUpperCase();
      return "000000".slice(string2.length) + string2;
    };
    convert.rgb.gray = function(rgb) {
      const value = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [value / 255 * 100];
    };
    function buildGraph() {
      const graph = {};
      const models2 = Object.keys(conversions_default);
      for (let { length } = models2, i = 0; i < length; i++) {
        graph[models2[i]] = {
          // http://jsperf.com/1-vs-infinity
          // micro-opt, but this is simple.
          distance: -1,
          parent: null
        };
      }
      return graph;
    }
    function deriveBFS(fromModel) {
      const graph = buildGraph();
      const queue2 = [fromModel];
      graph[fromModel].distance = 0;
      while (queue2.length > 0) {
        const current = queue2.pop();
        const adjacents = Object.keys(conversions_default[current]);
        for (let { length } = adjacents, i = 0; i < length; i++) {
          const adjacent = adjacents[i];
          const node = graph[adjacent];
          if (node.distance === -1) {
            node.distance = graph[current].distance + 1;
            node.parent = current;
            queue2.unshift(adjacent);
          }
        }
      }
      return graph;
    }
    function link(from, to) {
      return function(args) {
        return to(from(args));
      };
    }
    function wrapConversion(toModel, graph) {
      const path9 = [graph[toModel].parent, toModel];
      let fn2 = conversions_default[graph[toModel].parent][toModel];
      let cur = graph[toModel].parent;
      while (graph[cur].parent) {
        path9.unshift(graph[cur].parent);
        fn2 = link(conversions_default[graph[cur].parent][cur], fn2);
        cur = graph[cur].parent;
      }
      fn2.conversion = path9;
      return fn2;
    }
    function route(fromModel) {
      const graph = deriveBFS(fromModel);
      const conversion = {};
      const models2 = Object.keys(graph);
      for (let { length } = models2, i = 0; i < length; i++) {
        const toModel = models2[i];
        const node = graph[toModel];
        if (node.parent === null) {
          continue;
        }
        conversion[toModel] = wrapConversion(toModel, graph);
      }
      return conversion;
    }
    var route_default = route;
    var convert2 = {};
    var models = Object.keys(conversions_default);
    function wrapRaw(fn2) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        return fn2(args);
      };
      if ("conversion" in fn2) {
        wrappedFn.conversion = fn2.conversion;
      }
      return wrappedFn;
    }
    function wrapRounded(fn2) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        const result = fn2(args);
        if (typeof result === "object") {
          for (let { length } = result, i = 0; i < length; i++) {
            result[i] = Math.round(result[i]);
          }
        }
        return result;
      };
      if ("conversion" in fn2) {
        wrappedFn.conversion = fn2.conversion;
      }
      return wrappedFn;
    }
    for (const fromModel of models) {
      convert2[fromModel] = {};
      Object.defineProperty(convert2[fromModel], "channels", { value: conversions_default[fromModel].channels });
      Object.defineProperty(convert2[fromModel], "labels", { value: conversions_default[fromModel].labels });
      const routes = route_default(fromModel);
      const routeModels = Object.keys(routes);
      for (const toModel of routeModels) {
        const fn2 = routes[toModel];
        convert2[fromModel][toModel] = wrapRounded(fn2);
        convert2[fromModel][toModel].raw = wrapRaw(fn2);
      }
    }
    var color_convert_default = convert2;
    var skippedModels = [
      // To be honest, I don't really feel like keyword belongs in color convert, but eh.
      "keyword",
      // Gray conflicts with some method names, and has its own method defined.
      "gray",
      // Shouldn't really be in color-convert either...
      "hex"
    ];
    var hashedModelKeys = {};
    for (const model of Object.keys(color_convert_default)) {
      hashedModelKeys[[...color_convert_default[model].labels].sort().join("")] = model;
    }
    var limiters = {};
    function Color(object2, model) {
      if (!(this instanceof Color)) {
        return new Color(object2, model);
      }
      if (model && model in skippedModels) {
        model = null;
      }
      if (model && !(model in color_convert_default)) {
        throw new Error("Unknown model: " + model);
      }
      let i;
      let channels;
      if (object2 == null) {
        this.model = "rgb";
        this.color = [0, 0, 0];
        this.valpha = 1;
      } else if (object2 instanceof Color) {
        this.model = object2.model;
        this.color = [...object2.color];
        this.valpha = object2.valpha;
      } else if (typeof object2 === "string") {
        const result = color_string_default.get(object2);
        if (result === null) {
          throw new Error("Unable to parse color from string: " + object2);
        }
        this.model = result.model;
        channels = color_convert_default[this.model].channels;
        this.color = result.value.slice(0, channels);
        this.valpha = typeof result.value[channels] === "number" ? result.value[channels] : 1;
      } else if (object2.length > 0) {
        this.model = model || "rgb";
        channels = color_convert_default[this.model].channels;
        const newArray = Array.prototype.slice.call(object2, 0, channels);
        this.color = zeroArray(newArray, channels);
        this.valpha = typeof object2[channels] === "number" ? object2[channels] : 1;
      } else if (typeof object2 === "number") {
        this.model = "rgb";
        this.color = [
          object2 >> 16 & 255,
          object2 >> 8 & 255,
          object2 & 255
        ];
        this.valpha = 1;
      } else {
        this.valpha = 1;
        const keys = Object.keys(object2);
        if ("alpha" in object2) {
          keys.splice(keys.indexOf("alpha"), 1);
          this.valpha = typeof object2.alpha === "number" ? object2.alpha : 0;
        }
        const hashedKeys = keys.sort().join("");
        if (!(hashedKeys in hashedModelKeys)) {
          throw new Error("Unable to parse color from object: " + JSON.stringify(object2));
        }
        this.model = hashedModelKeys[hashedKeys];
        const { labels } = color_convert_default[this.model];
        const color2 = [];
        for (i = 0; i < labels.length; i++) {
          color2.push(object2[labels[i]]);
        }
        this.color = zeroArray(color2);
      }
      if (limiters[this.model]) {
        channels = color_convert_default[this.model].channels;
        for (i = 0; i < channels; i++) {
          const limit = limiters[this.model][i];
          if (limit) {
            this.color[i] = limit(this.color[i]);
          }
        }
      }
      this.valpha = Math.max(0, Math.min(1, this.valpha));
      if (Object.freeze) {
        Object.freeze(this);
      }
    }
    Color.prototype = {
      toString() {
        return this.string();
      },
      toJSON() {
        return this[this.model]();
      },
      string(places) {
        let self = this.model in color_string_default.to ? this : this.rgb();
        self = self.round(typeof places === "number" ? places : 1);
        const arguments_ = self.valpha === 1 ? self.color : [...self.color, this.valpha];
        return color_string_default.to[self.model](...arguments_);
      },
      percentString(places) {
        const self = this.rgb().round(typeof places === "number" ? places : 1);
        const arguments_ = self.valpha === 1 ? self.color : [...self.color, this.valpha];
        return color_string_default.to.rgb.percent(...arguments_);
      },
      array() {
        return this.valpha === 1 ? [...this.color] : [...this.color, this.valpha];
      },
      object() {
        const result = {};
        const { channels } = color_convert_default[this.model];
        const { labels } = color_convert_default[this.model];
        for (let i = 0; i < channels; i++) {
          result[labels[i]] = this.color[i];
        }
        if (this.valpha !== 1) {
          result.alpha = this.valpha;
        }
        return result;
      },
      unitArray() {
        const rgb = this.rgb().color;
        rgb[0] /= 255;
        rgb[1] /= 255;
        rgb[2] /= 255;
        if (this.valpha !== 1) {
          rgb.push(this.valpha);
        }
        return rgb;
      },
      unitObject() {
        const rgb = this.rgb().object();
        rgb.r /= 255;
        rgb.g /= 255;
        rgb.b /= 255;
        if (this.valpha !== 1) {
          rgb.alpha = this.valpha;
        }
        return rgb;
      },
      round(places) {
        places = Math.max(places || 0, 0);
        return new Color([...this.color.map(roundToPlace(places)), this.valpha], this.model);
      },
      alpha(value) {
        if (value !== void 0) {
          return new Color([...this.color, Math.max(0, Math.min(1, value))], this.model);
        }
        return this.valpha;
      },
      // Rgb
      red: getset("rgb", 0, maxfn(255)),
      green: getset("rgb", 1, maxfn(255)),
      blue: getset("rgb", 2, maxfn(255)),
      hue: getset(["hsl", "hsv", "hsl", "hwb", "hcg"], 0, (value) => (value % 360 + 360) % 360),
      saturationl: getset("hsl", 1, maxfn(100)),
      lightness: getset("hsl", 2, maxfn(100)),
      saturationv: getset("hsv", 1, maxfn(100)),
      value: getset("hsv", 2, maxfn(100)),
      chroma: getset("hcg", 1, maxfn(100)),
      gray: getset("hcg", 2, maxfn(100)),
      white: getset("hwb", 1, maxfn(100)),
      wblack: getset("hwb", 2, maxfn(100)),
      cyan: getset("cmyk", 0, maxfn(100)),
      magenta: getset("cmyk", 1, maxfn(100)),
      yellow: getset("cmyk", 2, maxfn(100)),
      black: getset("cmyk", 3, maxfn(100)),
      x: getset("xyz", 0, maxfn(95.047)),
      y: getset("xyz", 1, maxfn(100)),
      z: getset("xyz", 2, maxfn(108.833)),
      l: getset("lab", 0, maxfn(100)),
      a: getset("lab", 1),
      b: getset("lab", 2),
      keyword(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        return color_convert_default[this.model].keyword(this.color);
      },
      hex(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        return color_string_default.to.hex(...this.rgb().round().color);
      },
      hexa(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        const rgbArray = this.rgb().round().color;
        let alphaHex = Math.round(this.valpha * 255).toString(16).toUpperCase();
        if (alphaHex.length === 1) {
          alphaHex = "0" + alphaHex;
        }
        return color_string_default.to.hex(...rgbArray) + alphaHex;
      },
      rgbNumber() {
        const rgb = this.rgb().color;
        return (rgb[0] & 255) << 16 | (rgb[1] & 255) << 8 | rgb[2] & 255;
      },
      luminosity() {
        const rgb = this.rgb().color;
        const lum = [];
        for (const [i, element] of rgb.entries()) {
          const chan = element / 255;
          lum[i] = chan <= 0.04045 ? chan / 12.92 : ((chan + 0.055) / 1.055) ** 2.4;
        }
        return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
      },
      contrast(color2) {
        const lum1 = this.luminosity();
        const lum2 = color2.luminosity();
        if (lum1 > lum2) {
          return (lum1 + 0.05) / (lum2 + 0.05);
        }
        return (lum2 + 0.05) / (lum1 + 0.05);
      },
      level(color2) {
        const contrastRatio = this.contrast(color2);
        if (contrastRatio >= 7) {
          return "AAA";
        }
        return contrastRatio >= 4.5 ? "AA" : "";
      },
      isDark() {
        const rgb = this.rgb().color;
        const yiq = (rgb[0] * 2126 + rgb[1] * 7152 + rgb[2] * 722) / 1e4;
        return yiq < 128;
      },
      isLight() {
        return !this.isDark();
      },
      negate() {
        const rgb = this.rgb();
        for (let i = 0; i < 3; i++) {
          rgb.color[i] = 255 - rgb.color[i];
        }
        return rgb;
      },
      lighten(ratio) {
        const hsl = this.hsl();
        hsl.color[2] += hsl.color[2] * ratio;
        return hsl;
      },
      darken(ratio) {
        const hsl = this.hsl();
        hsl.color[2] -= hsl.color[2] * ratio;
        return hsl;
      },
      saturate(ratio) {
        const hsl = this.hsl();
        hsl.color[1] += hsl.color[1] * ratio;
        return hsl;
      },
      desaturate(ratio) {
        const hsl = this.hsl();
        hsl.color[1] -= hsl.color[1] * ratio;
        return hsl;
      },
      whiten(ratio) {
        const hwb = this.hwb();
        hwb.color[1] += hwb.color[1] * ratio;
        return hwb;
      },
      blacken(ratio) {
        const hwb = this.hwb();
        hwb.color[2] += hwb.color[2] * ratio;
        return hwb;
      },
      grayscale() {
        const rgb = this.rgb().color;
        const value = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
        return Color.rgb(value, value, value);
      },
      fade(ratio) {
        return this.alpha(this.valpha - this.valpha * ratio);
      },
      opaquer(ratio) {
        return this.alpha(this.valpha + this.valpha * ratio);
      },
      rotate(degrees) {
        const hsl = this.hsl();
        let hue = hsl.color[0];
        hue = (hue + degrees) % 360;
        hue = hue < 0 ? 360 + hue : hue;
        hsl.color[0] = hue;
        return hsl;
      },
      mix(mixinColor, weight) {
        if (!mixinColor || !mixinColor.rgb) {
          throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof mixinColor);
        }
        const color1 = mixinColor.rgb();
        const color2 = this.rgb();
        const p = weight === void 0 ? 0.5 : weight;
        const w = 2 * p - 1;
        const a = color1.alpha() - color2.alpha();
        const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2;
        const w2 = 1 - w1;
        return Color.rgb(
          w1 * color1.red() + w2 * color2.red(),
          w1 * color1.green() + w2 * color2.green(),
          w1 * color1.blue() + w2 * color2.blue(),
          color1.alpha() * p + color2.alpha() * (1 - p)
        );
      }
    };
    for (const model of Object.keys(color_convert_default)) {
      if (skippedModels.includes(model)) {
        continue;
      }
      const { channels } = color_convert_default[model];
      Color.prototype[model] = function(...arguments_) {
        if (this.model === model) {
          return new Color(this);
        }
        if (arguments_.length > 0) {
          return new Color(arguments_, model);
        }
        return new Color([...assertArray(color_convert_default[this.model][model].raw(this.color)), this.valpha], model);
      };
      Color[model] = function(...arguments_) {
        let color2 = arguments_[0];
        if (typeof color2 === "number") {
          color2 = zeroArray(arguments_, channels);
        }
        return new Color(color2, model);
      };
    }
    function roundTo(number2, places) {
      return Number(number2.toFixed(places));
    }
    function roundToPlace(places) {
      return function(number2) {
        return roundTo(number2, places);
      };
    }
    function getset(model, channel, modifier) {
      model = Array.isArray(model) ? model : [model];
      for (const m of model) {
        (limiters[m] ||= [])[channel] = modifier;
      }
      model = model[0];
      return function(value) {
        let result;
        if (value !== void 0) {
          if (modifier) {
            value = modifier(value);
          }
          result = this[model]();
          result.color[channel] = value;
          return result;
        }
        result = this[model]().color[channel];
        if (modifier) {
          result = modifier(result);
        }
        return result;
      };
    }
    function maxfn(max) {
      return function(v) {
        return Math.max(0, Math.min(max, v));
      };
    }
    function assertArray(value) {
      return Array.isArray(value) ? value : [value];
    }
    function zeroArray(array, length) {
      for (let i = 0; i < length; i++) {
        if (typeof array[i] !== "number") {
          array[i] = 0;
        }
      }
      return array;
    }
    var index_default = Color;
  }
});

// node_modules/@img/colour/index.cjs
var require_colour = __commonJS({
  "node_modules/@img/colour/index.cjs"(exports2, module2) {
    module2.exports = require_color().default;
  }
});

// vscode/src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"));
var import_node_path8 = __toESM(require("node:path"));
var import_promises4 = __toESM(require("node:fs/promises"));

// lib/adb.ts
var import_node_child_process2 = require("node:child_process");
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_os2 = __toESM(require("node:os"), 1);

// node_modules/sharp/dist/constructor.mjs
var import_node_util = __toESM(require("node:util"), 1);
var import_node_stream = __toESM(require("node:stream"), 1);

// node_modules/sharp/dist/is.mjs
var defined = (val) => typeof val !== "undefined" && val !== null;
var object = (val) => typeof val === "object";
var plainObject = (val) => Object.prototype.toString.call(val) === "[object Object]";
var fn = (val) => typeof val === "function";
var bool = (val) => typeof val === "boolean";
var buffer = (val) => val instanceof Buffer;
var typedArray = (val) => {
  if (defined(val)) {
    switch (val.constructor) {
      case Uint8Array:
      case Uint8ClampedArray:
      case Int8Array:
      case Uint16Array:
      case Int16Array:
      case Uint32Array:
      case Int32Array:
      case Float32Array:
      case Float64Array:
        return true;
    }
  }
  return false;
};
var arrayBuffer = (val) => val instanceof ArrayBuffer;
var string = (val) => typeof val === "string" && val.length > 0;
var number = (val) => typeof val === "number" && Number.isFinite(val);
var integer = (val) => Number.isInteger(val);
var inRange = (val, min, max) => val >= min && val <= max;
var inArray = (val, list) => list.includes(val);
var invalidParameterError = (name, expected, actual) => new Error(
  `Expected ${expected} for ${name} but received ${actual} of type ${typeof actual}`
);
var nativeError = (native, context) => {
  context.message = native.message;
  return context;
};
var is_default = {
  defined,
  object,
  plainObject,
  fn,
  bool,
  buffer,
  typedArray,
  arrayBuffer,
  string,
  number,
  integer,
  inRange,
  inArray,
  invalidParameterError,
  nativeError
};

// node_modules/sharp/dist/sharp.mjs
var import_node_module = require("node:module");
var import_detect_libc2 = __toESM(require_detect_libc(), 1);

// node_modules/sharp/dist/libvips.mjs
var import_node_child_process = require("node:child_process");
var import_node_crypto = require("node:crypto");
var import_semver = __toESM(require_semver2(), 1);
var import_detect_libc = __toESM(require_detect_libc(), 1);

// node_modules/sharp/package.json
var package_default = {
  name: "sharp",
  description: "High performance Node.js image processing, the fastest module to resize JPEG, PNG, WebP, GIF, AVIF and TIFF images",
  version: "0.35.4",
  author: "Lovell Fuller <npm@lovell.info>",
  homepage: "https://sharp.pixelplumbing.com",
  contributors: [
    "Pierre Inglebert <pierre.inglebert@gmail.com>",
    "Jonathan Ong <jonathanrichardong@gmail.com>",
    "Chanon Sajjamanochai <chanon.s@gmail.com>",
    "Juliano Julio <julianojulio@gmail.com>",
    "Daniel Gasienica <daniel@gasienica.ch>",
    "Julian Walker <julian@fiftythree.com>",
    "Amit Pitaru <pitaru.amit@gmail.com>",
    "Brandon Aaron <hello.brandon@aaron.sh>",
    "Andreas Lind <andreas@one.com>",
    "Maurus Cuelenaere <mcuelenaere@gmail.com>",
    "Linus Unneb\xE4ck <linus@folkdatorn.se>",
    "Victor Mateevitsi <mvictoras@gmail.com>",
    "Alaric Holloway <alaric.holloway@gmail.com>",
    "Bernhard K. Weisshuhn <bkw@codingforce.com>",
    "Chris Riley <criley@primedia.com>",
    "David Carley <dacarley@gmail.com>",
    "John Tobin <john@limelightmobileinc.com>",
    "Kenton Gray <kentongray@gmail.com>",
    "Felix B\xFCnemann <Felix.Buenemann@gmail.com>",
    "Samy Al Zahrani <samyalzahrany@gmail.com>",
    "Chintan Thakkar <lemnisk8@gmail.com>",
    "F. Orlando Galashan <frulo@gmx.de>",
    "Kleis Auke Wolthuizen <info@kleisauke.nl>",
    "Matt Hirsch <mhirsch@media.mit.edu>",
    "Matthias Thoemmes <thoemmes@gmail.com>",
    "Patrick Paskaris <patrick@paskaris.gr>",
    "J\xE9r\xE9my Lal <kapouer@melix.org>",
    "Rahul Nanwani <r.nanwani@gmail.com>",
    "Alice Monday <alice0meta@gmail.com>",
    "Kristo Jorgenson <kristo.jorgenson@gmail.com>",
    "YvesBos <yves_bos@outlook.com>",
    "Guy Maliar <guy@tailorbrands.com>",
    "Nicolas Coden <nicolas@ncoden.fr>",
    "Matt Parrish <matt.r.parrish@gmail.com>",
    "Marcel Bretschneider <marcel.bretschneider@gmail.com>",
    "Matthew McEachen <matthew+github@mceachen.org>",
    "Jarda Kot\u011B\u0161ovec <jarda.kotesovec@gmail.com>",
    "Kenric D'Souza <kenric.dsouza@gmail.com>",
    "Oleh Aleinyk <oleg.aleynik@gmail.com>",
    "Marcel Bretschneider <marcel.bretschneider@gmail.com>",
    "Andrea Bianco <andrea.bianco@unibas.ch>",
    "Rik Heywood <rik@rik.org>",
    "Thomas Parisot <hi@oncletom.io>",
    "Nathan Graves <nathanrgraves+github@gmail.com>",
    "Tom Lokhorst <tom@lokhorst.eu>",
    "Espen Hovlandsdal <espen@hovlandsdal.com>",
    "Sylvain Dumont <sylvain.dumont35@gmail.com>",
    "Alun Davies <alun.owain.davies@googlemail.com>",
    "Aidan Hoolachan <ajhoolachan21@gmail.com>",
    "Axel Eirola <axel.eirola@iki.fi>",
    "Freezy <freezy@xbmc.org>",
    "Daiz <taneli.vatanen@gmail.com>",
    "Julian Aubourg <j@ubourg.net>",
    "Keith Belovay <keith@picthrive.com>",
    "Michael B. Klein <mbklein@gmail.com>",
    "Jordan Prudhomme <jordan@raboland.fr>",
    "Ilya Ovdin <iovdin@gmail.com>",
    "Andargor <andargor@yahoo.com>",
    "Paul Neave <paul.neave@gmail.com>",
    "Brendan Kennedy <brenwken@gmail.com>",
    "Brychan Bennett-Odlum <git@brychan.io>",
    "Edward Silverton <e.silverton@gmail.com>",
    "Roman Malieiev <aromaleev@gmail.com>",
    "Tomas Szabo <tomas.szabo@deftomat.com>",
    "Robert O'Rourke <robert@o-rourke.org>",
    "Guillermo Alfonso Varela Chouci\xF1o <guillevch@gmail.com>",
    "Christian Flintrup <chr@gigahost.dk>",
    "Manan Jadhav <manan@motionden.com>",
    "Leon Radley <leon@radley.se>",
    "alza54 <alza54@thiocod.in>",
    "Jacob Smith <jacob@frende.me>",
    "Michael Nutt <michael@nutt.im>",
    "Brad Parham <baparham@gmail.com>",
    "Taneli Vatanen <taneli.vatanen@gmail.com>",
    "Joris Dugu\xE9 <zaruike10@gmail.com>",
    "Chris Banks <christopher.bradley.banks@gmail.com>",
    "Ompal Singh <ompal.hitm09@gmail.com>",
    "Brodan <christopher.hranj@gmail.com>",
    "Ankur Parihar <ankur.github@gmail.com>",
    "Brahim Ait elhaj <brahima@gmail.com>",
    "Mart Jansink <m.jansink@gmail.com>",
    "Lachlan Newman <lachnewman007@gmail.com>",
    "Dennis Beatty <dennis@dcbeatty.com>",
    "Ingvar Stepanyan <me@rreverser.com>",
    "Don Denton <don@happycollision.com>",
    "Dmytro Tiapukhin <cool.gegeg@gmail.com>",
    "Florian Lefebvre <contact@florian-lefebvre.dev>"
  ],
  scripts: {
    build: "node install/build.js",
    "build:dist": "node scripts/build.mjs",
    clean: "rm -rf src/build/ test/fixtures/output.*",
    test: "npm run lint && npm run test-unit",
    lint: "npm run lint-cpp && npm run lint-js && npm run lint-types && npm run lint-publish",
    "lint-cpp": "cpplint --quiet src/*.h src/*.cc",
    "lint-js": "biome lint",
    "lint-publish": "publint --strict",
    "lint-types": "tsd --files ./test/types/sharp.test-d.{cts,mts}",
    "test-leak": "./test/leak/leak.sh",
    "test-unit": "node --experimental-test-coverage test/unit.mjs",
    "package-from-local-build": "node npm/from-local-build.js",
    "package-wasm-wrappers": "node npm/wasm-wrappers.js",
    "package-release-notes": "node npm/release-notes.js",
    "docs-build": "node docs/build.mjs",
    "docs-serve": "cd docs && npm start",
    "docs-publish": "cd docs && npm run build && npx firebase-tools deploy --project pixelplumbing --only hosting:pixelplumbing-sharp"
  },
  type: "commonjs",
  files: [
    "dist",
    "install",
    "lib/index.d.ts",
    "src/*.{cc,h,gyp}"
  ],
  main: "./dist/index.cjs",
  module: "./dist/index.mjs",
  types: "./dist/index.d.mts",
  exports: {
    ".": {
      import: {
        types: "./dist/index.d.mts",
        default: "./dist/index.mjs"
      },
      require: {
        types: "./dist/index.d.cts",
        default: "./dist/index.cjs"
      }
    }
  },
  sideEffects: true,
  repository: {
    type: "git",
    url: "git+https://github.com/lovell/sharp.git"
  },
  keywords: [
    "jpeg",
    "png",
    "webp",
    "avif",
    "tiff",
    "gif",
    "svg",
    "jp2",
    "dzi",
    "image",
    "resize",
    "thumbnail",
    "crop",
    "embed",
    "libvips",
    "vips"
  ],
  dependencies: {
    "@img/colour": "^1.1.0",
    "detect-libc": "^2.1.2",
    semver: "^7.8.5"
  },
  optionalDependencies: {
    "@img/sharp-darwin-arm64": "0.35.4",
    "@img/sharp-darwin-x64": "0.35.4",
    "@img/sharp-freebsd-wasm32": "0.35.4",
    "@img/sharp-libvips-darwin-arm64": "1.3.3",
    "@img/sharp-libvips-darwin-x64": "1.3.3",
    "@img/sharp-libvips-linux-arm": "1.3.3",
    "@img/sharp-libvips-linux-arm64": "1.3.3",
    "@img/sharp-libvips-linux-ppc64": "1.3.3",
    "@img/sharp-libvips-linux-riscv64": "1.3.3",
    "@img/sharp-libvips-linux-s390x": "1.3.3",
    "@img/sharp-libvips-linux-x64": "1.3.3",
    "@img/sharp-libvips-linuxmusl-arm64": "1.3.3",
    "@img/sharp-libvips-linuxmusl-x64": "1.3.3",
    "@img/sharp-linux-arm": "0.35.4",
    "@img/sharp-linux-arm64": "0.35.4",
    "@img/sharp-linux-ppc64": "0.35.4",
    "@img/sharp-linux-riscv64": "0.35.4",
    "@img/sharp-linux-s390x": "0.35.4",
    "@img/sharp-linux-x64": "0.35.4",
    "@img/sharp-linuxmusl-arm64": "0.35.4",
    "@img/sharp-linuxmusl-x64": "0.35.4",
    "@img/sharp-webcontainers-wasm32": "0.35.4",
    "@img/sharp-win32-arm64": "0.35.4",
    "@img/sharp-win32-ia32": "0.35.4",
    "@img/sharp-win32-x64": "0.35.4"
  },
  peerDependenciesMeta: {
    "@types/node": {
      optional: true
    }
  },
  devDependencies: {
    "@biomejs/biome": "^2.5.10",
    "@cpplint/cli": "^0.1.0",
    "@emnapi/runtime": "^1.11.3",
    "@img/sharp-libvips-dev": "1.3.3",
    "@img/sharp-libvips-dev-wasm32": "1.3.3",
    "@img/sharp-libvips-win32-arm64": "1.3.3",
    "@img/sharp-libvips-win32-ia32": "1.3.3",
    "@img/sharp-libvips-win32-x64": "1.3.3",
    "@types/node": "*",
    emnapi: "^1.11.3",
    "exif-reader": "^2.0.3",
    yauzl: "^3.4.0",
    icc: "^4.0.0",
    "node-addon-api": "^8.9.2",
    "node-gyp": "^12.4.0",
    publint: "^0.3.24",
    "tar-fs": "^3.1.3",
    tsd: "^0.33.0"
  },
  license: "Apache-2.0",
  engines: {
    node: ">=20.9.0"
  },
  config: {
    libvips: ">=8.18.6"
  },
  funding: {
    url: "https://opencollective.com/libvips"
  }
};

// node_modules/sharp/dist/libvips.mjs
var minimumLibvipsVersionLabelled = process.env.npm_package_config_libvips || package_default.config.libvips;
var minimumLibvipsVersion = import_semver.default.coerce(minimumLibvipsVersionLabelled).version;
var prebuiltPlatforms = [
  "darwin-arm64",
  "darwin-x64",
  "freebsd-arm64",
  "freebsd-x64",
  "linux-arm",
  "linux-arm64",
  "linux-ppc64",
  "linux-riscv64",
  "linux-s390x",
  "linux-wasm32",
  "linux-x64",
  "linuxmusl-arm64",
  "linuxmusl-x64",
  "win32-arm64",
  "win32-ia32",
  "win32-x64"
];
var spawnSyncOptions = {
  encoding: "utf8",
  shell: true
};
var log = (item) => {
  if (item instanceof Error) {
    console.error(`sharp: Installation error: ${item.message}`);
  } else {
    console.log(`sharp: ${item}`);
  }
};
var runtimeLibc = () => import_detect_libc.default.isNonGlibcLinuxSync() ? import_detect_libc.default.familySync() : "";
var runtimePlatformArch = () => `${process.platform}${runtimeLibc()}-${process.arch}`;
var buildPlatformArch = () => {
  if (isEmscripten()) {
    return "wasm32";
  }
  const { npm_config_arch, npm_config_platform, npm_config_libc } = process.env;
  const libc = typeof npm_config_libc === "string" ? npm_config_libc : runtimeLibc();
  return `${npm_config_platform || process.platform}${libc}-${npm_config_arch || process.arch}`;
};
var buildSharpLibvipsIncludeDir = () => {
  try {
    return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/include`);
  } catch {
    try {
      return require("@img/sharp-libvips-dev/include");
    } catch {
    }
  }
  return "";
};
var buildSharpLibvipsCPlusPlusDir = () => {
  try {
    return require("@img/sharp-libvips-dev/cplusplus");
  } catch {
  }
  return "";
};
var buildSharpLibvipsLibDir = () => {
  try {
    return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/lib`);
  } catch {
    try {
      return require(`@img/sharp-libvips-${buildPlatformArch()}/lib`);
    } catch {
    }
  }
  return "";
};
var isUnsupportedNodeRuntime = () => {
  if (process.release?.name === "node" && process.versions) {
    if (!import_semver.default.satisfies(process.versions.node, package_default.engines.node)) {
      return { found: process.versions.node, expected: package_default.engines.node };
    }
  }
};
var isEmscripten = () => {
  const { CC } = process.env;
  return Boolean(CC?.endsWith("/emcc"));
};
var isRosetta = () => {
  if (process.platform === "darwin" && process.arch === "x64") {
    const translated = (0, import_node_child_process.spawnSync)("sysctl sysctl.proc_translated", spawnSyncOptions).stdout;
    return (translated || "").trim() === "sysctl.proc_translated: 1";
  }
  return false;
};
var sha512 = (s) => (0, import_node_crypto.createHash)("sha512").update(s).digest("hex");
var yarnLocator = () => {
  try {
    const identHash = sha512(`imgsharp-libvips-${buildPlatformArch()}`);
    const npmVersion = import_semver.default.coerce(package_default.optionalDependencies[`@img/sharp-libvips-${buildPlatformArch()}`], {
      includePrerelease: true
    }).version;
    return sha512(`${identHash}npm:${npmVersion}`).slice(0, 10);
  } catch {
  }
  return "";
};
var spawnRebuild = () => (0, import_node_child_process.spawnSync)(`node-gyp rebuild --directory=src ${isEmscripten() ? "--nodedir=emscripten" : ""}`, {
  ...spawnSyncOptions,
  stdio: "inherit"
}).status;
var globalLibvipsVersion = () => {
  if (process.platform !== "win32") {
    const globalLibvipsVersion2 = (0, import_node_child_process.spawnSync)("pkg-config --modversion vips-cpp", {
      ...spawnSyncOptions,
      env: {
        ...process.env,
        PKG_CONFIG_PATH: pkgConfigPath()
      }
    }).stdout;
    return (globalLibvipsVersion2 || "").trim();
  } else {
    return "";
  }
};
var getBrewPkgConfigPath = () => {
  try {
    const brewPrefix = ((0, import_node_child_process.spawnSync)("brew", ["--prefix"], { encoding: "utf8" }).stdout || "").trim();
    if (brewPrefix) {
      return `${brewPrefix}/lib/pkgconfig`;
    }
  } catch (_err) {
  }
  return void 0;
};
var getPkgConfigPath = () => {
  try {
    const pkgConfigPath2 = ((0, import_node_child_process.spawnSync)("pkg-config", ["--variable", "pc_path", "pkg-config"], { encoding: "utf8" }).stdout || "").trim();
    if (pkgConfigPath2) {
      return pkgConfigPath2;
    }
  } catch (_err) {
  }
  return void 0;
};
var pkgConfigPath = () => {
  if (process.platform !== "win32") {
    return [
      getBrewPkgConfigPath(),
      getPkgConfigPath(),
      process.env.PKG_CONFIG_PATH
    ].filter(Boolean).join(":");
  } else {
    return "";
  }
};
var skipSearch = (status, reason, logger) => {
  if (logger) {
    logger(`Detected ${reason}, skipping search for globally-installed libvips`);
  }
  return status;
};
var useGlobalLibvips = (logger) => {
  if (Boolean(process.env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
    return skipSearch(false, "SHARP_IGNORE_GLOBAL_LIBVIPS", logger);
  }
  if (Boolean(process.env.SHARP_FORCE_GLOBAL_LIBVIPS) === true) {
    return skipSearch(true, "SHARP_FORCE_GLOBAL_LIBVIPS", logger);
  }
  if (isRosetta()) {
    return skipSearch(false, "Rosetta", logger);
  }
  const globalVipsVersion = globalLibvipsVersion();
  return !!globalVipsVersion && import_semver.default.gte(globalVipsVersion, minimumLibvipsVersion);
};
var libvips_default = {
  minimumLibvipsVersion,
  prebuiltPlatforms,
  buildPlatformArch,
  buildSharpLibvipsIncludeDir,
  buildSharpLibvipsCPlusPlusDir,
  buildSharpLibvipsLibDir,
  isUnsupportedNodeRuntime,
  runtimePlatformArch,
  log,
  yarnLocator,
  spawnRebuild,
  globalLibvipsVersion,
  pkgConfigPath,
  useGlobalLibvips
};

// node_modules/sharp/dist/sharp.mjs
var import_meta = {};
var require2 = (0, import_node_module.createRequire)(import_meta.url);
var { version } = package_default;
var { runtimePlatformArch: runtimePlatformArch2, isUnsupportedNodeRuntime: isUnsupportedNodeRuntime2, prebuiltPlatforms: prebuiltPlatforms2, minimumLibvipsVersion: minimumLibvipsVersion2 } = libvips_default;
var runtimePlatform = runtimePlatformArch2();
var sharp;
var errors = [];
try {
  sharp = require2(`../src/build/Release/sharp-${runtimePlatform}-${version}.node`);
} catch (err) {
  errors.push(err);
}
if (!sharp) {
  try {
    sharp = require2(`../src/build/Release/sharp-wasm32-${version}.node`);
  } catch (err) {
    errors.push(err);
  }
}
if (!sharp) {
  try {
    switch (runtimePlatform) {
      case "darwin-arm64":
        sharp = require2("@img/sharp-darwin-arm64/sharp.node");
        break;
      case "darwin-x64":
        sharp = require2("@img/sharp-darwin-x64/sharp.node");
        break;
      case "linux-arm":
        sharp = require2("@img/sharp-linux-arm/sharp.node");
        break;
      case "linux-arm64":
        sharp = require2("@img/sharp-linux-arm64/sharp.node");
        break;
      case "linux-ppc64":
        sharp = require2("@img/sharp-linux-ppc64/sharp.node");
        break;
      case "linux-riscv64":
        sharp = require2("@img/sharp-linux-riscv64/sharp.node");
        break;
      case "linux-s390x":
        sharp = require2("@img/sharp-linux-s390x/sharp.node");
        break;
      case "linux-x64":
        sharp = require2("@img/sharp-linux-x64/sharp.node");
        break;
      case "linuxmusl-arm64":
        sharp = require2("@img/sharp-linuxmusl-arm64/sharp.node");
        break;
      case "linuxmusl-x64":
        sharp = require2("@img/sharp-linuxmusl-x64/sharp.node");
        break;
      case "win32-arm64":
        sharp = require2("@img/sharp-win32-arm64/sharp.node");
        break;
      case "win32-ia32":
        sharp = require2("@img/sharp-win32-ia32/sharp.node");
        break;
      case "win32-x64":
        sharp = require2("@img/sharp-win32-x64/sharp.node");
        break;
      case "freebsd-arm64":
      case "freebsd-x64":
        sharp = require2("@img/sharp-freebsd-wasm32/sharp.node");
        break;
      case "linux-wasm32":
        sharp = require2("@img/sharp-webcontainers-wasm32/sharp.node");
        break;
    }
    if (sharp && ["linux-x64", "linuxmusl-x64"].includes(runtimePlatform) && !sharp._isUsingX64V2()) {
      const err = new Error("Prebuilt binaries for Linux x64 require v2 microarchitecture");
      err.code = "Unsupported CPU";
      errors.push(err);
      sharp = null;
    }
    if (sharp && process.versions.electron && runtimePlatform.startsWith("linux")) {
      process.emitWarning(
        "Binaries provided by Electron for use on Linux may be incompatible with sharp - see https://sharp.pixelplumbing.com/install#electron-and-linux",
        { code: "SharpElectronLinux" }
      );
    }
  } catch (err) {
    errors.push(err);
  }
}
if (!sharp) {
  try {
    sharp = require2("@img/sharp-wasm32/sharp.node");
  } catch (err) {
    errors.push(err);
  }
}
if (!sharp) {
  const [isLinux, isMacOs, isWindows] = ["linux", "darwin", "win32"].map((os4) => runtimePlatform.startsWith(os4));
  const help = [`Could not load the "sharp" module using the ${runtimePlatform} runtime`];
  errors.forEach((err) => {
    if (!err.code.endsWith("MODULE_NOT_FOUND")) {
      help.push(`${err.code}: ${err.message}`);
    }
  });
  const messages = errors.map((err) => err.message).join(" ");
  help.push("Possible solutions:");
  if (isUnsupportedNodeRuntime2()) {
    const { found, expected } = isUnsupportedNodeRuntime2();
    help.push("- Please upgrade Node.js:", `    Found ${found}`, `    Requires ${expected}`);
  } else if (prebuiltPlatforms2.includes(runtimePlatform)) {
    const [os4, cpu] = runtimePlatform.split("-");
    const libc = os4.endsWith("musl") ? " --libc=musl" : "";
    help.push(
      "- Ensure optional dependencies can be installed:",
      "    npm install --include=optional sharp",
      "- Ensure your package manager supports multi-platform installation:",
      "    See https://sharp.pixelplumbing.com/install#cross-platform",
      "- Add platform-specific dependencies:",
      `    npm install --os=${os4.replace("musl", "")}${libc} --cpu=${cpu} sharp`
    );
  } else {
    help.push(
      `- Manually install libvips >= ${minimumLibvipsVersion2}`,
      "    See https://sharp.pixelplumbing.com/install#building-from-source",
      "- Add WebAssembly-based dependencies:",
      "    npm install sharp @img/sharp-wasm32"
    );
  }
  if (isLinux && /(symbol not found|CXXABI_)/i.test(messages)) {
    try {
      const { config } = require2(`@img/sharp-libvips-${runtimePlatform}/package`);
      const libcFound = `${(0, import_detect_libc2.familySync)()} ${(0, import_detect_libc2.versionSync)()}`;
      const libcRequires = `${config.musl ? "musl" : "glibc"} ${config.musl || config.glibc}`;
      help.push("- Update your OS:", `    Found ${libcFound}`, `    Requires ${libcRequires}`);
    } catch (_errEngines) {
    }
  }
  if (isLinux && /\/snap\/core[0-9]{2}/.test(messages)) {
    help.push("- Remove the Node.js Snap, which does not support native modules", "    snap remove node");
  }
  if (isMacOs && /Incompatible library version/.test(messages)) {
    help.push("- Update Homebrew:", "    brew update && brew upgrade vips");
  }
  if (errors.some((err) => err.code === "ERR_DLOPEN_DISABLED")) {
    help.push("- Run Node.js without using the --no-addons flag");
  }
  if (isWindows && /The specified procedure could not be found/.test(messages)) {
    help.push(
      "- Using the canvas package on Windows?",
      "    See https://sharp.pixelplumbing.com/install#canvas-and-windows",
      "- Check for outdated versions of sharp in the dependency tree:",
      "    npm ls sharp"
    );
  }
  help.push("- Consult the installation documentation:", "    See https://sharp.pixelplumbing.com/install");
  throw new Error(help.join("\n"));
}
var sharp_default = sharp;

// node_modules/sharp/dist/constructor.mjs
var debuglog = import_node_util.default.debuglog("sharp");
var queueListener = (queueLength) => {
  Sharp.queue.emit("change", queueLength);
};
var Sharp = function(input, options) {
  if (arguments.length === 1 && !is_default.defined(input)) {
    throw new Error("Invalid input");
  }
  if (!(this instanceof Sharp)) {
    return new Sharp(input, options);
  }
  import_node_stream.default.Duplex.call(this);
  this.options = {
    // resize options
    topOffsetPre: -1,
    leftOffsetPre: -1,
    widthPre: -1,
    heightPre: -1,
    topOffsetPost: -1,
    leftOffsetPost: -1,
    widthPost: -1,
    heightPost: -1,
    width: -1,
    height: -1,
    canvas: "crop",
    position: 0,
    resizeBackground: [0, 0, 0, 255],
    angle: 0,
    rotationAngle: 0,
    rotationBackground: [0, 0, 0, 255],
    rotateBefore: false,
    orientBefore: false,
    flip: false,
    flop: false,
    extendTop: 0,
    extendBottom: 0,
    extendLeft: 0,
    extendRight: 0,
    extendBackground: [0, 0, 0, 255],
    extendWith: "background",
    withoutEnlargement: false,
    withoutReduction: false,
    affineMatrix: [],
    affineBackground: [0, 0, 0, 255],
    affineIdx: 0,
    affineIdy: 0,
    affineOdx: 0,
    affineOdy: 0,
    affineInterpolator: this.constructor.interpolators.bilinear,
    kernel: "lanczos3",
    fastShrinkOnLoad: true,
    // operations
    tint: [-1, 0, 0, 0],
    flatten: false,
    flattenBackground: [0, 0, 0],
    unflatten: false,
    negate: false,
    negateAlpha: true,
    medianSize: 0,
    blurSigma: 0,
    precision: "integer",
    minAmpl: 0.2,
    sharpenSigma: 0,
    sharpenM1: 1,
    sharpenM2: 2,
    sharpenX1: 2,
    sharpenY2: 10,
    sharpenY3: 20,
    threshold: 0,
    thresholdGrayscale: true,
    trimBackground: [],
    trimThreshold: -1,
    trimLineArt: false,
    trimMargin: 0,
    dilateWidth: 0,
    erodeWidth: 0,
    gamma: 0,
    gammaOut: 0,
    greyscale: false,
    normalise: false,
    normaliseLower: 1,
    normaliseUpper: 99,
    claheWidth: 0,
    claheHeight: 0,
    claheMaxSlope: 3,
    brightness: 1,
    saturation: 1,
    hue: 0,
    lightness: 0,
    booleanBufferIn: null,
    booleanFileIn: "",
    joinChannelIn: [],
    extractChannel: -1,
    removeAlpha: false,
    ensureAlpha: -1,
    colourspace: "srgb",
    colourspacePipeline: "last",
    composite: [],
    // output
    fileOut: "",
    formatOut: "input",
    streamOut: false,
    typedArrayOut: false,
    keepMetadata: 0,
    withMetadataOrientation: -1,
    withMetadataDensity: 0,
    withIccProfile: "",
    withExif: {},
    withExifMerge: true,
    withXmp: "",
    keepGainMap: false,
    withGainMap: false,
    resolveWithObject: false,
    loop: -1,
    delay: [],
    // output format
    jpegQuality: 80,
    jpegProgressive: false,
    jpegChromaSubsampling: "4:2:0",
    jpegTrellisQuantisation: false,
    jpegOvershootDeringing: false,
    jpegOptimiseScans: false,
    jpegOptimiseCoding: true,
    jpegQuantisationTable: 0,
    pngProgressive: false,
    pngCompressionLevel: 6,
    pngAdaptiveFiltering: false,
    pngPalette: false,
    pngQuality: 100,
    pngEffort: 7,
    pngBitdepth: 8,
    pngDither: 1,
    jp2Quality: 80,
    jp2TileHeight: 512,
    jp2TileWidth: 512,
    jp2Lossless: false,
    jp2ChromaSubsampling: "4:4:4",
    webpQuality: 80,
    webpAlphaQuality: 100,
    webpLossless: false,
    webpNearLossless: false,
    webpSmartSubsample: false,
    webpSmartDeblock: false,
    webpPreset: "default",
    webpEffort: 4,
    webpMinSize: false,
    webpMixed: false,
    webpExact: false,
    gifBitdepth: 8,
    gifEffort: 7,
    gifDither: 1,
    gifInterFrameMaxError: 0,
    gifInterPaletteMaxError: 3,
    gifKeepDuplicateFrames: false,
    gifReuse: true,
    gifProgressive: false,
    tiffQuality: 80,
    tiffCompression: "jpeg",
    tiffBigtiff: false,
    tiffPredictor: "horizontal",
    tiffPyramid: false,
    tiffMiniswhite: false,
    tiffBitdepth: 0,
    tiffTile: false,
    tiffTileHeight: 256,
    tiffTileWidth: 256,
    tiffXres: 1,
    tiffYres: 1,
    tiffResolutionUnit: "inch",
    heifQuality: 50,
    heifLossless: false,
    heifCompression: "av1",
    heifEffort: 4,
    heifChromaSubsampling: "4:4:4",
    heifBitdepth: 8,
    heifTune: "auto",
    jxlDistance: 1,
    jxlDecodingTier: 0,
    jxlEffort: 7,
    jxlLossless: false,
    rawDepth: "uchar",
    tileSize: 256,
    tileOverlap: 0,
    tileContainer: "fs",
    tileLayout: "dz",
    tileFormat: "last",
    tileDepth: "last",
    tileAngle: 0,
    tileSkipBlanks: -1,
    tileBackground: [255, 255, 255, 255],
    tileCentre: false,
    tileId: "https://example.com/iiif",
    tileBasename: "",
    timeoutSeconds: 0,
    linearA: [],
    linearB: [],
    pdfBackground: [255, 255, 255, 255],
    // Function to notify of libvips warnings
    debuglog: (warning) => {
      this.emit("warning", warning);
      debuglog(warning);
    },
    // Function to notify of queue length changes
    queueListener
  };
  this.options.input = this._createInputDescriptor(input, options, { allowStream: true });
  return this;
};
Object.setPrototypeOf(Sharp.prototype, import_node_stream.default.Duplex.prototype);
Object.setPrototypeOf(Sharp, import_node_stream.default.Duplex);
function clone() {
  const clone2 = this.constructor.call();
  const { debuglog: debuglog2, queueListener: queueListener2, ...options } = this.options;
  clone2.options = structuredClone(options);
  clone2.options.debuglog = debuglog2;
  clone2.options.queueListener = queueListener2;
  if (this._isStreamInput()) {
    this._whenStreamInFinished(() => {
      this._flattenBufferIn();
      clone2.options.input.buffer = this.options.input.buffer;
      clone2.emit("finish");
    });
  }
  return clone2;
}
Object.assign(Sharp.prototype, { clone });
var constructor_default = Sharp;

// node_modules/sharp/dist/input.mjs
var align = {
  left: "low",
  top: "low",
  low: "low",
  center: "centre",
  centre: "centre",
  right: "high",
  bottom: "high",
  high: "high"
};
var inputStreamParameters = [
  // Limits and error handling
  "failOn",
  "limitInputPixels",
  "limitInputChannels",
  "unlimited",
  // Format-generic
  "animated",
  "autoOrient",
  "density",
  "ignoreIcc",
  "page",
  "pages",
  "sequentialRead",
  // Format-specific
  "jp2",
  "openSlide",
  "pdf",
  "raw",
  "svg",
  "tiff",
  // Deprecated
  "openSlideLevel",
  "pdfBackground",
  "tiffSubifd"
];
function _inputOptionsFromObject(obj) {
  const params = inputStreamParameters.filter((p) => is_default.defined(obj[p])).map((p) => [p, obj[p]]);
  return params.length ? Object.fromEntries(params) : void 0;
}
function _createInputDescriptor(input, inputOptions, containerOptions) {
  const inputDescriptor = {
    autoOrient: false,
    failOn: "warning",
    limitInputPixels: 16383 ** 2,
    limitInputChannels: 5,
    ignoreIcc: false,
    unlimited: false,
    sequentialRead: true
  };
  if (is_default.string(input)) {
    inputDescriptor.file = input;
  } else if (is_default.buffer(input)) {
    if (input.length === 0) {
      throw Error("Input Buffer is empty");
    }
    inputDescriptor.buffer = input;
  } else if (is_default.arrayBuffer(input)) {
    if (input.byteLength === 0) {
      throw Error("Input bit Array is empty");
    }
    inputDescriptor.buffer = Buffer.from(input, 0, input.byteLength);
  } else if (is_default.typedArray(input)) {
    if (input.length === 0) {
      throw Error("Input Bit Array is empty");
    }
    inputDescriptor.buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  } else if (is_default.plainObject(input) && !is_default.defined(inputOptions)) {
    inputOptions = input;
    if (_inputOptionsFromObject(inputOptions)) {
      inputDescriptor.buffer = [];
    }
  } else if (!is_default.defined(input) && !is_default.defined(inputOptions) && is_default.object(containerOptions) && containerOptions.allowStream) {
    inputDescriptor.buffer = [];
  } else if (Array.isArray(input)) {
    if (input.length > 1) {
      if (!this.options.joining) {
        this.options.joining = true;
        this.options.join = input.map((i) => this._createInputDescriptor(i));
      } else {
        throw new Error("Recursive join is unsupported");
      }
    } else {
      throw new Error("Expected at least two images to join");
    }
  } else {
    throw new Error(`Unsupported input '${input}' of type ${typeof input}${is_default.defined(inputOptions) ? ` when also providing options of type ${typeof inputOptions}` : ""}`);
  }
  if (is_default.object(inputOptions)) {
    if (is_default.defined(inputOptions.failOn)) {
      if (is_default.string(inputOptions.failOn) && is_default.inArray(inputOptions.failOn, ["none", "truncated", "error", "warning"])) {
        inputDescriptor.failOn = inputOptions.failOn;
      } else {
        throw is_default.invalidParameterError("failOn", "one of: none, truncated, error, warning", inputOptions.failOn);
      }
    }
    if (is_default.defined(inputOptions.autoOrient)) {
      if (is_default.bool(inputOptions.autoOrient)) {
        inputDescriptor.autoOrient = inputOptions.autoOrient;
      } else {
        throw is_default.invalidParameterError("autoOrient", "boolean", inputOptions.autoOrient);
      }
    }
    if (is_default.defined(inputOptions.density)) {
      if (is_default.number(inputOptions.density) && is_default.inRange(inputOptions.density, 1, 1e5)) {
        inputDescriptor.density = inputOptions.density;
      } else {
        throw is_default.invalidParameterError("density", "number between 1 and 100000", inputOptions.density);
      }
    }
    if (is_default.defined(inputOptions.ignoreIcc)) {
      if (is_default.bool(inputOptions.ignoreIcc)) {
        inputDescriptor.ignoreIcc = inputOptions.ignoreIcc;
      } else {
        throw is_default.invalidParameterError("ignoreIcc", "boolean", inputOptions.ignoreIcc);
      }
    }
    if (is_default.defined(inputOptions.limitInputPixels)) {
      if (is_default.bool(inputOptions.limitInputPixels)) {
        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels ? 16383 ** 2 : 0;
      } else if (is_default.integer(inputOptions.limitInputPixels) && is_default.inRange(inputOptions.limitInputPixels, 0, Number.MAX_SAFE_INTEGER)) {
        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels;
      } else {
        throw is_default.invalidParameterError("limitInputPixels", "positive integer", inputOptions.limitInputPixels);
      }
    }
    if (is_default.defined(inputOptions.limitInputChannels)) {
      if (is_default.bool(inputOptions.limitInputChannels)) {
        inputDescriptor.limitInputChannels = inputOptions.limitInputChannels ? 5 : 0;
      } else if (is_default.integer(inputOptions.limitInputChannels) && is_default.inRange(inputOptions.limitInputChannels, 0, Number.MAX_SAFE_INTEGER)) {
        inputDescriptor.limitInputChannels = inputOptions.limitInputChannels;
      } else {
        throw is_default.invalidParameterError("limitInputChannels", "positive integer", inputOptions.limitInputChannels);
      }
    }
    if (is_default.defined(inputOptions.unlimited)) {
      if (is_default.bool(inputOptions.unlimited)) {
        inputDescriptor.unlimited = inputOptions.unlimited;
      } else {
        throw is_default.invalidParameterError("unlimited", "boolean", inputOptions.unlimited);
      }
    }
    if (is_default.defined(inputOptions.sequentialRead)) {
      if (is_default.bool(inputOptions.sequentialRead)) {
        inputDescriptor.sequentialRead = inputOptions.sequentialRead;
      } else {
        throw is_default.invalidParameterError("sequentialRead", "boolean", inputOptions.sequentialRead);
      }
    }
    if (is_default.defined(inputOptions.raw)) {
      if (is_default.object(inputOptions.raw) && is_default.integer(inputOptions.raw.width) && is_default.inRange(inputOptions.raw.width, 1, 1e8) && is_default.integer(inputOptions.raw.height) && is_default.inRange(inputOptions.raw.height, 1, 1e8) && is_default.integer(inputOptions.raw.channels) && is_default.inRange(inputOptions.raw.channels, 1, 4)) {
        inputDescriptor.rawWidth = inputOptions.raw.width;
        inputDescriptor.rawHeight = inputOptions.raw.height;
        inputDescriptor.rawChannels = inputOptions.raw.channels;
        switch (input.constructor) {
          case Uint8Array:
          case Uint8ClampedArray:
            inputDescriptor.rawDepth = "uchar";
            break;
          case Int8Array:
            inputDescriptor.rawDepth = "char";
            break;
          case Uint16Array:
            inputDescriptor.rawDepth = "ushort";
            break;
          case Int16Array:
            inputDescriptor.rawDepth = "short";
            break;
          case Uint32Array:
            inputDescriptor.rawDepth = "uint";
            break;
          case Int32Array:
            inputDescriptor.rawDepth = "int";
            break;
          case Float32Array:
            inputDescriptor.rawDepth = "float";
            break;
          case Float64Array:
            inputDescriptor.rawDepth = "double";
            break;
          default:
            inputDescriptor.rawDepth = "uchar";
            break;
        }
      } else {
        throw new Error("Expected width, height and channels for raw pixel input");
      }
      inputDescriptor.rawPremultiplied = false;
      if (is_default.defined(inputOptions.raw.premultiplied)) {
        if (is_default.bool(inputOptions.raw.premultiplied)) {
          inputDescriptor.rawPremultiplied = inputOptions.raw.premultiplied;
        } else {
          throw is_default.invalidParameterError("raw.premultiplied", "boolean", inputOptions.raw.premultiplied);
        }
      }
      inputDescriptor.rawPageHeight = 0;
      if (is_default.defined(inputOptions.raw.pageHeight)) {
        if (is_default.integer(inputOptions.raw.pageHeight) && inputOptions.raw.pageHeight > 0 && inputOptions.raw.pageHeight <= inputOptions.raw.height) {
          if (inputOptions.raw.height % inputOptions.raw.pageHeight !== 0) {
            throw new Error(`Expected raw.height ${inputOptions.raw.height} to be a multiple of raw.pageHeight ${inputOptions.raw.pageHeight}`);
          }
          inputDescriptor.rawPageHeight = inputOptions.raw.pageHeight;
        } else {
          throw is_default.invalidParameterError("raw.pageHeight", "positive integer", inputOptions.raw.pageHeight);
        }
      }
    }
    if (is_default.defined(inputOptions.animated)) {
      if (is_default.bool(inputOptions.animated)) {
        inputDescriptor.pages = inputOptions.animated ? -1 : 1;
      } else {
        throw is_default.invalidParameterError("animated", "boolean", inputOptions.animated);
      }
    }
    if (is_default.defined(inputOptions.pages)) {
      if (is_default.integer(inputOptions.pages) && is_default.inRange(inputOptions.pages, -1, 1e5)) {
        inputDescriptor.pages = inputOptions.pages;
      } else {
        throw is_default.invalidParameterError("pages", "integer between -1 and 100000", inputOptions.pages);
      }
    }
    if (is_default.defined(inputOptions.page)) {
      if (is_default.integer(inputOptions.page) && is_default.inRange(inputOptions.page, 0, 1e5)) {
        inputDescriptor.page = inputOptions.page;
      } else {
        throw is_default.invalidParameterError("page", "integer between 0 and 100000", inputOptions.page);
      }
    }
    if (is_default.object(inputOptions.openSlide) && is_default.defined(inputOptions.openSlide.level)) {
      if (is_default.integer(inputOptions.openSlide.level) && is_default.inRange(inputOptions.openSlide.level, 0, 256)) {
        inputDescriptor.openSlideLevel = inputOptions.openSlide.level;
      } else {
        throw is_default.invalidParameterError("openSlide.level", "integer between 0 and 256", inputOptions.openSlide.level);
      }
    } else if (is_default.defined(inputOptions.level)) {
      if (is_default.integer(inputOptions.level) && is_default.inRange(inputOptions.level, 0, 256)) {
        inputDescriptor.openSlideLevel = inputOptions.level;
      } else {
        throw is_default.invalidParameterError("level", "integer between 0 and 256", inputOptions.level);
      }
    }
    if (is_default.object(inputOptions.tiff) && is_default.defined(inputOptions.tiff.subifd)) {
      if (is_default.integer(inputOptions.tiff.subifd) && is_default.inRange(inputOptions.tiff.subifd, -1, 1e5)) {
        inputDescriptor.tiffSubifd = inputOptions.tiff.subifd;
      } else {
        throw is_default.invalidParameterError("tiff.subifd", "integer between -1 and 100000", inputOptions.tiff.subifd);
      }
    } else if (is_default.defined(inputOptions.subifd)) {
      if (is_default.integer(inputOptions.subifd) && is_default.inRange(inputOptions.subifd, -1, 1e5)) {
        inputDescriptor.tiffSubifd = inputOptions.subifd;
      } else {
        throw is_default.invalidParameterError("subifd", "integer between -1 and 100000", inputOptions.subifd);
      }
    }
    if (is_default.object(inputOptions.svg)) {
      if (is_default.defined(inputOptions.svg.stylesheet)) {
        if (is_default.string(inputOptions.svg.stylesheet)) {
          inputDescriptor.svgStylesheet = inputOptions.svg.stylesheet;
        } else {
          throw is_default.invalidParameterError("svg.stylesheet", "string", inputOptions.svg.stylesheet);
        }
      }
      if (is_default.defined(inputOptions.svg.highBitdepth)) {
        if (is_default.bool(inputOptions.svg.highBitdepth)) {
          inputDescriptor.svgHighBitdepth = inputOptions.svg.highBitdepth;
        } else {
          throw is_default.invalidParameterError("svg.highBitdepth", "boolean", inputOptions.svg.highBitdepth);
        }
      }
    }
    if (is_default.object(inputOptions.pdf) && is_default.defined(inputOptions.pdf.background)) {
      inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdf.background);
    } else if (is_default.defined(inputOptions.pdfBackground)) {
      inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdfBackground);
    }
    if (is_default.object(inputOptions.jp2) && is_default.defined(inputOptions.jp2.oneshot)) {
      if (is_default.bool(inputOptions.jp2.oneshot)) {
        inputDescriptor.jp2Oneshot = inputOptions.jp2.oneshot;
      } else {
        throw is_default.invalidParameterError("jp2.oneshot", "boolean", inputOptions.jp2.oneshot);
      }
    }
    if (is_default.defined(inputOptions.create)) {
      if (is_default.object(inputOptions.create) && is_default.integer(inputOptions.create.width) && is_default.inRange(inputOptions.create.width, 1, 1e8) && is_default.integer(inputOptions.create.height) && is_default.inRange(inputOptions.create.height, 1, 1e8) && is_default.integer(inputOptions.create.channels)) {
        inputDescriptor.createWidth = inputOptions.create.width;
        inputDescriptor.createHeight = inputOptions.create.height;
        inputDescriptor.createChannels = inputOptions.create.channels;
        inputDescriptor.createPageHeight = 0;
        if (is_default.defined(inputOptions.create.pageHeight)) {
          if (is_default.integer(inputOptions.create.pageHeight) && inputOptions.create.pageHeight > 0 && inputOptions.create.pageHeight <= inputOptions.create.height) {
            if (inputOptions.create.height % inputOptions.create.pageHeight !== 0) {
              throw new Error(`Expected create.height ${inputOptions.create.height} to be a multiple of create.pageHeight ${inputOptions.create.pageHeight}`);
            }
            inputDescriptor.createPageHeight = inputOptions.create.pageHeight;
          } else {
            throw is_default.invalidParameterError("create.pageHeight", "positive integer", inputOptions.create.pageHeight);
          }
        }
        if (is_default.defined(inputOptions.create.noise)) {
          if (!is_default.object(inputOptions.create.noise)) {
            throw new Error("Expected noise to be an object");
          }
          if (inputOptions.create.noise.type !== "gaussian") {
            throw new Error("Only gaussian noise is supported at the moment");
          }
          inputDescriptor.createNoiseType = inputOptions.create.noise.type;
          if (!is_default.inRange(inputOptions.create.channels, 1, 4)) {
            throw is_default.invalidParameterError("create.channels", "number between 1 and 4", inputOptions.create.channels);
          }
          inputDescriptor.createNoiseMean = 128;
          if (is_default.defined(inputOptions.create.noise.mean)) {
            if (is_default.number(inputOptions.create.noise.mean) && is_default.inRange(inputOptions.create.noise.mean, 0, 1e4)) {
              inputDescriptor.createNoiseMean = inputOptions.create.noise.mean;
            } else {
              throw is_default.invalidParameterError("create.noise.mean", "number between 0 and 10000", inputOptions.create.noise.mean);
            }
          }
          inputDescriptor.createNoiseSigma = 30;
          if (is_default.defined(inputOptions.create.noise.sigma)) {
            if (is_default.number(inputOptions.create.noise.sigma) && is_default.inRange(inputOptions.create.noise.sigma, 0, 1e4)) {
              inputDescriptor.createNoiseSigma = inputOptions.create.noise.sigma;
            } else {
              throw is_default.invalidParameterError("create.noise.sigma", "number between 0 and 10000", inputOptions.create.noise.sigma);
            }
          }
        } else if (is_default.defined(inputOptions.create.background)) {
          if (!is_default.inRange(inputOptions.create.channels, 3, 4)) {
            throw is_default.invalidParameterError("create.channels", "number between 3 and 4", inputOptions.create.channels);
          }
          inputDescriptor.createBackground = this._getBackgroundColourOption(inputOptions.create.background);
        } else {
          throw new Error("Expected valid noise or background to create a new input image");
        }
        delete inputDescriptor.buffer;
      } else {
        throw new Error("Expected valid width, height and channels to create a new input image");
      }
    }
    if (is_default.defined(inputOptions.text)) {
      if (is_default.object(inputOptions.text) && is_default.string(inputOptions.text.text)) {
        inputDescriptor.textValue = inputOptions.text.text;
        if (is_default.defined(inputOptions.text.height) && is_default.defined(inputOptions.text.dpi)) {
          throw new Error("Expected only one of dpi or height");
        }
        if (is_default.defined(inputOptions.text.font)) {
          if (is_default.string(inputOptions.text.font)) {
            inputDescriptor.textFont = inputOptions.text.font;
          } else {
            throw is_default.invalidParameterError("text.font", "string", inputOptions.text.font);
          }
        }
        if (is_default.defined(inputOptions.text.fontfile)) {
          if (is_default.string(inputOptions.text.fontfile)) {
            inputDescriptor.textFontfile = inputOptions.text.fontfile;
          } else {
            throw is_default.invalidParameterError("text.fontfile", "string", inputOptions.text.fontfile);
          }
        }
        if (is_default.defined(inputOptions.text.width)) {
          if (is_default.integer(inputOptions.text.width) && is_default.inRange(inputOptions.text.width, 1, 1e6)) {
            inputDescriptor.textWidth = inputOptions.text.width;
          } else {
            throw is_default.invalidParameterError("text.width", "integer between 1 and 1000000", inputOptions.text.width);
          }
        }
        if (is_default.defined(inputOptions.text.height)) {
          if (is_default.integer(inputOptions.text.height) && is_default.inRange(inputOptions.text.height, 1, 1e6)) {
            inputDescriptor.textHeight = inputOptions.text.height;
          } else {
            throw is_default.invalidParameterError("text.height", "integer between 1 and 1000000", inputOptions.text.height);
          }
        }
        if (is_default.defined(inputOptions.text.align)) {
          if (is_default.string(inputOptions.text.align) && is_default.string(this.constructor.align[inputOptions.text.align])) {
            inputDescriptor.textAlign = this.constructor.align[inputOptions.text.align];
          } else {
            throw is_default.invalidParameterError("text.align", "valid alignment", inputOptions.text.align);
          }
        }
        if (is_default.defined(inputOptions.text.justify)) {
          if (is_default.bool(inputOptions.text.justify)) {
            inputDescriptor.textJustify = inputOptions.text.justify;
          } else {
            throw is_default.invalidParameterError("text.justify", "boolean", inputOptions.text.justify);
          }
        }
        if (is_default.defined(inputOptions.text.dpi)) {
          if (is_default.integer(inputOptions.text.dpi) && is_default.inRange(inputOptions.text.dpi, 1, 1e6)) {
            inputDescriptor.textDpi = inputOptions.text.dpi;
          } else {
            throw is_default.invalidParameterError("text.dpi", "integer between 1 and 1000000", inputOptions.text.dpi);
          }
        }
        if (is_default.defined(inputOptions.text.rgba)) {
          if (is_default.bool(inputOptions.text.rgba)) {
            inputDescriptor.textRgba = inputOptions.text.rgba;
          } else {
            throw is_default.invalidParameterError("text.rgba", "bool", inputOptions.text.rgba);
          }
        }
        if (is_default.defined(inputOptions.text.spacing)) {
          if (is_default.integer(inputOptions.text.spacing) && is_default.inRange(inputOptions.text.spacing, -1e6, 1e6)) {
            inputDescriptor.textSpacing = inputOptions.text.spacing;
          } else {
            throw is_default.invalidParameterError("text.spacing", "integer between -1000000 and 1000000", inputOptions.text.spacing);
          }
        }
        if (is_default.defined(inputOptions.text.wrap)) {
          if (is_default.string(inputOptions.text.wrap) && is_default.inArray(inputOptions.text.wrap, ["word", "char", "word-char", "none"])) {
            inputDescriptor.textWrap = inputOptions.text.wrap;
          } else {
            throw is_default.invalidParameterError("text.wrap", "one of: word, char, word-char, none", inputOptions.text.wrap);
          }
        }
        delete inputDescriptor.buffer;
      } else {
        throw new Error("Expected a valid string to create an image with text.");
      }
    }
    if (is_default.defined(inputOptions.join)) {
      if (is_default.defined(this.options.join)) {
        if (is_default.defined(inputOptions.join.animated)) {
          if (is_default.bool(inputOptions.join.animated)) {
            inputDescriptor.joinAnimated = inputOptions.join.animated;
          } else {
            throw is_default.invalidParameterError("join.animated", "boolean", inputOptions.join.animated);
          }
        }
        if (is_default.defined(inputOptions.join.across)) {
          if (is_default.integer(inputOptions.join.across) && is_default.inRange(inputOptions.join.across, 1, 1e6)) {
            inputDescriptor.joinAcross = inputOptions.join.across;
          } else {
            throw is_default.invalidParameterError("join.across", "integer between 1 and 100000", inputOptions.join.across);
          }
        }
        if (is_default.defined(inputOptions.join.shim)) {
          if (is_default.integer(inputOptions.join.shim) && is_default.inRange(inputOptions.join.shim, 0, 1e6)) {
            inputDescriptor.joinShim = inputOptions.join.shim;
          } else {
            throw is_default.invalidParameterError("join.shim", "integer between 0 and 100000", inputOptions.join.shim);
          }
        }
        if (is_default.defined(inputOptions.join.background)) {
          inputDescriptor.joinBackground = this._getBackgroundColourOption(inputOptions.join.background);
        }
        if (is_default.defined(inputOptions.join.halign)) {
          if (is_default.string(inputOptions.join.halign) && is_default.string(this.constructor.align[inputOptions.join.halign])) {
            inputDescriptor.joinHalign = this.constructor.align[inputOptions.join.halign];
          } else {
            throw is_default.invalidParameterError("join.halign", "valid alignment", inputOptions.join.halign);
          }
        }
        if (is_default.defined(inputOptions.join.valign)) {
          if (is_default.string(inputOptions.join.valign) && is_default.string(this.constructor.align[inputOptions.join.valign])) {
            inputDescriptor.joinValign = this.constructor.align[inputOptions.join.valign];
          } else {
            throw is_default.invalidParameterError("join.valign", "valid alignment", inputOptions.join.valign);
          }
        }
      } else {
        throw new Error("Expected input to be an array of images to join");
      }
    }
  } else if (is_default.defined(inputOptions)) {
    throw new Error(`Invalid input options ${inputOptions}`);
  }
  return inputDescriptor;
}
function _write(chunk, _encoding, callback) {
  if (Array.isArray(this.options.input.buffer)) {
    if (is_default.buffer(chunk)) {
      this.options.input.buffer.push(chunk);
      callback();
    } else {
      callback(new Error("Non-Buffer data on Writable Stream"));
    }
  } else {
    callback(new Error("Unexpected data on Writable Stream"));
  }
}
function _flattenBufferIn() {
  if (this._isStreamInput()) {
    this.options.input.buffer = Buffer.concat(this.options.input.buffer);
  }
}
function _isStreamInput() {
  return Array.isArray(this.options.input.buffer);
}
function _whenStreamInFinished(fn2) {
  if (this.writableFinished) {
    fn2();
  } else {
    this.once("finish", fn2);
  }
}
function metadata(callback) {
  const stack = Error();
  if (is_default.fn(callback)) {
    if (this._isStreamInput()) {
      this._whenStreamInFinished(() => {
        this._flattenBufferIn();
        sharp_default.metadata(this.options, (err, metadata2) => {
          if (err) {
            callback(is_default.nativeError(err, stack));
          } else {
            callback(null, metadata2);
          }
        });
      });
    } else {
      sharp_default.metadata(this.options, (err, metadata2) => {
        if (err) {
          callback(is_default.nativeError(err, stack));
        } else {
          callback(null, metadata2);
        }
      });
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        this._whenStreamInFinished(() => {
          this._flattenBufferIn();
          sharp_default.metadata(this.options, (err, metadata2) => {
            if (err) {
              reject(is_default.nativeError(err, stack));
            } else {
              resolve(metadata2);
            }
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp_default.metadata(this.options, (err, metadata2) => {
          if (err) {
            reject(is_default.nativeError(err, stack));
          } else {
            resolve(metadata2);
          }
        });
      });
    }
  }
}
function stats(callback) {
  const stack = Error();
  if (is_default.fn(callback)) {
    if (this._isStreamInput()) {
      this._whenStreamInFinished(() => {
        this._flattenBufferIn();
        sharp_default.stats(this.options, (err, stats2) => {
          if (err) {
            callback(is_default.nativeError(err, stack));
          } else {
            callback(null, stats2);
          }
        });
      });
    } else {
      sharp_default.stats(this.options, (err, stats2) => {
        if (err) {
          callback(is_default.nativeError(err, stack));
        } else {
          callback(null, stats2);
        }
      });
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        this._whenStreamInFinished(() => {
          this._flattenBufferIn();
          sharp_default.stats(this.options, (err, stats2) => {
            if (err) {
              reject(is_default.nativeError(err, stack));
            } else {
              resolve(stats2);
            }
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp_default.stats(this.options, (err, stats2) => {
          if (err) {
            reject(is_default.nativeError(err, stack));
          } else {
            resolve(stats2);
          }
        });
      });
    }
  }
}
var input_default = (Sharp2) => {
  Object.assign(Sharp2.prototype, {
    // Private
    _inputOptionsFromObject,
    _createInputDescriptor,
    _write,
    _flattenBufferIn,
    _isStreamInput,
    _whenStreamInFinished,
    // Public
    metadata,
    stats
  });
  Sharp2.align = align;
};

// node_modules/sharp/dist/resize.mjs
var gravity = {
  center: 0,
  centre: 0,
  north: 1,
  east: 2,
  south: 3,
  west: 4,
  northeast: 5,
  southeast: 6,
  southwest: 7,
  northwest: 8
};
var position = {
  top: 1,
  right: 2,
  bottom: 3,
  left: 4,
  "right top": 5,
  "right bottom": 6,
  "left bottom": 7,
  "left top": 8
};
var extendWith = {
  background: "background",
  copy: "copy",
  repeat: "repeat",
  mirror: "mirror"
};
var strategy = {
  entropy: 16,
  attention: 17
};
var kernel = {
  nearest: "nearest",
  linear: "linear",
  cubic: "cubic",
  mitchell: "mitchell",
  lanczos2: "lanczos2",
  lanczos3: "lanczos3",
  mks2013: "mks2013",
  mks2021: "mks2021"
};
var fit = {
  contain: "contain",
  cover: "cover",
  fill: "fill",
  inside: "inside",
  outside: "outside"
};
var mapFitToCanvas = {
  contain: "embed",
  cover: "crop",
  fill: "ignore_aspect",
  inside: "max",
  outside: "min"
};
function isRotationExpected(options) {
  return options.angle % 360 !== 0 || options.rotationAngle !== 0;
}
function isResizeExpected(options) {
  return options.width !== -1 || options.height !== -1;
}
function resize(widthOrOptions, height, options) {
  if (isResizeExpected(this.options)) {
    this.options.debuglog("ignoring previous resize options");
  }
  if (this.options.widthPost !== -1) {
    this.options.debuglog("operation order will be: extract, resize, extract");
  }
  if (is_default.defined(widthOrOptions)) {
    if (is_default.object(widthOrOptions) && !is_default.defined(options)) {
      options = widthOrOptions;
    } else if (is_default.integer(widthOrOptions) && is_default.inRange(widthOrOptions, 1, 1e8)) {
      this.options.width = widthOrOptions;
    } else {
      throw is_default.invalidParameterError("width", "positive integer between 1 and 100000000", widthOrOptions);
    }
  } else {
    this.options.width = -1;
  }
  if (is_default.defined(height)) {
    if (is_default.integer(height) && is_default.inRange(height, 1, 1e8)) {
      this.options.height = height;
    } else {
      throw is_default.invalidParameterError("height", "positive integer between 1 and 100000000", height);
    }
  } else {
    this.options.height = -1;
  }
  if (is_default.object(options)) {
    if (is_default.defined(options.width)) {
      if (is_default.integer(options.width) && is_default.inRange(options.width, 1, 1e8)) {
        this.options.width = options.width;
      } else {
        throw is_default.invalidParameterError("width", "positive integer between 1 and 100000000", options.width);
      }
    }
    if (is_default.defined(options.height)) {
      if (is_default.integer(options.height) && is_default.inRange(options.height, 1, 1e8)) {
        this.options.height = options.height;
      } else {
        throw is_default.invalidParameterError("height", "positive integer between 1 and 100000000", options.height);
      }
    }
    if (is_default.defined(options.fit)) {
      const canvas = mapFitToCanvas[options.fit];
      if (is_default.string(canvas)) {
        this.options.canvas = canvas;
      } else {
        throw is_default.invalidParameterError("fit", "valid fit", options.fit);
      }
    }
    if (is_default.defined(options.position)) {
      const pos = is_default.integer(options.position) ? options.position : strategy[options.position] || position[options.position] || gravity[options.position];
      if (is_default.integer(pos) && (is_default.inRange(pos, 0, 8) || is_default.inRange(pos, 16, 17))) {
        this.options.position = pos;
      } else {
        throw is_default.invalidParameterError("position", "valid position/gravity/strategy", options.position);
      }
    }
    this._setBackgroundColourOption("resizeBackground", options.background);
    if (is_default.defined(options.kernel)) {
      if (is_default.string(kernel[options.kernel])) {
        this.options.kernel = kernel[options.kernel];
      } else {
        throw is_default.invalidParameterError("kernel", "valid kernel name", options.kernel);
      }
    }
    if (is_default.defined(options.withoutEnlargement)) {
      this._setBooleanOption("withoutEnlargement", options.withoutEnlargement);
    }
    if (is_default.defined(options.withoutReduction)) {
      this._setBooleanOption("withoutReduction", options.withoutReduction);
    }
    if (is_default.defined(options.fastShrinkOnLoad)) {
      this._setBooleanOption("fastShrinkOnLoad", options.fastShrinkOnLoad);
    }
  }
  if (isRotationExpected(this.options) && isResizeExpected(this.options)) {
    this.options.rotateBefore = true;
  }
  return this;
}
function extend(extend2) {
  if (is_default.integer(extend2)) {
    if (is_default.inRange(extend2, 1, 1e4)) {
      this.options.extendTop = extend2;
      this.options.extendBottom = extend2;
      this.options.extendLeft = extend2;
      this.options.extendRight = extend2;
    } else {
      throw is_default.invalidParameterError("extend", "integer between 1 and 10000", extend2);
    }
  } else if (is_default.object(extend2)) {
    if (is_default.defined(extend2.top)) {
      if (is_default.integer(extend2.top) && is_default.inRange(extend2.top, 0, 1e4)) {
        this.options.extendTop = extend2.top;
      } else {
        throw is_default.invalidParameterError("top", "integer between 0 and 10000", extend2.top);
      }
    }
    if (is_default.defined(extend2.bottom)) {
      if (is_default.integer(extend2.bottom) && is_default.inRange(extend2.bottom, 0, 1e4)) {
        this.options.extendBottom = extend2.bottom;
      } else {
        throw is_default.invalidParameterError("bottom", "integer between 0 and 10000", extend2.bottom);
      }
    }
    if (is_default.defined(extend2.left)) {
      if (is_default.integer(extend2.left) && is_default.inRange(extend2.left, 0, 1e4)) {
        this.options.extendLeft = extend2.left;
      } else {
        throw is_default.invalidParameterError("left", "integer between 0 and 10000", extend2.left);
      }
    }
    if (is_default.defined(extend2.right)) {
      if (is_default.integer(extend2.right) && is_default.inRange(extend2.right, 0, 1e4)) {
        this.options.extendRight = extend2.right;
      } else {
        throw is_default.invalidParameterError("right", "integer between 0 and 10000", extend2.right);
      }
    }
    this._setBackgroundColourOption("extendBackground", extend2.background);
    if (is_default.defined(extend2.extendWith)) {
      if (is_default.string(extendWith[extend2.extendWith])) {
        this.options.extendWith = extendWith[extend2.extendWith];
      } else {
        throw is_default.invalidParameterError("extendWith", "one of: background, copy, repeat, mirror", extend2.extendWith);
      }
    }
  } else {
    throw is_default.invalidParameterError("extend", "integer or object", extend2);
  }
  return this;
}
function extract(options) {
  const suffix = isResizeExpected(this.options) || this.options.widthPre !== -1 ? "Post" : "Pre";
  if (this.options[`width${suffix}`] !== -1) {
    this.options.debuglog("ignoring previous extract options");
  }
  ["left", "top", "width", "height"].forEach(function(name) {
    const value = options[name];
    if (is_default.integer(value) && is_default.inRange(value, 0, 1e8)) {
      this.options[name + (name === "left" || name === "top" ? "Offset" : "") + suffix] = value;
    } else {
      throw is_default.invalidParameterError(name, "integer between 0 and 100000000", value);
    }
  }, this);
  if (isRotationExpected(this.options) && !isResizeExpected(this.options)) {
    if (this.options.widthPre === -1 || this.options.widthPost === -1) {
      this.options.rotateBefore = true;
    }
  }
  if (this.options.input.autoOrient) {
    this.options.orientBefore = true;
  }
  return this;
}
function trim(options) {
  this.options.trimThreshold = 10;
  if (is_default.defined(options)) {
    if (is_default.object(options)) {
      if (is_default.defined(options.background)) {
        this._setBackgroundColourOption("trimBackground", options.background);
      }
      if (is_default.defined(options.threshold)) {
        if (is_default.number(options.threshold) && options.threshold >= 0) {
          this.options.trimThreshold = options.threshold;
        } else {
          throw is_default.invalidParameterError("threshold", "positive number", options.threshold);
        }
      }
      if (is_default.defined(options.lineArt)) {
        this._setBooleanOption("trimLineArt", options.lineArt);
      }
      if (is_default.defined(options.margin)) {
        if (is_default.integer(options.margin) && is_default.inRange(options.margin, 0, 1e7)) {
          this.options.trimMargin = options.margin;
        } else {
          throw is_default.invalidParameterError("margin", "integer between 0 and 10000000", options.margin);
        }
      }
    } else {
      throw is_default.invalidParameterError("trim", "object", options);
    }
  }
  if (isRotationExpected(this.options)) {
    this.options.rotateBefore = true;
  }
  return this;
}
var resize_default = (Sharp2) => {
  Object.assign(Sharp2.prototype, {
    resize,
    extend,
    extract,
    trim
  });
  Sharp2.gravity = gravity;
  Sharp2.strategy = strategy;
  Sharp2.kernel = kernel;
  Sharp2.fit = fit;
  Sharp2.position = position;
};

// node_modules/sharp/dist/composite.mjs
var blend = {
  clear: "clear",
  source: "source",
  over: "over",
  in: "in",
  out: "out",
  atop: "atop",
  dest: "dest",
  "dest-over": "dest-over",
  "dest-in": "dest-in",
  "dest-out": "dest-out",
  "dest-atop": "dest-atop",
  xor: "xor",
  add: "add",
  saturate: "saturate",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
  darken: "darken",
  lighten: "lighten",
  "colour-dodge": "colour-dodge",
  "color-dodge": "colour-dodge",
  "colour-burn": "colour-burn",
  "color-burn": "colour-burn",
  "hard-light": "hard-light",
  "soft-light": "soft-light",
  difference: "difference",
  exclusion: "exclusion"
};
function composite(images) {
  if (!Array.isArray(images)) {
    throw is_default.invalidParameterError("images to composite", "array", images);
  }
  this.options.composite = images.map((image) => {
    if (!is_default.object(image)) {
      throw is_default.invalidParameterError("image to composite", "object", image);
    }
    const inputOptions = this._inputOptionsFromObject(image);
    const composite2 = {
      input: this._createInputDescriptor(image.input, inputOptions, { allowStream: false }),
      blend: "over",
      tile: false,
      left: 0,
      top: 0,
      hasOffset: false,
      gravity: 0,
      premultiplied: false
    };
    if (is_default.defined(image.blend)) {
      if (is_default.string(blend[image.blend])) {
        composite2.blend = blend[image.blend];
      } else {
        throw is_default.invalidParameterError("blend", "valid blend name", image.blend);
      }
    }
    if (is_default.defined(image.tile)) {
      if (is_default.bool(image.tile)) {
        composite2.tile = image.tile;
      } else {
        throw is_default.invalidParameterError("tile", "boolean", image.tile);
      }
    }
    if (is_default.defined(image.left)) {
      if (is_default.integer(image.left) && is_default.inRange(image.left, -1e8, 1e8)) {
        composite2.left = image.left;
      } else {
        throw is_default.invalidParameterError("left", "integer between -100000000 and 100000000", image.left);
      }
    }
    if (is_default.defined(image.top)) {
      if (is_default.integer(image.top) && is_default.inRange(image.top, -1e8, 1e8)) {
        composite2.top = image.top;
      } else {
        throw is_default.invalidParameterError("top", "integer between -100000000 and 100000000", image.top);
      }
    }
    if (is_default.defined(image.top) !== is_default.defined(image.left)) {
      throw new Error("Expected both left and top to be set");
    } else {
      composite2.hasOffset = is_default.integer(image.top) && is_default.integer(image.left);
    }
    if (is_default.defined(image.gravity)) {
      if (is_default.integer(image.gravity) && is_default.inRange(image.gravity, 0, 8)) {
        composite2.gravity = image.gravity;
      } else if (is_default.string(image.gravity) && is_default.integer(this.constructor.gravity[image.gravity])) {
        composite2.gravity = this.constructor.gravity[image.gravity];
      } else {
        throw is_default.invalidParameterError("gravity", "valid gravity", image.gravity);
      }
    }
    if (is_default.defined(image.premultiplied)) {
      if (is_default.bool(image.premultiplied)) {
        composite2.premultiplied = image.premultiplied;
      } else {
        throw is_default.invalidParameterError("premultiplied", "boolean", image.premultiplied);
      }
    }
    return composite2;
  });
  return this;
}
var composite_default = (Sharp2) => {
  Sharp2.prototype.composite = composite;
  Sharp2.blend = blend;
};

// node_modules/sharp/dist/operation.mjs
var vipsPrecision = {
  integer: "integer",
  float: "float",
  approximate: "approximate"
};
function rotate(angle, options) {
  if (!is_default.defined(angle)) {
    return this.autoOrient();
  }
  if (this.options.angle || this.options.rotationAngle) {
    this.options.debuglog("ignoring previous rotate options");
    this.options.angle = 0;
    this.options.rotationAngle = 0;
  }
  if (is_default.integer(angle) && !(angle % 90)) {
    this.options.angle = angle;
  } else if (is_default.number(angle)) {
    this.options.rotationAngle = angle;
    if (is_default.object(options) && options.background) {
      this._setBackgroundColourOption("rotationBackground", options.background);
    }
  } else {
    throw is_default.invalidParameterError("angle", "numeric", angle);
  }
  return this;
}
function autoOrient() {
  this.options.input.autoOrient = true;
  return this;
}
function flip(flip2) {
  this.options.flip = is_default.bool(flip2) ? flip2 : true;
  return this;
}
function flop(flop2) {
  this.options.flop = is_default.bool(flop2) ? flop2 : true;
  return this;
}
function affine(matrix, options) {
  const isValidShape = Array.isArray(matrix) && // 1x4 array of numbers
  (matrix.length === 4 && matrix.every(is_default.number) || // 2x2 array of arrays of numbers
  matrix.length === 2 && matrix.every((row) => Array.isArray(row) && row.length === 2));
  const flatMatrix = isValidShape ? matrix.flat() : [];
  if (flatMatrix.length === 4 && flatMatrix.every(is_default.number)) {
    this.options.affineMatrix = flatMatrix;
  } else {
    throw is_default.invalidParameterError("matrix", "1x4 or 2x2 array", matrix);
  }
  if (is_default.defined(options)) {
    if (is_default.object(options)) {
      this._setBackgroundColourOption("affineBackground", options.background);
      if (is_default.defined(options.idx)) {
        if (is_default.number(options.idx)) {
          this.options.affineIdx = options.idx;
        } else {
          throw is_default.invalidParameterError("options.idx", "number", options.idx);
        }
      }
      if (is_default.defined(options.idy)) {
        if (is_default.number(options.idy)) {
          this.options.affineIdy = options.idy;
        } else {
          throw is_default.invalidParameterError("options.idy", "number", options.idy);
        }
      }
      if (is_default.defined(options.odx)) {
        if (is_default.number(options.odx)) {
          this.options.affineOdx = options.odx;
        } else {
          throw is_default.invalidParameterError("options.odx", "number", options.odx);
        }
      }
      if (is_default.defined(options.ody)) {
        if (is_default.number(options.ody)) {
          this.options.affineOdy = options.ody;
        } else {
          throw is_default.invalidParameterError("options.ody", "number", options.ody);
        }
      }
      if (is_default.defined(options.interpolator)) {
        if (is_default.inArray(options.interpolator, Object.values(this.constructor.interpolators))) {
          this.options.affineInterpolator = options.interpolator;
        } else {
          throw is_default.invalidParameterError("options.interpolator", "valid interpolator name", options.interpolator);
        }
      }
    } else {
      throw is_default.invalidParameterError("options", "object", options);
    }
  }
  return this;
}
function sharpen(options) {
  if (is_default.plainObject(options)) {
    if (is_default.number(options.sigma) && is_default.inRange(options.sigma, 1e-6, 10)) {
      this.options.sharpenSigma = options.sigma;
    } else {
      throw is_default.invalidParameterError("options.sigma", "number between 0.000001 and 10", options.sigma);
    }
    if (is_default.defined(options.m1)) {
      if (is_default.number(options.m1) && is_default.inRange(options.m1, 0, 1e6)) {
        this.options.sharpenM1 = options.m1;
      } else {
        throw is_default.invalidParameterError("options.m1", "number between 0 and 1000000", options.m1);
      }
    }
    if (is_default.defined(options.m2)) {
      if (is_default.number(options.m2) && is_default.inRange(options.m2, 0, 1e6)) {
        this.options.sharpenM2 = options.m2;
      } else {
        throw is_default.invalidParameterError("options.m2", "number between 0 and 1000000", options.m2);
      }
    }
    if (is_default.defined(options.x1)) {
      if (is_default.number(options.x1) && is_default.inRange(options.x1, 0, 1e6)) {
        this.options.sharpenX1 = options.x1;
      } else {
        throw is_default.invalidParameterError("options.x1", "number between 0 and 1000000", options.x1);
      }
    }
    if (is_default.defined(options.y2)) {
      if (is_default.number(options.y2) && is_default.inRange(options.y2, 0, 1e6)) {
        this.options.sharpenY2 = options.y2;
      } else {
        throw is_default.invalidParameterError("options.y2", "number between 0 and 1000000", options.y2);
      }
    }
    if (is_default.defined(options.y3)) {
      if (is_default.number(options.y3) && is_default.inRange(options.y3, 0, 1e6)) {
        this.options.sharpenY3 = options.y3;
      } else {
        throw is_default.invalidParameterError("options.y3", "number between 0 and 1000000", options.y3);
      }
    }
  } else {
    this.options.sharpenSigma = -1;
  }
  return this;
}
function median(size) {
  if (!is_default.defined(size)) {
    this.options.medianSize = 3;
  } else if (is_default.integer(size) && is_default.inRange(size, 1, 1e3)) {
    this.options.medianSize = size;
  } else {
    throw is_default.invalidParameterError("size", "integer between 1 and 1000", size);
  }
  return this;
}
function blur(options) {
  let sigma;
  if (is_default.number(options)) {
    sigma = options;
  } else if (is_default.plainObject(options)) {
    if (!is_default.number(options.sigma)) {
      throw is_default.invalidParameterError("options.sigma", "number between 0.3 and 1000", sigma);
    }
    sigma = options.sigma;
    if ("precision" in options) {
      if (is_default.string(vipsPrecision[options.precision])) {
        this.options.precision = vipsPrecision[options.precision];
      } else {
        throw is_default.invalidParameterError("precision", "one of: integer, float, approximate", options.precision);
      }
    }
    if ("minAmplitude" in options) {
      if (is_default.number(options.minAmplitude) && is_default.inRange(options.minAmplitude, 1e-3, 1)) {
        this.options.minAmpl = options.minAmplitude;
      } else {
        throw is_default.invalidParameterError("minAmplitude", "number between 0.001 and 1", options.minAmplitude);
      }
    }
  }
  if (!is_default.defined(options)) {
    this.options.blurSigma = -1;
  } else if (is_default.bool(options)) {
    this.options.blurSigma = options ? -1 : 0;
  } else if (is_default.number(sigma) && is_default.inRange(sigma, 0.3, 1e3)) {
    this.options.blurSigma = sigma;
  } else {
    throw is_default.invalidParameterError("sigma", "number between 0.3 and 1000", sigma);
  }
  return this;
}
function dilate(width) {
  if (!is_default.defined(width)) {
    this.options.dilateWidth = 1;
  } else if (is_default.integer(width) && is_default.inRange(width, 1, 65536)) {
    this.options.dilateWidth = width;
  } else {
    throw is_default.invalidParameterError("width", "integer between 1 and 65536", width);
  }
  return this;
}
function erode(width) {
  if (!is_default.defined(width)) {
    this.options.erodeWidth = 1;
  } else if (is_default.integer(width) && is_default.inRange(width, 1, 65536)) {
    this.options.erodeWidth = width;
  } else {
    throw is_default.invalidParameterError("width", "integer between 1 and 65536", width);
  }
  return this;
}
function flatten(options) {
  this.options.flatten = is_default.bool(options) ? options : true;
  if (is_default.object(options)) {
    this._setBackgroundColourOption("flattenBackground", options.background);
  }
  return this;
}
function unflatten() {
  this.options.unflatten = true;
  return this;
}
function gamma(gamma2, gammaOut) {
  if (!is_default.defined(gamma2)) {
    this.options.gamma = 2.2;
  } else if (is_default.number(gamma2) && is_default.inRange(gamma2, 1, 3)) {
    this.options.gamma = gamma2;
  } else {
    throw is_default.invalidParameterError("gamma", "number between 1.0 and 3.0", gamma2);
  }
  if (!is_default.defined(gammaOut)) {
    this.options.gammaOut = this.options.gamma;
  } else if (is_default.number(gammaOut) && is_default.inRange(gammaOut, 1, 3)) {
    this.options.gammaOut = gammaOut;
  } else {
    throw is_default.invalidParameterError("gammaOut", "number between 1.0 and 3.0", gammaOut);
  }
  return this;
}
function negate(options) {
  this.options.negate = is_default.bool(options) ? options : true;
  if (is_default.plainObject(options) && "alpha" in options) {
    if (!is_default.bool(options.alpha)) {
      throw is_default.invalidParameterError("alpha", "should be boolean value", options.alpha);
    } else {
      this.options.negateAlpha = options.alpha;
    }
  }
  return this;
}
function normalise(options) {
  if (is_default.plainObject(options)) {
    if (is_default.defined(options.lower)) {
      if (is_default.number(options.lower) && is_default.inRange(options.lower, 0, 99)) {
        this.options.normaliseLower = options.lower;
      } else {
        throw is_default.invalidParameterError("lower", "number between 0 and 99", options.lower);
      }
    }
    if (is_default.defined(options.upper)) {
      if (is_default.number(options.upper) && is_default.inRange(options.upper, 1, 100)) {
        this.options.normaliseUpper = options.upper;
      } else {
        throw is_default.invalidParameterError("upper", "number between 1 and 100", options.upper);
      }
    }
  }
  if (this.options.normaliseLower >= this.options.normaliseUpper) {
    throw is_default.invalidParameterError(
      "range",
      "lower to be less than upper",
      `${this.options.normaliseLower} >= ${this.options.normaliseUpper}`
    );
  }
  this.options.normalise = true;
  return this;
}
function normalize(options) {
  return this.normalise(options);
}
function clahe(options) {
  if (is_default.plainObject(options)) {
    if (is_default.integer(options.width) && is_default.inRange(options.width, 1, 65536)) {
      this.options.claheWidth = options.width;
    } else {
      throw is_default.invalidParameterError("width", "integer between 1 and 65536", options.width);
    }
    if (is_default.integer(options.height) && is_default.inRange(options.height, 1, 65536)) {
      this.options.claheHeight = options.height;
    } else {
      throw is_default.invalidParameterError("height", "integer between 1 and 65536", options.height);
    }
    if (is_default.defined(options.maxSlope)) {
      if (is_default.integer(options.maxSlope) && is_default.inRange(options.maxSlope, 0, 100)) {
        this.options.claheMaxSlope = options.maxSlope;
      } else {
        throw is_default.invalidParameterError("maxSlope", "integer between 0 and 100", options.maxSlope);
      }
    }
  } else {
    throw is_default.invalidParameterError("options", "plain object", options);
  }
  return this;
}
function convolve(kernel2) {
  if (!is_default.object(kernel2) || !Array.isArray(kernel2.kernel) || !is_default.integer(kernel2.width) || !is_default.integer(kernel2.height) || !is_default.inRange(kernel2.width, 3, 1001) || !is_default.inRange(kernel2.height, 3, 1001) || kernel2.height * kernel2.width !== kernel2.kernel.length || !kernel2.kernel.every(is_default.number)) {
    throw new Error("Invalid convolution kernel");
  }
  if (!is_default.integer(kernel2.scale)) {
    kernel2.scale = kernel2.kernel.reduce((a, b) => a + b, 0);
  }
  if (kernel2.scale < 1) {
    kernel2.scale = 1;
  }
  if (!is_default.integer(kernel2.offset)) {
    kernel2.offset = 0;
  }
  this.options.convKernel = kernel2;
  return this;
}
function threshold(threshold2, options) {
  if (!is_default.defined(threshold2)) {
    this.options.threshold = 128;
  } else if (is_default.bool(threshold2)) {
    this.options.threshold = threshold2 ? 128 : 0;
  } else if (is_default.integer(threshold2) && is_default.inRange(threshold2, 0, 255)) {
    this.options.threshold = threshold2;
  } else {
    throw is_default.invalidParameterError("threshold", "integer between 0 and 255", threshold2);
  }
  if (!is_default.object(options) || options.greyscale === true || options.grayscale === true) {
    this.options.thresholdGrayscale = true;
  } else {
    this.options.thresholdGrayscale = false;
  }
  return this;
}
function boolean(operand, operator, options) {
  this.options.boolean = this._createInputDescriptor(operand, options);
  if (is_default.string(operator) && is_default.inArray(operator, ["and", "or", "eor"])) {
    this.options.booleanOp = operator;
  } else {
    throw is_default.invalidParameterError("operator", "one of: and, or, eor", operator);
  }
  return this;
}
function linear(a, b) {
  if (!is_default.defined(a) && is_default.number(b)) {
    a = 1;
  } else if (is_default.number(a) && !is_default.defined(b)) {
    b = 0;
  }
  if (!is_default.defined(a)) {
    this.options.linearA = [];
  } else if (is_default.number(a)) {
    this.options.linearA = [a];
  } else if (Array.isArray(a) && a.length && a.every(is_default.number)) {
    this.options.linearA = a;
  } else {
    throw is_default.invalidParameterError("a", "number or array of numbers", a);
  }
  if (!is_default.defined(b)) {
    this.options.linearB = [];
  } else if (is_default.number(b)) {
    this.options.linearB = [b];
  } else if (Array.isArray(b) && b.length && b.every(is_default.number)) {
    this.options.linearB = b;
  } else {
    throw is_default.invalidParameterError("b", "number or array of numbers", b);
  }
  if (this.options.linearA.length !== this.options.linearB.length) {
    throw new Error("Expected a and b to be arrays of the same length");
  }
  return this;
}
function recomb(inputMatrix) {
  if (!Array.isArray(inputMatrix)) {
    throw is_default.invalidParameterError("inputMatrix", "array", inputMatrix);
  }
  const dimensions = inputMatrix.length;
  if (dimensions !== 3 && dimensions !== 4) {
    throw is_default.invalidParameterError("inputMatrix", "3x3 or 4x4 array", dimensions);
  }
  if (!inputMatrix.every((row) => Array.isArray(row) && row.length === dimensions)) {
    throw is_default.invalidParameterError("inputMatrix", `array of ${dimensions} arrays of length ${dimensions}`, inputMatrix);
  }
  const recombMatrix = inputMatrix.flat();
  if (!recombMatrix.every(is_default.number)) {
    throw is_default.invalidParameterError("inputMatrix", "array of numbers", recombMatrix);
  }
  this.options.recombMatrix = recombMatrix;
  return this;
}
function modulate(options) {
  if (!is_default.plainObject(options)) {
    throw is_default.invalidParameterError("options", "plain object", options);
  }
  if ("brightness" in options) {
    if (is_default.number(options.brightness) && options.brightness >= 0) {
      this.options.brightness = options.brightness;
    } else {
      throw is_default.invalidParameterError("brightness", "number above zero", options.brightness);
    }
  }
  if ("saturation" in options) {
    if (is_default.number(options.saturation) && options.saturation >= 0) {
      this.options.saturation = options.saturation;
    } else {
      throw is_default.invalidParameterError("saturation", "number above zero", options.saturation);
    }
  }
  if ("hue" in options) {
    if (is_default.integer(options.hue)) {
      this.options.hue = options.hue % 360;
    } else {
      throw is_default.invalidParameterError("hue", "number", options.hue);
    }
  }
  if ("lightness" in options) {
    if (is_default.number(options.lightness)) {
      this.options.lightness = options.lightness;
    } else {
      throw is_default.invalidParameterError("lightness", "number", options.lightness);
    }
  }
  return this;
}
var operation_default = (Sharp2) => {
  Object.assign(Sharp2.prototype, {
    autoOrient,
    rotate,
    flip,
    flop,
    affine,
    sharpen,
    erode,
    dilate,
    median,
    blur,
    flatten,
    unflatten,
    gamma,
    negate,
    normalise,
    normalize,
    clahe,
    convolve,
    threshold,
    boolean,
    linear,
    recomb,
    modulate
  });
};

// node_modules/sharp/dist/colour.mjs
var import_colour = __toESM(require_colour(), 1);
var colourspace = {
  multiband: "multiband",
  "b-w": "b-w",
  bw: "b-w",
  cmyk: "cmyk",
  srgb: "srgb"
};
function tint(tint2) {
  this._setBackgroundColourOption("tint", tint2);
  return this;
}
function greyscale(greyscale2) {
  this.options.greyscale = is_default.bool(greyscale2) ? greyscale2 : true;
  return this;
}
function grayscale(grayscale2) {
  return this.greyscale(grayscale2);
}
function pipelineColourspace(colourspace2) {
  if (!is_default.string(colourspace2)) {
    throw is_default.invalidParameterError("colourspace", "string", colourspace2);
  }
  this.options.colourspacePipeline = colourspace2;
  return this;
}
function pipelineColorspace(colorspace) {
  return this.pipelineColourspace(colorspace);
}
function toColourspace(colourspace2) {
  if (!is_default.string(colourspace2)) {
    throw is_default.invalidParameterError("colourspace", "string", colourspace2);
  }
  this.options.colourspace = colourspace2;
  return this;
}
function toColorspace(colorspace) {
  return this.toColourspace(colorspace);
}
function _getBackgroundColourOption(value) {
  if (is_default.object(value) || is_default.string(value) && value.length >= 3 && value.length <= 200) {
    const colour = (0, import_colour.default)(value);
    const red = colour.red();
    const green = colour.green();
    const blue = colour.blue();
    const alpha = Math.round(colour.alpha() * 255);
    for (const [channel, component] of [["red", red], ["green", green], ["blue", blue], ["alpha", alpha]]) {
      if (!is_default.number(component)) {
        throw is_default.invalidParameterError(`background.${channel}`, "number", component);
      }
    }
    return [red, green, blue, alpha];
  } else {
    throw is_default.invalidParameterError("background", "object or string", value);
  }
}
function _setBackgroundColourOption(key, value) {
  if (is_default.defined(value)) {
    this.options[key] = _getBackgroundColourOption(value);
  }
}
var colour_default = (Sharp2) => {
  Object.assign(Sharp2.prototype, {
    // Public
    tint,
    greyscale,
    grayscale,
    pipelineColourspace,
    pipelineColorspace,
    toColourspace,
    toColorspace,
    // Private
    _getBackgroundColourOption,
    _setBackgroundColourOption
  });
  Sharp2.colourspace = colourspace;
  Sharp2.colorspace = colourspace;
};

// node_modules/sharp/dist/channel.mjs
var bool2 = {
  and: "and",
  or: "or",
  eor: "eor"
};
function removeAlpha() {
  this.options.removeAlpha = true;
  return this;
}
function ensureAlpha(alpha) {
  if (is_default.defined(alpha)) {
    if (is_default.number(alpha) && is_default.inRange(alpha, 0, 1)) {
      this.options.ensureAlpha = alpha;
    } else {
      throw is_default.invalidParameterError("alpha", "number between 0 and 1", alpha);
    }
  } else {
    this.options.ensureAlpha = 1;
  }
  return this;
}
function extractChannel(channel) {
  const channelMap = { red: 0, green: 1, blue: 2, alpha: 3 };
  if (Object.keys(channelMap).includes(channel)) {
    channel = channelMap[channel];
  }
  if (is_default.integer(channel) && is_default.inRange(channel, 0, 4)) {
    this.options.extractChannel = channel;
  } else {
    throw is_default.invalidParameterError("channel", "integer or one of: red, green, blue, alpha", channel);
  }
  return this;
}
function joinChannel(images, options) {
  if (Array.isArray(images)) {
    images.forEach(function(image) {
      this.options.joinChannelIn.push(this._createInputDescriptor(image, options));
    }, this);
  } else {
    this.options.joinChannelIn.push(this._createInputDescriptor(images, options));
  }
  return this;
}
function bandbool(boolOp) {
  if (is_default.string(boolOp) && is_default.inArray(boolOp, ["and", "or", "eor"])) {
    this.options.bandBoolOp = boolOp;
  } else {
    throw is_default.invalidParameterError("boolOp", "one of: and, or, eor", boolOp);
  }
  return this;
}
var channel_default = (Sharp2) => {
  Object.assign(Sharp2.prototype, {
    // Public instance functions
    removeAlpha,
    ensureAlpha,
    extractChannel,
    joinChannel,
    bandbool
  });
  Sharp2.bool = bool2;
};

// node_modules/sharp/dist/output.mjs
var import_node_path = __toESM(require("node:path"), 1);
var formats = /* @__PURE__ */ new Map([
  ["heic", "heif"],
  ["heif", "heif"],
  ["avif", "avif"],
  ["jpeg", "jpeg"],
  ["jpg", "jpeg"],
  ["jpe", "jpeg"],
  ["tile", "tile"],
  ["dz", "tile"],
  ["png", "png"],
  ["raw", "raw"],
  ["tiff", "tiff"],
  ["tif", "tiff"],
  ["webp", "webp"],
  ["gif", "gif"],
  ["jp2", "jp2"],
  ["jpx", "jp2"],
  ["j2k", "jp2"],
  ["j2c", "jp2"],
  ["jxl", "jxl"]
]);
var jp2Regex = /\.(jp[2x]|j2[kc])$/i;
var errJp2Save = () => new Error("JP2 output requires libvips with support for OpenJPEG");
var bitdepthFromColourCount = (colours) => 1 << 32 - Math.clz32(Math.ceil(Math.log2(colours)) - 1);
function toFile(fileOut, callback) {
  let err;
  if (!is_default.string(fileOut)) {
    err = new Error("Missing output file path");
  } else if (is_default.string(this.options.input.file) && import_node_path.default.resolve(this.options.input.file) === import_node_path.default.resolve(fileOut)) {
    err = new Error("Cannot use same file for input and output");
  } else if (jp2Regex.test(import_node_path.default.extname(fileOut)) && !this.constructor.format.jp2.output.file) {
    err = errJp2Save();
  }
  if (err) {
    if (is_default.fn(callback)) {
      callback(err);
    } else {
      return Promise.reject(err);
    }
  } else {
    this.options.fileOut = fileOut;
    const stack = Error();
    return this._pipeline(callback, stack);
  }
  return this;
}
function toBuffer(options, callback) {
  if (is_default.object(options)) {
    this._setBooleanOption("resolveWithObject", options.resolveWithObject);
  } else if (this.options.resolveWithObject) {
    this.options.resolveWithObject = false;
  }
  this.options.fileOut = "";
  const stack = Error();
  return this._pipeline(is_default.fn(options) ? options : callback, stack);
}
function toUint8Array() {
  this.options.resolveWithObject = true;
  this.options.typedArrayOut = true;
  const stack = Error();
  return this._pipeline(null, stack);
}
function withDensity(density) {
  if (is_default.number(density) && density > 0) {
    this.options.withMetadataDensity = density;
  } else {
    throw is_default.invalidParameterError("density", "positive number", density);
  }
  return this.keepExif();
}
function keepExif() {
  this.options.keepMetadata |= 1;
  return this;
}
function withExif(exif) {
  if (is_default.object(exif)) {
    for (const [ifd, entries] of Object.entries(exif)) {
      if (is_default.object(entries)) {
        for (const [k, v] of Object.entries(entries)) {
          if (is_default.string(v)) {
            this.options.withExif[`exif-${ifd.toLowerCase()}-${k}`] = v;
          } else {
            throw is_default.invalidParameterError(`${ifd}.${k}`, "string", v);
          }
        }
      } else {
        throw is_default.invalidParameterError(ifd, "object", entries);
      }
    }
  } else {
    throw is_default.invalidParameterError("exif", "object", exif);
  }
  this.options.withExifMerge = false;
  return this.keepExif();
}
function withExifMerge(exif) {
  this.withExif(exif);
  this.options.withExifMerge = true;
  return this;
}
function keepIccProfile() {
  this.options.keepMetadata |= 8;
  return this;
}
function withIccProfile(icc, options) {
  if (is_default.string(icc)) {
    this.options.withIccProfile = icc;
  } else {
    throw is_default.invalidParameterError("icc", "string", icc);
  }
  this.keepIccProfile();
  if (is_default.object(options)) {
    if (is_default.defined(options.attach)) {
      if (is_default.bool(options.attach)) {
        if (!options.attach) {
          this.options.keepMetadata &= ~8;
        }
      } else {
        throw is_default.invalidParameterError("attach", "boolean", options.attach);
      }
    }
  }
  return this;
}
function keepGainMap() {
  this.options.keepGainMap = true;
  this.options.withGainMap = false;
  this.options.keepMetadata |= 32;
  return this;
}
function withGainMap() {
  this.options.withGainMap = true;
  this.options.keepGainMap = false;
  this.options.colourspace = "scrgb";
  return this;
}
function keepXmp() {
  this.options.keepMetadata |= 2;
  return this;
}
function withXmp(xmp) {
  if (is_default.string(xmp) && xmp.length > 0) {
    this.options.withXmp = xmp;
    this.options.keepMetadata |= 2;
  } else {
    throw is_default.invalidParameterError("xmp", "non-empty string", xmp);
  }
  return this;
}
function keepMetadata() {
  this.options.keepMetadata |= 31;
  return this;
}
function withMetadata(options) {
  this.keepMetadata();
  this.withIccProfile("srgb");
  if (is_default.object(options)) {
    if (is_default.defined(options.orientation)) {
      if (is_default.integer(options.orientation) && is_default.inRange(options.orientation, 1, 8)) {
        this.options.withMetadataOrientation = options.orientation;
      } else {
        throw is_default.invalidParameterError("orientation", "integer between 1 and 8", options.orientation);
      }
    }
    if (is_default.defined(options.density)) {
      if (is_default.number(options.density) && options.density > 0) {
        this.options.withMetadataDensity = options.density;
      } else {
        throw is_default.invalidParameterError("density", "positive number", options.density);
      }
    }
    if (is_default.defined(options.icc)) {
      this.withIccProfile(options.icc);
    }
    if (is_default.defined(options.exif)) {
      this.withExifMerge(options.exif);
    }
  }
  return this;
}
function toFormat(format2, options) {
  const actualFormat = formats.get((is_default.object(format2) && is_default.string(format2.id) ? format2.id : format2).toLowerCase());
  if (!actualFormat) {
    throw is_default.invalidParameterError("format", `one of: ${[...formats.keys()].join(", ")}`, format2);
  }
  return this[actualFormat](options);
}
function jpeg(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.quality)) {
      if (is_default.integer(options.quality) && is_default.inRange(options.quality, 1, 100)) {
        this.options.jpegQuality = options.quality;
      } else {
        throw is_default.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is_default.defined(options.progressive)) {
      this._setBooleanOption("jpegProgressive", options.progressive);
    }
    if (is_default.defined(options.chromaSubsampling)) {
      if (is_default.string(options.chromaSubsampling) && is_default.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
        this.options.jpegChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is_default.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
      }
    }
    const optimiseCoding = is_default.bool(options.optimizeCoding) ? options.optimizeCoding : options.optimiseCoding;
    if (is_default.defined(optimiseCoding)) {
      this._setBooleanOption("jpegOptimiseCoding", optimiseCoding);
    }
    if (is_default.defined(options.mozjpeg)) {
      if (is_default.bool(options.mozjpeg)) {
        if (options.mozjpeg) {
          this.options.jpegTrellisQuantisation = true;
          this.options.jpegOvershootDeringing = true;
          this.options.jpegOptimiseScans = true;
          this.options.jpegProgressive = true;
          this.options.jpegQuantisationTable = 3;
        }
      } else {
        throw is_default.invalidParameterError("mozjpeg", "boolean", options.mozjpeg);
      }
    }
    const trellisQuantisation = is_default.bool(options.trellisQuantization) ? options.trellisQuantization : options.trellisQuantisation;
    if (is_default.defined(trellisQuantisation)) {
      this._setBooleanOption("jpegTrellisQuantisation", trellisQuantisation);
    }
    if (is_default.defined(options.overshootDeringing)) {
      this._setBooleanOption("jpegOvershootDeringing", options.overshootDeringing);
    }
    const optimiseScans = is_default.bool(options.optimizeScans) ? options.optimizeScans : options.optimiseScans;
    if (is_default.defined(optimiseScans)) {
      this._setBooleanOption("jpegOptimiseScans", optimiseScans);
      if (optimiseScans) {
        this.options.jpegProgressive = true;
      }
    }
    const quantisationTable = is_default.number(options.quantizationTable) ? options.quantizationTable : options.quantisationTable;
    if (is_default.defined(quantisationTable)) {
      if (is_default.integer(quantisationTable) && is_default.inRange(quantisationTable, 0, 8)) {
        this.options.jpegQuantisationTable = quantisationTable;
      } else {
        throw is_default.invalidParameterError("quantisationTable", "integer between 0 and 8", quantisationTable);
      }
    }
  }
  return this._updateFormatOut("jpeg", options);
}
function png(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.progressive)) {
      this._setBooleanOption("pngProgressive", options.progressive);
    }
    if (is_default.defined(options.compressionLevel)) {
      if (is_default.integer(options.compressionLevel) && is_default.inRange(options.compressionLevel, 0, 9)) {
        this.options.pngCompressionLevel = options.compressionLevel;
      } else {
        throw is_default.invalidParameterError("compressionLevel", "integer between 0 and 9", options.compressionLevel);
      }
    }
    if (is_default.defined(options.adaptiveFiltering)) {
      this._setBooleanOption("pngAdaptiveFiltering", options.adaptiveFiltering);
    }
    const colours = options.colours || options.colors;
    if (is_default.defined(colours)) {
      if (is_default.integer(colours) && is_default.inRange(colours, 2, 256)) {
        this.options.pngBitdepth = bitdepthFromColourCount(colours);
      } else {
        throw is_default.invalidParameterError("colours", "integer between 2 and 256", colours);
      }
    }
    if (is_default.defined(options.palette)) {
      this._setBooleanOption("pngPalette", options.palette);
    } else if ([options.quality, options.effort, options.colours, options.colors, options.dither].some(is_default.defined)) {
      this._setBooleanOption("pngPalette", true);
    }
    if (this.options.pngPalette) {
      if (is_default.defined(options.quality)) {
        if (is_default.integer(options.quality) && is_default.inRange(options.quality, 0, 100)) {
          this.options.pngQuality = options.quality;
        } else {
          throw is_default.invalidParameterError("quality", "integer between 0 and 100", options.quality);
        }
      }
      if (is_default.defined(options.effort)) {
        if (is_default.integer(options.effort) && is_default.inRange(options.effort, 1, 10)) {
          this.options.pngEffort = options.effort;
        } else {
          throw is_default.invalidParameterError("effort", "integer between 1 and 10", options.effort);
        }
      }
      if (is_default.defined(options.dither)) {
        if (is_default.number(options.dither) && is_default.inRange(options.dither, 0, 1)) {
          this.options.pngDither = options.dither;
        } else {
          throw is_default.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
        }
      }
    }
  }
  return this._updateFormatOut("png", options);
}
function webp(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.quality)) {
      if (is_default.integer(options.quality) && is_default.inRange(options.quality, 1, 100)) {
        this.options.webpQuality = options.quality;
      } else {
        throw is_default.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is_default.defined(options.alphaQuality)) {
      if (is_default.integer(options.alphaQuality) && is_default.inRange(options.alphaQuality, 0, 100)) {
        this.options.webpAlphaQuality = options.alphaQuality;
      } else {
        throw is_default.invalidParameterError("alphaQuality", "integer between 0 and 100", options.alphaQuality);
      }
    }
    if (is_default.defined(options.lossless)) {
      this._setBooleanOption("webpLossless", options.lossless);
    }
    if (is_default.defined(options.nearLossless)) {
      this._setBooleanOption("webpNearLossless", options.nearLossless);
    }
    if (is_default.defined(options.smartSubsample)) {
      this._setBooleanOption("webpSmartSubsample", options.smartSubsample);
    }
    if (is_default.defined(options.smartDeblock)) {
      this._setBooleanOption("webpSmartDeblock", options.smartDeblock);
    }
    if (is_default.defined(options.preset)) {
      if (is_default.string(options.preset) && is_default.inArray(options.preset, ["default", "photo", "picture", "drawing", "icon", "text"])) {
        this.options.webpPreset = options.preset;
      } else {
        throw is_default.invalidParameterError("preset", "one of: default, photo, picture, drawing, icon, text", options.preset);
      }
    }
    if (is_default.defined(options.effort)) {
      if (is_default.integer(options.effort) && is_default.inRange(options.effort, 0, 6)) {
        this.options.webpEffort = options.effort;
      } else {
        throw is_default.invalidParameterError("effort", "integer between 0 and 6", options.effort);
      }
    }
    if (is_default.defined(options.minSize)) {
      this._setBooleanOption("webpMinSize", options.minSize);
    }
    if (is_default.defined(options.mixed)) {
      this._setBooleanOption("webpMixed", options.mixed);
    }
    if (is_default.defined(options.exact)) {
      this._setBooleanOption("webpExact", options.exact);
    }
  }
  trySetAnimationOptions(options, this.options);
  return this._updateFormatOut("webp", options);
}
function gif(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.reuse)) {
      this._setBooleanOption("gifReuse", options.reuse);
    }
    if (is_default.defined(options.progressive)) {
      this._setBooleanOption("gifProgressive", options.progressive);
    }
    const colours = options.colours || options.colors;
    if (is_default.defined(colours)) {
      if (is_default.integer(colours) && is_default.inRange(colours, 2, 256)) {
        this.options.gifBitdepth = bitdepthFromColourCount(colours);
      } else {
        throw is_default.invalidParameterError("colours", "integer between 2 and 256", colours);
      }
    }
    if (is_default.defined(options.effort)) {
      if (is_default.integer(options.effort) && is_default.inRange(options.effort, 1, 10)) {
        this.options.gifEffort = options.effort;
      } else {
        throw is_default.invalidParameterError("effort", "integer between 1 and 10", options.effort);
      }
    }
    if (is_default.defined(options.dither)) {
      if (is_default.number(options.dither) && is_default.inRange(options.dither, 0, 1)) {
        this.options.gifDither = options.dither;
      } else {
        throw is_default.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
      }
    }
    if (is_default.defined(options.interFrameMaxError)) {
      if (is_default.number(options.interFrameMaxError) && is_default.inRange(options.interFrameMaxError, 0, 32)) {
        this.options.gifInterFrameMaxError = options.interFrameMaxError;
      } else {
        throw is_default.invalidParameterError("interFrameMaxError", "number between 0.0 and 32.0", options.interFrameMaxError);
      }
    }
    if (is_default.defined(options.interPaletteMaxError)) {
      if (is_default.number(options.interPaletteMaxError) && is_default.inRange(options.interPaletteMaxError, 0, 256)) {
        this.options.gifInterPaletteMaxError = options.interPaletteMaxError;
      } else {
        throw is_default.invalidParameterError("interPaletteMaxError", "number between 0.0 and 256.0", options.interPaletteMaxError);
      }
    }
    if (is_default.defined(options.keepDuplicateFrames)) {
      if (is_default.bool(options.keepDuplicateFrames)) {
        this._setBooleanOption("gifKeepDuplicateFrames", options.keepDuplicateFrames);
      } else {
        throw is_default.invalidParameterError("keepDuplicateFrames", "boolean", options.keepDuplicateFrames);
      }
    }
  }
  trySetAnimationOptions(options, this.options);
  return this._updateFormatOut("gif", options);
}
function jp2(options) {
  if (!this.constructor.format.jp2.output.buffer) {
    throw errJp2Save();
  }
  if (is_default.object(options)) {
    if (is_default.defined(options.quality)) {
      if (is_default.integer(options.quality) && is_default.inRange(options.quality, 1, 100)) {
        this.options.jp2Quality = options.quality;
      } else {
        throw is_default.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is_default.defined(options.lossless)) {
      if (is_default.bool(options.lossless)) {
        this.options.jp2Lossless = options.lossless;
      } else {
        throw is_default.invalidParameterError("lossless", "boolean", options.lossless);
      }
    }
    if (is_default.defined(options.tileWidth)) {
      if (is_default.integer(options.tileWidth) && is_default.inRange(options.tileWidth, 1, 32768)) {
        this.options.jp2TileWidth = options.tileWidth;
      } else {
        throw is_default.invalidParameterError("tileWidth", "integer between 1 and 32768", options.tileWidth);
      }
    }
    if (is_default.defined(options.tileHeight)) {
      if (is_default.integer(options.tileHeight) && is_default.inRange(options.tileHeight, 1, 32768)) {
        this.options.jp2TileHeight = options.tileHeight;
      } else {
        throw is_default.invalidParameterError("tileHeight", "integer between 1 and 32768", options.tileHeight);
      }
    }
    if (is_default.defined(options.chromaSubsampling)) {
      if (is_default.string(options.chromaSubsampling) && is_default.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
        this.options.jp2ChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is_default.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
      }
    }
  }
  return this._updateFormatOut("jp2", options);
}
function trySetAnimationOptions(source, target) {
  if (is_default.object(source) && is_default.defined(source.loop)) {
    if (is_default.integer(source.loop) && is_default.inRange(source.loop, 0, 65535)) {
      target.loop = source.loop;
    } else {
      throw is_default.invalidParameterError("loop", "integer between 0 and 65535", source.loop);
    }
  }
  if (is_default.object(source) && is_default.defined(source.delay)) {
    if (is_default.integer(source.delay) && is_default.inRange(source.delay, 0, 65535)) {
      target.delay = [source.delay];
    } else if (Array.isArray(source.delay) && source.delay.every(is_default.integer) && source.delay.every((v) => is_default.inRange(v, 0, 65535))) {
      target.delay = source.delay;
    } else {
      throw is_default.invalidParameterError("delay", "integer or an array of integers between 0 and 65535", source.delay);
    }
  }
}
function tiff(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.quality)) {
      if (is_default.integer(options.quality) && is_default.inRange(options.quality, 1, 100)) {
        this.options.tiffQuality = options.quality;
      } else {
        throw is_default.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is_default.defined(options.bitdepth)) {
      if (is_default.integer(options.bitdepth) && is_default.inArray(options.bitdepth, [1, 2, 4])) {
        this.options.tiffBitdepth = options.bitdepth;
      } else {
        throw is_default.invalidParameterError("bitdepth", "1, 2 or 4", options.bitdepth);
      }
    }
    if (is_default.defined(options.tile)) {
      this._setBooleanOption("tiffTile", options.tile);
    }
    if (is_default.defined(options.tileWidth)) {
      if (is_default.integer(options.tileWidth) && is_default.inRange(options.tileWidth, 1, 32768)) {
        this.options.tiffTileWidth = options.tileWidth;
      } else {
        throw is_default.invalidParameterError("tileWidth", "integer between 1 and 32768", options.tileWidth);
      }
    }
    if (is_default.defined(options.tileHeight)) {
      if (is_default.integer(options.tileHeight) && is_default.inRange(options.tileHeight, 1, 32768)) {
        this.options.tiffTileHeight = options.tileHeight;
      } else {
        throw is_default.invalidParameterError("tileHeight", "integer between 1 and 32768", options.tileHeight);
      }
    }
    if (is_default.defined(options.miniswhite)) {
      this._setBooleanOption("tiffMiniswhite", options.miniswhite);
    }
    if (is_default.defined(options.pyramid)) {
      this._setBooleanOption("tiffPyramid", options.pyramid);
    }
    if (is_default.defined(options.xres)) {
      if (is_default.number(options.xres) && is_default.inRange(options.xres, 1e-3, 1e6)) {
        this.options.tiffXres = options.xres;
      } else {
        throw is_default.invalidParameterError("xres", "number between 0.001 and 1000000", options.xres);
      }
    }
    if (is_default.defined(options.yres)) {
      if (is_default.number(options.yres) && is_default.inRange(options.yres, 1e-3, 1e6)) {
        this.options.tiffYres = options.yres;
      } else {
        throw is_default.invalidParameterError("yres", "number between 0.001 and 1000000", options.yres);
      }
    }
    if (is_default.defined(options.compression)) {
      if (is_default.string(options.compression) && is_default.inArray(options.compression, ["none", "jpeg", "deflate", "packbits", "ccittfax4", "lzw", "webp", "zstd", "jp2k"])) {
        this.options.tiffCompression = options.compression;
      } else {
        throw is_default.invalidParameterError("compression", "one of: none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k", options.compression);
      }
    }
    if (is_default.defined(options.bigtiff)) {
      this._setBooleanOption("tiffBigtiff", options.bigtiff);
    }
    if (is_default.defined(options.predictor)) {
      if (is_default.string(options.predictor) && is_default.inArray(options.predictor, ["none", "horizontal", "float"])) {
        this.options.tiffPredictor = options.predictor;
      } else {
        throw is_default.invalidParameterError("predictor", "one of: none, horizontal, float", options.predictor);
      }
    }
    if (is_default.defined(options.resolutionUnit)) {
      if (is_default.string(options.resolutionUnit) && is_default.inArray(options.resolutionUnit, ["inch", "cm"])) {
        this.options.tiffResolutionUnit = options.resolutionUnit;
      } else {
        throw is_default.invalidParameterError("resolutionUnit", "one of: inch, cm", options.resolutionUnit);
      }
    }
  }
  return this._updateFormatOut("tiff", options);
}
function avif(options) {
  return this.heif({ ...options, compression: "av1" });
}
function heif(options) {
  if (is_default.object(options)) {
    if (is_default.string(options.compression) && is_default.inArray(options.compression, ["av1", "hevc"])) {
      this.options.heifCompression = options.compression;
    } else {
      throw is_default.invalidParameterError("compression", "one of: av1, hevc", options.compression);
    }
    if (is_default.defined(options.quality)) {
      if (is_default.integer(options.quality) && is_default.inRange(options.quality, 1, 100)) {
        this.options.heifQuality = options.quality;
      } else {
        throw is_default.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    }
    if (is_default.defined(options.lossless)) {
      if (is_default.bool(options.lossless)) {
        this.options.heifLossless = options.lossless;
      } else {
        throw is_default.invalidParameterError("lossless", "boolean", options.lossless);
      }
    }
    if (is_default.defined(options.effort)) {
      if (is_default.integer(options.effort) && is_default.inRange(options.effort, 0, 9)) {
        this.options.heifEffort = options.effort;
      } else {
        throw is_default.invalidParameterError("effort", "integer between 0 and 9", options.effort);
      }
    }
    if (is_default.defined(options.chromaSubsampling)) {
      if (is_default.string(options.chromaSubsampling) && is_default.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
        this.options.heifChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is_default.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
      }
    }
    if (is_default.defined(options.bitdepth)) {
      if (is_default.integer(options.bitdepth) && is_default.inArray(options.bitdepth, [8, 10, 12])) {
        this.options.heifBitdepth = options.bitdepth;
      } else {
        throw is_default.invalidParameterError("bitdepth", "8, 10 or 12", options.bitdepth);
      }
    }
    if (is_default.defined(options.tune)) {
      if (is_default.string(options.tune) && is_default.inArray(options.tune, ["auto", "iq", "psnr", "ssim"])) {
        if (this.options.heifLossless && options.tune === "iq") {
          this.options.heifTune = "ssim";
        } else {
          this.options.heifTune = options.tune;
        }
      } else {
        throw is_default.invalidParameterError("tune", "one of: auto, iq, psnr, ssim", options.tune);
      }
    }
  } else {
    throw is_default.invalidParameterError("options", "Object", options);
  }
  return this._updateFormatOut("heif", options);
}
function jxl(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.quality)) {
      if (is_default.integer(options.quality) && is_default.inRange(options.quality, 1, 100)) {
        this.options.jxlDistance = options.quality >= 30 ? 0.1 + (100 - options.quality) * 0.09 : 53 / 3e3 * options.quality * options.quality - 23 / 20 * options.quality + 25;
      } else {
        throw is_default.invalidParameterError("quality", "integer between 1 and 100", options.quality);
      }
    } else if (is_default.defined(options.distance)) {
      if (is_default.number(options.distance) && is_default.inRange(options.distance, 0, 15)) {
        this.options.jxlDistance = options.distance;
      } else {
        throw is_default.invalidParameterError("distance", "number between 0.0 and 15.0", options.distance);
      }
    }
    if (is_default.defined(options.decodingTier)) {
      if (is_default.integer(options.decodingTier) && is_default.inRange(options.decodingTier, 0, 4)) {
        this.options.jxlDecodingTier = options.decodingTier;
      } else {
        throw is_default.invalidParameterError("decodingTier", "integer between 0 and 4", options.decodingTier);
      }
    }
    if (is_default.defined(options.lossless)) {
      if (is_default.bool(options.lossless)) {
        this.options.jxlLossless = options.lossless;
      } else {
        throw is_default.invalidParameterError("lossless", "boolean", options.lossless);
      }
    }
    if (is_default.defined(options.effort)) {
      if (is_default.integer(options.effort) && is_default.inRange(options.effort, 1, 9)) {
        this.options.jxlEffort = options.effort;
      } else {
        throw is_default.invalidParameterError("effort", "integer between 1 and 9", options.effort);
      }
    }
  }
  trySetAnimationOptions(options, this.options);
  return this._updateFormatOut("jxl", options);
}
function raw(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.depth)) {
      if (is_default.string(options.depth) && is_default.inArray(
        options.depth,
        ["char", "uchar", "short", "ushort", "int", "uint", "float", "complex", "double", "dpcomplex"]
      )) {
        this.options.rawDepth = options.depth;
      } else {
        throw is_default.invalidParameterError("depth", "one of: char, uchar, short, ushort, int, uint, float, complex, double, dpcomplex", options.depth);
      }
    }
  }
  return this._updateFormatOut("raw");
}
function tile(options) {
  if (is_default.object(options)) {
    if (is_default.defined(options.size)) {
      if (is_default.integer(options.size) && is_default.inRange(options.size, 1, 8192)) {
        this.options.tileSize = options.size;
      } else {
        throw is_default.invalidParameterError("size", "integer between 1 and 8192", options.size);
      }
    }
    if (is_default.defined(options.overlap)) {
      if (is_default.integer(options.overlap) && is_default.inRange(options.overlap, 0, 8192)) {
        if (options.overlap > this.options.tileSize) {
          throw is_default.invalidParameterError("overlap", `<= size (${this.options.tileSize})`, options.overlap);
        }
        this.options.tileOverlap = options.overlap;
      } else {
        throw is_default.invalidParameterError("overlap", "integer between 0 and 8192", options.overlap);
      }
    }
    if (is_default.defined(options.container)) {
      if (is_default.string(options.container) && is_default.inArray(options.container, ["fs", "zip"])) {
        this.options.tileContainer = options.container;
      } else {
        throw is_default.invalidParameterError("container", "one of: fs, zip", options.container);
      }
    }
    if (is_default.defined(options.layout)) {
      if (is_default.string(options.layout) && is_default.inArray(options.layout, ["dz", "google", "iiif", "iiif3", "zoomify"])) {
        this.options.tileLayout = options.layout;
      } else {
        throw is_default.invalidParameterError("layout", "one of: dz, google, iiif, iiif3, zoomify", options.layout);
      }
    }
    if (is_default.defined(options.angle)) {
      if (is_default.integer(options.angle) && !(options.angle % 90)) {
        this.options.tileAngle = options.angle;
      } else {
        throw is_default.invalidParameterError("angle", "positive/negative multiple of 90", options.angle);
      }
    }
    this._setBackgroundColourOption("tileBackground", options.background);
    if (is_default.defined(options.depth)) {
      if (is_default.string(options.depth) && is_default.inArray(options.depth, ["onepixel", "onetile", "one"])) {
        this.options.tileDepth = options.depth;
      } else {
        throw is_default.invalidParameterError("depth", "one of: onepixel, onetile, one", options.depth);
      }
    }
    if (is_default.defined(options.skipBlanks)) {
      if (is_default.integer(options.skipBlanks) && is_default.inRange(options.skipBlanks, -1, 65535)) {
        this.options.tileSkipBlanks = options.skipBlanks;
      } else {
        throw is_default.invalidParameterError("skipBlanks", "integer between -1 and 255/65535", options.skipBlanks);
      }
    } else if (is_default.defined(options.layout) && options.layout === "google") {
      this.options.tileSkipBlanks = 5;
    }
    const centre = is_default.bool(options.center) ? options.center : options.centre;
    if (is_default.defined(centre)) {
      this._setBooleanOption("tileCentre", centre);
    }
    if (is_default.defined(options.id)) {
      if (is_default.string(options.id)) {
        this.options.tileId = options.id;
      } else {
        throw is_default.invalidParameterError("id", "string", options.id);
      }
    }
    if (is_default.defined(options.basename)) {
      if (is_default.string(options.basename)) {
        this.options.tileBasename = options.basename;
      } else {
        throw is_default.invalidParameterError("basename", "string", options.basename);
      }
    }
  }
  if (is_default.inArray(this.options.formatOut, ["jpeg", "png", "webp"])) {
    this.options.tileFormat = this.options.formatOut;
  } else if (this.options.formatOut !== "input") {
    throw is_default.invalidParameterError("format", "one of: jpeg, png, webp", this.options.formatOut);
  }
  return this._updateFormatOut("dz");
}
function timeout(options) {
  if (!is_default.plainObject(options)) {
    throw is_default.invalidParameterError("options", "object", options);
  }
  if (is_default.integer(options.seconds) && is_default.inRange(options.seconds, 0, 3600)) {
    this.options.timeoutSeconds = options.seconds;
  } else {
    throw is_default.invalidParameterError("seconds", "integer between 0 and 3600", options.seconds);
  }
  return this;
}
function _updateFormatOut(formatOut, options) {
  if (!(is_default.object(options) && options.force === false)) {
    this.options.formatOut = formatOut;
  }
  return this;
}
function _setBooleanOption(key, val) {
  if (is_default.bool(val)) {
    this.options[key] = val;
  } else {
    throw is_default.invalidParameterError(key, "boolean", val);
  }
}
function _read() {
  if (!this.options.streamOut) {
    this.options.streamOut = true;
    const stack = Error();
    this._pipeline(void 0, stack);
  }
}
function _pipeline(callback, stack) {
  if (typeof callback === "function") {
    if (this._isStreamInput()) {
      this._whenStreamInFinished(() => {
        this._flattenBufferIn();
        sharp_default.pipeline(this.options, (err, data, info) => {
          if (err) {
            callback(is_default.nativeError(err, stack));
          } else {
            callback(null, data, info);
          }
        });
      });
    } else {
      sharp_default.pipeline(this.options, (err, data, info) => {
        if (err) {
          callback(is_default.nativeError(err, stack));
        } else {
          callback(null, data, info);
        }
      });
    }
    return this;
  } else if (this.options.streamOut) {
    if (this._isStreamInput()) {
      this._whenStreamInFinished(() => {
        this._flattenBufferIn();
        sharp_default.pipeline(this.options, (err, data, info) => {
          if (err) {
            this.emit("error", is_default.nativeError(err, stack));
          } else {
            this.emit("info", info);
            this.push(data);
          }
          this.push(null);
          this.on("end", () => this.emit("close"));
        });
      });
    } else {
      sharp_default.pipeline(this.options, (err, data, info) => {
        if (err) {
          this.emit("error", is_default.nativeError(err, stack));
        } else {
          this.emit("info", info);
          this.push(data);
        }
        this.push(null);
        this.on("end", () => this.emit("close"));
      });
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        this._whenStreamInFinished(() => {
          this._flattenBufferIn();
          sharp_default.pipeline(this.options, (err, data, info) => {
            if (err) {
              reject(is_default.nativeError(err, stack));
            } else {
              if (this.options.resolveWithObject) {
                resolve({ data, info });
              } else {
                resolve(data);
              }
            }
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp_default.pipeline(this.options, (err, data, info) => {
          if (err) {
            reject(is_default.nativeError(err, stack));
          } else {
            if (this.options.resolveWithObject) {
              resolve({ data, info });
            } else {
              resolve(data);
            }
          }
        });
      });
    }
  }
}
var output_default = (Sharp2) => {
  Object.assign(Sharp2.prototype, {
    // Public
    toFile,
    toBuffer,
    toUint8Array,
    withDensity,
    keepExif,
    withExif,
    withExifMerge,
    keepIccProfile,
    withIccProfile,
    keepGainMap,
    withGainMap,
    keepXmp,
    withXmp,
    keepMetadata,
    withMetadata,
    toFormat,
    jpeg,
    jp2,
    png,
    webp,
    tiff,
    avif,
    heif,
    jxl,
    gif,
    raw,
    tile,
    timeout,
    // Private
    _updateFormatOut,
    _setBooleanOption,
    _read,
    _pipeline
  });
};

// node_modules/sharp/dist/utility.mjs
var import_node_events = __toESM(require("node:events"), 1);
var import_node_module2 = require("node:module");
var import_node_os = require("node:os");
var import_detect_libc3 = __toESM(require_detect_libc(), 1);
var import_meta2 = {};
var require3 = (0, import_node_module2.createRequire)(import_meta2.url);
var runtimePlatform2 = libvips_default.runtimePlatformArch();
var libvipsVersion = sharp_default.libvipsVersion();
var format = sharp_default.format();
format.heif.output.alias = ["avif", "heic"];
format.jpeg.output.alias = ["jpe", "jpg"];
format.tiff.output.alias = ["tif"];
format.jp2.output.alias = ["j2c", "j2k", "jp2", "jpx"];
var interpolators = {
  /** [Nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation). Suitable for image enlargement only. */
  nearest: "nearest",
  /** [Bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation). Faster than bicubic but with less smooth results. */
  bilinear: "bilinear",
  /** [Bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default). */
  bicubic: "bicubic",
  /** [LBB interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/lbb.cpp#L100). Prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2. */
  locallyBoundedBicubic: "lbb",
  /** [Nohalo interpolation](http://eprints.soton.ac.uk/268086/). Prevents acutance but typically reduces performance by a factor of 3. */
  nohalo: "nohalo",
  /** [VSQBS interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/vsqbs.cpp#L48). Prevents "staircasing" when enlarging. */
  vertexSplitQuadraticBasisSpline: "vsqbs"
};
var versions = {
  vips: libvipsVersion.semver
};
if (!libvipsVersion.isGlobal) {
  if (!libvipsVersion.isWasm) {
    try {
      versions = require3(`@img/sharp-${runtimePlatform2}/versions`);
    } catch (_) {
      try {
        versions = require3(`@img/sharp-libvips-${runtimePlatform2}/versions`);
      } catch (_2) {
      }
    }
  } else {
    try {
      versions = require3("@img/sharp-wasm32/versions");
    } catch (_) {
    }
  }
}
versions.sharp = package_default.version;
if (versions.heif && format.heif) {
  format.heif.input.fileSuffix = [".avif"];
  format.heif.output.alias = ["avif"];
}
function cache(options) {
  if (is_default.bool(options)) {
    if (options) {
      return sharp_default.cache(50, 20, 100);
    } else {
      return sharp_default.cache(0, 0, 0);
    }
  } else if (is_default.object(options)) {
    for (const property of ["memory", "files", "items"]) {
      const value = options[property];
      if (is_default.defined(value) && !(is_default.integer(value) && value >= 0)) {
        throw is_default.invalidParameterError(property, "a positive integer", value);
      }
    }
    return sharp_default.cache(options.memory, options.files, options.items);
  } else {
    return sharp_default.cache();
  }
}
cache(true);
function concurrency(concurrency2) {
  return sharp_default.concurrency(is_default.integer(concurrency2) ? concurrency2 : null);
}
if (!process.env.MALLOC_ARENA_MAX && import_detect_libc3.default.familySync() === import_detect_libc3.default.GLIBC && !sharp_default._isUsingJemalloc()) {
  sharp_default.concurrency(1);
} else if (import_detect_libc3.default.familySync() === import_detect_libc3.default.MUSL && sharp_default.concurrency() === 1024) {
  sharp_default.concurrency((0, import_node_os.availableParallelism)());
}
var queue = new import_node_events.default.EventEmitter();
function counters() {
  return sharp_default.counters();
}
function simd(simd2) {
  return sharp_default.simd(is_default.bool(simd2) ? simd2 : null);
}
function block(options) {
  if (is_default.object(options)) {
    if (Array.isArray(options.operation) && options.operation.every(is_default.string)) {
      sharp_default.block(options.operation, true);
    } else {
      throw is_default.invalidParameterError("operation", "Array<string>", options.operation);
    }
  } else {
    throw is_default.invalidParameterError("options", "object", options);
  }
}
function unblock(options) {
  if (is_default.object(options)) {
    if (Array.isArray(options.operation) && options.operation.every(is_default.string)) {
      sharp_default.block(options.operation, false);
    } else {
      throw is_default.invalidParameterError("operation", "Array<string>", options.operation);
    }
  } else {
    throw is_default.invalidParameterError("options", "object", options);
  }
}
var utility_default = (Sharp2) => {
  Sharp2.cache = cache;
  Sharp2.concurrency = concurrency;
  Sharp2.counters = counters;
  Sharp2.simd = simd;
  Sharp2.format = format;
  Sharp2.interpolators = interpolators;
  Sharp2.versions = versions;
  Sharp2.queue = queue;
  Sharp2.block = block;
  Sharp2.unblock = unblock;
};

// node_modules/sharp/dist/index.mjs
input_default(constructor_default);
resize_default(constructor_default);
composite_default(constructor_default);
operation_default(constructor_default);
colour_default(constructor_default);
channel_default(constructor_default);
output_default(constructor_default);
utility_default(constructor_default);
var dist_default = constructor_default;

// constants/commands.ts
var ADB_COMMANDS = {
  DEVICES: ["devices", "-l"],
  SCREENCAP: ["exec-out", "screencap", "-p"],
  SCREENCAP_RAW: ["exec-out", "screencap"],
  TCP_IP: (port) => ["tcpip", port.toString()],
  CONNECT: (ip, port) => ["connect", `${ip}:${port}`],
  PAIR: (ip, port, code) => ["pair", `${ip}:${port}`, code],
  WLAN_IP: ["shell", "ip", "-f", "inet", "addr", "show", "wlan0"],
  FOREGROUND_APP: ["shell", "dumpsys", "window"],
  FORCE_STOP: (pkg) => ["shell", "am", "force-stop", pkg],
  CLEAR_APP: (pkg) => ["shell", "pm", "clear", pkg],
  LAUNCH_APP: (pkg) => ["shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"],
  UIAUTOMATOR_DUMP: ["exec-out", "uiautomator", "dump", "/dev/tty"],
  INPUT_TAP: (x, y) => ["shell", "input", "tap", x.toString(), y.toString()],
  INPUT_TEXT: (escapedText) => ["shell", "input", "text", escapedText],
  INPUT_KEY: (keyCode) => ["shell", "input", "keyevent", keyCode.toString()],
  INPUT_SWIPE: (x1, y1, x2, y2, durationMs = 300) => [
    "shell",
    "input",
    "swipe",
    x1.toString(),
    y1.toString(),
    x2.toString(),
    y2.toString(),
    durationMs.toString()
  ]
};

// constants/config.ts
var CONFIG = {
  DEFAULT_PORT: 5555,
  DEFAULT_OUTPUT_DIR: "./output",
  DEFAULT_TIMEOUT_MS: 1e4,
  DEFAULT_DEVICE_FRAME: "minimal",
  ADB_DEFAULT_HOST: "127.0.0.1"
};

// lib/adb.ts
var cachedAdbPath = null;
function resolveAdbPath() {
  if (cachedAdbPath) return cachedAdbPath;
  if (process.env.ADB_PATH && import_node_fs.default.existsSync(process.env.ADB_PATH)) {
    cachedAdbPath = process.env.ADB_PATH;
    return cachedAdbPath;
  }
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome) {
    const adbExt = process.platform === "win32" ? "adb.exe" : "adb";
    const candidate = import_node_path2.default.join(androidHome, "platform-tools", adbExt);
    if (import_node_fs.default.existsSync(candidate)) {
      cachedAdbPath = candidate;
      return cachedAdbPath;
    }
  }
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || import_node_path2.default.join(import_node_os2.default.homedir(), "AppData", "Local");
    const winCandidate = import_node_path2.default.join(localAppData, "Android", "Sdk", "platform-tools", "adb.exe");
    if (import_node_fs.default.existsSync(winCandidate)) {
      cachedAdbPath = winCandidate;
      return cachedAdbPath;
    }
  } else if (process.platform === "darwin") {
    const macCandidate = import_node_path2.default.join(import_node_os2.default.homedir(), "Library", "Android", "sdk", "platform-tools", "adb");
    if (import_node_fs.default.existsSync(macCandidate)) {
      cachedAdbPath = macCandidate;
      return cachedAdbPath;
    }
  } else {
    const linuxCandidate = import_node_path2.default.join(import_node_os2.default.homedir(), "Android", "Sdk", "platform-tools", "adb");
    if (import_node_fs.default.existsSync(linuxCandidate)) {
      cachedAdbPath = linuxCandidate;
      return cachedAdbPath;
    }
  }
  cachedAdbPath = "adb";
  return cachedAdbPath;
}
var AndroidDriver = class {
  platform = "android";
  /**
   * Helper to execute adb commands with timeout and error handling.
   */
  async exec(args, timeoutMs = CONFIG.DEFAULT_TIMEOUT_MS) {
    const adbBinary = resolveAdbPath();
    return new Promise((resolve, reject) => {
      (0, import_node_child_process2.execFile)(adbBinary, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`ADB command "${adbBinary} ${args.join(" ")}" failed: ${stderr || err.message}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
  /**
   * Discovers and parses all currently attached Android devices (USB, Wi-Fi, Emulator).
   */
  async listDevices() {
    const output = await this.exec(ADB_COMMANDS.DEVICES);
    const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const devices = [];
    for (const line of lines) {
      if (line.startsWith("List of devices attached") || line.startsWith("* daemon")) {
        continue;
      }
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const id = parts[0];
      const rawStatus = parts[1];
      const isAuthorized = rawStatus === "device";
      let model = id;
      let product = "generic";
      for (let i = 2; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith("model:")) {
          model = part.replace("model:", "").replace(/_/g, " ");
        } else if (part.startsWith("product:")) {
          product = part.replace("product:", "");
        }
      }
      let type = "usb";
      if (id.includes(":") || id.includes("._tcp") || id.includes("_adb-tls-") || id.includes("._adb.") || id.includes("tls-connect")) {
        type = "wifi";
      } else if (id.startsWith("emulator-")) {
        type = "emulator";
      }
      devices.push({
        id,
        platform: "android",
        type,
        model,
        product,
        isAuthorized,
        rawStatus
      });
    }
    devices.sort((a, b) => {
      if (a.isAuthorized !== b.isAuthorized) return a.isAuthorized ? -1 : 1;
      const rank = (type) => {
        if (type === "usb") return 0;
        if (type === "wifi") return 1;
        if (type === "emulator") return 2;
        return 3;
      };
      return rank(a.type) - rank(b.type);
    });
    return devices;
  }
  /**
   * Captures raw screenshot directly into a memory Buffer via high-speed raw framebuffer streaming.
   * Bypasses device-side CPU PNG compression with automatic fallback to standard `screencap -p`.
   */
  async captureScreenshot(deviceId) {
    let targetId = deviceId;
    if (!targetId) {
      try {
        const devices = await this.listDevices();
        const ready = devices.find((d) => d.isAuthorized);
        if (ready) targetId = ready.id;
      } catch {
      }
    }
    const adbBinary = resolveAdbPath();
    try {
      const rawArgs = targetId ? ["-s", targetId, ...ADB_COMMANDS.SCREENCAP_RAW] : ADB_COMMANDS.SCREENCAP_RAW;
      const rawBuffer = await new Promise((resolve, reject) => {
        (0, import_node_child_process2.execFile)(
          adbBinary,
          rawArgs,
          {
            encoding: "buffer",
            maxBuffer: 50 * 1024 * 1024,
            timeout: CONFIG.DEFAULT_TIMEOUT_MS
          },
          (err, stdout, stderr) => {
            if (err) return reject(err);
            if (!stdout || stdout.length < 16) return reject(new Error("Invalid raw screencap buffer"));
            resolve(stdout);
          }
        );
      });
      const width = rawBuffer.readUInt32LE(0);
      const height = rawBuffer.readUInt32LE(4);
      const format2 = rawBuffer.readUInt32LE(8);
      if (width > 0 && height > 0 && (format2 === 1 || format2 === 2 || format2 === 3 || format2 === 5)) {
        const expectedBytes = 16 + width * height * 4;
        if (rawBuffer.length >= expectedBytes) {
          const pixelData = rawBuffer.subarray(16, expectedBytes);
          return await dist_default(pixelData, {
            raw: {
              width,
              height,
              channels: 4
            }
          }).png({ compressionLevel: 6 }).toBuffer();
        }
      }
    } catch {
    }
    const fallbackArgs = targetId ? ["-s", targetId, ...ADB_COMMANDS.SCREENCAP] : ADB_COMMANDS.SCREENCAP;
    return new Promise((resolve, reject) => {
      (0, import_node_child_process2.execFile)(
        adbBinary,
        fallbackArgs,
        {
          encoding: "buffer",
          maxBuffer: 50 * 1024 * 1024,
          timeout: CONFIG.DEFAULT_TIMEOUT_MS
        },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(`Screenshot capture failed: ${stderr ? stderr.toString() : err.message}`));
          } else {
            if (!stdout || stdout.length === 0) {
              reject(new Error("Received empty screenshot buffer from ADB."));
              return;
            }
            resolve(stdout);
          }
        }
      );
    });
  }
  /**
   * Extracts the internal local Wi-Fi IP address of an attached device with multi-layer fallbacks.
   */
  async getDeviceIp(deviceId) {
    try {
      const output = await this.exec(["-s", deviceId, ...ADB_COMMANDS.WLAN_IP]);
      const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (match && match[1] && !match[1].startsWith("127.")) {
        return match[1];
      }
    } catch {
    }
    try {
      const routeOutput = await this.exec(["-s", deviceId, "shell", "ip", "route"]);
      const routeMatch = routeOutput.match(/src\s+(\d+\.\d+\.\d+\.\d+)/);
      if (routeMatch && routeMatch[1] && !routeMatch[1].startsWith("127.")) {
        return routeMatch[1];
      }
    } catch {
    }
    try {
      const addrOutput = await this.exec(["-s", deviceId, "shell", "ip", "-f", "inet", "addr"]);
      const lines = addrOutput.split("\n");
      for (const line of lines) {
        const m = line.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
        if (m && m[1] && !m[1].startsWith("127.")) {
          return m[1];
        }
      }
    } catch {
    }
    try {
      const propOutput = await this.exec(["-s", deviceId, "shell", "getprop", "dhcp.wlan0.ipaddress"]);
      const trimmed = propOutput.trim();
      if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
        return trimmed;
      }
    } catch {
    }
    throw new Error(`Unable to determine Wi-Fi IP address for device ${deviceId}. Please verify that your phone is connected to your Wi-Fi network.`);
  }
  /**
   * 1-Click Switch: Puts USB-connected device in TCP mode, finds its IP, and connects over Wi-Fi.
   */
  async enableWireless(deviceId, port = CONFIG.DEFAULT_PORT) {
    const ip = await this.getDeviceIp(deviceId);
    await this.exec(["-s", deviceId, ...ADB_COMMANDS.TCP_IP(port)]);
    await new Promise((r) => setTimeout(r, 800));
    const connectOutput = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
    if (!connectOutput.includes("connected to") && !connectOutput.includes("already connected")) {
      throw new Error(`Failed to connect over Wi-Fi to ${ip}:${port}: ${connectOutput}`);
    }
    return `${ip}:${port}`;
  }
  /**
   * Disconnects a wireless ADB session and resets device connection back to USB mode.
   */
  async disableWireless(deviceId) {
    const isWireless = deviceId && (deviceId.includes(":") || deviceId.includes("._tcp") || deviceId.includes("_adb-tls-") || deviceId.includes("tls-connect"));
    if (isWireless) {
      try {
        return await this.exec(["disconnect", deviceId]);
      } catch {
        return "disconnected";
      }
    }
    const prefix = deviceId ? ["-s", deviceId] : [];
    return await this.exec([...prefix, "usb"]);
  }
  /**
   * Connects directly to an existing wireless device endpoint (IP:Port).
   */
  async connectWifi(ip, port = CONFIG.DEFAULT_PORT) {
    try {
      const output = await this.exec(ADB_COMMANDS.CONNECT(ip, port));
      if (output.includes("connected to") || output.includes("already connected")) {
        return { success: true, message: output };
      }
      return { success: false, message: output || "Failed to connect" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
  /**
   * Pairs an Android 11+ device using pairing code and pairing port.
   */
  async pairWifi(ip, port, code) {
    try {
      const output = await this.exec(ADB_COMMANDS.PAIR(ip, port, code));
      if (output.includes("Successfully paired") || output.includes("already paired")) {
        return { success: true, message: output };
      }
      return { success: false, message: output || "Pairing failed" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
  /**
   * Detects the currently open/focused application package on the phone screen.
   */
  async getForegroundApp(deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    const output = await this.exec([...prefix, ...ADB_COMMANDS.FOREGROUND_APP]);
    const match = output.match(/mCurrentFocus[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//) || output.match(/mFocusedApp[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//) || output.match(/topResumedActivity[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//);
    return match ? match[1] : null;
  }
  /**
   * Instantly wipes app data, tokens, and cache in <100ms, returning app to pristine logged-out state.
   */
  async resetAppData(packageName, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.CLEAR_APP(packageName)]);
  }
  /**
   * Launches an app from cold start using Android Monkey launcher trigger.
   */
  async launchApp(packageName, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.LAUNCH_APP(packageName)]);
  }
  /**
   * Terminates the app process completely.
   */
  async killApp(packageName, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    await this.exec([...prefix, ...ADB_COMMANDS.FORCE_STOP(packageName)]);
  }
  /**
   * Toggles Android SystemUI Demo Mode (pristine 9:41 AM, 100% battery, full wifi, no notifications).
   */
  async setDemoMode(enable, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    if (enable) {
      await this.exec([...prefix, "shell", "settings", "put", "global", "sysui_demo_allowed", "1"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "enter"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "clock", "-e", "hhmm", "0941"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "battery", "-e", "level", "100", "-e", "plugged", "false"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "network", "-e", "wifi", "show", "-e", "level", "4", "-e", "fully", "true"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "network", "-e", "mobile", "show", "-e", "datatype", "false", "-e", "level", "4"]);
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "notifications", "-e", "visible", "false"]);
    } else {
      await this.exec([...prefix, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "exit"]);
    }
  }
  /**
   * Records a high-definition MP4 clip directly from the mobile screen using adb screenrecord.
   */
  async recordVideo(seconds = 5, deviceId) {
    const prefix = deviceId ? ["-s", deviceId] : [];
    const remotePath = "/sdcard/adbsnap_temp_rec.mp4";
    const localTmp = import_node_path2.default.join(import_node_os2.default.tmpdir(), `adbsnap-rec-${Date.now()}.mp4`);
    try {
      await this.exec([...prefix, "shell", "rm", "-f", remotePath]);
    } catch {
    }
    const duration = Math.min(Math.max(seconds, 1), 30);
    await this.exec(
      [...prefix, "shell", "screenrecord", "--time-limit", String(duration), remotePath],
      (duration + 10) * 1e3
    );
    await this.exec([...prefix, "pull", remotePath, localTmp], 3e4);
    const buffer2 = import_node_fs.default.readFileSync(localTmp);
    try {
      import_node_fs.default.unlinkSync(localTmp);
    } catch {
    }
    try {
      await this.exec([...prefix, "shell", "rm", "-f", remotePath]);
    } catch {
    }
    return buffer2;
  }
};
var androidDriver = new AndroidDriver();

// lib/ios.ts
var import_node_child_process3 = require("node:child_process");
var import_promises = __toESM(require("node:fs/promises"), 1);
var import_node_os3 = __toESM(require("node:os"), 1);
var import_node_path3 = __toESM(require("node:path"), 1);
var runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  (0, import_node_child_process3.execFile)(command, args, options, (error, stdout, stderr) => {
    if (error) {
      reject(new Error(stderr.trim() || error.message));
      return;
    }
    resolve({ stdout, stderr });
  });
});
var IOSDriver = class {
  constructor(execute = runCommand) {
    this.execute = execute;
  }
  execute;
  platform = "ios";
  /**
   * Verifies whether Xcode's simulator tooling is available on this host.
   */
  async isAvailable() {
    if (process.platform !== "darwin") return false;
    try {
      await this.execute("xcrun", ["simctl", "help"]);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Lists booted simulators and connected physical iOS devices on macOS.
   */
  async listDevices() {
    if (process.platform !== "darwin") return [];
    const [simulators, physicalDevices] = await Promise.all([
      this.listSimulators(),
      this.listPhysicalDevices()
    ]);
    return [...simulators, ...physicalDevices];
  }
  async listSimulators() {
    let stdout;
    try {
      ({ stdout } = await this.execute("xcrun", ["simctl", "list", "devices", "booted", "--json"]));
    } catch {
      return [];
    }
    const parsed = JSON.parse(stdout);
    return Object.values(parsed.devices ?? {}).flat().filter((device) => device.state === "Booted").map((device) => ({
      id: device.udid,
      platform: "ios",
      type: "emulator",
      model: device.name || "iOS Simulator",
      product: device.deviceTypeIdentifier || "iPhone",
      isAuthorized: true,
      rawStatus: device.state
    }));
  }
  async listPhysicalDevices() {
    const { stdout } = await this.execute("xcrun", [
      "devicectl",
      "--quiet",
      "list",
      "devices",
      "--json-output",
      "-"
    ]);
    const parsed = JSON.parse(stdout);
    return (parsed.result?.devices ?? []).filter((device) => device.properties?.hardware?.reality?.toLowerCase() === "physical").filter((device) => device.properties?.connection?.state?.toLowerCase() === "connected").map((device) => {
      const hardware = device.properties?.hardware;
      const connection = device.properties?.connection;
      const pairingState = connection?.pairingState?.toLowerCase() ?? "unknown";
      const state = connection?.state ?? "unknown";
      return {
        id: device.identifier || hardware?.udid || "",
        platform: "ios",
        type: this.connectionType(connection?.transportType),
        model: hardware?.marketingName || device.properties?.state?.name || "iOS Device",
        product: hardware?.productType || hardware?.deviceType || "iPhone",
        isAuthorized: pairingState === "paired",
        rawStatus: `${state}; pairing ${pairingState}`
      };
    }).filter((device) => device.id.length > 0);
  }
  connectionType(transportType) {
    const transport = transportType?.toLowerCase();
    return transport && ["wifi", "wireless", "network", "remote"].includes(transport) ? "wifi" : "usb";
  }
  /**
   * Captures a screenshot from a booted simulator or connected physical iOS device.
   */
  async captureScreenshot(deviceId) {
    if (process.platform !== "darwin") {
      throw new Error("iOS screenshot capture requires macOS with Xcode installed and configured.");
    }
    const devices = await this.listDevices();
    const device = deviceId ? devices.find((candidate) => candidate.id === deviceId) : devices.find((candidate) => candidate.isAuthorized);
    if (!device) {
      throw new Error(
        deviceId ? `No available iOS simulator or paired device found with identifier "${deviceId}".` : "No booted iOS simulator or connected, paired iOS device found."
      );
    }
    if (!device.isAuthorized) {
      throw new Error(`iOS device "${device.model}" is not paired with this Mac.`);
    }
    const tmpDir = await import_promises.default.mkdtemp(import_node_path3.default.join(import_node_os3.default.tmpdir(), "adbsnap-ios-"));
    const tmpFile = import_node_path3.default.join(tmpDir, "capture.png");
    try {
      if (device.type === "emulator") {
        await this.execute(
          "xcrun",
          ["simctl", "io", device.id, "screenshot", tmpFile],
          { timeout: 12e4, maxBuffer: 50 * 1024 * 1024 }
        );
      } else {
        await this.execute(
          "xcrun",
          [
            "devicectl",
            "device",
            "capture",
            "screenshot",
            "--device",
            device.id,
            "--destination",
            tmpFile,
            "--quiet"
          ],
          { timeout: 12e4, maxBuffer: 50 * 1024 * 1024 }
        );
      }
      const screenshot = await import_promises.default.readFile(tmpFile);
      if (screenshot.length === 0) {
        throw new Error(`Received empty screenshot from iOS device "${device.model}".`);
      }
      return screenshot;
    } finally {
      await import_promises.default.rm(tmpDir, { recursive: true, force: true });
    }
  }
};
var iosDriver = new IOSDriver();

// lib/devices.ts
async function listAllDevices() {
  const [androidDevices, iosDevices] = await Promise.all([
    androidDriver.listDevices().catch(() => []),
    iosDriver.listDevices().catch(() => [])
  ]);
  return [...androidDevices, ...iosDevices];
}

// vscode/src/clipboard.ts
var import_promises2 = __toESM(require("node:fs/promises"));
var import_node_path4 = __toESM(require("node:path"));
var import_node_os4 = __toESM(require("node:os"));
var import_node_child_process4 = require("node:child_process");
async function copyImageBufferToClipboard(buffer2) {
  const tempPath = import_node_path4.default.join(import_node_os4.default.tmpdir(), `adbsnap-clip-${Date.now()}.png`);
  await import_promises2.default.writeFile(tempPath, buffer2);
  try {
    const platform = process.platform;
    if (platform === "win32") {
      const psCommand = `
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;
$img = [System.Drawing.Image]::FromFile('${tempPath.replace(/\\/g, "\\\\")}');
[System.Windows.Forms.Clipboard]::SetImage($img);
$img.Dispose();
`;
      await new Promise((resolve, reject) => {
        (0, import_node_child_process4.execFile)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", psCommand], (err, _stdout, stderr) => {
          if (err) {
            reject(new Error(`Clipboard error: ${stderr || err.message}`));
          } else {
            resolve();
          }
        });
      });
    } else if (platform === "darwin") {
      await new Promise((resolve, reject) => {
        (0, import_node_child_process4.execFile)(
          "osascript",
          ["-e", `set the clipboard to (read (POSIX file "${tempPath}") as \xABclass PNGf\xBB)`],
          (err, _stdout, stderr) => {
            if (err) {
              reject(new Error(`Clipboard error: ${stderr || err.message}`));
            } else {
              resolve();
            }
          }
        );
      });
    } else {
      await new Promise((resolve, reject) => {
        (0, import_node_child_process4.execFile)("xclip", ["-selection", "clipboard", "-t", "image/png", "-i", tempPath], (err) => {
          if (err) {
            (0, import_node_child_process4.execFile)("wl-copy", ["-t", "image/png"], { input: buffer2 }, (err2) => {
              if (err2) {
                reject(new Error("Please install xclip or wl-clipboard to copy images on Linux."));
              } else {
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
      });
    }
  } finally {
    setTimeout(async () => {
      try {
        await import_promises2.default.unlink(tempPath);
      } catch {
      }
    }, 2e3);
  }
}

// vscode/src/statusBar.ts
var vscode = __toESM(require("vscode"));
var AdbStatusBarManager = class {
  statusBarItem;
  activeDevice = null;
  pollInterval = null;
  isRefreshing = false;
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "adbsnap.devices";
    this.statusBarItem.text = "$(device-mobile) ADBSnap: Initializing...";
    this.statusBarItem.tooltip = "ADBSnap: Click to select device or refresh";
    this.statusBarItem.show();
    this.refresh();
    this.pollInterval = setInterval(() => this.refresh(), 1e4);
  }
  async refresh() {
    if (this.isRefreshing) return [];
    this.isRefreshing = true;
    try {
      const devices = await listAllDevices();
      if (devices.length === 0) {
        this.activeDevice = null;
        this.statusBarItem.text = "$(device-mobile) No Device";
        this.statusBarItem.tooltip = "No mobile devices found. Click to refresh connected devices.";
        this.statusBarItem.backgroundColor = void 0;
      } else {
        const currentStillAttached = devices.find((d) => d.id === this.activeDevice?.id);
        if (currentStillAttached) {
          this.activeDevice = currentStillAttached;
        } else {
          const firstReady = devices.find((d) => d.isAuthorized);
          this.activeDevice = firstReady || devices[0];
        }
        if (!this.activeDevice.isAuthorized) {
          this.statusBarItem.text = `$(alert) ${this.activeDevice.model} (Unauthorized)`;
          this.statusBarItem.tooltip = this.activeDevice.platform === "ios" ? `Device ${this.activeDevice.id} must be paired and trusted with this Mac.` : `Device ${this.activeDevice.id} requires USB debugging authorization on the device screen.`;
          this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
        } else {
          const typeBadge = this.activeDevice.platform === "ios" ? this.activeDevice.type === "emulator" ? "iOS Sim" : "iOS" : this.activeDevice.type === "wifi" ? "Wi-Fi" : this.activeDevice.type === "emulator" ? "Emu" : "USB";
          this.statusBarItem.text = `$(device-mobile) ${this.activeDevice.model} (${typeBadge})`;
          this.statusBarItem.tooltip = `Active Target: ${this.activeDevice.model} [${this.activeDevice.id}]
Click to switch devices.`;
          this.statusBarItem.backgroundColor = void 0;
        }
      }
      return devices;
    } catch {
      this.statusBarItem.text = "$(alert) Device Scan Failed";
      this.statusBarItem.tooltip = "Device discovery failed. Check ADB and Xcode command-line tool configuration.";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
      return [];
    } finally {
      this.isRefreshing = false;
    }
  }
  getActiveDevice() {
    return this.activeDevice;
  }
  setActiveDevice(device) {
    this.activeDevice = device;
    const typeBadge = device.platform === "ios" ? device.type === "emulator" ? "iOS Sim" : "iOS" : device.type === "wifi" ? "Wi-Fi" : device.type === "emulator" ? "Emu" : "USB";
    this.statusBarItem.text = `$(device-mobile) ${device.model} (${typeBadge})`;
    this.statusBarItem.tooltip = `Active Target: ${device.model} [${device.id}]
Click to switch devices.`;
    this.statusBarItem.backgroundColor = void 0;
  }
  dispose() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.statusBarItem.dispose();
  }
};

// vscode/src/cli.ts
var import_node_child_process5 = require("node:child_process");
var import_node_path5 = __toESM(require("node:path"));
var import_node_fs2 = __toESM(require("node:fs"));
function resolveCliRunner(extensionPath) {
  const localCli = import_node_path5.default.resolve(extensionPath, "..", "dist", "bin", "cli.js");
  if (import_node_fs2.default.existsSync(localCli)) {
    return {
      command: process.execPath,
      // node
      prefixArgs: [localCli],
      label: `node ${localCli}`
    };
  }
  const localSrcCli = import_node_path5.default.resolve(extensionPath, "..", "bin", "cli.ts");
  if (import_node_fs2.default.existsSync(localSrcCli)) {
    const tsxBin = import_node_path5.default.resolve(extensionPath, "..", "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
    if (import_node_fs2.default.existsSync(tsxBin)) {
      return {
        command: tsxBin,
        prefixArgs: [localSrcCli],
        label: `tsx ${localSrcCli}`
      };
    }
  }
  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    prefixArgs: ["adbsnap"],
    label: "npx adbsnap"
  };
}
async function runAdbSnapCli(extensionPath, args, timeoutMs = 3e4) {
  const runner = resolveCliRunner(extensionPath);
  return new Promise((resolve) => {
    (0, import_node_child_process5.execFile)(
      runner.command,
      [...runner.prefixArgs, ...args],
      {
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
        cwd: import_node_path5.default.resolve(extensionPath, ".."),
        env: { ...process.env, FORCE_COLOR: "0" }
        // Disable chalk colors in output
      },
      (err, stdout, stderr) => {
        resolve({
          stdout: stdout?.toString() || "",
          stderr: stderr?.toString() || "",
          exitCode: err ? err.code ?? 1 : 0
        });
      }
    );
  });
}
function getCliRunnerLabel(extensionPath) {
  return resolveCliRunner(extensionPath).label;
}

// vscode/src/views/devicesProvider.ts
var vscode2 = __toESM(require("vscode"));
var DeviceTreeItem = class extends vscode2.TreeItem {
  constructor(device, isActive) {
    super(device.model, vscode2.TreeItemCollapsibleState.None);
    this.device = device;
    this.isActive = isActive;
    const typeLabel = device.platform === "ios" ? device.type === "emulator" ? "iOS Simulator" : `iOS ${device.type === "wifi" ? "Wi-Fi" : "Device"}` : device.type === "wifi" ? "Wi-Fi" : device.type === "emulator" ? "Emulator" : "USB";
    this.description = `${device.id} \u2022 ${typeLabel}${isActive ? " (Active)" : ""}`;
    if (!device.isAuthorized) {
      const authorizationHelp = device.platform === "ios" ? "Pair and trust this Mac on the device" : "Confirm USB debugging on the phone";
      this.tooltip = `Device: ${device.model} (${device.id})
Status: Unauthorized (${authorizationHelp})`;
      this.iconPath = new vscode2.ThemeIcon("alert", new vscode2.ThemeColor("errorForeground"));
      this.contextValue = "device-unauthorized";
    } else {
      this.tooltip = `Device: ${device.model} (${device.id})
Product: ${device.product}
Type: ${typeLabel}
Status: Ready`;
      this.iconPath = new vscode2.ThemeIcon(
        device.type === "wifi" ? "radio-tower" : "device-mobile",
        isActive ? new vscode2.ThemeColor("charts.green") : void 0
      );
      if (device.type === "wifi") {
        this.contextValue = isActive ? "device-wifi-active" : "device-wifi-ready";
      } else {
        this.contextValue = isActive ? "device-active" : "device-ready";
      }
    }
    this.command = {
      command: "adbsnap.setActiveDeviceFromTree",
      title: "Select Active Device",
      arguments: [device]
    };
  }
  device;
  isActive;
};
var DevicesTreeDataProvider = class {
  constructor(statusBarManager2) {
    this.statusBarManager = statusBarManager2;
  }
  statusBarManager;
  _onDidChangeTreeData = new vscode2.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  devices = [];
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren() {
    try {
      this.devices = await listAllDevices();
      const activeDevice = this.statusBarManager.getActiveDevice();
      if (this.devices.length === 0) {
        return [];
      }
      return this.devices.map(
        (dev) => new DeviceTreeItem(dev, activeDevice?.id === dev.id)
      );
    } catch {
      return [];
    }
  }
  getDevices() {
    return this.devices;
  }
};

// vscode/src/views/capturesProvider.ts
var vscode3 = __toESM(require("vscode"));
var import_node_fs3 = __toESM(require("node:fs"));
var import_node_path6 = __toESM(require("node:path"));
var CaptureTreeItem = class extends vscode3.TreeItem {
  constructor(filePath, fileName, stats2) {
    super(fileName, vscode3.TreeItemCollapsibleState.None);
    this.filePath = filePath;
    this.fileName = fileName;
    this.stats = stats2;
    const sizeKb = (stats2.size / 1024).toFixed(1);
    const sizeStr = stats2.size > 1024 * 1024 ? `${(stats2.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKb} KB`;
    const dateStr = stats2.mtime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    this.description = `${sizeStr} \u2022 ${dateStr}`;
    this.tooltip = `${fileName}
Size: ${sizeStr}
Saved: ${stats2.mtime.toLocaleString()}`;
    const isZip = fileName.endsWith(".zip");
    this.iconPath = new vscode3.ThemeIcon(isZip ? "archive" : "file-media");
    this.contextValue = isZip ? "capture-zip" : "capture-image";
    this.command = {
      command: "vscode.open",
      title: "Open File",
      arguments: [vscode3.Uri.file(filePath)]
    };
  }
  filePath;
  fileName;
  stats;
};
var CapturesTreeDataProvider = class {
  constructor(getOutputDir) {
    this.getOutputDir = getOutputDir;
  }
  getOutputDir;
  _onDidChangeTreeData = new vscode3.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren() {
    const outDir = this.getOutputDir();
    if (!import_node_fs3.default.existsSync(outDir)) {
      return [];
    }
    try {
      const entries = import_node_fs3.default.readdirSync(outDir, { withFileTypes: true });
      const items = [];
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith(".png") || entry.name.endsWith(".jpg") || entry.name.endsWith(".zip"))) {
          const fullPath = import_node_path6.default.join(outDir, entry.name);
          const stats2 = import_node_fs3.default.statSync(fullPath);
          items.push(new CaptureTreeItem(fullPath, entry.name, stats2));
        } else if (entry.isDirectory() && entry.name.startsWith("export-")) {
          const subDir = import_node_path6.default.join(outDir, entry.name);
          const subStats = import_node_fs3.default.statSync(subDir);
          items.push(new CaptureTreeItem(subDir, `\u{1F4C1} ${entry.name}`, subStats));
        }
      }
      items.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
      return items;
    } catch {
      return [];
    }
  }
};

// vscode/src/studio/studioWebview.ts
var vscode4 = __toESM(require("vscode"));
var import_node_path7 = __toESM(require("node:path"));
var import_promises3 = __toESM(require("node:fs/promises"));
var StudioWebviewManager = class _StudioWebviewManager {
  static currentPanel = null;
  static createOrShow(context, statusBarManager2, resolveOutputDir2, onCaptureSaved) {
    const column = vscode4.window.activeTextEditor ? vscode4.window.activeTextEditor.viewColumn : void 0;
    if (_StudioWebviewManager.currentPanel) {
      _StudioWebviewManager.currentPanel.reveal(column);
      return;
    }
    const panel = vscode4.window.createWebviewPanel(
      "adbsnapStudio",
      "ADBSnap Studio \u{1F3A8}",
      column || vscode4.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode4.Uri.file(context.extensionPath)]
      }
    );
    _StudioWebviewManager.currentPanel = panel;
    panel.webview.html = _StudioWebviewManager.getHtmlForWebview();
    panel.onDidDispose(() => {
      _StudioWebviewManager.currentPanel = null;
    });
    panel.webview.onDidReceiveMessage(async (message) => {
      const activeDevice = statusBarManager2.getActiveDevice();
      switch (message.command) {
        case "init": {
          const devices = await listAllDevices();
          panel.webview.postMessage({
            type: "state",
            devices,
            activeDeviceId: activeDevice?.id || null
          });
          break;
        }
        case "refreshDevices": {
          const devices = await statusBarManager2.refresh();
          panel.webview.postMessage({
            type: "state",
            devices,
            activeDeviceId: statusBarManager2.getActiveDevice()?.id || null
          });
          break;
        }
        case "capture": {
          if (!activeDevice || !activeDevice.isAuthorized) {
            vscode4.window.showErrorMessage("ADBSnap: No authorized device available to capture.");
            panel.webview.postMessage({ type: "captureError", message: "Device not ready" });
            return;
          }
          try {
            panel.webview.postMessage({ type: "busy", isBusy: true, message: "Capturing from device..." });
            const outDir = resolveOutputDir2();
            await import_promises3.default.mkdir(outDir, { recursive: true });
            const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const tempFile = import_node_path7.default.join(outDir, `adbsnap-temp-${timestamp}.png`);
            const cliArgs = [
              "snap",
              "--frame",
              message.frame || "iphone-16-pro",
              "--theme",
              message.theme || "aurora",
              "--device",
              activeDevice.id,
              "--out",
              tempFile
            ];
            if (message.title) cliArgs.push("--title", message.title);
            if (message.subtitle) cliArgs.push("--subtitle", message.subtitle);
            const result = await runAdbSnapCli(context.extensionPath, cliArgs, 35e3);
            if (result.exitCode !== 0) {
              throw new Error(result.stderr || result.stdout || "Capture failed");
            }
            const imageBuffer = await import_promises3.default.readFile(tempFile);
            const base64Data = imageBuffer.toString("base64");
            panel.webview.postMessage({
              type: "previewImage",
              dataUrl: `data:image/png;base64,${base64Data}`,
              filePath: tempFile
            });
            if (onCaptureSaved) onCaptureSaved();
          } catch (err) {
            vscode4.window.showErrorMessage(`Capture failed: ${err.message || err}`);
            panel.webview.postMessage({ type: "captureError", message: err.message || String(err) });
          } finally {
            panel.webview.postMessage({ type: "busy", isBusy: false });
          }
          break;
        }
        case "copyToClipboard": {
          if (!message.filePath) {
            vscode4.window.showWarningMessage("ADBSnap: Please capture an image first before copying.");
            return;
          }
          try {
            const buf = await import_promises3.default.readFile(message.filePath);
            await copyImageBufferToClipboard(buf);
            vscode4.window.showInformationMessage("\u{1F4F8} ADBSnap: Framed graphic copied to clipboard!");
          } catch (err) {
            vscode4.window.showErrorMessage(`Copy failed: ${err.message || err}`);
          }
          break;
        }
        case "saveAsset": {
          if (!message.filePath) {
            vscode4.window.showWarningMessage("ADBSnap: Please capture an image first.");
            return;
          }
          vscode4.window.showInformationMessage(`\u{1F4F8} Asset saved: ${import_node_path7.default.basename(message.filePath)}`);
          break;
        }
      }
    });
  }
  static getHtmlForWebview() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADBSnap Studio</title>
  <style>
    :root {
      --bg-dark: #0f111a;
      --panel-bg: #161925;
      --card-bg: #1e2235;
      --border-color: #2b3049;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --cyan: #06b6d4;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      background: var(--bg-dark);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    /* Controls Panel */
    .controls {
      width: 360px;
      min-width: 340px;
      background: var(--panel-bg);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .controls-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .controls-header h2 {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #a5b4fc, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
    }
    .controls-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }
    input[type="text"], select {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      color: var(--text);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus, select:focus {
      border-color: var(--accent);
    }
    /* Theme Swatches */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .theme-btn {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-size: 12px;
      transition: all 0.2s;
    }
    .theme-btn.active {
      border-color: var(--accent);
      background: #282e47;
    }
    .swatch {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    /* Frame Buttons */
    .frame-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .frame-btn {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 10px;
      border-radius: 8px;
      color: var(--text);
      font-size: 11px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .frame-btn.active {
      border-color: var(--cyan);
      background: #182e3f;
      color: #38bdf8;
    }
    /* Action Buttons */
    .actions-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn {
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--cyan));
      color: #fff;
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--card-bg);
      color: var(--text);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover {
      background: #252b42;
    }
    /* Canvas / Preview Stage */
    .canvas-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      background: radial-gradient(circle at center, #1b2033 0%, #0d0f17 100%);
      position: relative;
      overflow: hidden;
    }
    .preview-container {
      max-height: 85vh;
      max-width: 90%;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }
    .preview-container img {
      max-height: 82vh;
      max-width: 100%;
      display: block;
      object-fit: contain;
    }
    .placeholder-box {
      border: 2px dashed #333a56;
      border-radius: 16px;
      padding: 60px 40px;
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .placeholder-box svg {
      width: 48px;
      height: 48px;
      stroke: #475569;
    }
    /* Spinner */
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <!-- Controls Sidebar -->
  <div class="controls">
    <div class="controls-header">
      <h2>\u{1F4F8} ADBSnap Studio</h2>
      <span class="badge" id="deviceBadge">Scanning...</span>
    </div>

    <div class="controls-body">
      <!-- Device Bezel Frame -->
      <div class="form-group">
        <label>Device Frame</label>
        <div class="frame-grid">
          <div class="frame-btn active" data-frame="iphone-16-pro">iPhone 16 Pro</div>
          <div class="frame-btn" data-frame="pixel-9-pro">Pixel 9 Pro</div>
          <div class="frame-btn" data-frame="minimal">Minimalist</div>
        </div>
      </div>

      <!-- Theme Preset -->
      <div class="form-group">
        <label>Backdrop Gradient</label>
        <div class="theme-grid">
          <div class="theme-btn active" data-theme="aurora">
            <span class="swatch" style="background: linear-gradient(135deg, #4f46e5, #06b6d4);"></span> Aurora
          </div>
          <div class="theme-btn" data-theme="studioLight">
            <span class="swatch" style="background: linear-gradient(135deg, #f8f9fa, #cbd5e1);"></span> Studio Light
          </div>
          <div class="theme-btn" data-theme="midnight">
            <span class="swatch" style="background: linear-gradient(135deg, #090d16, #1e293b);"></span> Midnight
          </div>
          <div class="theme-btn" data-theme="sunset">
            <span class="swatch" style="background: linear-gradient(135deg, #e11d48, #f59e0b);"></span> Sunset
          </div>
          <div class="theme-btn" data-theme="freshMint">
            <span class="swatch" style="background: linear-gradient(135deg, #059669, #10b981);"></span> Fresh Mint
          </div>
          <div class="theme-btn" data-theme="royal">
            <span class="swatch" style="background: linear-gradient(135deg, #4338ca, #3b82f6);"></span> Royal
          </div>
        </div>
      </div>

      <!-- Headlines -->
      <div class="form-group">
        <label>Showcase Headline</label>
        <input type="text" id="headlineInput" placeholder="e.g. Master Your Daily Routine" value="" />
      </div>

      <div class="form-group">
        <label>Subtitle</label>
        <input type="text" id="subtitleInput" placeholder="e.g. Simple. Fast. Beautiful." value="" />
      </div>
    </div>

    <!-- Actions -->
    <div class="actions-footer">
      <button class="btn btn-primary" id="captureBtn">
        <span class="spinner" id="btnSpinner"></span>
        <span id="btnText">\u{1F4F8} Capture Live Device</span>
      </button>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button class="btn btn-secondary" id="copyBtn">\u{1F4CB} Copy</button>
        <button class="btn btn-secondary" id="saveBtn">\u{1F4BE} Save Asset</button>
      </div>
    </div>
  </div>

  <!-- Stage / Canvas -->
  <div class="canvas-stage">
    <div class="preview-container" id="previewContainer">
      <div class="placeholder-box" id="placeholder">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <div>
          <h3 style="font-size: 15px; margin-bottom: 6px; color: #cbd5e1;">Live Showcase Preview</h3>
          <p style="font-size: 13px;">Click <b>Capture Live Device</b> to pull your screen buffer into 4K vectors.</p>
        </div>
      </div>
      <img id="previewImage" style="display: none;" alt="Showcase Preview" />
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentFrame = 'iphone-16-pro';
    let currentTheme = 'aurora';
    let lastSavedPath = null;

    // Elements
    const deviceBadge = document.getElementById('deviceBadge');
    const headlineInput = document.getElementById('headlineInput');
    const subtitleInput = document.getElementById('subtitleInput');
    const captureBtn = document.getElementById('captureBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const previewContainer = document.getElementById('previewContainer');
    const placeholder = document.getElementById('placeholder');
    const previewImage = document.getElementById('previewImage');

    // Init
    vscode.postMessage({ command: 'init' });

    // Frame selection
    document.querySelectorAll('.frame-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFrame = btn.dataset.frame;
      });
    });

    // Theme selection
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
      });
    });

    // Trigger Capture
    captureBtn.addEventListener('click', () => {
      vscode.postMessage({
        command: 'capture',
        frame: currentFrame,
        theme: currentTheme,
        title: headlineInput.value.trim(),
        subtitle: subtitleInput.value.trim()
      });
    });

    // Copy
    copyBtn.addEventListener('click', () => {
      if (lastSavedPath) {
        vscode.postMessage({ command: 'copyToClipboard', filePath: lastSavedPath });
      } else {
        alert('Please capture a graphic first!');
      }
    });

    // Save
    saveBtn.addEventListener('click', () => {
      if (lastSavedPath) {
        vscode.postMessage({ command: 'saveAsset', filePath: lastSavedPath });
      } else {
        alert('Please capture a graphic first!');
      }
    });

    // Incoming messages
    window.addEventListener('message', event => {
      const msg = event.data;

      switch (msg.type) {
        case 'state':
          if (msg.devices && msg.devices.length > 0) {
            const active = msg.devices.find(d => d.id === msg.activeDeviceId) || msg.devices[0];
            deviceBadge.textContent = active.model + ' (' + active.type.toUpperCase() + ')';
            deviceBadge.style.color = '#38bdf8';
          } else {
            deviceBadge.textContent = 'No Device';
            deviceBadge.style.color = '#f87171';
          }
          break;

        case 'busy':
          if (msg.isBusy) {
            btnSpinner.style.display = 'inline-block';
            btnText.textContent = msg.message || 'Processing...';
            captureBtn.disabled = true;
          } else {
            btnSpinner.style.display = 'none';
            btnText.textContent = '\u{1F4F8} Capture Live Device';
            captureBtn.disabled = false;
          }
          break;

        case 'previewImage':
          placeholder.style.display = 'none';
          previewImage.style.display = 'block';
          previewImage.src = msg.dataUrl;
          lastSavedPath = msg.filePath;
          break;

        case 'captureError':
          btnSpinner.style.display = 'none';
          btnText.textContent = '\u{1F4F8} Capture Live Device';
          captureBtn.disabled = false;
          break;
      }
    });
  </script>
</body>
</html>`;
  }
};

// vscode/src/extension.ts
var statusBarManager;
var outputChannel;
var devicesProvider;
var capturesProvider;
function activate(context) {
  outputChannel = vscode5.window.createOutputChannel("ADBSnap");
  statusBarManager = new AdbStatusBarManager();
  context.subscriptions.push(statusBarManager, outputChannel);
  const config = vscode5.workspace.getConfiguration("adbsnap");
  const customAdb = config.get("customAdbPath");
  if (customAdb && customAdb.trim().length > 0) {
    process.env.ADB_PATH = customAdb.trim();
  }
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snap", async () => {
      await handleSnapCommand(context, { copyToClipboard: false });
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snapClipboard", async () => {
      await handleSnapCommand(context, { copyToClipboard: true });
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snapRaw", async () => {
      await handleSnapRawCommand(context);
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.devices", async () => {
      await handleSelectDeviceCommand();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.wifi", async () => {
      await handleWifiCommand();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.disconnectWifi", async (item) => {
      await handleDisconnectWifiCommand(item);
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.doctor", async () => {
      await handleDoctorCommand(context);
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.export", async () => {
      await handleExportCommand(context);
    })
  );
  devicesProvider = new DevicesTreeDataProvider(statusBarManager);
  capturesProvider = new CapturesTreeDataProvider(() => resolveOutputDir());
  context.subscriptions.push(
    vscode5.window.registerTreeDataProvider("adbsnap.devicesView", devicesProvider),
    vscode5.window.registerTreeDataProvider("adbsnap.recentCapturesView", capturesProvider)
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.openStudio", () => {
      StudioWebviewManager.createOrShow(
        context,
        statusBarManager,
        resolveOutputDir,
        () => capturesProvider.refresh()
      );
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.refreshDevices", async () => {
      await statusBarManager.refresh();
      devicesProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.refreshCaptures", () => {
      capturesProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.setActiveDeviceFromTree", (device) => {
      if (device) {
        statusBarManager.setActiveDevice(device);
        devicesProvider.refresh();
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.snapDeviceFromTree", async (item) => {
      if (item && item.device) {
        statusBarManager.setActiveDevice(item.device);
        devicesProvider.refresh();
        await handleSnapCommand(context, { copyToClipboard: false });
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.revealCapture", (item) => {
      if (item && item.filePath) {
        vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(item.filePath));
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.copyCapture", async (item) => {
      if (item && item.filePath) {
        try {
          const buf = await import_promises4.default.readFile(item.filePath);
          await copyImageBufferToClipboard(buf);
          vscode5.window.showInformationMessage(`\u{1F4F8} Copied ${item.fileName} to clipboard!`);
        } catch (err) {
          vscode5.window.showErrorMessage(`Failed to copy: ${err.message || err}`);
        }
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("adbsnap.deleteCapture", async (item) => {
      if (item && item.filePath) {
        const confirm = await vscode5.window.showWarningMessage(
          `Delete "${item.fileName}"?`,
          { modal: true },
          "Delete"
        );
        if (confirm === "Delete") {
          try {
            await import_promises4.default.rm(item.filePath, { recursive: true, force: true });
            capturesProvider.refresh();
            vscode5.window.showInformationMessage(`Deleted ${item.fileName}`);
          } catch (err) {
            vscode5.window.showErrorMessage(`Failed to delete: ${err.message || err}`);
          }
        }
      }
    })
  );
}
function deactivate() {
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}
function resolveOutputDir() {
  const config = vscode5.workspace.getConfiguration("adbsnap");
  let outDir = config.get("outputDirectory") || "${workspaceFolder}/output";
  const workspaceFolders = vscode5.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    outDir = outDir.replace("${workspaceFolder}", workspaceFolders[0].uri.fsPath);
  } else if (outDir.includes("${workspaceFolder}")) {
    const os4 = require("node:os");
    const desktopPath = import_node_path8.default.join(os4.homedir(), "Desktop");
    const fallbackRoot = import_promises4.default.stat(desktopPath).then(() => desktopPath).catch(() => os4.homedir());
    const home = os4.homedir();
    const desktop = import_node_path8.default.join(home, "Desktop");
    let baseDir;
    try {
      require("node:fs").accessSync(desktop);
      baseDir = desktop;
    } catch {
      baseDir = home;
    }
    outDir = import_node_path8.default.join(baseDir, "ADBSnap");
  }
  return import_node_path8.default.resolve(outDir);
}
async function handleSnapCommand(context, options) {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode5.window.showWarningMessage("ADBSnap: No connected ADB device found. Please attach a device or emulator.");
    return;
  }
  if (!device.isAuthorized) {
    vscode5.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return;
  }
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: options.copyToClipboard ? "ADBSnap: Snapping to Clipboard..." : "ADBSnap: Capturing & Framing...",
      cancellable: false
    },
    async () => {
      try {
        const config = vscode5.workspace.getConfiguration("adbsnap");
        const theme = config.get("defaultTheme") || "aurora";
        const frame = config.get("defaultFrame") || "iphone-16-pro";
        const outDir = resolveOutputDir();
        await import_promises4.default.mkdir(outDir, { recursive: true });
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `adbsnap-${frame}-${theme}-${timestamp}.png`;
        const filePath = import_node_path8.default.join(outDir, fileName);
        const cliArgs = [
          "snap",
          "--frame",
          frame,
          "--theme",
          theme,
          "--device",
          device.id,
          "--out",
          filePath
        ];
        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 3e4);
        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || "Unknown CLI error";
          throw new Error(errorMsg.trim());
        }
        if (options.copyToClipboard) {
          const imgBuffer = await import_promises4.default.readFile(filePath);
          await copyImageBufferToClipboard(Buffer.from(imgBuffer));
          vscode5.window.showInformationMessage("\u{1F4F8} ADBSnap: Framed screenshot copied to clipboard!");
        }
        if (capturesProvider) {
          capturesProvider.refresh();
        }
        const action = await vscode5.window.showInformationMessage(
          `\u{1F4F8} Saved screenshot to ${fileName}`,
          "Open Image",
          "Reveal in Explorer"
        );
        if (action === "Open Image") {
          await vscode5.commands.executeCommand("vscode.open", vscode5.Uri.file(filePath));
        } else if (action === "Reveal in Explorer") {
          await vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(filePath));
        }
        await checkAndPromptReview(context);
      } catch (err) {
        vscode5.window.showErrorMessage(`ADBSnap Capture Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleSnapRawCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device || !device.isAuthorized) {
    vscode5.window.showWarningMessage("ADBSnap: No authorized device found.");
    return;
  }
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: "ADBSnap: Capturing Raw Screen...",
      cancellable: false
    },
    async () => {
      try {
        const outDir = resolveOutputDir();
        await import_promises4.default.mkdir(outDir, { recursive: true });
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const fileName = `raw-snap-${timestamp}.png`;
        const filePath = import_node_path8.default.join(outDir, fileName);
        const cliArgs = [
          "snap",
          "--raw",
          "--device",
          device.id,
          "--out",
          filePath
        ];
        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 15e3);
        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || "Unknown CLI error";
          throw new Error(errorMsg.trim());
        }
        if (capturesProvider) {
          capturesProvider.refresh();
        }
        const action = await vscode5.window.showInformationMessage(
          `\u{1F4F8} Saved raw screen to ${fileName}`,
          "Open Image",
          "Reveal in Explorer"
        );
        if (action === "Open Image") {
          await vscode5.commands.executeCommand("vscode.open", vscode5.Uri.file(filePath));
        } else if (action === "Reveal in Explorer") {
          await vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(filePath));
        }
        await checkAndPromptReview(context);
      } catch (err) {
        vscode5.window.showErrorMessage(`ADBSnap Raw Capture Failed: ${err.message || err}`);
      }
    }
  );
}
async function checkAndPromptReview(context) {
  const HAS_RATED_KEY = "adbsnap.hasRatedOrDismissed";
  const SNAP_COUNT_KEY = "adbsnap.successfulSnapCount";
  if (context.globalState.get(HAS_RATED_KEY)) {
    return;
  }
  const currentCount = (context.globalState.get(SNAP_COUNT_KEY) || 0) + 1;
  await context.globalState.update(SNAP_COUNT_KEY, currentCount);
  if (currentCount === 5) {
    const response = await vscode5.window.showInformationMessage(
      "\u2B50 Enjoying ADBSnap? Leaving a 5-star review on the Marketplace helps support open-source development!",
      "Leave a Review",
      "Maybe Later",
      "Don't Ask Again"
    );
    if (response === "Leave a Review") {
      await context.globalState.update(HAS_RATED_KEY, true);
      vscode5.env.openExternal(
        vscode5.Uri.parse("https://marketplace.visualstudio.com/items?itemName=shriramsingh.adbsnap&ssr=false#review-details")
      );
    } else if (response === "Don't Ask Again") {
      await context.globalState.update(HAS_RATED_KEY, true);
    }
  }
}
async function handleSelectDeviceCommand() {
  const devices = await statusBarManager.refresh();
  const items = [];
  if (devices.length > 0) {
    const active = statusBarManager.getActiveDevice();
    for (const d of devices) {
      const isCurrent = active?.id === d.id;
      const typeLabel = d.platform === "ios" ? d.type === "emulator" ? "iOS Simulator" : `iOS ${d.type === "wifi" ? "Wi-Fi" : "Device"}` : d.type === "wifi" ? "Wi-Fi" : d.type === "emulator" ? "Emulator" : "USB";
      const statusIcon = d.isAuthorized ? "$(check)" : "$(alert)";
      items.push({
        label: `${statusIcon} ${d.model} (${typeLabel}) ${isCurrent ? "\u2022 Active" : ""}`,
        description: d.id,
        detail: d.isAuthorized ? `Status: Ready (${d.product})` : d.platform === "ios" ? "Status: Not paired - unlock the device and trust this Mac" : "Status: Unauthorized - approve USB debugging on device",
        device: d
      });
    }
  } else {
    items.push({
      label: "$(warning) No devices detected",
      description: "Connect an Android device or pair an iOS device with this Mac"
    });
  }
  items.push({ label: "", kind: vscode5.QuickPickItemKind.Separator });
  items.push({
    label: "$(refresh) Refresh Connected Devices",
    description: "Re-scan USB and Wi-Fi ADB devices",
    action: "refresh"
  });
  items.push({
    label: "$(radio-tower) Switch USB Device to Wireless (WiFi)",
    description: "Set up wireless debugging over local network",
    action: "wifi"
  });
  items.push({
    label: "$(plug) Turn Off Wi-Fi Mode (Revert to USB)",
    description: "Disconnect wireless ADB and reset device connection to USB",
    action: "disconnectWifi"
  });
  const selected = await vscode5.window.showQuickPick(items, {
    placeHolder: "Select active Android device or action"
  });
  if (!selected) return;
  if (selected.action === "refresh") {
    await statusBarManager.refresh();
    vscode5.window.showInformationMessage("ADBSnap: Device list refreshed.");
  } else if (selected.action === "wifi") {
    await handleWifiCommand();
  } else if (selected.action === "disconnectWifi") {
    await handleDisconnectWifiCommand();
  } else if (selected.device) {
    statusBarManager.setActiveDevice(selected.device);
    vscode5.window.showInformationMessage(`ADBSnap: Active device set to "${selected.device.model}".`);
  }
}
async function handleWifiCommand() {
  const devices = await listAllDevices();
  const usbDevices = devices.filter((d) => d.platform === "android" && d.type === "usb" && d.isAuthorized);
  if (usbDevices.length === 0) {
    vscode5.window.showWarningMessage("ADBSnap: No authorized USB device found. Please connect your phone via USB first to enable wireless mode.");
    return;
  }
  let targetId = usbDevices[0].id;
  if (usbDevices.length > 1) {
    const picked = await vscode5.window.showQuickPick(
      usbDevices.map((d) => ({ label: d.model, description: d.id })),
      { placeHolder: "Select USB device to switch to Wireless" }
    );
    if (!picked) return;
    targetId = picked.description;
  }
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: "ADBSnap: Switching device to Wireless ADB...",
      cancellable: false
    },
    async () => {
      try {
        const address = await androidDriver.enableWireless(targetId);
        await statusBarManager.refresh();
        if (devicesProvider) {
          devicesProvider.refresh();
        }
        vscode5.window.showInformationMessage(`\u{1F389} ADBSnap: Connected wirelessly to ${address}! You can now disconnect the USB cable.`);
      } catch (err) {
        vscode5.window.showErrorMessage(`Wireless Setup Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleDisconnectWifiCommand(targetDevice) {
  const dev = targetDevice && "device" in targetDevice ? targetDevice.device : targetDevice;
  const deviceId = dev?.id || statusBarManager.getActiveDevice()?.id;
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: "ADBSnap: Reverting ADB to USB mode...",
      cancellable: false
    },
    async () => {
      try {
        if (androidDriver.disableWireless) {
          await androidDriver.disableWireless(deviceId);
        }
        await statusBarManager.refresh();
        if (devicesProvider) {
          devicesProvider.refresh();
        }
        vscode5.window.showInformationMessage("\u{1F50C} ADBSnap: Wi-Fi mode turned off. Switched back to USB mode.");
      } catch (err) {
        vscode5.window.showErrorMessage(`Disconnect Wi-Fi Failed: ${err.message || err}`);
      }
    }
  );
}
async function handleDoctorCommand(context) {
  outputChannel.clear();
  outputChannel.show(true);
  outputChannel.appendLine("========================================");
  outputChannel.appendLine("  \u{1FA7A} ADBSnap Environment Doctor");
  outputChannel.appendLine("========================================");
  outputChannel.appendLine(`\u2022 Node Version : ${process.version}`);
  outputChannel.appendLine(`\u2022 Platform     : ${process.platform} (${process.arch})`);
  let adbPath = "adb";
  try {
    adbPath = resolveAdbPath();
    outputChannel.appendLine(`\u2022 ADB Path     : ${adbPath}`);
  } catch (err) {
    outputChannel.appendLine(`\u2022 ADB Path     : FAILED (${err.message})`);
  }
  const cliLabel = getCliRunnerLabel(context.extensionPath);
  outputChannel.appendLine(`\u2022 CLI Runner   : ${cliLabel}`);
  outputChannel.appendLine("\n--- Connected Devices ---");
  try {
    const devices = await listAllDevices();
    if (devices.length === 0) {
      outputChannel.appendLine("No attached mobile devices detected.");
    } else {
      devices.forEach((d, index) => {
        outputChannel.appendLine(
          `[${index + 1}] [${d.type.toUpperCase()}] ${d.model} (${d.id}) -> ${d.isAuthorized ? "READY" : "UNAUTHORIZED"}`
        );
      });
    }
  } catch (err) {
    outputChannel.appendLine(`Device scan failed: ${err.message}`);
  }
  outputChannel.appendLine("========================================\n");
}
async function handleExportCommand(context) {
  const device = statusBarManager.getActiveDevice();
  if (!device) {
    vscode5.window.showWarningMessage("ADBSnap: No connected ADB device found. Please attach a device or emulator.");
    return;
  }
  if (!device.isAuthorized) {
    vscode5.window.showErrorMessage(`ADBSnap: Device "${device.model}" is unauthorized. Please accept the USB debugging prompt on the device.`);
    return;
  }
  const storePick = await vscode5.window.showQuickPick(
    [
      { label: "$(package) All Stores (App Store + Google Play)", description: '4 sizes: 6.9", 6.7", 6.5" + Play Store', value: "all" },
      { label: "$(device-mobile) Apple App Store Only", description: '3 sizes: 6.9", 6.7", 6.5"', value: "apple" },
      { label: "$(rocket) Google Play Store Only", description: "1 size: Play Store standard", value: "google" }
    ],
    { placeHolder: "Select store targets for export" }
  );
  if (!storePick) return;
  const title = await vscode5.window.showInputBox({
    prompt: "Headline text for the showcase (leave empty to skip)",
    placeHolder: "e.g. Track Your Daily Habits"
  });
  const subtitle = title ? await vscode5.window.showInputBox({
    prompt: "Subtitle text (leave empty to skip)",
    placeHolder: "e.g. Simple. Fast. Beautiful."
  }) : void 0;
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: `ADBSnap: Exporting ${storePick.value === "all" ? "All Stores" : storePick.value === "apple" ? "App Store" : "Play Store"} assets...`,
      cancellable: false
    },
    async () => {
      try {
        const config = vscode5.workspace.getConfiguration("adbsnap");
        const theme = config.get("defaultTheme") || "aurora";
        const frame = config.get("defaultFrame") || "iphone-16-pro";
        const outDir = resolveOutputDir();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const exportDir = import_node_path8.default.join(outDir, `export-${theme}-${timestamp}`);
        const cliArgs = [
          "export",
          "--frame",
          frame,
          "--theme",
          theme,
          "--store",
          storePick.value,
          "--device",
          device.id,
          "--out",
          exportDir,
          "--zip"
        ];
        if (title) {
          cliArgs.push("--title", title);
        }
        if (subtitle) {
          cliArgs.push("--subtitle", subtitle);
        }
        const result = await runAdbSnapCli(context.extensionPath, cliArgs, 6e4);
        if (result.exitCode !== 0) {
          const errorMsg = result.stderr || result.stdout || "Unknown CLI error";
          throw new Error(errorMsg.trim());
        }
        if (capturesProvider) {
          capturesProvider.refresh();
        }
        const action = await vscode5.window.showInformationMessage(
          `\u{1F4E6} Store asset pack exported to ${import_node_path8.default.basename(exportDir)}/`,
          "Reveal in Explorer"
        );
        if (action === "Reveal in Explorer") {
          await vscode5.commands.executeCommand("revealFileInOS", vscode5.Uri.file(exportDir));
        }
      } catch (err) {
        vscode5.window.showErrorMessage(`ADBSnap Export Failed: ${err.message || err}`);
      }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
/*! Bundled license information:

sharp/dist/is.mjs:
sharp/dist/libvips.mjs:
sharp/dist/sharp.mjs:
sharp/dist/constructor.mjs:
sharp/dist/input.mjs:
sharp/dist/resize.mjs:
sharp/dist/composite.mjs:
sharp/dist/operation.mjs:
sharp/dist/colour.mjs:
sharp/dist/channel.mjs:
sharp/dist/output.mjs:
sharp/dist/utility.mjs:
sharp/dist/index.mjs:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)
*/
//# sourceMappingURL=extension.js.map
