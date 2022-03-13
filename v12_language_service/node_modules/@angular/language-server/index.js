var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// dist/banner/cmdline_utils.js
var require_cmdline_utils = __commonJS({
  "dist/banner/cmdline_utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.generateHelpMessage = exports2.parseCommandLine = void 0;
    function findArgument(argv, argName) {
      const index = argv.indexOf(argName);
      if (index < 0 || index === argv.length - 1) {
        return;
      }
      return argv[index + 1];
    }
    function parseStringArray(argv, argName) {
      const arg = findArgument(argv, argName);
      if (!arg) {
        return [];
      }
      return arg.split(",");
    }
    function hasArgument(argv, argName) {
      return argv.includes(argName);
    }
    function parseCommandLine(argv) {
      return {
        help: hasArgument(argv, "--help"),
        ivy: !hasArgument(argv, "--viewEngine"),
        logFile: findArgument(argv, "--logFile"),
        logVerbosity: findArgument(argv, "--logVerbosity"),
        logToConsole: hasArgument(argv, "--logToConsole"),
        ngProbeLocations: parseStringArray(argv, "--ngProbeLocations"),
        tsProbeLocations: parseStringArray(argv, "--tsProbeLocations")
      };
    }
    exports2.parseCommandLine = parseCommandLine;
    function generateHelpMessage(argv) {
      return `Angular Language Service that implements the Language Server Protocol (LSP).

  Usage: ${argv[0]} ${argv[1]} [options]

  Options:
    --help: Prints help message.
    --viewEngine: Use legacy View Engine language service. Defaults to false.
    --logFile: Location to log messages. Logging to file is disabled if not provided.
    --logVerbosity: terse|normal|verbose|requestTime. See ts.server.LogLevel.
    --logToConsole: Enables logging to console via 'window/logMessage'. Defaults to false.
    --ngProbeLocations: Path of @angular/language-service. Required.
    --tsProbeLocations: Path of typescript. Required.

  Additional options supported by vscode-languageserver:
    --clientProcessId=<number>: Automatically kills the server if the client process dies.
    --node-ipc: Communicate using Node's IPC. This is the default.
    --stdio: Communicate over stdin/stdout.
    --socket=<number>: Communicate using Unix socket.
  `;
    }
    exports2.generateHelpMessage = generateHelpMessage;
  }
});

// dist/common/resolver.js
var require_resolver = __commonJS({
  "dist/common/resolver.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Version = exports2.resolve = void 0;
    var fs = require("fs");
    function resolve(packageName, location, rootPackage) {
      rootPackage = rootPackage || packageName;
      try {
        const packageJsonPath = require.resolve(`${rootPackage}/package.json`, {
          paths: [location]
        });
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        const resolvedPath = require.resolve(packageName, {
          paths: [location]
        });
        return {
          name: packageName,
          resolvedPath,
          version: new Version(packageJson.version)
        };
      } catch (_a) {
      }
    }
    exports2.resolve = resolve;
    var Version = class {
      constructor(versionStr) {
        this.versionStr = versionStr;
        const [major, minor, patch] = Version.parseVersionStr(versionStr);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
      }
      greaterThanOrEqual(other) {
        if (this.major < other.major) {
          return false;
        }
        if (this.major > other.major) {
          return true;
        }
        if (this.minor < other.minor) {
          return false;
        }
        if (this.minor > other.minor) {
          return true;
        }
        return this.patch >= other.patch;
      }
      toString() {
        return this.versionStr;
      }
      static parseVersionStr(versionStr) {
        const [major, minor, patch] = versionStr.split(".").map(parseNonNegativeInt);
        return [
          major === void 0 ? 0 : major,
          minor === void 0 ? 0 : minor,
          patch === void 0 ? 0 : patch
        ];
      }
    };
    exports2.Version = Version;
    function parseNonNegativeInt(a) {
      const i = parseInt(a, 10);
      return isNaN(i) ? -1 : i;
    }
  }
});

// dist/banner/version_provider.js
var require_version_provider = __commonJS({
  "dist/banner/version_provider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveNgcc = exports2.loadEsmModule = exports2.resolveNgLangSvc = exports2.resolveTsServer = void 0;
    var fs = require("fs");
    var path = require("path");
    var url = require("url");
    var resolver_1 = require_resolver();
    var MIN_TS_VERSION = "4.2";
    var MIN_NG_VERSION = "12.0";
    var TSSERVERLIB = "typescript/lib/tsserverlibrary";
    function resolveWithMinVersion(packageName, minVersionStr, probeLocations, rootPackage) {
      if (!packageName.startsWith(rootPackage)) {
        throw new Error(`${packageName} must be in the root package`);
      }
      const minVersion = new resolver_1.Version(minVersionStr);
      for (const location of probeLocations) {
        const nodeModule = resolver_1.resolve(packageName, location, rootPackage);
        if (nodeModule && nodeModule.version.greaterThanOrEqual(minVersion)) {
          return nodeModule;
        }
      }
      throw new Error(`Failed to resolve '${packageName}' with minimum version '${minVersion}' from ` + JSON.stringify(probeLocations, null, 2));
    }
    function resolveTsServer(probeLocations) {
      if (probeLocations.length > 0) {
        const resolvedFromTsdk = resolveTsServerFromTsdk(probeLocations[0]);
        if (resolvedFromTsdk !== void 0) {
          return resolvedFromTsdk;
        }
      }
      return resolveWithMinVersion(TSSERVERLIB, MIN_TS_VERSION, probeLocations, "typescript");
    }
    exports2.resolveTsServer = resolveTsServer;
    function resolveTsServerFromTsdk(tsdk) {
      if (!path.isAbsolute(tsdk)) {
        return void 0;
      }
      const tsserverlib = path.join(tsdk, "tsserverlibrary.js");
      if (!fs.existsSync(tsserverlib)) {
        return void 0;
      }
      const packageJson = path.resolve(tsserverlib, "../../package.json");
      if (!fs.existsSync(packageJson)) {
        return void 0;
      }
      try {
        const json = JSON.parse(fs.readFileSync(packageJson, "utf8"));
        return {
          name: TSSERVERLIB,
          resolvedPath: tsserverlib,
          version: new resolver_1.Version(json.version)
        };
      } catch (_a) {
        return void 0;
      }
    }
    function resolveNgLangSvc(probeLocations) {
      const ngls = "@angular/language-service";
      return resolveWithMinVersion(ngls, MIN_NG_VERSION, probeLocations, ngls);
    }
    exports2.resolveNgLangSvc = resolveNgLangSvc;
    function loadEsmModule(modulePath) {
      return new Function("modulePath", `return import(modulePath);`)(modulePath);
    }
    exports2.loadEsmModule = loadEsmModule;
    async function resolveNgcc(directory) {
      try {
        const ngcc = resolver_1.resolve("@angular/compiler-cli/ngcc", directory, "@angular/compiler-cli");
        if (ngcc === void 0) {
          throw new Error("Could not resolve ngcc");
        }
        const ngccModule = await loadEsmModule(url.pathToFileURL(ngcc.resolvedPath));
        const resolvedPath = ngccModule.ngccMainFilePath;
        if (resolvedPath === void 0) {
          throw new Error("Could not resolve ngcc path.");
        }
        return Object.assign(Object.assign({}, ngcc), { resolvedPath });
      } catch (e) {
        return resolver_1.resolve("@angular/compiler-cli/ngcc/main-ngcc.js", directory, "@angular/compiler-cli");
      }
    }
    exports2.resolveNgcc = resolveNgcc;
  }
});

// dist/banner/banner.js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOverride = void 0;
var cmdline_utils_1 = require_cmdline_utils();
var version_provider_1 = require_version_provider();
var originalRequire = require;
function requireOverride(moduleName) {
  const TSSERVER = "typescript/lib/tsserverlibrary";
  if (moduleName === "typescript") {
    throw new Error(`Import '${TSSERVER}' instead of 'typescript'`);
  }
  if (moduleName === TSSERVER) {
    const { tsProbeLocations } = cmdline_utils_1.parseCommandLine(process.argv);
    moduleName = version_provider_1.resolveTsServer(tsProbeLocations).resolvedPath;
  }
  return originalRequire(moduleName);
}
exports.requireOverride = requireOverride;
requireOverride.resolve = originalRequire.resolve;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
require = requireOverride;

var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// dist/server/cmdline_utils.js
var require_cmdline_utils = __commonJS({
  "dist/server/cmdline_utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.generateHelpMessage = exports2.parseCommandLine = void 0;
    function findArgument(argv, argName) {
      const index = argv.indexOf(argName);
      if (index < 0 || index === argv.length - 1) {
        return;
      }
      return argv[index + 1];
    }
    function parseStringArray(argv, argName) {
      const arg = findArgument(argv, argName);
      if (!arg) {
        return [];
      }
      return arg.split(",");
    }
    function hasArgument(argv, argName) {
      return argv.includes(argName);
    }
    function parseCommandLine(argv) {
      return {
        help: hasArgument(argv, "--help"),
        ivy: !hasArgument(argv, "--viewEngine"),
        logFile: findArgument(argv, "--logFile"),
        logVerbosity: findArgument(argv, "--logVerbosity"),
        logToConsole: hasArgument(argv, "--logToConsole"),
        ngProbeLocations: parseStringArray(argv, "--ngProbeLocations"),
        tsProbeLocations: parseStringArray(argv, "--tsProbeLocations")
      };
    }
    exports2.parseCommandLine = parseCommandLine;
    function generateHelpMessage(argv) {
      return `Angular Language Service that implements the Language Server Protocol (LSP).

  Usage: ${argv[0]} ${argv[1]} [options]

  Options:
    --help: Prints help message.
    --viewEngine: Use legacy View Engine language service. Defaults to false.
    --logFile: Location to log messages. Logging to file is disabled if not provided.
    --logVerbosity: terse|normal|verbose|requestTime. See ts.server.LogLevel.
    --logToConsole: Enables logging to console via 'window/logMessage'. Defaults to false.
    --ngProbeLocations: Path of @angular/language-service. Required.
    --tsProbeLocations: Path of typescript. Required.

  Additional options supported by vscode-languageserver:
    --clientProcessId=<number>: Automatically kills the server if the client process dies.
    --node-ipc: Communicate using Node's IPC. This is the default.
    --stdio: Communicate over stdin/stdout.
    --socket=<number>: Communicate using Unix socket.
  `;
    }
    exports2.generateHelpMessage = generateHelpMessage;
  }
});

// dist/server/logger.js
var require_logger = __commonJS({
  "dist/server/logger.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createLogger = void 0;
    var fs = require("fs");
    var path = require("path");
    var ts = require("typescript/lib/tsserverlibrary");
    function createLogger(options) {
      let logLevel;
      switch (options.logVerbosity) {
        case "requestTime":
          logLevel = ts.server.LogLevel.requestTime;
          break;
        case "verbose":
          logLevel = ts.server.LogLevel.verbose;
          break;
        case "normal":
          logLevel = ts.server.LogLevel.normal;
          break;
        case "terse":
        default:
          logLevel = ts.server.LogLevel.terse;
          break;
      }
      return new Logger(logLevel, options.logFile);
    }
    exports2.createLogger = createLogger;
    function noop(_) {
    }
    function nowString() {
      const d = new Date();
      return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
    }
    var Logger = class {
      constructor(level, logFilename) {
        this.level = level;
        this.logFilename = logFilename;
        this.seq = 0;
        this.inGroup = false;
        this.firstInGroup = true;
        this.fd = -1;
        if (logFilename) {
          try {
            const dir = path.dirname(logFilename);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir);
            }
            this.fd = fs.openSync(logFilename, "w");
          } catch (_a) {
          }
        }
      }
      close() {
        if (this.loggingEnabled()) {
          fs.close(this.fd, noop);
        }
      }
      getLogFileName() {
        return this.logFilename;
      }
      perftrc(s) {
        this.msg(s, ts.server.Msg.Perf);
      }
      info(s) {
        this.msg(s, ts.server.Msg.Info);
      }
      startGroup() {
        this.inGroup = true;
        this.firstInGroup = true;
      }
      endGroup() {
        this.inGroup = false;
      }
      loggingEnabled() {
        return this.fd >= 0;
      }
      hasLevel(level) {
        return this.loggingEnabled() && this.level >= level;
      }
      msg(s, type = ts.server.Msg.Err) {
        if (!this.loggingEnabled()) {
          return;
        }
        let prefix = "";
        if (!this.inGroup || this.firstInGroup) {
          this.firstInGroup = false;
          prefix = `${type} ${this.seq}`.padEnd(10) + `[${nowString()}] `;
        }
        const entry = prefix + s + "\n";
        fs.writeSync(this.fd, entry);
        if (!this.inGroup) {
          this.seq++;
        }
      }
    };
  }
});

// dist/server/server_host.js
var require_server_host = __commonJS({
  "dist/server/server_host.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ServerHost = void 0;
    var ts = require("typescript/lib/tsserverlibrary");
    var NOOP_WATCHER = {
      close() {
      }
    };
    var ServerHost = class {
      constructor(isG3) {
        this.isG3 = isG3;
        this.args = ts.sys.args;
        this.newLine = ts.sys.newLine;
        this.useCaseSensitiveFileNames = ts.sys.useCaseSensitiveFileNames;
      }
      write(s) {
        ts.sys.write(s);
      }
      writeOutputIsTTY() {
        return ts.sys.writeOutputIsTTY();
      }
      readFile(path, encoding) {
        return ts.sys.readFile(path, encoding);
      }
      getFileSize(path) {
        return ts.sys.getFileSize(path);
      }
      writeFile(path, data, writeByteOrderMark) {
        return ts.sys.writeFile(path, data, writeByteOrderMark);
      }
      watchFile(path, callback, pollingInterval, options) {
        return ts.sys.watchFile(path, callback, pollingInterval, options);
      }
      watchDirectory(path, callback, recursive, options) {
        if (this.isG3 && path.startsWith("/google/src")) {
          return NOOP_WATCHER;
        }
        return ts.sys.watchDirectory(path, callback, recursive, options);
      }
      resolvePath(path) {
        return ts.sys.resolvePath(path);
      }
      fileExists(path) {
        if (path.endsWith(".ngtypecheck.ts")) {
          return true;
        }
        return ts.sys.fileExists(path);
      }
      directoryExists(path) {
        return ts.sys.directoryExists(path);
      }
      createDirectory(path) {
        return ts.sys.createDirectory(path);
      }
      getExecutingFilePath() {
        return ts.sys.getExecutingFilePath();
      }
      getCurrentDirectory() {
        return ts.sys.getCurrentDirectory();
      }
      getDirectories(path) {
        return ts.sys.getDirectories(path);
      }
      readDirectory(path, extensions, exclude, include, depth) {
        return ts.sys.readDirectory(path, extensions, exclude, include, depth);
      }
      getModifiedTime(path) {
        return ts.sys.getModifiedTime(path);
      }
      setModifiedTime(path, time) {
        return ts.sys.setModifiedTime(path, time);
      }
      deleteFile(path) {
        return ts.sys.deleteFile(path);
      }
      createHash(data) {
        return ts.sys.createHash(data);
      }
      createSHA256Hash(data) {
        return ts.sys.createSHA256Hash(data);
      }
      getMemoryUsage() {
        return ts.sys.getMemoryUsage();
      }
      exit(exitCode) {
        return ts.sys.exit(exitCode);
      }
      realpath(path) {
        return ts.sys.realpath(path);
      }
      setTimeout(callback, ms, ...args) {
        return ts.sys.setTimeout(callback, ms, ...args);
      }
      clearTimeout(timeoutId) {
        return ts.sys.clearTimeout(timeoutId);
      }
      clearScreen() {
        return ts.sys.clearScreen();
      }
      base64decode(input) {
        return ts.sys.base64decode(input);
      }
      base64encode(input) {
        return ts.sys.base64encode(input);
      }
      setImmediate(callback, ...args) {
        return setImmediate(callback, ...args);
      }
      clearImmediate(timeoutId) {
        return clearImmediate(timeoutId);
      }
      require(initialPath, moduleName) {
        if (moduleName !== "@angular/language-service") {
          return {
            module: void 0,
            error: new Error(`Angular server will not load plugin '${moduleName}'.`)
          };
        }
        try {
          const modulePath = require.resolve(moduleName, {
            paths: [initialPath]
          });
          return {
            module: require(modulePath),
            error: void 0
          };
        } catch (e) {
          return {
            module: void 0,
            error: e
          };
        }
      }
    };
    exports2.ServerHost = ServerHost;
  }
});

// node_modules/@angular/language-service/api.js
var require_api = __commonJS({
  "node_modules/@angular/language-service/api.js"(exports2, module2) {
    (function(factory) {
      if (typeof module2 === "object" && typeof module2.exports === "object") {
        var v = factory(require, exports2);
        if (v !== void 0)
          module2.exports = v;
      } else if (typeof define === "function" && define.amd) {
        define("@angular/language-service/api", ["require", "exports"], factory);
      }
    })(function(require2, exports3) {
      "use strict";
      Object.defineProperty(exports3, "__esModule", { value: true });
      exports3.isNgLanguageService = void 0;
      function isNgLanguageService(ls) {
        return "getTcb" in ls;
      }
      exports3.isNgLanguageService = isNgLanguageService;
    });
  }
});

// dist/common/notifications.js
var require_notifications = __commonJS({
  "dist/common/notifications.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SuggestStrictMode = exports2.ProjectLanguageService = exports2.ProjectLoadingFinish = exports2.ProjectLoadingStart = void 0;
    var vscode_jsonrpc_1 = require("vscode-jsonrpc");
    exports2.ProjectLoadingStart = new vscode_jsonrpc_1.NotificationType0("angular/projectLoadingStart");
    exports2.ProjectLoadingFinish = new vscode_jsonrpc_1.NotificationType0("angular/projectLoadingFinish");
    exports2.ProjectLanguageService = new vscode_jsonrpc_1.NotificationType("angular/projectLanguageService");
    exports2.SuggestStrictMode = new vscode_jsonrpc_1.NotificationType("angular/suggestStrictMode");
  }
});

// dist/common/progress.js
var require_progress = __commonJS({
  "dist/common/progress.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NgccProgressType = exports2.NgccProgressToken = void 0;
    var vscode_jsonrpc_1 = require("vscode-jsonrpc");
    exports2.NgccProgressToken = "ngcc";
    exports2.NgccProgressType = new vscode_jsonrpc_1.ProgressType();
  }
});

// node_modules/vscode-languageserver-types/lib/umd/main.js
var require_main = __commonJS({
  "node_modules/vscode-languageserver-types/lib/umd/main.js"(exports2, module2) {
    (function(factory) {
      if (typeof module2 === "object" && typeof module2.exports === "object") {
        var v = factory(require, exports2);
        if (v !== void 0)
          module2.exports = v;
      } else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
      }
    })(function(require2, exports3) {
      "use strict";
      Object.defineProperty(exports3, "__esModule", { value: true });
      exports3.TextDocument = exports3.EOL = exports3.SelectionRange = exports3.DocumentLink = exports3.FormattingOptions = exports3.CodeLens = exports3.CodeAction = exports3.CodeActionContext = exports3.CodeActionKind = exports3.DocumentSymbol = exports3.SymbolInformation = exports3.SymbolTag = exports3.SymbolKind = exports3.DocumentHighlight = exports3.DocumentHighlightKind = exports3.SignatureInformation = exports3.ParameterInformation = exports3.Hover = exports3.MarkedString = exports3.CompletionList = exports3.CompletionItem = exports3.InsertTextMode = exports3.InsertReplaceEdit = exports3.CompletionItemTag = exports3.InsertTextFormat = exports3.CompletionItemKind = exports3.MarkupContent = exports3.MarkupKind = exports3.TextDocumentItem = exports3.OptionalVersionedTextDocumentIdentifier = exports3.VersionedTextDocumentIdentifier = exports3.TextDocumentIdentifier = exports3.WorkspaceChange = exports3.WorkspaceEdit = exports3.DeleteFile = exports3.RenameFile = exports3.CreateFile = exports3.TextDocumentEdit = exports3.AnnotatedTextEdit = exports3.ChangeAnnotationIdentifier = exports3.ChangeAnnotation = exports3.TextEdit = exports3.Command = exports3.Diagnostic = exports3.CodeDescription = exports3.DiagnosticTag = exports3.DiagnosticSeverity = exports3.DiagnosticRelatedInformation = exports3.FoldingRange = exports3.FoldingRangeKind = exports3.ColorPresentation = exports3.ColorInformation = exports3.Color = exports3.LocationLink = exports3.Location = exports3.Range = exports3.Position = exports3.uinteger = exports3.integer = void 0;
      var integer;
      (function(integer2) {
        integer2.MIN_VALUE = -2147483648;
        integer2.MAX_VALUE = 2147483647;
      })(integer = exports3.integer || (exports3.integer = {}));
      var uinteger;
      (function(uinteger2) {
        uinteger2.MIN_VALUE = 0;
        uinteger2.MAX_VALUE = 2147483647;
      })(uinteger = exports3.uinteger || (exports3.uinteger = {}));
      var Position;
      (function(Position2) {
        function create(line, character) {
          if (line === Number.MAX_VALUE) {
            line = uinteger.MAX_VALUE;
          }
          if (character === Number.MAX_VALUE) {
            character = uinteger.MAX_VALUE;
          }
          return { line, character };
        }
        Position2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.uinteger(candidate.line) && Is.uinteger(candidate.character);
        }
        Position2.is = is;
      })(Position = exports3.Position || (exports3.Position = {}));
      var Range;
      (function(Range2) {
        function create(one, two, three, four) {
          if (Is.uinteger(one) && Is.uinteger(two) && Is.uinteger(three) && Is.uinteger(four)) {
            return { start: Position.create(one, two), end: Position.create(three, four) };
          } else if (Position.is(one) && Position.is(two)) {
            return { start: one, end: two };
          } else {
            throw new Error("Range#create called with invalid arguments[" + one + ", " + two + ", " + three + ", " + four + "]");
          }
        }
        Range2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Position.is(candidate.start) && Position.is(candidate.end);
        }
        Range2.is = is;
      })(Range = exports3.Range || (exports3.Range = {}));
      var Location;
      (function(Location2) {
        function create(uri, range) {
          return { uri, range };
        }
        Location2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
        }
        Location2.is = is;
      })(Location = exports3.Location || (exports3.Location = {}));
      var LocationLink;
      (function(LocationLink2) {
        function create(targetUri, targetRange, targetSelectionRange, originSelectionRange) {
          return { targetUri, targetRange, targetSelectionRange, originSelectionRange };
        }
        LocationLink2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.targetRange) && Is.string(candidate.targetUri) && (Range.is(candidate.targetSelectionRange) || Is.undefined(candidate.targetSelectionRange)) && (Range.is(candidate.originSelectionRange) || Is.undefined(candidate.originSelectionRange));
        }
        LocationLink2.is = is;
      })(LocationLink = exports3.LocationLink || (exports3.LocationLink = {}));
      var Color;
      (function(Color2) {
        function create(red, green, blue, alpha) {
          return {
            red,
            green,
            blue,
            alpha
          };
        }
        Color2.create = create;
        function is(value) {
          var candidate = value;
          return Is.numberRange(candidate.red, 0, 1) && Is.numberRange(candidate.green, 0, 1) && Is.numberRange(candidate.blue, 0, 1) && Is.numberRange(candidate.alpha, 0, 1);
        }
        Color2.is = is;
      })(Color = exports3.Color || (exports3.Color = {}));
      var ColorInformation;
      (function(ColorInformation2) {
        function create(range, color) {
          return {
            range,
            color
          };
        }
        ColorInformation2.create = create;
        function is(value) {
          var candidate = value;
          return Range.is(candidate.range) && Color.is(candidate.color);
        }
        ColorInformation2.is = is;
      })(ColorInformation = exports3.ColorInformation || (exports3.ColorInformation = {}));
      var ColorPresentation;
      (function(ColorPresentation2) {
        function create(label, textEdit, additionalTextEdits) {
          return {
            label,
            textEdit,
            additionalTextEdits
          };
        }
        ColorPresentation2.create = create;
        function is(value) {
          var candidate = value;
          return Is.string(candidate.label) && (Is.undefined(candidate.textEdit) || TextEdit.is(candidate)) && (Is.undefined(candidate.additionalTextEdits) || Is.typedArray(candidate.additionalTextEdits, TextEdit.is));
        }
        ColorPresentation2.is = is;
      })(ColorPresentation = exports3.ColorPresentation || (exports3.ColorPresentation = {}));
      var FoldingRangeKind;
      (function(FoldingRangeKind2) {
        FoldingRangeKind2["Comment"] = "comment";
        FoldingRangeKind2["Imports"] = "imports";
        FoldingRangeKind2["Region"] = "region";
      })(FoldingRangeKind = exports3.FoldingRangeKind || (exports3.FoldingRangeKind = {}));
      var FoldingRange;
      (function(FoldingRange2) {
        function create(startLine, endLine, startCharacter, endCharacter, kind) {
          var result = {
            startLine,
            endLine
          };
          if (Is.defined(startCharacter)) {
            result.startCharacter = startCharacter;
          }
          if (Is.defined(endCharacter)) {
            result.endCharacter = endCharacter;
          }
          if (Is.defined(kind)) {
            result.kind = kind;
          }
          return result;
        }
        FoldingRange2.create = create;
        function is(value) {
          var candidate = value;
          return Is.uinteger(candidate.startLine) && Is.uinteger(candidate.startLine) && (Is.undefined(candidate.startCharacter) || Is.uinteger(candidate.startCharacter)) && (Is.undefined(candidate.endCharacter) || Is.uinteger(candidate.endCharacter)) && (Is.undefined(candidate.kind) || Is.string(candidate.kind));
        }
        FoldingRange2.is = is;
      })(FoldingRange = exports3.FoldingRange || (exports3.FoldingRange = {}));
      var DiagnosticRelatedInformation;
      (function(DiagnosticRelatedInformation2) {
        function create(location, message) {
          return {
            location,
            message
          };
        }
        DiagnosticRelatedInformation2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
        }
        DiagnosticRelatedInformation2.is = is;
      })(DiagnosticRelatedInformation = exports3.DiagnosticRelatedInformation || (exports3.DiagnosticRelatedInformation = {}));
      var DiagnosticSeverity;
      (function(DiagnosticSeverity2) {
        DiagnosticSeverity2.Error = 1;
        DiagnosticSeverity2.Warning = 2;
        DiagnosticSeverity2.Information = 3;
        DiagnosticSeverity2.Hint = 4;
      })(DiagnosticSeverity = exports3.DiagnosticSeverity || (exports3.DiagnosticSeverity = {}));
      var DiagnosticTag;
      (function(DiagnosticTag2) {
        DiagnosticTag2.Unnecessary = 1;
        DiagnosticTag2.Deprecated = 2;
      })(DiagnosticTag = exports3.DiagnosticTag || (exports3.DiagnosticTag = {}));
      var CodeDescription;
      (function(CodeDescription2) {
        function is(value) {
          var candidate = value;
          return candidate !== void 0 && candidate !== null && Is.string(candidate.href);
        }
        CodeDescription2.is = is;
      })(CodeDescription = exports3.CodeDescription || (exports3.CodeDescription = {}));
      var Diagnostic;
      (function(Diagnostic2) {
        function create(range, message, severity, code, source, relatedInformation) {
          var result = { range, message };
          if (Is.defined(severity)) {
            result.severity = severity;
          }
          if (Is.defined(code)) {
            result.code = code;
          }
          if (Is.defined(source)) {
            result.source = source;
          }
          if (Is.defined(relatedInformation)) {
            result.relatedInformation = relatedInformation;
          }
          return result;
        }
        Diagnostic2.create = create;
        function is(value) {
          var _a;
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.range) && Is.string(candidate.message) && (Is.number(candidate.severity) || Is.undefined(candidate.severity)) && (Is.integer(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code)) && (Is.undefined(candidate.codeDescription) || Is.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)) && (Is.string(candidate.source) || Is.undefined(candidate.source)) && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
        }
        Diagnostic2.is = is;
      })(Diagnostic = exports3.Diagnostic || (exports3.Diagnostic = {}));
      var Command;
      (function(Command2) {
        function create(title, command) {
          var args = [];
          for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
          }
          var result = { title, command };
          if (Is.defined(args) && args.length > 0) {
            result.arguments = args;
          }
          return result;
        }
        Command2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.title) && Is.string(candidate.command);
        }
        Command2.is = is;
      })(Command = exports3.Command || (exports3.Command = {}));
      var TextEdit;
      (function(TextEdit2) {
        function replace(range, newText) {
          return { range, newText };
        }
        TextEdit2.replace = replace;
        function insert(position, newText) {
          return { range: { start: position, end: position }, newText };
        }
        TextEdit2.insert = insert;
        function del(range) {
          return { range, newText: "" };
        }
        TextEdit2.del = del;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.string(candidate.newText) && Range.is(candidate.range);
        }
        TextEdit2.is = is;
      })(TextEdit = exports3.TextEdit || (exports3.TextEdit = {}));
      var ChangeAnnotation;
      (function(ChangeAnnotation2) {
        function create(label, needsConfirmation, description) {
          var result = { label };
          if (needsConfirmation !== void 0) {
            result.needsConfirmation = needsConfirmation;
          }
          if (description !== void 0) {
            result.description = description;
          }
          return result;
        }
        ChangeAnnotation2.create = create;
        function is(value) {
          var candidate = value;
          return candidate !== void 0 && Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
        }
        ChangeAnnotation2.is = is;
      })(ChangeAnnotation = exports3.ChangeAnnotation || (exports3.ChangeAnnotation = {}));
      var ChangeAnnotationIdentifier;
      (function(ChangeAnnotationIdentifier2) {
        function is(value) {
          var candidate = value;
          return typeof candidate === "string";
        }
        ChangeAnnotationIdentifier2.is = is;
      })(ChangeAnnotationIdentifier = exports3.ChangeAnnotationIdentifier || (exports3.ChangeAnnotationIdentifier = {}));
      var AnnotatedTextEdit;
      (function(AnnotatedTextEdit2) {
        function replace(range, newText, annotation) {
          return { range, newText, annotationId: annotation };
        }
        AnnotatedTextEdit2.replace = replace;
        function insert(position, newText, annotation) {
          return { range: { start: position, end: position }, newText, annotationId: annotation };
        }
        AnnotatedTextEdit2.insert = insert;
        function del(range, annotation) {
          return { range, newText: "", annotationId: annotation };
        }
        AnnotatedTextEdit2.del = del;
        function is(value) {
          var candidate = value;
          return TextEdit.is(candidate) && (ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        AnnotatedTextEdit2.is = is;
      })(AnnotatedTextEdit = exports3.AnnotatedTextEdit || (exports3.AnnotatedTextEdit = {}));
      var TextDocumentEdit;
      (function(TextDocumentEdit2) {
        function create(textDocument, edits) {
          return { textDocument, edits };
        }
        TextDocumentEdit2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && OptionalVersionedTextDocumentIdentifier.is(candidate.textDocument) && Array.isArray(candidate.edits);
        }
        TextDocumentEdit2.is = is;
      })(TextDocumentEdit = exports3.TextDocumentEdit || (exports3.TextDocumentEdit = {}));
      var CreateFile;
      (function(CreateFile2) {
        function create(uri, options, annotation) {
          var result = {
            kind: "create",
            uri
          };
          if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
            result.options = options;
          }
          if (annotation !== void 0) {
            result.annotationId = annotation;
          }
          return result;
        }
        CreateFile2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && candidate.kind === "create" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        CreateFile2.is = is;
      })(CreateFile = exports3.CreateFile || (exports3.CreateFile = {}));
      var RenameFile;
      (function(RenameFile2) {
        function create(oldUri, newUri, options, annotation) {
          var result = {
            kind: "rename",
            oldUri,
            newUri
          };
          if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
            result.options = options;
          }
          if (annotation !== void 0) {
            result.annotationId = annotation;
          }
          return result;
        }
        RenameFile2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && candidate.kind === "rename" && Is.string(candidate.oldUri) && Is.string(candidate.newUri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        RenameFile2.is = is;
      })(RenameFile = exports3.RenameFile || (exports3.RenameFile = {}));
      var DeleteFile;
      (function(DeleteFile2) {
        function create(uri, options, annotation) {
          var result = {
            kind: "delete",
            uri
          };
          if (options !== void 0 && (options.recursive !== void 0 || options.ignoreIfNotExists !== void 0)) {
            result.options = options;
          }
          if (annotation !== void 0) {
            result.annotationId = annotation;
          }
          return result;
        }
        DeleteFile2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && candidate.kind === "delete" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.recursive === void 0 || Is.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === void 0 || Is.boolean(candidate.options.ignoreIfNotExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        DeleteFile2.is = is;
      })(DeleteFile = exports3.DeleteFile || (exports3.DeleteFile = {}));
      var WorkspaceEdit;
      (function(WorkspaceEdit2) {
        function is(value) {
          var candidate = value;
          return candidate && (candidate.changes !== void 0 || candidate.documentChanges !== void 0) && (candidate.documentChanges === void 0 || candidate.documentChanges.every(function(change) {
            if (Is.string(change.kind)) {
              return CreateFile.is(change) || RenameFile.is(change) || DeleteFile.is(change);
            } else {
              return TextDocumentEdit.is(change);
            }
          }));
        }
        WorkspaceEdit2.is = is;
      })(WorkspaceEdit = exports3.WorkspaceEdit || (exports3.WorkspaceEdit = {}));
      var TextEditChangeImpl = function() {
        function TextEditChangeImpl2(edits, changeAnnotations) {
          this.edits = edits;
          this.changeAnnotations = changeAnnotations;
        }
        TextEditChangeImpl2.prototype.insert = function(position, newText, annotation) {
          var edit;
          var id;
          if (annotation === void 0) {
            edit = TextEdit.insert(position, newText);
          } else if (ChangeAnnotationIdentifier.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit.insert(position, newText, annotation);
          } else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit.insert(position, newText, id);
          }
          this.edits.push(edit);
          if (id !== void 0) {
            return id;
          }
        };
        TextEditChangeImpl2.prototype.replace = function(range, newText, annotation) {
          var edit;
          var id;
          if (annotation === void 0) {
            edit = TextEdit.replace(range, newText);
          } else if (ChangeAnnotationIdentifier.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit.replace(range, newText, annotation);
          } else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit.replace(range, newText, id);
          }
          this.edits.push(edit);
          if (id !== void 0) {
            return id;
          }
        };
        TextEditChangeImpl2.prototype.delete = function(range, annotation) {
          var edit;
          var id;
          if (annotation === void 0) {
            edit = TextEdit.del(range);
          } else if (ChangeAnnotationIdentifier.is(annotation)) {
            id = annotation;
            edit = AnnotatedTextEdit.del(range, annotation);
          } else {
            this.assertChangeAnnotations(this.changeAnnotations);
            id = this.changeAnnotations.manage(annotation);
            edit = AnnotatedTextEdit.del(range, id);
          }
          this.edits.push(edit);
          if (id !== void 0) {
            return id;
          }
        };
        TextEditChangeImpl2.prototype.add = function(edit) {
          this.edits.push(edit);
        };
        TextEditChangeImpl2.prototype.all = function() {
          return this.edits;
        };
        TextEditChangeImpl2.prototype.clear = function() {
          this.edits.splice(0, this.edits.length);
        };
        TextEditChangeImpl2.prototype.assertChangeAnnotations = function(value) {
          if (value === void 0) {
            throw new Error("Text edit change is not configured to manage change annotations.");
          }
        };
        return TextEditChangeImpl2;
      }();
      var ChangeAnnotations = function() {
        function ChangeAnnotations2(annotations) {
          this._annotations = annotations === void 0 ? Object.create(null) : annotations;
          this._counter = 0;
          this._size = 0;
        }
        ChangeAnnotations2.prototype.all = function() {
          return this._annotations;
        };
        Object.defineProperty(ChangeAnnotations2.prototype, "size", {
          get: function() {
            return this._size;
          },
          enumerable: false,
          configurable: true
        });
        ChangeAnnotations2.prototype.manage = function(idOrAnnotation, annotation) {
          var id;
          if (ChangeAnnotationIdentifier.is(idOrAnnotation)) {
            id = idOrAnnotation;
          } else {
            id = this.nextId();
            annotation = idOrAnnotation;
          }
          if (this._annotations[id] !== void 0) {
            throw new Error("Id " + id + " is already in use.");
          }
          if (annotation === void 0) {
            throw new Error("No annotation provided for id " + id);
          }
          this._annotations[id] = annotation;
          this._size++;
          return id;
        };
        ChangeAnnotations2.prototype.nextId = function() {
          this._counter++;
          return this._counter.toString();
        };
        return ChangeAnnotations2;
      }();
      var WorkspaceChange = function() {
        function WorkspaceChange2(workspaceEdit) {
          var _this = this;
          this._textEditChanges = Object.create(null);
          if (workspaceEdit !== void 0) {
            this._workspaceEdit = workspaceEdit;
            if (workspaceEdit.documentChanges) {
              this._changeAnnotations = new ChangeAnnotations(workspaceEdit.changeAnnotations);
              workspaceEdit.changeAnnotations = this._changeAnnotations.all();
              workspaceEdit.documentChanges.forEach(function(change) {
                if (TextDocumentEdit.is(change)) {
                  var textEditChange = new TextEditChangeImpl(change.edits, _this._changeAnnotations);
                  _this._textEditChanges[change.textDocument.uri] = textEditChange;
                }
              });
            } else if (workspaceEdit.changes) {
              Object.keys(workspaceEdit.changes).forEach(function(key) {
                var textEditChange = new TextEditChangeImpl(workspaceEdit.changes[key]);
                _this._textEditChanges[key] = textEditChange;
              });
            }
          } else {
            this._workspaceEdit = {};
          }
        }
        Object.defineProperty(WorkspaceChange2.prototype, "edit", {
          get: function() {
            this.initDocumentChanges();
            if (this._changeAnnotations !== void 0) {
              if (this._changeAnnotations.size === 0) {
                this._workspaceEdit.changeAnnotations = void 0;
              } else {
                this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
              }
            }
            return this._workspaceEdit;
          },
          enumerable: false,
          configurable: true
        });
        WorkspaceChange2.prototype.getTextEditChange = function(key) {
          if (OptionalVersionedTextDocumentIdentifier.is(key)) {
            this.initDocumentChanges();
            if (this._workspaceEdit.documentChanges === void 0) {
              throw new Error("Workspace edit is not configured for document changes.");
            }
            var textDocument = { uri: key.uri, version: key.version };
            var result = this._textEditChanges[textDocument.uri];
            if (!result) {
              var edits = [];
              var textDocumentEdit = {
                textDocument,
                edits
              };
              this._workspaceEdit.documentChanges.push(textDocumentEdit);
              result = new TextEditChangeImpl(edits, this._changeAnnotations);
              this._textEditChanges[textDocument.uri] = result;
            }
            return result;
          } else {
            this.initChanges();
            if (this._workspaceEdit.changes === void 0) {
              throw new Error("Workspace edit is not configured for normal text edit changes.");
            }
            var result = this._textEditChanges[key];
            if (!result) {
              var edits = [];
              this._workspaceEdit.changes[key] = edits;
              result = new TextEditChangeImpl(edits);
              this._textEditChanges[key] = result;
            }
            return result;
          }
        };
        WorkspaceChange2.prototype.initDocumentChanges = function() {
          if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
            this._changeAnnotations = new ChangeAnnotations();
            this._workspaceEdit.documentChanges = [];
            this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
          }
        };
        WorkspaceChange2.prototype.initChanges = function() {
          if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
            this._workspaceEdit.changes = Object.create(null);
          }
        };
        WorkspaceChange2.prototype.createFile = function(uri, optionsOrAnnotation, options) {
          this.initDocumentChanges();
          if (this._workspaceEdit.documentChanges === void 0) {
            throw new Error("Workspace edit is not configured for document changes.");
          }
          var annotation;
          if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
          } else {
            options = optionsOrAnnotation;
          }
          var operation;
          var id;
          if (annotation === void 0) {
            operation = CreateFile.create(uri, options);
          } else {
            id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = CreateFile.create(uri, options, id);
          }
          this._workspaceEdit.documentChanges.push(operation);
          if (id !== void 0) {
            return id;
          }
        };
        WorkspaceChange2.prototype.renameFile = function(oldUri, newUri, optionsOrAnnotation, options) {
          this.initDocumentChanges();
          if (this._workspaceEdit.documentChanges === void 0) {
            throw new Error("Workspace edit is not configured for document changes.");
          }
          var annotation;
          if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
          } else {
            options = optionsOrAnnotation;
          }
          var operation;
          var id;
          if (annotation === void 0) {
            operation = RenameFile.create(oldUri, newUri, options);
          } else {
            id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = RenameFile.create(oldUri, newUri, options, id);
          }
          this._workspaceEdit.documentChanges.push(operation);
          if (id !== void 0) {
            return id;
          }
        };
        WorkspaceChange2.prototype.deleteFile = function(uri, optionsOrAnnotation, options) {
          this.initDocumentChanges();
          if (this._workspaceEdit.documentChanges === void 0) {
            throw new Error("Workspace edit is not configured for document changes.");
          }
          var annotation;
          if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
            annotation = optionsOrAnnotation;
          } else {
            options = optionsOrAnnotation;
          }
          var operation;
          var id;
          if (annotation === void 0) {
            operation = DeleteFile.create(uri, options);
          } else {
            id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
            operation = DeleteFile.create(uri, options, id);
          }
          this._workspaceEdit.documentChanges.push(operation);
          if (id !== void 0) {
            return id;
          }
        };
        return WorkspaceChange2;
      }();
      exports3.WorkspaceChange = WorkspaceChange;
      var TextDocumentIdentifier;
      (function(TextDocumentIdentifier2) {
        function create(uri) {
          return { uri };
        }
        TextDocumentIdentifier2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri);
        }
        TextDocumentIdentifier2.is = is;
      })(TextDocumentIdentifier = exports3.TextDocumentIdentifier || (exports3.TextDocumentIdentifier = {}));
      var VersionedTextDocumentIdentifier;
      (function(VersionedTextDocumentIdentifier2) {
        function create(uri, version) {
          return { uri, version };
        }
        VersionedTextDocumentIdentifier2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && Is.integer(candidate.version);
        }
        VersionedTextDocumentIdentifier2.is = is;
      })(VersionedTextDocumentIdentifier = exports3.VersionedTextDocumentIdentifier || (exports3.VersionedTextDocumentIdentifier = {}));
      var OptionalVersionedTextDocumentIdentifier;
      (function(OptionalVersionedTextDocumentIdentifier2) {
        function create(uri, version) {
          return { uri, version };
        }
        OptionalVersionedTextDocumentIdentifier2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && (candidate.version === null || Is.integer(candidate.version));
        }
        OptionalVersionedTextDocumentIdentifier2.is = is;
      })(OptionalVersionedTextDocumentIdentifier = exports3.OptionalVersionedTextDocumentIdentifier || (exports3.OptionalVersionedTextDocumentIdentifier = {}));
      var TextDocumentItem;
      (function(TextDocumentItem2) {
        function create(uri, languageId, version, text) {
          return { uri, languageId, version, text };
        }
        TextDocumentItem2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.integer(candidate.version) && Is.string(candidate.text);
        }
        TextDocumentItem2.is = is;
      })(TextDocumentItem = exports3.TextDocumentItem || (exports3.TextDocumentItem = {}));
      var MarkupKind;
      (function(MarkupKind2) {
        MarkupKind2.PlainText = "plaintext";
        MarkupKind2.Markdown = "markdown";
      })(MarkupKind = exports3.MarkupKind || (exports3.MarkupKind = {}));
      (function(MarkupKind2) {
        function is(value) {
          var candidate = value;
          return candidate === MarkupKind2.PlainText || candidate === MarkupKind2.Markdown;
        }
        MarkupKind2.is = is;
      })(MarkupKind = exports3.MarkupKind || (exports3.MarkupKind = {}));
      var MarkupContent;
      (function(MarkupContent2) {
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(value) && MarkupKind.is(candidate.kind) && Is.string(candidate.value);
        }
        MarkupContent2.is = is;
      })(MarkupContent = exports3.MarkupContent || (exports3.MarkupContent = {}));
      var CompletionItemKind;
      (function(CompletionItemKind2) {
        CompletionItemKind2.Text = 1;
        CompletionItemKind2.Method = 2;
        CompletionItemKind2.Function = 3;
        CompletionItemKind2.Constructor = 4;
        CompletionItemKind2.Field = 5;
        CompletionItemKind2.Variable = 6;
        CompletionItemKind2.Class = 7;
        CompletionItemKind2.Interface = 8;
        CompletionItemKind2.Module = 9;
        CompletionItemKind2.Property = 10;
        CompletionItemKind2.Unit = 11;
        CompletionItemKind2.Value = 12;
        CompletionItemKind2.Enum = 13;
        CompletionItemKind2.Keyword = 14;
        CompletionItemKind2.Snippet = 15;
        CompletionItemKind2.Color = 16;
        CompletionItemKind2.File = 17;
        CompletionItemKind2.Reference = 18;
        CompletionItemKind2.Folder = 19;
        CompletionItemKind2.EnumMember = 20;
        CompletionItemKind2.Constant = 21;
        CompletionItemKind2.Struct = 22;
        CompletionItemKind2.Event = 23;
        CompletionItemKind2.Operator = 24;
        CompletionItemKind2.TypeParameter = 25;
      })(CompletionItemKind = exports3.CompletionItemKind || (exports3.CompletionItemKind = {}));
      var InsertTextFormat;
      (function(InsertTextFormat2) {
        InsertTextFormat2.PlainText = 1;
        InsertTextFormat2.Snippet = 2;
      })(InsertTextFormat = exports3.InsertTextFormat || (exports3.InsertTextFormat = {}));
      var CompletionItemTag;
      (function(CompletionItemTag2) {
        CompletionItemTag2.Deprecated = 1;
      })(CompletionItemTag = exports3.CompletionItemTag || (exports3.CompletionItemTag = {}));
      var InsertReplaceEdit;
      (function(InsertReplaceEdit2) {
        function create(newText, insert, replace) {
          return { newText, insert, replace };
        }
        InsertReplaceEdit2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && Is.string(candidate.newText) && Range.is(candidate.insert) && Range.is(candidate.replace);
        }
        InsertReplaceEdit2.is = is;
      })(InsertReplaceEdit = exports3.InsertReplaceEdit || (exports3.InsertReplaceEdit = {}));
      var InsertTextMode;
      (function(InsertTextMode2) {
        InsertTextMode2.asIs = 1;
        InsertTextMode2.adjustIndentation = 2;
      })(InsertTextMode = exports3.InsertTextMode || (exports3.InsertTextMode = {}));
      var CompletionItem;
      (function(CompletionItem2) {
        function create(label) {
          return { label };
        }
        CompletionItem2.create = create;
      })(CompletionItem = exports3.CompletionItem || (exports3.CompletionItem = {}));
      var CompletionList;
      (function(CompletionList2) {
        function create(items, isIncomplete) {
          return { items: items ? items : [], isIncomplete: !!isIncomplete };
        }
        CompletionList2.create = create;
      })(CompletionList = exports3.CompletionList || (exports3.CompletionList = {}));
      var MarkedString;
      (function(MarkedString2) {
        function fromPlainText(plainText) {
          return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
        }
        MarkedString2.fromPlainText = fromPlainText;
        function is(value) {
          var candidate = value;
          return Is.string(candidate) || Is.objectLiteral(candidate) && Is.string(candidate.language) && Is.string(candidate.value);
        }
        MarkedString2.is = is;
      })(MarkedString = exports3.MarkedString || (exports3.MarkedString = {}));
      var Hover;
      (function(Hover2) {
        function is(value) {
          var candidate = value;
          return !!candidate && Is.objectLiteral(candidate) && (MarkupContent.is(candidate.contents) || MarkedString.is(candidate.contents) || Is.typedArray(candidate.contents, MarkedString.is)) && (value.range === void 0 || Range.is(value.range));
        }
        Hover2.is = is;
      })(Hover = exports3.Hover || (exports3.Hover = {}));
      var ParameterInformation;
      (function(ParameterInformation2) {
        function create(label, documentation) {
          return documentation ? { label, documentation } : { label };
        }
        ParameterInformation2.create = create;
      })(ParameterInformation = exports3.ParameterInformation || (exports3.ParameterInformation = {}));
      var SignatureInformation;
      (function(SignatureInformation2) {
        function create(label, documentation) {
          var parameters = [];
          for (var _i = 2; _i < arguments.length; _i++) {
            parameters[_i - 2] = arguments[_i];
          }
          var result = { label };
          if (Is.defined(documentation)) {
            result.documentation = documentation;
          }
          if (Is.defined(parameters)) {
            result.parameters = parameters;
          } else {
            result.parameters = [];
          }
          return result;
        }
        SignatureInformation2.create = create;
      })(SignatureInformation = exports3.SignatureInformation || (exports3.SignatureInformation = {}));
      var DocumentHighlightKind;
      (function(DocumentHighlightKind2) {
        DocumentHighlightKind2.Text = 1;
        DocumentHighlightKind2.Read = 2;
        DocumentHighlightKind2.Write = 3;
      })(DocumentHighlightKind = exports3.DocumentHighlightKind || (exports3.DocumentHighlightKind = {}));
      var DocumentHighlight;
      (function(DocumentHighlight2) {
        function create(range, kind) {
          var result = { range };
          if (Is.number(kind)) {
            result.kind = kind;
          }
          return result;
        }
        DocumentHighlight2.create = create;
      })(DocumentHighlight = exports3.DocumentHighlight || (exports3.DocumentHighlight = {}));
      var SymbolKind;
      (function(SymbolKind2) {
        SymbolKind2.File = 1;
        SymbolKind2.Module = 2;
        SymbolKind2.Namespace = 3;
        SymbolKind2.Package = 4;
        SymbolKind2.Class = 5;
        SymbolKind2.Method = 6;
        SymbolKind2.Property = 7;
        SymbolKind2.Field = 8;
        SymbolKind2.Constructor = 9;
        SymbolKind2.Enum = 10;
        SymbolKind2.Interface = 11;
        SymbolKind2.Function = 12;
        SymbolKind2.Variable = 13;
        SymbolKind2.Constant = 14;
        SymbolKind2.String = 15;
        SymbolKind2.Number = 16;
        SymbolKind2.Boolean = 17;
        SymbolKind2.Array = 18;
        SymbolKind2.Object = 19;
        SymbolKind2.Key = 20;
        SymbolKind2.Null = 21;
        SymbolKind2.EnumMember = 22;
        SymbolKind2.Struct = 23;
        SymbolKind2.Event = 24;
        SymbolKind2.Operator = 25;
        SymbolKind2.TypeParameter = 26;
      })(SymbolKind = exports3.SymbolKind || (exports3.SymbolKind = {}));
      var SymbolTag;
      (function(SymbolTag2) {
        SymbolTag2.Deprecated = 1;
      })(SymbolTag = exports3.SymbolTag || (exports3.SymbolTag = {}));
      var SymbolInformation;
      (function(SymbolInformation2) {
        function create(name, kind, range, uri, containerName) {
          var result = {
            name,
            kind,
            location: { uri, range }
          };
          if (containerName) {
            result.containerName = containerName;
          }
          return result;
        }
        SymbolInformation2.create = create;
      })(SymbolInformation = exports3.SymbolInformation || (exports3.SymbolInformation = {}));
      var DocumentSymbol;
      (function(DocumentSymbol2) {
        function create(name, detail, kind, range, selectionRange, children) {
          var result = {
            name,
            detail,
            kind,
            range,
            selectionRange
          };
          if (children !== void 0) {
            result.children = children;
          }
          return result;
        }
        DocumentSymbol2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && Is.string(candidate.name) && Is.number(candidate.kind) && Range.is(candidate.range) && Range.is(candidate.selectionRange) && (candidate.detail === void 0 || Is.string(candidate.detail)) && (candidate.deprecated === void 0 || Is.boolean(candidate.deprecated)) && (candidate.children === void 0 || Array.isArray(candidate.children)) && (candidate.tags === void 0 || Array.isArray(candidate.tags));
        }
        DocumentSymbol2.is = is;
      })(DocumentSymbol = exports3.DocumentSymbol || (exports3.DocumentSymbol = {}));
      var CodeActionKind;
      (function(CodeActionKind2) {
        CodeActionKind2.Empty = "";
        CodeActionKind2.QuickFix = "quickfix";
        CodeActionKind2.Refactor = "refactor";
        CodeActionKind2.RefactorExtract = "refactor.extract";
        CodeActionKind2.RefactorInline = "refactor.inline";
        CodeActionKind2.RefactorRewrite = "refactor.rewrite";
        CodeActionKind2.Source = "source";
        CodeActionKind2.SourceOrganizeImports = "source.organizeImports";
        CodeActionKind2.SourceFixAll = "source.fixAll";
      })(CodeActionKind = exports3.CodeActionKind || (exports3.CodeActionKind = {}));
      var CodeActionContext;
      (function(CodeActionContext2) {
        function create(diagnostics, only) {
          var result = { diagnostics };
          if (only !== void 0 && only !== null) {
            result.only = only;
          }
          return result;
        }
        CodeActionContext2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is) && (candidate.only === void 0 || Is.typedArray(candidate.only, Is.string));
        }
        CodeActionContext2.is = is;
      })(CodeActionContext = exports3.CodeActionContext || (exports3.CodeActionContext = {}));
      var CodeAction;
      (function(CodeAction2) {
        function create(title, kindOrCommandOrEdit, kind) {
          var result = { title };
          var checkKind = true;
          if (typeof kindOrCommandOrEdit === "string") {
            checkKind = false;
            result.kind = kindOrCommandOrEdit;
          } else if (Command.is(kindOrCommandOrEdit)) {
            result.command = kindOrCommandOrEdit;
          } else {
            result.edit = kindOrCommandOrEdit;
          }
          if (checkKind && kind !== void 0) {
            result.kind = kind;
          }
          return result;
        }
        CodeAction2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && Is.string(candidate.title) && (candidate.diagnostics === void 0 || Is.typedArray(candidate.diagnostics, Diagnostic.is)) && (candidate.kind === void 0 || Is.string(candidate.kind)) && (candidate.edit !== void 0 || candidate.command !== void 0) && (candidate.command === void 0 || Command.is(candidate.command)) && (candidate.isPreferred === void 0 || Is.boolean(candidate.isPreferred)) && (candidate.edit === void 0 || WorkspaceEdit.is(candidate.edit));
        }
        CodeAction2.is = is;
      })(CodeAction = exports3.CodeAction || (exports3.CodeAction = {}));
      var CodeLens;
      (function(CodeLens2) {
        function create(range, data) {
          var result = { range };
          if (Is.defined(data)) {
            result.data = data;
          }
          return result;
        }
        CodeLens2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
        }
        CodeLens2.is = is;
      })(CodeLens = exports3.CodeLens || (exports3.CodeLens = {}));
      var FormattingOptions;
      (function(FormattingOptions2) {
        function create(tabSize, insertSpaces) {
          return { tabSize, insertSpaces };
        }
        FormattingOptions2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.uinteger(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
        }
        FormattingOptions2.is = is;
      })(FormattingOptions = exports3.FormattingOptions || (exports3.FormattingOptions = {}));
      var DocumentLink;
      (function(DocumentLink2) {
        function create(range, target, data) {
          return { range, target, data };
        }
        DocumentLink2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
        }
        DocumentLink2.is = is;
      })(DocumentLink = exports3.DocumentLink || (exports3.DocumentLink = {}));
      var SelectionRange;
      (function(SelectionRange2) {
        function create(range, parent) {
          return { range, parent };
        }
        SelectionRange2.create = create;
        function is(value) {
          var candidate = value;
          return candidate !== void 0 && Range.is(candidate.range) && (candidate.parent === void 0 || SelectionRange2.is(candidate.parent));
        }
        SelectionRange2.is = is;
      })(SelectionRange = exports3.SelectionRange || (exports3.SelectionRange = {}));
      exports3.EOL = ["\n", "\r\n", "\r"];
      var TextDocument;
      (function(TextDocument2) {
        function create(uri, languageId, version, content) {
          return new FullTextDocument(uri, languageId, version, content);
        }
        TextDocument2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.uinteger(candidate.lineCount) && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
        }
        TextDocument2.is = is;
        function applyEdits(document, edits) {
          var text = document.getText();
          var sortedEdits = mergeSort(edits, function(a, b) {
            var diff = a.range.start.line - b.range.start.line;
            if (diff === 0) {
              return a.range.start.character - b.range.start.character;
            }
            return diff;
          });
          var lastModifiedOffset = text.length;
          for (var i = sortedEdits.length - 1; i >= 0; i--) {
            var e = sortedEdits[i];
            var startOffset = document.offsetAt(e.range.start);
            var endOffset = document.offsetAt(e.range.end);
            if (endOffset <= lastModifiedOffset) {
              text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
            } else {
              throw new Error("Overlapping edit");
            }
            lastModifiedOffset = startOffset;
          }
          return text;
        }
        TextDocument2.applyEdits = applyEdits;
        function mergeSort(data, compare) {
          if (data.length <= 1) {
            return data;
          }
          var p = data.length / 2 | 0;
          var left = data.slice(0, p);
          var right = data.slice(p);
          mergeSort(left, compare);
          mergeSort(right, compare);
          var leftIdx = 0;
          var rightIdx = 0;
          var i = 0;
          while (leftIdx < left.length && rightIdx < right.length) {
            var ret = compare(left[leftIdx], right[rightIdx]);
            if (ret <= 0) {
              data[i++] = left[leftIdx++];
            } else {
              data[i++] = right[rightIdx++];
            }
          }
          while (leftIdx < left.length) {
            data[i++] = left[leftIdx++];
          }
          while (rightIdx < right.length) {
            data[i++] = right[rightIdx++];
          }
          return data;
        }
      })(TextDocument = exports3.TextDocument || (exports3.TextDocument = {}));
      var FullTextDocument = function() {
        function FullTextDocument2(uri, languageId, version, content) {
          this._uri = uri;
          this._languageId = languageId;
          this._version = version;
          this._content = content;
          this._lineOffsets = void 0;
        }
        Object.defineProperty(FullTextDocument2.prototype, "uri", {
          get: function() {
            return this._uri;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(FullTextDocument2.prototype, "languageId", {
          get: function() {
            return this._languageId;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(FullTextDocument2.prototype, "version", {
          get: function() {
            return this._version;
          },
          enumerable: false,
          configurable: true
        });
        FullTextDocument2.prototype.getText = function(range) {
          if (range) {
            var start = this.offsetAt(range.start);
            var end = this.offsetAt(range.end);
            return this._content.substring(start, end);
          }
          return this._content;
        };
        FullTextDocument2.prototype.update = function(event, version) {
          this._content = event.text;
          this._version = version;
          this._lineOffsets = void 0;
        };
        FullTextDocument2.prototype.getLineOffsets = function() {
          if (this._lineOffsets === void 0) {
            var lineOffsets = [];
            var text = this._content;
            var isLineStart = true;
            for (var i = 0; i < text.length; i++) {
              if (isLineStart) {
                lineOffsets.push(i);
                isLineStart = false;
              }
              var ch = text.charAt(i);
              isLineStart = ch === "\r" || ch === "\n";
              if (ch === "\r" && i + 1 < text.length && text.charAt(i + 1) === "\n") {
                i++;
              }
            }
            if (isLineStart && text.length > 0) {
              lineOffsets.push(text.length);
            }
            this._lineOffsets = lineOffsets;
          }
          return this._lineOffsets;
        };
        FullTextDocument2.prototype.positionAt = function(offset) {
          offset = Math.max(Math.min(offset, this._content.length), 0);
          var lineOffsets = this.getLineOffsets();
          var low = 0, high = lineOffsets.length;
          if (high === 0) {
            return Position.create(0, offset);
          }
          while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (lineOffsets[mid] > offset) {
              high = mid;
            } else {
              low = mid + 1;
            }
          }
          var line = low - 1;
          return Position.create(line, offset - lineOffsets[line]);
        };
        FullTextDocument2.prototype.offsetAt = function(position) {
          var lineOffsets = this.getLineOffsets();
          if (position.line >= lineOffsets.length) {
            return this._content.length;
          } else if (position.line < 0) {
            return 0;
          }
          var lineOffset = lineOffsets[position.line];
          var nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
          return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
        };
        Object.defineProperty(FullTextDocument2.prototype, "lineCount", {
          get: function() {
            return this.getLineOffsets().length;
          },
          enumerable: false,
          configurable: true
        });
        return FullTextDocument2;
      }();
      var Is;
      (function(Is2) {
        var toString = Object.prototype.toString;
        function defined(value) {
          return typeof value !== "undefined";
        }
        Is2.defined = defined;
        function undefined2(value) {
          return typeof value === "undefined";
        }
        Is2.undefined = undefined2;
        function boolean(value) {
          return value === true || value === false;
        }
        Is2.boolean = boolean;
        function string(value) {
          return toString.call(value) === "[object String]";
        }
        Is2.string = string;
        function number(value) {
          return toString.call(value) === "[object Number]";
        }
        Is2.number = number;
        function numberRange(value, min, max) {
          return toString.call(value) === "[object Number]" && min <= value && value <= max;
        }
        Is2.numberRange = numberRange;
        function integer2(value) {
          return toString.call(value) === "[object Number]" && -2147483648 <= value && value <= 2147483647;
        }
        Is2.integer = integer2;
        function uinteger2(value) {
          return toString.call(value) === "[object Number]" && 0 <= value && value <= 2147483647;
        }
        Is2.uinteger = uinteger2;
        function func(value) {
          return toString.call(value) === "[object Function]";
        }
        Is2.func = func;
        function objectLiteral(value) {
          return value !== null && typeof value === "object";
        }
        Is2.objectLiteral = objectLiteral;
        function typedArray(value, check) {
          return Array.isArray(value) && value.every(check);
        }
        Is2.typedArray = typedArray;
      })(Is || (Is = {}));
    });
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/messages.js
var require_messages = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/messages.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProtocolNotificationType = exports2.ProtocolNotificationType0 = exports2.ProtocolRequestType = exports2.ProtocolRequestType0 = exports2.RegistrationType = void 0;
    var vscode_jsonrpc_1 = require("vscode-jsonrpc");
    var RegistrationType = class {
      constructor(method) {
        this.method = method;
      }
    };
    exports2.RegistrationType = RegistrationType;
    var ProtocolRequestType0 = class extends vscode_jsonrpc_1.RequestType0 {
      constructor(method) {
        super(method);
      }
    };
    exports2.ProtocolRequestType0 = ProtocolRequestType0;
    var ProtocolRequestType = class extends vscode_jsonrpc_1.RequestType {
      constructor(method) {
        super(method, vscode_jsonrpc_1.ParameterStructures.byName);
      }
    };
    exports2.ProtocolRequestType = ProtocolRequestType;
    var ProtocolNotificationType0 = class extends vscode_jsonrpc_1.NotificationType0 {
      constructor(method) {
        super(method);
      }
    };
    exports2.ProtocolNotificationType0 = ProtocolNotificationType0;
    var ProtocolNotificationType = class extends vscode_jsonrpc_1.NotificationType {
      constructor(method) {
        super(method, vscode_jsonrpc_1.ParameterStructures.byName);
      }
    };
    exports2.ProtocolNotificationType = ProtocolNotificationType;
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/utils/is.js
var require_is = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/utils/is.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.objectLiteral = exports2.typedArray = exports2.stringArray = exports2.array = exports2.func = exports2.error = exports2.number = exports2.string = exports2.boolean = void 0;
    function boolean(value) {
      return value === true || value === false;
    }
    exports2.boolean = boolean;
    function string(value) {
      return typeof value === "string" || value instanceof String;
    }
    exports2.string = string;
    function number(value) {
      return typeof value === "number" || value instanceof Number;
    }
    exports2.number = number;
    function error(value) {
      return value instanceof Error;
    }
    exports2.error = error;
    function func(value) {
      return typeof value === "function";
    }
    exports2.func = func;
    function array(value) {
      return Array.isArray(value);
    }
    exports2.array = array;
    function stringArray(value) {
      return array(value) && value.every((elem) => string(elem));
    }
    exports2.stringArray = stringArray;
    function typedArray(value, check) {
      return Array.isArray(value) && value.every(check);
    }
    exports2.typedArray = typedArray;
    function objectLiteral(value) {
      return value !== null && typeof value === "object";
    }
    exports2.objectLiteral = objectLiteral;
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.implementation.js
var require_protocol_implementation = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.implementation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ImplementationRequest = void 0;
    var messages_1 = require_messages();
    var ImplementationRequest;
    (function(ImplementationRequest2) {
      ImplementationRequest2.method = "textDocument/implementation";
      ImplementationRequest2.type = new messages_1.ProtocolRequestType(ImplementationRequest2.method);
    })(ImplementationRequest = exports2.ImplementationRequest || (exports2.ImplementationRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.typeDefinition.js
var require_protocol_typeDefinition = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.typeDefinition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TypeDefinitionRequest = void 0;
    var messages_1 = require_messages();
    var TypeDefinitionRequest;
    (function(TypeDefinitionRequest2) {
      TypeDefinitionRequest2.method = "textDocument/typeDefinition";
      TypeDefinitionRequest2.type = new messages_1.ProtocolRequestType(TypeDefinitionRequest2.method);
    })(TypeDefinitionRequest = exports2.TypeDefinitionRequest || (exports2.TypeDefinitionRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.workspaceFolders.js
var require_protocol_workspaceFolders = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.workspaceFolders.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DidChangeWorkspaceFoldersNotification = exports2.WorkspaceFoldersRequest = void 0;
    var messages_1 = require_messages();
    var WorkspaceFoldersRequest;
    (function(WorkspaceFoldersRequest2) {
      WorkspaceFoldersRequest2.type = new messages_1.ProtocolRequestType0("workspace/workspaceFolders");
    })(WorkspaceFoldersRequest = exports2.WorkspaceFoldersRequest || (exports2.WorkspaceFoldersRequest = {}));
    var DidChangeWorkspaceFoldersNotification;
    (function(DidChangeWorkspaceFoldersNotification2) {
      DidChangeWorkspaceFoldersNotification2.type = new messages_1.ProtocolNotificationType("workspace/didChangeWorkspaceFolders");
    })(DidChangeWorkspaceFoldersNotification = exports2.DidChangeWorkspaceFoldersNotification || (exports2.DidChangeWorkspaceFoldersNotification = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.configuration.js
var require_protocol_configuration = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.configuration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ConfigurationRequest = void 0;
    var messages_1 = require_messages();
    var ConfigurationRequest;
    (function(ConfigurationRequest2) {
      ConfigurationRequest2.type = new messages_1.ProtocolRequestType("workspace/configuration");
    })(ConfigurationRequest = exports2.ConfigurationRequest || (exports2.ConfigurationRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.colorProvider.js
var require_protocol_colorProvider = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.colorProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ColorPresentationRequest = exports2.DocumentColorRequest = void 0;
    var messages_1 = require_messages();
    var DocumentColorRequest;
    (function(DocumentColorRequest2) {
      DocumentColorRequest2.method = "textDocument/documentColor";
      DocumentColorRequest2.type = new messages_1.ProtocolRequestType(DocumentColorRequest2.method);
    })(DocumentColorRequest = exports2.DocumentColorRequest || (exports2.DocumentColorRequest = {}));
    var ColorPresentationRequest;
    (function(ColorPresentationRequest2) {
      ColorPresentationRequest2.type = new messages_1.ProtocolRequestType("textDocument/colorPresentation");
    })(ColorPresentationRequest = exports2.ColorPresentationRequest || (exports2.ColorPresentationRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.foldingRange.js
var require_protocol_foldingRange = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.foldingRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FoldingRangeRequest = exports2.FoldingRangeKind = void 0;
    var messages_1 = require_messages();
    var FoldingRangeKind;
    (function(FoldingRangeKind2) {
      FoldingRangeKind2["Comment"] = "comment";
      FoldingRangeKind2["Imports"] = "imports";
      FoldingRangeKind2["Region"] = "region";
    })(FoldingRangeKind = exports2.FoldingRangeKind || (exports2.FoldingRangeKind = {}));
    var FoldingRangeRequest;
    (function(FoldingRangeRequest2) {
      FoldingRangeRequest2.method = "textDocument/foldingRange";
      FoldingRangeRequest2.type = new messages_1.ProtocolRequestType(FoldingRangeRequest2.method);
    })(FoldingRangeRequest = exports2.FoldingRangeRequest || (exports2.FoldingRangeRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.declaration.js
var require_protocol_declaration = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.declaration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DeclarationRequest = void 0;
    var messages_1 = require_messages();
    var DeclarationRequest;
    (function(DeclarationRequest2) {
      DeclarationRequest2.method = "textDocument/declaration";
      DeclarationRequest2.type = new messages_1.ProtocolRequestType(DeclarationRequest2.method);
    })(DeclarationRequest = exports2.DeclarationRequest || (exports2.DeclarationRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.selectionRange.js
var require_protocol_selectionRange = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.selectionRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SelectionRangeRequest = void 0;
    var messages_1 = require_messages();
    var SelectionRangeRequest;
    (function(SelectionRangeRequest2) {
      SelectionRangeRequest2.method = "textDocument/selectionRange";
      SelectionRangeRequest2.type = new messages_1.ProtocolRequestType(SelectionRangeRequest2.method);
    })(SelectionRangeRequest = exports2.SelectionRangeRequest || (exports2.SelectionRangeRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.progress.js
var require_protocol_progress = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.progress.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCreateRequest = exports2.WorkDoneProgress = void 0;
    var vscode_jsonrpc_1 = require("vscode-jsonrpc");
    var messages_1 = require_messages();
    var WorkDoneProgress;
    (function(WorkDoneProgress2) {
      WorkDoneProgress2.type = new vscode_jsonrpc_1.ProgressType();
      function is(value) {
        return value === WorkDoneProgress2.type;
      }
      WorkDoneProgress2.is = is;
    })(WorkDoneProgress = exports2.WorkDoneProgress || (exports2.WorkDoneProgress = {}));
    var WorkDoneProgressCreateRequest;
    (function(WorkDoneProgressCreateRequest2) {
      WorkDoneProgressCreateRequest2.type = new messages_1.ProtocolRequestType("window/workDoneProgress/create");
    })(WorkDoneProgressCreateRequest = exports2.WorkDoneProgressCreateRequest || (exports2.WorkDoneProgressCreateRequest = {}));
    var WorkDoneProgressCancelNotification;
    (function(WorkDoneProgressCancelNotification2) {
      WorkDoneProgressCancelNotification2.type = new messages_1.ProtocolNotificationType("window/workDoneProgress/cancel");
    })(WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCancelNotification || (exports2.WorkDoneProgressCancelNotification = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.callHierarchy.js
var require_protocol_callHierarchy = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.callHierarchy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyIncomingCallsRequest = exports2.CallHierarchyPrepareRequest = void 0;
    var messages_1 = require_messages();
    var CallHierarchyPrepareRequest;
    (function(CallHierarchyPrepareRequest2) {
      CallHierarchyPrepareRequest2.method = "textDocument/prepareCallHierarchy";
      CallHierarchyPrepareRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyPrepareRequest2.method);
    })(CallHierarchyPrepareRequest = exports2.CallHierarchyPrepareRequest || (exports2.CallHierarchyPrepareRequest = {}));
    var CallHierarchyIncomingCallsRequest;
    (function(CallHierarchyIncomingCallsRequest2) {
      CallHierarchyIncomingCallsRequest2.method = "callHierarchy/incomingCalls";
      CallHierarchyIncomingCallsRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyIncomingCallsRequest2.method);
    })(CallHierarchyIncomingCallsRequest = exports2.CallHierarchyIncomingCallsRequest || (exports2.CallHierarchyIncomingCallsRequest = {}));
    var CallHierarchyOutgoingCallsRequest;
    (function(CallHierarchyOutgoingCallsRequest2) {
      CallHierarchyOutgoingCallsRequest2.method = "callHierarchy/outgoingCalls";
      CallHierarchyOutgoingCallsRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyOutgoingCallsRequest2.method);
    })(CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyOutgoingCallsRequest || (exports2.CallHierarchyOutgoingCallsRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.semanticTokens.js
var require_protocol_semanticTokens = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.semanticTokens.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SemanticTokensRefreshRequest = exports2.SemanticTokensRangeRequest = exports2.SemanticTokensDeltaRequest = exports2.SemanticTokensRequest = exports2.SemanticTokensRegistrationType = exports2.TokenFormat = exports2.SemanticTokens = exports2.SemanticTokenModifiers = exports2.SemanticTokenTypes = void 0;
    var messages_1 = require_messages();
    var SemanticTokenTypes;
    (function(SemanticTokenTypes2) {
      SemanticTokenTypes2["namespace"] = "namespace";
      SemanticTokenTypes2["type"] = "type";
      SemanticTokenTypes2["class"] = "class";
      SemanticTokenTypes2["enum"] = "enum";
      SemanticTokenTypes2["interface"] = "interface";
      SemanticTokenTypes2["struct"] = "struct";
      SemanticTokenTypes2["typeParameter"] = "typeParameter";
      SemanticTokenTypes2["parameter"] = "parameter";
      SemanticTokenTypes2["variable"] = "variable";
      SemanticTokenTypes2["property"] = "property";
      SemanticTokenTypes2["enumMember"] = "enumMember";
      SemanticTokenTypes2["event"] = "event";
      SemanticTokenTypes2["function"] = "function";
      SemanticTokenTypes2["method"] = "method";
      SemanticTokenTypes2["macro"] = "macro";
      SemanticTokenTypes2["keyword"] = "keyword";
      SemanticTokenTypes2["modifier"] = "modifier";
      SemanticTokenTypes2["comment"] = "comment";
      SemanticTokenTypes2["string"] = "string";
      SemanticTokenTypes2["number"] = "number";
      SemanticTokenTypes2["regexp"] = "regexp";
      SemanticTokenTypes2["operator"] = "operator";
    })(SemanticTokenTypes = exports2.SemanticTokenTypes || (exports2.SemanticTokenTypes = {}));
    var SemanticTokenModifiers;
    (function(SemanticTokenModifiers2) {
      SemanticTokenModifiers2["declaration"] = "declaration";
      SemanticTokenModifiers2["definition"] = "definition";
      SemanticTokenModifiers2["readonly"] = "readonly";
      SemanticTokenModifiers2["static"] = "static";
      SemanticTokenModifiers2["deprecated"] = "deprecated";
      SemanticTokenModifiers2["abstract"] = "abstract";
      SemanticTokenModifiers2["async"] = "async";
      SemanticTokenModifiers2["modification"] = "modification";
      SemanticTokenModifiers2["documentation"] = "documentation";
      SemanticTokenModifiers2["defaultLibrary"] = "defaultLibrary";
    })(SemanticTokenModifiers = exports2.SemanticTokenModifiers || (exports2.SemanticTokenModifiers = {}));
    var SemanticTokens;
    (function(SemanticTokens2) {
      function is(value) {
        const candidate = value;
        return candidate !== void 0 && (candidate.resultId === void 0 || typeof candidate.resultId === "string") && Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === "number");
      }
      SemanticTokens2.is = is;
    })(SemanticTokens = exports2.SemanticTokens || (exports2.SemanticTokens = {}));
    var TokenFormat;
    (function(TokenFormat2) {
      TokenFormat2.Relative = "relative";
    })(TokenFormat = exports2.TokenFormat || (exports2.TokenFormat = {}));
    var SemanticTokensRegistrationType;
    (function(SemanticTokensRegistrationType2) {
      SemanticTokensRegistrationType2.method = "textDocument/semanticTokens";
      SemanticTokensRegistrationType2.type = new messages_1.RegistrationType(SemanticTokensRegistrationType2.method);
    })(SemanticTokensRegistrationType = exports2.SemanticTokensRegistrationType || (exports2.SemanticTokensRegistrationType = {}));
    var SemanticTokensRequest;
    (function(SemanticTokensRequest2) {
      SemanticTokensRequest2.method = "textDocument/semanticTokens/full";
      SemanticTokensRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensRequest2.method);
    })(SemanticTokensRequest = exports2.SemanticTokensRequest || (exports2.SemanticTokensRequest = {}));
    var SemanticTokensDeltaRequest;
    (function(SemanticTokensDeltaRequest2) {
      SemanticTokensDeltaRequest2.method = "textDocument/semanticTokens/full/delta";
      SemanticTokensDeltaRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensDeltaRequest2.method);
    })(SemanticTokensDeltaRequest = exports2.SemanticTokensDeltaRequest || (exports2.SemanticTokensDeltaRequest = {}));
    var SemanticTokensRangeRequest;
    (function(SemanticTokensRangeRequest2) {
      SemanticTokensRangeRequest2.method = "textDocument/semanticTokens/range";
      SemanticTokensRangeRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensRangeRequest2.method);
    })(SemanticTokensRangeRequest = exports2.SemanticTokensRangeRequest || (exports2.SemanticTokensRangeRequest = {}));
    var SemanticTokensRefreshRequest;
    (function(SemanticTokensRefreshRequest2) {
      SemanticTokensRefreshRequest2.method = `workspace/semanticTokens/refresh`;
      SemanticTokensRefreshRequest2.type = new messages_1.ProtocolRequestType0(SemanticTokensRefreshRequest2.method);
    })(SemanticTokensRefreshRequest = exports2.SemanticTokensRefreshRequest || (exports2.SemanticTokensRefreshRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.showDocument.js
var require_protocol_showDocument = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.showDocument.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ShowDocumentRequest = void 0;
    var messages_1 = require_messages();
    var ShowDocumentRequest;
    (function(ShowDocumentRequest2) {
      ShowDocumentRequest2.method = "window/showDocument";
      ShowDocumentRequest2.type = new messages_1.ProtocolRequestType(ShowDocumentRequest2.method);
    })(ShowDocumentRequest = exports2.ShowDocumentRequest || (exports2.ShowDocumentRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.linkedEditingRange.js
var require_protocol_linkedEditingRange = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.linkedEditingRange.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LinkedEditingRangeRequest = void 0;
    var messages_1 = require_messages();
    var LinkedEditingRangeRequest;
    (function(LinkedEditingRangeRequest2) {
      LinkedEditingRangeRequest2.method = "textDocument/linkedEditingRange";
      LinkedEditingRangeRequest2.type = new messages_1.ProtocolRequestType(LinkedEditingRangeRequest2.method);
    })(LinkedEditingRangeRequest = exports2.LinkedEditingRangeRequest || (exports2.LinkedEditingRangeRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.fileOperations.js
var require_protocol_fileOperations = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.fileOperations.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WillDeleteFilesRequest = exports2.DidDeleteFilesNotification = exports2.DidRenameFilesNotification = exports2.WillRenameFilesRequest = exports2.DidCreateFilesNotification = exports2.WillCreateFilesRequest = exports2.FileOperationPatternKind = void 0;
    var messages_1 = require_messages();
    var FileOperationPatternKind;
    (function(FileOperationPatternKind2) {
      FileOperationPatternKind2.file = "file";
      FileOperationPatternKind2.folder = "folder";
    })(FileOperationPatternKind = exports2.FileOperationPatternKind || (exports2.FileOperationPatternKind = {}));
    var WillCreateFilesRequest;
    (function(WillCreateFilesRequest2) {
      WillCreateFilesRequest2.method = "workspace/willCreateFiles";
      WillCreateFilesRequest2.type = new messages_1.ProtocolRequestType(WillCreateFilesRequest2.method);
    })(WillCreateFilesRequest = exports2.WillCreateFilesRequest || (exports2.WillCreateFilesRequest = {}));
    var DidCreateFilesNotification;
    (function(DidCreateFilesNotification2) {
      DidCreateFilesNotification2.method = "workspace/didCreateFiles";
      DidCreateFilesNotification2.type = new messages_1.ProtocolNotificationType(DidCreateFilesNotification2.method);
    })(DidCreateFilesNotification = exports2.DidCreateFilesNotification || (exports2.DidCreateFilesNotification = {}));
    var WillRenameFilesRequest;
    (function(WillRenameFilesRequest2) {
      WillRenameFilesRequest2.method = "workspace/willRenameFiles";
      WillRenameFilesRequest2.type = new messages_1.ProtocolRequestType(WillRenameFilesRequest2.method);
    })(WillRenameFilesRequest = exports2.WillRenameFilesRequest || (exports2.WillRenameFilesRequest = {}));
    var DidRenameFilesNotification;
    (function(DidRenameFilesNotification2) {
      DidRenameFilesNotification2.method = "workspace/didRenameFiles";
      DidRenameFilesNotification2.type = new messages_1.ProtocolNotificationType(DidRenameFilesNotification2.method);
    })(DidRenameFilesNotification = exports2.DidRenameFilesNotification || (exports2.DidRenameFilesNotification = {}));
    var DidDeleteFilesNotification;
    (function(DidDeleteFilesNotification2) {
      DidDeleteFilesNotification2.method = "workspace/didDeleteFiles";
      DidDeleteFilesNotification2.type = new messages_1.ProtocolNotificationType(DidDeleteFilesNotification2.method);
    })(DidDeleteFilesNotification = exports2.DidDeleteFilesNotification || (exports2.DidDeleteFilesNotification = {}));
    var WillDeleteFilesRequest;
    (function(WillDeleteFilesRequest2) {
      WillDeleteFilesRequest2.method = "workspace/willDeleteFiles";
      WillDeleteFilesRequest2.type = new messages_1.ProtocolRequestType(WillDeleteFilesRequest2.method);
    })(WillDeleteFilesRequest = exports2.WillDeleteFilesRequest || (exports2.WillDeleteFilesRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.moniker.js
var require_protocol_moniker = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.moniker.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MonikerRequest = exports2.MonikerKind = exports2.UniquenessLevel = void 0;
    var messages_1 = require_messages();
    var UniquenessLevel;
    (function(UniquenessLevel2) {
      UniquenessLevel2["document"] = "document";
      UniquenessLevel2["project"] = "project";
      UniquenessLevel2["group"] = "group";
      UniquenessLevel2["scheme"] = "scheme";
      UniquenessLevel2["global"] = "global";
    })(UniquenessLevel = exports2.UniquenessLevel || (exports2.UniquenessLevel = {}));
    var MonikerKind;
    (function(MonikerKind2) {
      MonikerKind2["import"] = "import";
      MonikerKind2["export"] = "export";
      MonikerKind2["local"] = "local";
    })(MonikerKind = exports2.MonikerKind || (exports2.MonikerKind = {}));
    var MonikerRequest;
    (function(MonikerRequest2) {
      MonikerRequest2.method = "textDocument/moniker";
      MonikerRequest2.type = new messages_1.ProtocolRequestType(MonikerRequest2.method);
    })(MonikerRequest = exports2.MonikerRequest || (exports2.MonikerRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.js
var require_protocol = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/protocol.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DocumentLinkRequest = exports2.CodeLensRefreshRequest = exports2.CodeLensResolveRequest = exports2.CodeLensRequest = exports2.WorkspaceSymbolRequest = exports2.CodeActionResolveRequest = exports2.CodeActionRequest = exports2.DocumentSymbolRequest = exports2.DocumentHighlightRequest = exports2.ReferencesRequest = exports2.DefinitionRequest = exports2.SignatureHelpRequest = exports2.SignatureHelpTriggerKind = exports2.HoverRequest = exports2.CompletionResolveRequest = exports2.CompletionRequest = exports2.CompletionTriggerKind = exports2.PublishDiagnosticsNotification = exports2.WatchKind = exports2.FileChangeType = exports2.DidChangeWatchedFilesNotification = exports2.WillSaveTextDocumentWaitUntilRequest = exports2.WillSaveTextDocumentNotification = exports2.TextDocumentSaveReason = exports2.DidSaveTextDocumentNotification = exports2.DidCloseTextDocumentNotification = exports2.DidChangeTextDocumentNotification = exports2.TextDocumentContentChangeEvent = exports2.DidOpenTextDocumentNotification = exports2.TextDocumentSyncKind = exports2.TelemetryEventNotification = exports2.LogMessageNotification = exports2.ShowMessageRequest = exports2.ShowMessageNotification = exports2.MessageType = exports2.DidChangeConfigurationNotification = exports2.ExitNotification = exports2.ShutdownRequest = exports2.InitializedNotification = exports2.InitializeError = exports2.InitializeRequest = exports2.WorkDoneProgressOptions = exports2.TextDocumentRegistrationOptions = exports2.StaticRegistrationOptions = exports2.FailureHandlingKind = exports2.ResourceOperationKind = exports2.UnregistrationRequest = exports2.RegistrationRequest = exports2.DocumentSelector = exports2.DocumentFilter = void 0;
    exports2.MonikerRequest = exports2.MonikerKind = exports2.UniquenessLevel = exports2.WillDeleteFilesRequest = exports2.DidDeleteFilesNotification = exports2.WillRenameFilesRequest = exports2.DidRenameFilesNotification = exports2.WillCreateFilesRequest = exports2.DidCreateFilesNotification = exports2.FileOperationPatternKind = exports2.LinkedEditingRangeRequest = exports2.ShowDocumentRequest = exports2.SemanticTokensRegistrationType = exports2.SemanticTokensRefreshRequest = exports2.SemanticTokensRangeRequest = exports2.SemanticTokensDeltaRequest = exports2.SemanticTokensRequest = exports2.TokenFormat = exports2.SemanticTokens = exports2.SemanticTokenModifiers = exports2.SemanticTokenTypes = exports2.CallHierarchyPrepareRequest = exports2.CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyIncomingCallsRequest = exports2.WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCreateRequest = exports2.WorkDoneProgress = exports2.SelectionRangeRequest = exports2.DeclarationRequest = exports2.FoldingRangeRequest = exports2.ColorPresentationRequest = exports2.DocumentColorRequest = exports2.ConfigurationRequest = exports2.DidChangeWorkspaceFoldersNotification = exports2.WorkspaceFoldersRequest = exports2.TypeDefinitionRequest = exports2.ImplementationRequest = exports2.ApplyWorkspaceEditRequest = exports2.ExecuteCommandRequest = exports2.PrepareRenameRequest = exports2.RenameRequest = exports2.PrepareSupportDefaultBehavior = exports2.DocumentOnTypeFormattingRequest = exports2.DocumentRangeFormattingRequest = exports2.DocumentFormattingRequest = exports2.DocumentLinkResolveRequest = void 0;
    var Is = require_is();
    var messages_1 = require_messages();
    var protocol_implementation_1 = require_protocol_implementation();
    Object.defineProperty(exports2, "ImplementationRequest", { enumerable: true, get: function() {
      return protocol_implementation_1.ImplementationRequest;
    } });
    var protocol_typeDefinition_1 = require_protocol_typeDefinition();
    Object.defineProperty(exports2, "TypeDefinitionRequest", { enumerable: true, get: function() {
      return protocol_typeDefinition_1.TypeDefinitionRequest;
    } });
    var protocol_workspaceFolders_1 = require_protocol_workspaceFolders();
    Object.defineProperty(exports2, "WorkspaceFoldersRequest", { enumerable: true, get: function() {
      return protocol_workspaceFolders_1.WorkspaceFoldersRequest;
    } });
    Object.defineProperty(exports2, "DidChangeWorkspaceFoldersNotification", { enumerable: true, get: function() {
      return protocol_workspaceFolders_1.DidChangeWorkspaceFoldersNotification;
    } });
    var protocol_configuration_1 = require_protocol_configuration();
    Object.defineProperty(exports2, "ConfigurationRequest", { enumerable: true, get: function() {
      return protocol_configuration_1.ConfigurationRequest;
    } });
    var protocol_colorProvider_1 = require_protocol_colorProvider();
    Object.defineProperty(exports2, "DocumentColorRequest", { enumerable: true, get: function() {
      return protocol_colorProvider_1.DocumentColorRequest;
    } });
    Object.defineProperty(exports2, "ColorPresentationRequest", { enumerable: true, get: function() {
      return protocol_colorProvider_1.ColorPresentationRequest;
    } });
    var protocol_foldingRange_1 = require_protocol_foldingRange();
    Object.defineProperty(exports2, "FoldingRangeRequest", { enumerable: true, get: function() {
      return protocol_foldingRange_1.FoldingRangeRequest;
    } });
    var protocol_declaration_1 = require_protocol_declaration();
    Object.defineProperty(exports2, "DeclarationRequest", { enumerable: true, get: function() {
      return protocol_declaration_1.DeclarationRequest;
    } });
    var protocol_selectionRange_1 = require_protocol_selectionRange();
    Object.defineProperty(exports2, "SelectionRangeRequest", { enumerable: true, get: function() {
      return protocol_selectionRange_1.SelectionRangeRequest;
    } });
    var protocol_progress_1 = require_protocol_progress();
    Object.defineProperty(exports2, "WorkDoneProgress", { enumerable: true, get: function() {
      return protocol_progress_1.WorkDoneProgress;
    } });
    Object.defineProperty(exports2, "WorkDoneProgressCreateRequest", { enumerable: true, get: function() {
      return protocol_progress_1.WorkDoneProgressCreateRequest;
    } });
    Object.defineProperty(exports2, "WorkDoneProgressCancelNotification", { enumerable: true, get: function() {
      return protocol_progress_1.WorkDoneProgressCancelNotification;
    } });
    var protocol_callHierarchy_1 = require_protocol_callHierarchy();
    Object.defineProperty(exports2, "CallHierarchyIncomingCallsRequest", { enumerable: true, get: function() {
      return protocol_callHierarchy_1.CallHierarchyIncomingCallsRequest;
    } });
    Object.defineProperty(exports2, "CallHierarchyOutgoingCallsRequest", { enumerable: true, get: function() {
      return protocol_callHierarchy_1.CallHierarchyOutgoingCallsRequest;
    } });
    Object.defineProperty(exports2, "CallHierarchyPrepareRequest", { enumerable: true, get: function() {
      return protocol_callHierarchy_1.CallHierarchyPrepareRequest;
    } });
    var protocol_semanticTokens_1 = require_protocol_semanticTokens();
    Object.defineProperty(exports2, "SemanticTokenTypes", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokenTypes;
    } });
    Object.defineProperty(exports2, "SemanticTokenModifiers", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokenModifiers;
    } });
    Object.defineProperty(exports2, "SemanticTokens", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokens;
    } });
    Object.defineProperty(exports2, "TokenFormat", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.TokenFormat;
    } });
    Object.defineProperty(exports2, "SemanticTokensRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensDeltaRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensDeltaRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensRangeRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRangeRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensRefreshRequest", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRefreshRequest;
    } });
    Object.defineProperty(exports2, "SemanticTokensRegistrationType", { enumerable: true, get: function() {
      return protocol_semanticTokens_1.SemanticTokensRegistrationType;
    } });
    var protocol_showDocument_1 = require_protocol_showDocument();
    Object.defineProperty(exports2, "ShowDocumentRequest", { enumerable: true, get: function() {
      return protocol_showDocument_1.ShowDocumentRequest;
    } });
    var protocol_linkedEditingRange_1 = require_protocol_linkedEditingRange();
    Object.defineProperty(exports2, "LinkedEditingRangeRequest", { enumerable: true, get: function() {
      return protocol_linkedEditingRange_1.LinkedEditingRangeRequest;
    } });
    var protocol_fileOperations_1 = require_protocol_fileOperations();
    Object.defineProperty(exports2, "FileOperationPatternKind", { enumerable: true, get: function() {
      return protocol_fileOperations_1.FileOperationPatternKind;
    } });
    Object.defineProperty(exports2, "DidCreateFilesNotification", { enumerable: true, get: function() {
      return protocol_fileOperations_1.DidCreateFilesNotification;
    } });
    Object.defineProperty(exports2, "WillCreateFilesRequest", { enumerable: true, get: function() {
      return protocol_fileOperations_1.WillCreateFilesRequest;
    } });
    Object.defineProperty(exports2, "DidRenameFilesNotification", { enumerable: true, get: function() {
      return protocol_fileOperations_1.DidRenameFilesNotification;
    } });
    Object.defineProperty(exports2, "WillRenameFilesRequest", { enumerable: true, get: function() {
      return protocol_fileOperations_1.WillRenameFilesRequest;
    } });
    Object.defineProperty(exports2, "DidDeleteFilesNotification", { enumerable: true, get: function() {
      return protocol_fileOperations_1.DidDeleteFilesNotification;
    } });
    Object.defineProperty(exports2, "WillDeleteFilesRequest", { enumerable: true, get: function() {
      return protocol_fileOperations_1.WillDeleteFilesRequest;
    } });
    var protocol_moniker_1 = require_protocol_moniker();
    Object.defineProperty(exports2, "UniquenessLevel", { enumerable: true, get: function() {
      return protocol_moniker_1.UniquenessLevel;
    } });
    Object.defineProperty(exports2, "MonikerKind", { enumerable: true, get: function() {
      return protocol_moniker_1.MonikerKind;
    } });
    Object.defineProperty(exports2, "MonikerRequest", { enumerable: true, get: function() {
      return protocol_moniker_1.MonikerRequest;
    } });
    var DocumentFilter;
    (function(DocumentFilter2) {
      function is(value) {
        const candidate = value;
        return Is.string(candidate.language) || Is.string(candidate.scheme) || Is.string(candidate.pattern);
      }
      DocumentFilter2.is = is;
    })(DocumentFilter = exports2.DocumentFilter || (exports2.DocumentFilter = {}));
    var DocumentSelector;
    (function(DocumentSelector2) {
      function is(value) {
        if (!Array.isArray(value)) {
          return false;
        }
        for (let elem of value) {
          if (!Is.string(elem) && !DocumentFilter.is(elem)) {
            return false;
          }
        }
        return true;
      }
      DocumentSelector2.is = is;
    })(DocumentSelector = exports2.DocumentSelector || (exports2.DocumentSelector = {}));
    var RegistrationRequest;
    (function(RegistrationRequest2) {
      RegistrationRequest2.type = new messages_1.ProtocolRequestType("client/registerCapability");
    })(RegistrationRequest = exports2.RegistrationRequest || (exports2.RegistrationRequest = {}));
    var UnregistrationRequest;
    (function(UnregistrationRequest2) {
      UnregistrationRequest2.type = new messages_1.ProtocolRequestType("client/unregisterCapability");
    })(UnregistrationRequest = exports2.UnregistrationRequest || (exports2.UnregistrationRequest = {}));
    var ResourceOperationKind;
    (function(ResourceOperationKind2) {
      ResourceOperationKind2.Create = "create";
      ResourceOperationKind2.Rename = "rename";
      ResourceOperationKind2.Delete = "delete";
    })(ResourceOperationKind = exports2.ResourceOperationKind || (exports2.ResourceOperationKind = {}));
    var FailureHandlingKind;
    (function(FailureHandlingKind2) {
      FailureHandlingKind2.Abort = "abort";
      FailureHandlingKind2.Transactional = "transactional";
      FailureHandlingKind2.TextOnlyTransactional = "textOnlyTransactional";
      FailureHandlingKind2.Undo = "undo";
    })(FailureHandlingKind = exports2.FailureHandlingKind || (exports2.FailureHandlingKind = {}));
    var StaticRegistrationOptions;
    (function(StaticRegistrationOptions2) {
      function hasId(value) {
        const candidate = value;
        return candidate && Is.string(candidate.id) && candidate.id.length > 0;
      }
      StaticRegistrationOptions2.hasId = hasId;
    })(StaticRegistrationOptions = exports2.StaticRegistrationOptions || (exports2.StaticRegistrationOptions = {}));
    var TextDocumentRegistrationOptions;
    (function(TextDocumentRegistrationOptions2) {
      function is(value) {
        const candidate = value;
        return candidate && (candidate.documentSelector === null || DocumentSelector.is(candidate.documentSelector));
      }
      TextDocumentRegistrationOptions2.is = is;
    })(TextDocumentRegistrationOptions = exports2.TextDocumentRegistrationOptions || (exports2.TextDocumentRegistrationOptions = {}));
    var WorkDoneProgressOptions;
    (function(WorkDoneProgressOptions2) {
      function is(value) {
        const candidate = value;
        return Is.objectLiteral(candidate) && (candidate.workDoneProgress === void 0 || Is.boolean(candidate.workDoneProgress));
      }
      WorkDoneProgressOptions2.is = is;
      function hasWorkDoneProgress(value) {
        const candidate = value;
        return candidate && Is.boolean(candidate.workDoneProgress);
      }
      WorkDoneProgressOptions2.hasWorkDoneProgress = hasWorkDoneProgress;
    })(WorkDoneProgressOptions = exports2.WorkDoneProgressOptions || (exports2.WorkDoneProgressOptions = {}));
    var InitializeRequest;
    (function(InitializeRequest2) {
      InitializeRequest2.type = new messages_1.ProtocolRequestType("initialize");
    })(InitializeRequest = exports2.InitializeRequest || (exports2.InitializeRequest = {}));
    var InitializeError;
    (function(InitializeError2) {
      InitializeError2.unknownProtocolVersion = 1;
    })(InitializeError = exports2.InitializeError || (exports2.InitializeError = {}));
    var InitializedNotification;
    (function(InitializedNotification2) {
      InitializedNotification2.type = new messages_1.ProtocolNotificationType("initialized");
    })(InitializedNotification = exports2.InitializedNotification || (exports2.InitializedNotification = {}));
    var ShutdownRequest;
    (function(ShutdownRequest2) {
      ShutdownRequest2.type = new messages_1.ProtocolRequestType0("shutdown");
    })(ShutdownRequest = exports2.ShutdownRequest || (exports2.ShutdownRequest = {}));
    var ExitNotification;
    (function(ExitNotification2) {
      ExitNotification2.type = new messages_1.ProtocolNotificationType0("exit");
    })(ExitNotification = exports2.ExitNotification || (exports2.ExitNotification = {}));
    var DidChangeConfigurationNotification;
    (function(DidChangeConfigurationNotification2) {
      DidChangeConfigurationNotification2.type = new messages_1.ProtocolNotificationType("workspace/didChangeConfiguration");
    })(DidChangeConfigurationNotification = exports2.DidChangeConfigurationNotification || (exports2.DidChangeConfigurationNotification = {}));
    var MessageType;
    (function(MessageType2) {
      MessageType2.Error = 1;
      MessageType2.Warning = 2;
      MessageType2.Info = 3;
      MessageType2.Log = 4;
    })(MessageType = exports2.MessageType || (exports2.MessageType = {}));
    var ShowMessageNotification;
    (function(ShowMessageNotification2) {
      ShowMessageNotification2.type = new messages_1.ProtocolNotificationType("window/showMessage");
    })(ShowMessageNotification = exports2.ShowMessageNotification || (exports2.ShowMessageNotification = {}));
    var ShowMessageRequest;
    (function(ShowMessageRequest2) {
      ShowMessageRequest2.type = new messages_1.ProtocolRequestType("window/showMessageRequest");
    })(ShowMessageRequest = exports2.ShowMessageRequest || (exports2.ShowMessageRequest = {}));
    var LogMessageNotification;
    (function(LogMessageNotification2) {
      LogMessageNotification2.type = new messages_1.ProtocolNotificationType("window/logMessage");
    })(LogMessageNotification = exports2.LogMessageNotification || (exports2.LogMessageNotification = {}));
    var TelemetryEventNotification;
    (function(TelemetryEventNotification2) {
      TelemetryEventNotification2.type = new messages_1.ProtocolNotificationType("telemetry/event");
    })(TelemetryEventNotification = exports2.TelemetryEventNotification || (exports2.TelemetryEventNotification = {}));
    var TextDocumentSyncKind;
    (function(TextDocumentSyncKind2) {
      TextDocumentSyncKind2.None = 0;
      TextDocumentSyncKind2.Full = 1;
      TextDocumentSyncKind2.Incremental = 2;
    })(TextDocumentSyncKind = exports2.TextDocumentSyncKind || (exports2.TextDocumentSyncKind = {}));
    var DidOpenTextDocumentNotification;
    (function(DidOpenTextDocumentNotification2) {
      DidOpenTextDocumentNotification2.method = "textDocument/didOpen";
      DidOpenTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidOpenTextDocumentNotification2.method);
    })(DidOpenTextDocumentNotification = exports2.DidOpenTextDocumentNotification || (exports2.DidOpenTextDocumentNotification = {}));
    var TextDocumentContentChangeEvent;
    (function(TextDocumentContentChangeEvent2) {
      function isIncremental(event) {
        let candidate = event;
        return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range !== void 0 && (candidate.rangeLength === void 0 || typeof candidate.rangeLength === "number");
      }
      TextDocumentContentChangeEvent2.isIncremental = isIncremental;
      function isFull(event) {
        let candidate = event;
        return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range === void 0 && candidate.rangeLength === void 0;
      }
      TextDocumentContentChangeEvent2.isFull = isFull;
    })(TextDocumentContentChangeEvent = exports2.TextDocumentContentChangeEvent || (exports2.TextDocumentContentChangeEvent = {}));
    var DidChangeTextDocumentNotification;
    (function(DidChangeTextDocumentNotification2) {
      DidChangeTextDocumentNotification2.method = "textDocument/didChange";
      DidChangeTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidChangeTextDocumentNotification2.method);
    })(DidChangeTextDocumentNotification = exports2.DidChangeTextDocumentNotification || (exports2.DidChangeTextDocumentNotification = {}));
    var DidCloseTextDocumentNotification;
    (function(DidCloseTextDocumentNotification2) {
      DidCloseTextDocumentNotification2.method = "textDocument/didClose";
      DidCloseTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidCloseTextDocumentNotification2.method);
    })(DidCloseTextDocumentNotification = exports2.DidCloseTextDocumentNotification || (exports2.DidCloseTextDocumentNotification = {}));
    var DidSaveTextDocumentNotification;
    (function(DidSaveTextDocumentNotification2) {
      DidSaveTextDocumentNotification2.method = "textDocument/didSave";
      DidSaveTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidSaveTextDocumentNotification2.method);
    })(DidSaveTextDocumentNotification = exports2.DidSaveTextDocumentNotification || (exports2.DidSaveTextDocumentNotification = {}));
    var TextDocumentSaveReason;
    (function(TextDocumentSaveReason2) {
      TextDocumentSaveReason2.Manual = 1;
      TextDocumentSaveReason2.AfterDelay = 2;
      TextDocumentSaveReason2.FocusOut = 3;
    })(TextDocumentSaveReason = exports2.TextDocumentSaveReason || (exports2.TextDocumentSaveReason = {}));
    var WillSaveTextDocumentNotification;
    (function(WillSaveTextDocumentNotification2) {
      WillSaveTextDocumentNotification2.method = "textDocument/willSave";
      WillSaveTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(WillSaveTextDocumentNotification2.method);
    })(WillSaveTextDocumentNotification = exports2.WillSaveTextDocumentNotification || (exports2.WillSaveTextDocumentNotification = {}));
    var WillSaveTextDocumentWaitUntilRequest;
    (function(WillSaveTextDocumentWaitUntilRequest2) {
      WillSaveTextDocumentWaitUntilRequest2.method = "textDocument/willSaveWaitUntil";
      WillSaveTextDocumentWaitUntilRequest2.type = new messages_1.ProtocolRequestType(WillSaveTextDocumentWaitUntilRequest2.method);
    })(WillSaveTextDocumentWaitUntilRequest = exports2.WillSaveTextDocumentWaitUntilRequest || (exports2.WillSaveTextDocumentWaitUntilRequest = {}));
    var DidChangeWatchedFilesNotification;
    (function(DidChangeWatchedFilesNotification2) {
      DidChangeWatchedFilesNotification2.type = new messages_1.ProtocolNotificationType("workspace/didChangeWatchedFiles");
    })(DidChangeWatchedFilesNotification = exports2.DidChangeWatchedFilesNotification || (exports2.DidChangeWatchedFilesNotification = {}));
    var FileChangeType;
    (function(FileChangeType2) {
      FileChangeType2.Created = 1;
      FileChangeType2.Changed = 2;
      FileChangeType2.Deleted = 3;
    })(FileChangeType = exports2.FileChangeType || (exports2.FileChangeType = {}));
    var WatchKind;
    (function(WatchKind2) {
      WatchKind2.Create = 1;
      WatchKind2.Change = 2;
      WatchKind2.Delete = 4;
    })(WatchKind = exports2.WatchKind || (exports2.WatchKind = {}));
    var PublishDiagnosticsNotification;
    (function(PublishDiagnosticsNotification2) {
      PublishDiagnosticsNotification2.type = new messages_1.ProtocolNotificationType("textDocument/publishDiagnostics");
    })(PublishDiagnosticsNotification = exports2.PublishDiagnosticsNotification || (exports2.PublishDiagnosticsNotification = {}));
    var CompletionTriggerKind;
    (function(CompletionTriggerKind2) {
      CompletionTriggerKind2.Invoked = 1;
      CompletionTriggerKind2.TriggerCharacter = 2;
      CompletionTriggerKind2.TriggerForIncompleteCompletions = 3;
    })(CompletionTriggerKind = exports2.CompletionTriggerKind || (exports2.CompletionTriggerKind = {}));
    var CompletionRequest;
    (function(CompletionRequest2) {
      CompletionRequest2.method = "textDocument/completion";
      CompletionRequest2.type = new messages_1.ProtocolRequestType(CompletionRequest2.method);
    })(CompletionRequest = exports2.CompletionRequest || (exports2.CompletionRequest = {}));
    var CompletionResolveRequest;
    (function(CompletionResolveRequest2) {
      CompletionResolveRequest2.method = "completionItem/resolve";
      CompletionResolveRequest2.type = new messages_1.ProtocolRequestType(CompletionResolveRequest2.method);
    })(CompletionResolveRequest = exports2.CompletionResolveRequest || (exports2.CompletionResolveRequest = {}));
    var HoverRequest;
    (function(HoverRequest2) {
      HoverRequest2.method = "textDocument/hover";
      HoverRequest2.type = new messages_1.ProtocolRequestType(HoverRequest2.method);
    })(HoverRequest = exports2.HoverRequest || (exports2.HoverRequest = {}));
    var SignatureHelpTriggerKind;
    (function(SignatureHelpTriggerKind2) {
      SignatureHelpTriggerKind2.Invoked = 1;
      SignatureHelpTriggerKind2.TriggerCharacter = 2;
      SignatureHelpTriggerKind2.ContentChange = 3;
    })(SignatureHelpTriggerKind = exports2.SignatureHelpTriggerKind || (exports2.SignatureHelpTriggerKind = {}));
    var SignatureHelpRequest;
    (function(SignatureHelpRequest2) {
      SignatureHelpRequest2.method = "textDocument/signatureHelp";
      SignatureHelpRequest2.type = new messages_1.ProtocolRequestType(SignatureHelpRequest2.method);
    })(SignatureHelpRequest = exports2.SignatureHelpRequest || (exports2.SignatureHelpRequest = {}));
    var DefinitionRequest;
    (function(DefinitionRequest2) {
      DefinitionRequest2.method = "textDocument/definition";
      DefinitionRequest2.type = new messages_1.ProtocolRequestType(DefinitionRequest2.method);
    })(DefinitionRequest = exports2.DefinitionRequest || (exports2.DefinitionRequest = {}));
    var ReferencesRequest;
    (function(ReferencesRequest2) {
      ReferencesRequest2.method = "textDocument/references";
      ReferencesRequest2.type = new messages_1.ProtocolRequestType(ReferencesRequest2.method);
    })(ReferencesRequest = exports2.ReferencesRequest || (exports2.ReferencesRequest = {}));
    var DocumentHighlightRequest;
    (function(DocumentHighlightRequest2) {
      DocumentHighlightRequest2.method = "textDocument/documentHighlight";
      DocumentHighlightRequest2.type = new messages_1.ProtocolRequestType(DocumentHighlightRequest2.method);
    })(DocumentHighlightRequest = exports2.DocumentHighlightRequest || (exports2.DocumentHighlightRequest = {}));
    var DocumentSymbolRequest;
    (function(DocumentSymbolRequest2) {
      DocumentSymbolRequest2.method = "textDocument/documentSymbol";
      DocumentSymbolRequest2.type = new messages_1.ProtocolRequestType(DocumentSymbolRequest2.method);
    })(DocumentSymbolRequest = exports2.DocumentSymbolRequest || (exports2.DocumentSymbolRequest = {}));
    var CodeActionRequest;
    (function(CodeActionRequest2) {
      CodeActionRequest2.method = "textDocument/codeAction";
      CodeActionRequest2.type = new messages_1.ProtocolRequestType(CodeActionRequest2.method);
    })(CodeActionRequest = exports2.CodeActionRequest || (exports2.CodeActionRequest = {}));
    var CodeActionResolveRequest;
    (function(CodeActionResolveRequest2) {
      CodeActionResolveRequest2.method = "codeAction/resolve";
      CodeActionResolveRequest2.type = new messages_1.ProtocolRequestType(CodeActionResolveRequest2.method);
    })(CodeActionResolveRequest = exports2.CodeActionResolveRequest || (exports2.CodeActionResolveRequest = {}));
    var WorkspaceSymbolRequest;
    (function(WorkspaceSymbolRequest2) {
      WorkspaceSymbolRequest2.method = "workspace/symbol";
      WorkspaceSymbolRequest2.type = new messages_1.ProtocolRequestType(WorkspaceSymbolRequest2.method);
    })(WorkspaceSymbolRequest = exports2.WorkspaceSymbolRequest || (exports2.WorkspaceSymbolRequest = {}));
    var CodeLensRequest;
    (function(CodeLensRequest2) {
      CodeLensRequest2.method = "textDocument/codeLens";
      CodeLensRequest2.type = new messages_1.ProtocolRequestType(CodeLensRequest2.method);
    })(CodeLensRequest = exports2.CodeLensRequest || (exports2.CodeLensRequest = {}));
    var CodeLensResolveRequest;
    (function(CodeLensResolveRequest2) {
      CodeLensResolveRequest2.method = "codeLens/resolve";
      CodeLensResolveRequest2.type = new messages_1.ProtocolRequestType(CodeLensResolveRequest2.method);
    })(CodeLensResolveRequest = exports2.CodeLensResolveRequest || (exports2.CodeLensResolveRequest = {}));
    var CodeLensRefreshRequest;
    (function(CodeLensRefreshRequest2) {
      CodeLensRefreshRequest2.method = `workspace/codeLens/refresh`;
      CodeLensRefreshRequest2.type = new messages_1.ProtocolRequestType0(CodeLensRefreshRequest2.method);
    })(CodeLensRefreshRequest = exports2.CodeLensRefreshRequest || (exports2.CodeLensRefreshRequest = {}));
    var DocumentLinkRequest;
    (function(DocumentLinkRequest2) {
      DocumentLinkRequest2.method = "textDocument/documentLink";
      DocumentLinkRequest2.type = new messages_1.ProtocolRequestType(DocumentLinkRequest2.method);
    })(DocumentLinkRequest = exports2.DocumentLinkRequest || (exports2.DocumentLinkRequest = {}));
    var DocumentLinkResolveRequest;
    (function(DocumentLinkResolveRequest2) {
      DocumentLinkResolveRequest2.method = "documentLink/resolve";
      DocumentLinkResolveRequest2.type = new messages_1.ProtocolRequestType(DocumentLinkResolveRequest2.method);
    })(DocumentLinkResolveRequest = exports2.DocumentLinkResolveRequest || (exports2.DocumentLinkResolveRequest = {}));
    var DocumentFormattingRequest;
    (function(DocumentFormattingRequest2) {
      DocumentFormattingRequest2.method = "textDocument/formatting";
      DocumentFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentFormattingRequest2.method);
    })(DocumentFormattingRequest = exports2.DocumentFormattingRequest || (exports2.DocumentFormattingRequest = {}));
    var DocumentRangeFormattingRequest;
    (function(DocumentRangeFormattingRequest2) {
      DocumentRangeFormattingRequest2.method = "textDocument/rangeFormatting";
      DocumentRangeFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentRangeFormattingRequest2.method);
    })(DocumentRangeFormattingRequest = exports2.DocumentRangeFormattingRequest || (exports2.DocumentRangeFormattingRequest = {}));
    var DocumentOnTypeFormattingRequest;
    (function(DocumentOnTypeFormattingRequest2) {
      DocumentOnTypeFormattingRequest2.method = "textDocument/onTypeFormatting";
      DocumentOnTypeFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentOnTypeFormattingRequest2.method);
    })(DocumentOnTypeFormattingRequest = exports2.DocumentOnTypeFormattingRequest || (exports2.DocumentOnTypeFormattingRequest = {}));
    var PrepareSupportDefaultBehavior;
    (function(PrepareSupportDefaultBehavior2) {
      PrepareSupportDefaultBehavior2.Identifier = 1;
    })(PrepareSupportDefaultBehavior = exports2.PrepareSupportDefaultBehavior || (exports2.PrepareSupportDefaultBehavior = {}));
    var RenameRequest;
    (function(RenameRequest2) {
      RenameRequest2.method = "textDocument/rename";
      RenameRequest2.type = new messages_1.ProtocolRequestType(RenameRequest2.method);
    })(RenameRequest = exports2.RenameRequest || (exports2.RenameRequest = {}));
    var PrepareRenameRequest;
    (function(PrepareRenameRequest2) {
      PrepareRenameRequest2.method = "textDocument/prepareRename";
      PrepareRenameRequest2.type = new messages_1.ProtocolRequestType(PrepareRenameRequest2.method);
    })(PrepareRenameRequest = exports2.PrepareRenameRequest || (exports2.PrepareRenameRequest = {}));
    var ExecuteCommandRequest;
    (function(ExecuteCommandRequest2) {
      ExecuteCommandRequest2.type = new messages_1.ProtocolRequestType("workspace/executeCommand");
    })(ExecuteCommandRequest = exports2.ExecuteCommandRequest || (exports2.ExecuteCommandRequest = {}));
    var ApplyWorkspaceEditRequest;
    (function(ApplyWorkspaceEditRequest2) {
      ApplyWorkspaceEditRequest2.type = new messages_1.ProtocolRequestType("workspace/applyEdit");
    })(ApplyWorkspaceEditRequest = exports2.ApplyWorkspaceEditRequest || (exports2.ApplyWorkspaceEditRequest = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/connection.js
var require_connection = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/connection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createProtocolConnection = void 0;
    var vscode_jsonrpc_1 = require("vscode-jsonrpc");
    function createProtocolConnection(input, output, logger, options) {
      if (vscode_jsonrpc_1.ConnectionStrategy.is(options)) {
        options = { connectionStrategy: options };
      }
      return vscode_jsonrpc_1.createMessageConnection(input, output, logger, options);
    }
    exports2.createProtocolConnection = createProtocolConnection;
  }
});

// node_modules/vscode-languageserver-protocol/lib/common/api.js
var require_api2 = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/common/api.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LSPErrorCodes = exports2.createProtocolConnection = void 0;
    __exportStar(require("vscode-jsonrpc"), exports2);
    __exportStar(require_main(), exports2);
    __exportStar(require_messages(), exports2);
    __exportStar(require_protocol(), exports2);
    var connection_1 = require_connection();
    Object.defineProperty(exports2, "createProtocolConnection", { enumerable: true, get: function() {
      return connection_1.createProtocolConnection;
    } });
    var LSPErrorCodes;
    (function(LSPErrorCodes2) {
      LSPErrorCodes2.lspReservedErrorRangeStart = -32899;
      LSPErrorCodes2.ContentModified = -32801;
      LSPErrorCodes2.RequestCancelled = -32800;
      LSPErrorCodes2.lspReservedErrorRangeEnd = -32800;
    })(LSPErrorCodes = exports2.LSPErrorCodes || (exports2.LSPErrorCodes = {}));
  }
});

// node_modules/vscode-languageserver-protocol/lib/node/main.js
var require_main2 = __commonJS({
  "node_modules/vscode-languageserver-protocol/lib/node/main.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createProtocolConnection = void 0;
    var node_1 = require("vscode-jsonrpc/node");
    __exportStar(require("vscode-jsonrpc/node"), exports2);
    __exportStar(require_api2(), exports2);
    function createProtocolConnection(input, output, logger, options) {
      return node_1.createMessageConnection(input, output, logger, options);
    }
    exports2.createProtocolConnection = createProtocolConnection;
  }
});

// dist/common/requests.js
var require_requests = __commonJS({
  "dist/common/requests.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.IsInAngularProject = exports2.GetTcbRequest = exports2.GetComponentsWithTemplateFile = void 0;
    var lsp = require_main2();
    exports2.GetComponentsWithTemplateFile = new lsp.RequestType("angular/getComponentsWithTemplateFile");
    exports2.GetTcbRequest = new lsp.RequestType("angular/getTcb");
    exports2.IsInAngularProject = new lsp.RequestType("angular/isAngularCoreInOwningProject");
  }
});

// dist/server/utils.js
var require_utils = __commonJS({
  "dist/server/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.tsDisplayPartsToText = exports2.MruTracker = exports2.isConfiguredProject = exports2.lspRangeToTsPositions = exports2.lspPositionToTsPosition = exports2.tsTextSpanToLspRange = exports2.filePathToUri = exports2.uriToFilePath = exports2.isDebugMode = void 0;
    var ts = require("typescript/lib/tsserverlibrary");
    var lsp = require("vscode-languageserver");
    var vscode_uri_1 = require("vscode-uri");
    exports2.isDebugMode = process.env["NG_DEBUG"] === "true";
    var Scheme;
    (function(Scheme2) {
      Scheme2["File"] = "file";
    })(Scheme || (Scheme = {}));
    function uriToFilePath(uri) {
      const { scheme, fsPath } = vscode_uri_1.URI.parse(uri);
      if (scheme !== Scheme.File) {
        return "";
      }
      return fsPath;
    }
    exports2.uriToFilePath = uriToFilePath;
    function filePathToUri(filePath) {
      return vscode_uri_1.URI.file(filePath).toString();
    }
    exports2.filePathToUri = filePathToUri;
    function tsTextSpanToLspRange(scriptInfo, textSpan) {
      const start = scriptInfo.positionToLineOffset(textSpan.start);
      const end = scriptInfo.positionToLineOffset(textSpan.start + textSpan.length);
      return lsp.Range.create(start.line - 1, start.offset - 1, end.line - 1, end.offset - 1);
    }
    exports2.tsTextSpanToLspRange = tsTextSpanToLspRange;
    function lspPositionToTsPosition(scriptInfo, position) {
      const { line, character } = position;
      return scriptInfo.lineOffsetToPosition(line + 1, character + 1);
    }
    exports2.lspPositionToTsPosition = lspPositionToTsPosition;
    function lspRangeToTsPositions(scriptInfo, range) {
      const start = lspPositionToTsPosition(scriptInfo, range.start);
      const end = lspPositionToTsPosition(scriptInfo, range.end);
      return [start, end];
    }
    exports2.lspRangeToTsPositions = lspRangeToTsPositions;
    function isConfiguredProject(project) {
      return project.projectKind === ts.server.ProjectKind.Configured;
    }
    exports2.isConfiguredProject = isConfiguredProject;
    var MruTracker = class {
      constructor() {
        this.set = new Set();
      }
      update(item) {
        if (this.set.has(item)) {
          this.set.delete(item);
        }
        this.set.add(item);
      }
      delete(item) {
        this.set.delete(item);
      }
      getAll() {
        return [...this.set].reverse();
      }
    };
    exports2.MruTracker = MruTracker;
    function tsDisplayPartsToText(parts) {
      return parts.map((dp) => dp.text).join("");
    }
    exports2.tsDisplayPartsToText = tsDisplayPartsToText;
  }
});

// dist/server/completion.js
var require_completion = __commonJS({
  "dist/server/completion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.tsCompletionEntryToLspCompletionItem = exports2.readNgCompletionData = void 0;
    var lsp = require("vscode-languageserver");
    var utils_1 = require_utils();
    var CompletionKind;
    (function(CompletionKind2) {
      CompletionKind2["attribute"] = "attribute";
      CompletionKind2["htmlAttribute"] = "html attribute";
      CompletionKind2["property"] = "property";
      CompletionKind2["component"] = "component";
      CompletionKind2["directive"] = "directive";
      CompletionKind2["element"] = "element";
      CompletionKind2["event"] = "event";
      CompletionKind2["key"] = "key";
      CompletionKind2["method"] = "method";
      CompletionKind2["pipe"] = "pipe";
      CompletionKind2["type"] = "type";
      CompletionKind2["reference"] = "reference";
      CompletionKind2["variable"] = "variable";
      CompletionKind2["entity"] = "entity";
    })(CompletionKind || (CompletionKind = {}));
    function readNgCompletionData(item) {
      if (item.data === void 0) {
        return null;
      }
      const data = item.data;
      if (data.kind !== "ngCompletionOriginData") {
        return null;
      }
      return data;
    }
    exports2.readNgCompletionData = readNgCompletionData;
    function ngCompletionKindToLspCompletionItemKind(kind) {
      switch (kind) {
        case CompletionKind.attribute:
        case CompletionKind.htmlAttribute:
        case CompletionKind.property:
        case CompletionKind.event:
          return lsp.CompletionItemKind.Property;
        case CompletionKind.directive:
        case CompletionKind.component:
        case CompletionKind.element:
        case CompletionKind.key:
          return lsp.CompletionItemKind.Class;
        case CompletionKind.method:
          return lsp.CompletionItemKind.Method;
        case CompletionKind.pipe:
          return lsp.CompletionItemKind.Function;
        case CompletionKind.type:
          return lsp.CompletionItemKind.Interface;
        case CompletionKind.reference:
        case CompletionKind.variable:
          return lsp.CompletionItemKind.Variable;
        case CompletionKind.entity:
        default:
          return lsp.CompletionItemKind.Text;
      }
    }
    function tsCompletionEntryToLspCompletionItem(entry, position, scriptInfo, insertReplaceSupport) {
      const item = lsp.CompletionItem.create(entry.name);
      const kind = entry.kind;
      item.kind = ngCompletionKindToLspCompletionItemKind(kind);
      item.detail = entry.kind;
      item.sortText = entry.sortText;
      const insertText = entry.insertText || entry.name;
      item.textEdit = createTextEdit(scriptInfo, entry, position, insertText, insertReplaceSupport);
      item.data = {
        kind: "ngCompletionOriginData",
        filePath: scriptInfo.fileName,
        position
      };
      return item;
    }
    exports2.tsCompletionEntryToLspCompletionItem = tsCompletionEntryToLspCompletionItem;
    function createTextEdit(scriptInfo, entry, position, insertText, insertReplaceSupport) {
      if (entry.replacementSpan === void 0) {
        return lsp.TextEdit.insert(position, insertText);
      } else if (insertReplaceSupport) {
        const replacementRange = utils_1.tsTextSpanToLspRange(scriptInfo, entry.replacementSpan);
        const tsPosition = utils_1.lspPositionToTsPosition(scriptInfo, position);
        const insertLength = tsPosition - entry.replacementSpan.start;
        const insertionRange = utils_1.tsTextSpanToLspRange(scriptInfo, Object.assign(Object.assign({}, entry.replacementSpan), { length: insertLength }));
        return lsp.InsertReplaceEdit.create(insertText, insertionRange, replacementRange);
      } else {
        return lsp.TextEdit.replace(utils_1.tsTextSpanToLspRange(scriptInfo, entry.replacementSpan), insertText);
      }
    }
  }
});

// dist/server/diagnostic.js
var require_diagnostic = __commonJS({
  "dist/server/diagnostic.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.tsDiagnosticToLspDiagnostic = void 0;
    var ts = require("typescript/lib/tsserverlibrary");
    var lsp = require("vscode-languageserver");
    var utils_1 = require_utils();
    function tsDiagnosticCategoryToLspDiagnosticSeverity(category) {
      switch (category) {
        case ts.DiagnosticCategory.Warning:
          return lsp.DiagnosticSeverity.Warning;
        case ts.DiagnosticCategory.Error:
          return lsp.DiagnosticSeverity.Error;
        case ts.DiagnosticCategory.Suggestion:
          return lsp.DiagnosticSeverity.Hint;
        case ts.DiagnosticCategory.Message:
        default:
          return lsp.DiagnosticSeverity.Information;
      }
    }
    function tsDiagnosticToLspDiagnostic(tsDiag, scriptInfo) {
      const textSpan = {
        start: tsDiag.start || 0,
        length: tsDiag.length || 0
      };
      return lsp.Diagnostic.create(utils_1.tsTextSpanToLspRange(scriptInfo, textSpan), ts.flattenDiagnosticMessageText(tsDiag.messageText, "\n"), tsDiagnosticCategoryToLspDiagnosticSeverity(tsDiag.category), tsDiag.code, tsDiag.source);
    }
    exports2.tsDiagnosticToLspDiagnostic = tsDiagnosticToLspDiagnostic;
  }
});

// dist/common/resolver.js
var require_resolver = __commonJS({
  "dist/common/resolver.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Version = exports2.resolve = void 0;
    var fs = require("fs");
    function resolve(packageName, location, rootPackage) {
      rootPackage = rootPackage || packageName;
      try {
        const packageJsonPath = require.resolve(`${rootPackage}/package.json`, {
          paths: [location]
        });
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        const resolvedPath = require.resolve(packageName, {
          paths: [location]
        });
        return {
          name: packageName,
          resolvedPath,
          version: new Version(packageJson.version)
        };
      } catch (_a) {
      }
    }
    exports2.resolve = resolve;
    var Version = class {
      constructor(versionStr) {
        this.versionStr = versionStr;
        const [major, minor, patch] = Version.parseVersionStr(versionStr);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
      }
      greaterThanOrEqual(other) {
        if (this.major < other.major) {
          return false;
        }
        if (this.major > other.major) {
          return true;
        }
        if (this.minor < other.minor) {
          return false;
        }
        if (this.minor > other.minor) {
          return true;
        }
        return this.patch >= other.patch;
      }
      toString() {
        return this.versionStr;
      }
      static parseVersionStr(versionStr) {
        const [major, minor, patch] = versionStr.split(".").map(parseNonNegativeInt);
        return [
          major === void 0 ? 0 : major,
          minor === void 0 ? 0 : minor,
          patch === void 0 ? 0 : patch
        ];
      }
    };
    exports2.Version = Version;
    function parseNonNegativeInt(a) {
      const i = parseInt(a, 10);
      return isNaN(i) ? -1 : i;
    }
  }
});

// dist/server/version_provider.js
var require_version_provider = __commonJS({
  "dist/server/version_provider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveNgcc = exports2.loadEsmModule = exports2.resolveNgLangSvc = exports2.resolveTsServer = void 0;
    var fs = require("fs");
    var path = require("path");
    var url = require("url");
    var resolver_1 = require_resolver();
    var MIN_TS_VERSION = "4.2";
    var MIN_NG_VERSION = "12.0";
    var TSSERVERLIB = "typescript/lib/tsserverlibrary";
    function resolveWithMinVersion(packageName, minVersionStr, probeLocations, rootPackage) {
      if (!packageName.startsWith(rootPackage)) {
        throw new Error(`${packageName} must be in the root package`);
      }
      const minVersion = new resolver_1.Version(minVersionStr);
      for (const location of probeLocations) {
        const nodeModule = resolver_1.resolve(packageName, location, rootPackage);
        if (nodeModule && nodeModule.version.greaterThanOrEqual(minVersion)) {
          return nodeModule;
        }
      }
      throw new Error(`Failed to resolve '${packageName}' with minimum version '${minVersion}' from ` + JSON.stringify(probeLocations, null, 2));
    }
    function resolveTsServer(probeLocations) {
      if (probeLocations.length > 0) {
        const resolvedFromTsdk = resolveTsServerFromTsdk(probeLocations[0]);
        if (resolvedFromTsdk !== void 0) {
          return resolvedFromTsdk;
        }
      }
      return resolveWithMinVersion(TSSERVERLIB, MIN_TS_VERSION, probeLocations, "typescript");
    }
    exports2.resolveTsServer = resolveTsServer;
    function resolveTsServerFromTsdk(tsdk) {
      if (!path.isAbsolute(tsdk)) {
        return void 0;
      }
      const tsserverlib = path.join(tsdk, "tsserverlibrary.js");
      if (!fs.existsSync(tsserverlib)) {
        return void 0;
      }
      const packageJson = path.resolve(tsserverlib, "../../package.json");
      if (!fs.existsSync(packageJson)) {
        return void 0;
      }
      try {
        const json = JSON.parse(fs.readFileSync(packageJson, "utf8"));
        return {
          name: TSSERVERLIB,
          resolvedPath: tsserverlib,
          version: new resolver_1.Version(json.version)
        };
      } catch (_a) {
        return void 0;
      }
    }
    function resolveNgLangSvc(probeLocations) {
      const ngls = "@angular/language-service";
      return resolveWithMinVersion(ngls, MIN_NG_VERSION, probeLocations, ngls);
    }
    exports2.resolveNgLangSvc = resolveNgLangSvc;
    function loadEsmModule(modulePath) {
      return new Function("modulePath", `return import(modulePath);`)(modulePath);
    }
    exports2.loadEsmModule = loadEsmModule;
    async function resolveNgcc(directory) {
      try {
        const ngcc = resolver_1.resolve("@angular/compiler-cli/ngcc", directory, "@angular/compiler-cli");
        if (ngcc === void 0) {
          throw new Error("Could not resolve ngcc");
        }
        const ngccModule = await loadEsmModule(url.pathToFileURL(ngcc.resolvedPath));
        const resolvedPath = ngccModule.ngccMainFilePath;
        if (resolvedPath === void 0) {
          throw new Error("Could not resolve ngcc path.");
        }
        return Object.assign(Object.assign({}, ngcc), { resolvedPath });
      } catch (e) {
        return resolver_1.resolve("@angular/compiler-cli/ngcc/main-ngcc.js", directory, "@angular/compiler-cli");
      }
    }
    exports2.resolveNgcc = resolveNgcc;
  }
});

// dist/server/ngcc.js
var require_ngcc = __commonJS({
  "dist/server/ngcc.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveAndRunNgcc = void 0;
    var child_process_1 = require("child_process");
    var path_1 = require("path");
    var resolver_1 = require_resolver();
    var version_provider_12 = require_version_provider();
    async function resolveAndRunNgcc(tsconfig, progress) {
      var _a, _b;
      const directory = path_1.dirname(tsconfig);
      const ngcc = await version_provider_12.resolveNgcc(directory);
      if (!ngcc) {
        throw new Error(`Failed to resolve ngcc from ${directory}`);
      }
      const index = ngcc.resolvedPath.lastIndexOf("node_modules");
      const cwd = index > 0 ? ngcc.resolvedPath.slice(0, index) : process.cwd();
      const args = [
        "--tsconfig",
        tsconfig
      ];
      if (ngcc.version.greaterThanOrEqual(new resolver_1.Version("11.2.4"))) {
        args.push("--typings-only");
      }
      const childProcess = child_process_1.fork(ngcc.resolvedPath, args, {
        cwd: path_1.resolve(cwd),
        silent: true,
        execArgv: []
      });
      let stderr = "";
      (_a = childProcess.stderr) === null || _a === void 0 ? void 0 : _a.on("data", (data) => {
        stderr += data.toString();
      });
      (_b = childProcess.stdout) === null || _b === void 0 ? void 0 : _b.on("data", (data) => {
        for (let entry of data.toString().split("\n")) {
          entry = entry.trim();
          if (entry) {
            progress.report(entry);
          }
        }
      });
      return new Promise((resolve, reject) => {
        childProcess.on("error", (error) => {
          reject(error);
        });
        childProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`ngcc for ${tsconfig} returned exit code ${code}, stderr: ${stderr.trim()}`));
          }
        });
      });
    }
    exports2.resolveAndRunNgcc = resolveAndRunNgcc;
  }
});

// dist/server/session.js
var require_session = __commonJS({
  "dist/server/session.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Session = void 0;
    var api_1 = require_api();
    var assert = require("assert");
    var ts = require("typescript/lib/tsserverlibrary");
    var util_1 = require("util");
    var lsp = require("vscode-languageserver/node");
    var notifications_1 = require_notifications();
    var progress_1 = require_progress();
    var requests_1 = require_requests();
    var completion_1 = require_completion();
    var diagnostic_1 = require_diagnostic();
    var ngcc_1 = require_ngcc();
    var utils_1 = require_utils();
    var LanguageId;
    (function(LanguageId2) {
      LanguageId2["TS"] = "typescript";
      LanguageId2["HTML"] = "html";
    })(LanguageId || (LanguageId = {}));
    var EMPTY_RANGE = lsp.Range.create(0, 0, 0, 0);
    var setImmediateP = util_1.promisify(setImmediate);
    var Session = class {
      constructor(options) {
        this.configuredProjToExternalProj = new Map();
        this.openFiles = new utils_1.MruTracker();
        this.projectNgccQueue = [];
        this.diagnosticsTimeout = null;
        this.isProjectLoading = false;
        this.renameDisabledProjects = new WeakSet();
        this.clientCapabilities = {};
        this.logger = options.logger;
        this.ivy = options.ivy;
        this.logToConsole = options.logToConsole;
        this.connection = lsp.createConnection({
          cancelUndispatched(message) {
            return {
              jsonrpc: message.jsonrpc,
              id: -1,
              error: new lsp.ResponseError(lsp.LSPErrorCodes.RequestCancelled, "Request cancelled")
            };
          }
        });
        this.addProtocolHandlers(this.connection);
        this.projectService = this.createProjectService(options);
      }
      createProjectService(options) {
        const projSvc = new ts.server.ProjectService({
          host: options.host,
          logger: options.logger,
          cancellationToken: ts.server.nullCancellationToken,
          useSingleInferredProject: true,
          useInferredProjectPerProjectRoot: true,
          typingsInstaller: ts.server.nullTypingsInstaller,
          suppressDiagnosticEvents: true,
          eventHandler: (e) => this.handleProjectServiceEvent(e),
          globalPlugins: [options.ngPlugin],
          pluginProbeLocations: [options.resolvedNgLsPath],
          allowLocalPluginLoads: false
        });
        projSvc.setHostConfiguration({
          formatOptions: projSvc.getHostFormatCodeOptions(),
          extraFileExtensions: [
            {
              extension: ".html",
              isMixedContent: false,
              scriptKind: ts.ScriptKind.Unknown
            }
          ],
          preferences: {
            includePackageJsonAutoImports: "off"
          },
          watchOptions: {
            watchFile: ts.WatchFileKind.UseFsEvents,
            watchDirectory: ts.WatchDirectoryKind.UseFsEvents,
            fallbackPolling: ts.PollingWatchKind.DynamicPriority
          }
        });
        const pluginConfig = {
          angularOnly: true,
          ivy: options.ivy
        };
        if (options.host.isG3) {
          assert(options.ivy === true, "Ivy LS must be used in google3");
          pluginConfig.forceStrictTemplates = true;
        }
        projSvc.configurePlugin({
          pluginName: options.ngPlugin,
          configuration: pluginConfig
        });
        return projSvc;
      }
      addProtocolHandlers(conn) {
        conn.onInitialize((p) => this.onInitialize(p));
        conn.onDidOpenTextDocument((p) => this.onDidOpenTextDocument(p));
        conn.onDidCloseTextDocument((p) => this.onDidCloseTextDocument(p));
        conn.onDidChangeTextDocument((p) => this.onDidChangeTextDocument(p));
        conn.onDidSaveTextDocument((p) => this.onDidSaveTextDocument(p));
        conn.onDefinition((p) => this.onDefinition(p));
        conn.onTypeDefinition((p) => this.onTypeDefinition(p));
        conn.onReferences((p) => this.onReferences(p));
        conn.onRenameRequest((p) => this.onRenameRequest(p));
        conn.onPrepareRename((p) => this.onPrepareRename(p));
        conn.onHover((p) => this.onHover(p));
        conn.onCompletion((p) => this.onCompletion(p));
        conn.onCompletionResolve((p) => this.onCompletionResolve(p));
        conn.onRequest(requests_1.GetComponentsWithTemplateFile, (p) => this.onGetComponentsWithTemplateFile(p));
        conn.onRequest(requests_1.GetTcbRequest, (p) => this.onGetTcb(p));
        conn.onRequest(requests_1.IsInAngularProject, (p) => this.isInAngularProject(p));
        conn.onCodeLens((p) => this.onCodeLens(p));
        conn.onCodeLensResolve((p) => this.onCodeLensResolve(p));
        conn.onSignatureHelp((p) => this.onSignatureHelp(p));
      }
      isInAngularProject(params) {
        const filePath = utils_1.uriToFilePath(params.textDocument.uri);
        if (!filePath) {
          return false;
        }
        const lsAndScriptInfo = this.getLSAndScriptInfo(params.textDocument);
        if (!lsAndScriptInfo) {
          return null;
        }
        const project = this.getDefaultProjectForScriptInfo(lsAndScriptInfo.scriptInfo);
        if (!project) {
          return null;
        }
        const angularCore = project.getFileNames().find(isAngularCore);
        return angularCore !== void 0;
      }
      onGetTcb(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return null;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const response = languageService.getTcb(scriptInfo.fileName, offset);
        if (response === void 0) {
          return null;
        }
        const { fileName: tcfName } = response;
        const tcfScriptInfo = this.projectService.getScriptInfo(tcfName);
        if (!tcfScriptInfo) {
          return null;
        }
        return {
          uri: utils_1.filePathToUri(tcfName),
          content: response.content,
          selections: response.selections.map((span) => utils_1.tsTextSpanToLspRange(tcfScriptInfo, span))
        };
      }
      onGetComponentsWithTemplateFile(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return null;
        }
        const { languageService, scriptInfo } = lsInfo;
        const documentSpans = languageService.getComponentLocationsForTemplate(scriptInfo.fileName);
        const results = [];
        for (const documentSpan of documentSpans) {
          const scriptInfo2 = this.projectService.getScriptInfo(documentSpan.fileName);
          if (scriptInfo2 === void 0) {
            continue;
          }
          const range = utils_1.tsTextSpanToLspRange(scriptInfo2, documentSpan.textSpan);
          results.push(lsp.Location.create(utils_1.filePathToUri(documentSpan.fileName), range));
        }
        return results;
      }
      onSignatureHelp(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return null;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const help = languageService.getSignatureHelpItems(scriptInfo.fileName, offset, void 0);
        if (help === void 0) {
          return null;
        }
        return {
          activeParameter: help.argumentCount > 0 ? help.argumentIndex : null,
          activeSignature: help.selectedItemIndex,
          signatures: help.items.map((item) => {
            let label = utils_1.tsDisplayPartsToText(item.prefixDisplayParts);
            const parameters = [];
            let first = true;
            for (const param of item.parameters) {
              if (!first) {
                label += utils_1.tsDisplayPartsToText(item.separatorDisplayParts);
              }
              first = false;
              const start = label.length;
              label += utils_1.tsDisplayPartsToText(param.displayParts);
              const end = label.length;
              parameters.push({
                label: [start, end],
                documentation: utils_1.tsDisplayPartsToText(param.documentation)
              });
            }
            label += utils_1.tsDisplayPartsToText(item.suffixDisplayParts);
            return {
              label,
              documentation: utils_1.tsDisplayPartsToText(item.documentation),
              parameters
            };
          })
        };
      }
      onCodeLens(params) {
        if (!params.textDocument.uri.endsWith(".html") || !this.isInAngularProject(params)) {
          return null;
        }
        const position = lsp.Position.create(0, 0);
        const topOfDocument = lsp.Range.create(position, position);
        const codeLens = {
          range: topOfDocument,
          data: params.textDocument
        };
        return [codeLens];
      }
      onCodeLensResolve(params) {
        const components = this.onGetComponentsWithTemplateFile({ textDocument: params.data });
        if (components === null || components.length === 0) {
          throw new Error("Could not determine component for " + params.data.uri);
        }
        params.command = {
          command: "angular.goToComponentWithTemplateFile",
          title: components.length > 1 ? `Used as templateUrl in ${components.length} components` : "Go to component"
        };
        return params;
      }
      enableLanguageServiceForProject(project) {
        const { projectName } = project;
        if (project.isClosed()) {
          this.info(`Cannot enable language service for closed project ${projectName}.`);
          return;
        }
        if (!project.languageServiceEnabled) {
          project.enableLanguageService();
          project.markAsDirty();
        }
        if (!this.ivy) {
          this.info(`Enabling View Engine language service for ${projectName}.`);
          return;
        }
        this.info(`Enabling Ivy language service for ${projectName}.`);
        this.handleCompilerOptionsDiagnostics(project);
        this.runGlobalAnalysisForNewlyLoadedProject(project);
      }
      disableLanguageServiceForProject(project, reason) {
        if (!project.languageServiceEnabled) {
          return;
        }
        project.disableLanguageService(`Disabling language service for ${project.projectName} because ${reason}.`);
      }
      runGlobalAnalysisForNewlyLoadedProject(project) {
        if (!project.hasRoots()) {
          return;
        }
        const fileName = project.getRootScriptInfos()[0].fileName;
        const label = `Global analysis - getSemanticDiagnostics for ${fileName}`;
        if (utils_1.isDebugMode) {
          console.time(label);
        }
        project.getLanguageService().getSemanticDiagnostics(fileName);
        if (utils_1.isDebugMode) {
          console.timeEnd(label);
        }
      }
      handleCompilerOptionsDiagnostics(project) {
        if (!utils_1.isConfiguredProject(project)) {
          return;
        }
        const diags = project.getLanguageService().getCompilerOptionsDiagnostics();
        const suggestStrictModeDiag = diags.find((d) => d.code === -9910001);
        if (suggestStrictModeDiag) {
          const configFilePath = project.getConfigFilePath();
          this.connection.sendNotification(notifications_1.SuggestStrictMode, {
            configFilePath,
            message: suggestStrictModeDiag.messageText
          });
          this.renameDisabledProjects.add(project);
        } else {
          this.renameDisabledProjects.delete(project);
        }
      }
      handleProjectServiceEvent(event) {
        switch (event.eventName) {
          case ts.server.ProjectLoadingStartEvent:
            this.isProjectLoading = true;
            this.connection.sendNotification(notifications_1.ProjectLoadingStart);
            this.logger.info(`Loading new project: ${event.data.reason}`);
            break;
          case ts.server.ProjectLoadingFinishEvent: {
            if (this.isProjectLoading) {
              this.isProjectLoading = false;
              this.connection.sendNotification(notifications_1.ProjectLoadingFinish);
            }
            const { project } = event.data;
            const angularCore = this.findAngularCore(project);
            if (angularCore) {
              if (this.ivy && isExternalAngularCore(angularCore)) {
                this.runNgcc(project);
              } else {
                this.enableLanguageServiceForProject(project);
              }
            } else {
              this.disableLanguageServiceForProject(project, `project is not an Angular project ('@angular/core' could not be found)`);
            }
            break;
          }
          case ts.server.ProjectsUpdatedInBackgroundEvent:
            this.triggerDiagnostics(event.data.openFiles, event.eventName);
            break;
          case ts.server.ProjectLanguageServiceStateEvent:
            this.connection.sendNotification(notifications_1.ProjectLanguageService, {
              projectName: event.data.project.getProjectName(),
              languageServiceEnabled: event.data.languageServiceEnabled
            });
        }
      }
      requestDiagnosticsOnOpenOrChangeFile(file, reason) {
        const files = [];
        if (isExternalTemplate(file)) {
          files.push(file);
        } else {
          for (const openFile of this.openFiles.getAll()) {
            const scriptInfo = this.projectService.getScriptInfo(openFile);
            if (scriptInfo) {
              files.push(scriptInfo.fileName);
            }
          }
        }
        this.triggerDiagnostics(files, reason);
      }
      triggerDiagnostics(files, reason, delay = 300) {
        if (this.diagnosticsTimeout) {
          clearTimeout(this.diagnosticsTimeout);
        }
        this.diagnosticsTimeout = setTimeout(() => {
          this.diagnosticsTimeout = null;
          this.sendPendingDiagnostics(files, reason);
        }, delay);
      }
      async sendPendingDiagnostics(files, reason) {
        for (let i = 0; i < files.length; ++i) {
          const fileName = files[i];
          const result = this.getLSAndScriptInfo(fileName);
          if (!result) {
            continue;
          }
          const label = `${reason} - getSemanticDiagnostics for ${fileName}`;
          if (utils_1.isDebugMode) {
            console.time(label);
          }
          const diagnostics = result.languageService.getSemanticDiagnostics(fileName);
          if (utils_1.isDebugMode) {
            console.timeEnd(label);
          }
          this.connection.sendDiagnostics({
            uri: utils_1.filePathToUri(fileName),
            diagnostics: diagnostics.map((d) => diagnostic_1.tsDiagnosticToLspDiagnostic(d, result.scriptInfo))
          });
          if (this.diagnosticsTimeout) {
            return;
          }
          if (i < files.length - 1) {
            await setImmediateP();
          }
        }
      }
      getDefaultProjectForScriptInfo(scriptInfo) {
        let project = this.projectService.getDefaultProjectForFile(scriptInfo.fileName, false);
        if (!project || project.projectKind !== ts.server.ProjectKind.Configured) {
          const { configFileName } = this.projectService.openClientFile(scriptInfo.fileName);
          if (!configFileName) {
            this.error(`No config file for ${scriptInfo.fileName}`);
            return;
          }
          project = this.projectService.findProject(configFileName);
          if (!project) {
            return;
          }
          scriptInfo.detachAllProjects();
          scriptInfo.attachToProject(project);
        }
        this.createExternalProject(project);
        return project;
      }
      onInitialize(params) {
        const serverOptions = {
          logFile: this.logger.getLogFileName()
        };
        this.clientCapabilities = params.capabilities;
        return {
          capabilities: {
            codeLensProvider: this.ivy ? { resolveProvider: true } : void 0,
            textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
            completionProvider: {
              resolveProvider: this.ivy,
              triggerCharacters: ["<", ".", "*", "[", "(", "$", "|"]
            },
            definitionProvider: true,
            typeDefinitionProvider: this.ivy,
            referencesProvider: this.ivy,
            renameProvider: this.ivy ? {
              prepareProvider: true
            } : false,
            hoverProvider: true,
            signatureHelpProvider: this.ivy ? {
              triggerCharacters: ["(", ","],
              retriggerCharacters: [","]
            } : void 0,
            workspace: {
              workspaceFolders: { supported: true }
            }
          },
          serverOptions
        };
      }
      onDidOpenTextDocument(params) {
        var _a;
        const { uri, languageId, text } = params.textDocument;
        const filePath = utils_1.uriToFilePath(uri);
        if (!filePath) {
          return;
        }
        this.openFiles.update(filePath);
        const scriptKind = languageId === LanguageId.TS ? ts.ScriptKind.TS : ts.ScriptKind.Unknown;
        try {
          const result = this.projectService.openClientFile(filePath, text, scriptKind);
          const { configFileName, configFileErrors } = result;
          if (configFileErrors && configFileErrors.length) {
            this.error(configFileErrors.map((e) => e.messageText).join("\n"));
          }
          const project = configFileName ? this.projectService.findProject(configFileName) : (_a = this.projectService.getScriptInfo(filePath)) === null || _a === void 0 ? void 0 : _a.containingProjects.find(utils_1.isConfiguredProject);
          if (!project) {
            return;
          }
          if (project.languageServiceEnabled) {
            project.markAsDirty();
            this.requestDiagnosticsOnOpenOrChangeFile(filePath, `Opening ${filePath}`);
          }
        } catch (error) {
          if (this.isProjectLoading) {
            this.isProjectLoading = false;
            this.connection.sendNotification(notifications_1.ProjectLoadingFinish);
          }
          if (error.stack) {
            this.error(error.stack);
          }
          throw error;
        }
        this.closeOrphanedExternalProjects();
      }
      createExternalProject(project) {
        if (utils_1.isConfiguredProject(project) && !this.configuredProjToExternalProj.has(project.projectName)) {
          const extProjectName = `${project.projectName}-external`;
          project.projectService.openExternalProject({
            projectFileName: extProjectName,
            rootFiles: [{ fileName: project.getConfigFilePath() }],
            options: {}
          });
          this.configuredProjToExternalProj.set(project.projectName, extProjectName);
        }
      }
      onDidCloseTextDocument(params) {
        const { textDocument } = params;
        const filePath = utils_1.uriToFilePath(textDocument.uri);
        if (!filePath) {
          return;
        }
        this.openFiles.delete(filePath);
        this.projectService.closeClientFile(filePath);
      }
      closeOrphanedExternalProjects() {
        for (const [configuredProjName, externalProjName] of this.configuredProjToExternalProj) {
          const configuredProj = this.projectService.findProject(configuredProjName);
          if (!configuredProj || configuredProj.isClosed()) {
            this.projectService.closeExternalProject(externalProjName);
            this.configuredProjToExternalProj.delete(configuredProjName);
            continue;
          }
          const openFiles = toArray(this.projectService.openFiles.keys());
          if (!openFiles.some((file) => {
            const scriptInfo = this.projectService.getScriptInfo(file);
            return scriptInfo === null || scriptInfo === void 0 ? void 0 : scriptInfo.isAttached(configuredProj);
          })) {
            this.projectService.closeExternalProject(externalProjName);
            this.configuredProjToExternalProj.delete(configuredProjName);
          }
        }
      }
      onDidChangeTextDocument(params) {
        const { contentChanges, textDocument } = params;
        const filePath = utils_1.uriToFilePath(textDocument.uri);
        if (!filePath) {
          return;
        }
        this.openFiles.update(filePath);
        const scriptInfo = this.projectService.getScriptInfo(filePath);
        if (!scriptInfo) {
          this.error(`Failed to get script info for ${filePath}`);
          return;
        }
        for (const change of contentChanges) {
          if ("range" in change) {
            const [start, end] = utils_1.lspRangeToTsPositions(scriptInfo, change.range);
            scriptInfo.editContent(start, end, change.text);
          } else {
            scriptInfo.editContent(0, scriptInfo.getSnapshot().getLength(), change.text);
          }
        }
        const project = this.getDefaultProjectForScriptInfo(scriptInfo);
        if (!project || !project.languageServiceEnabled) {
          return;
        }
        this.requestDiagnosticsOnOpenOrChangeFile(scriptInfo.fileName, `Changing ${filePath}`);
      }
      onDidSaveTextDocument(params) {
        const { text, textDocument } = params;
        const filePath = utils_1.uriToFilePath(textDocument.uri);
        if (!filePath) {
          return;
        }
        this.openFiles.update(filePath);
        const scriptInfo = this.projectService.getScriptInfo(filePath);
        if (!scriptInfo) {
          return;
        }
        if (text) {
          scriptInfo.open(text);
        } else {
          scriptInfo.reloadFromFile();
        }
      }
      onDefinition(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const definition = languageService.getDefinitionAndBoundSpan(scriptInfo.fileName, offset);
        if (!definition || !definition.definitions) {
          return;
        }
        const originSelectionRange = utils_1.tsTextSpanToLspRange(scriptInfo, definition.textSpan);
        return this.tsDefinitionsToLspLocationLinks(definition.definitions, originSelectionRange);
      }
      onTypeDefinition(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const definitions = languageService.getTypeDefinitionAtPosition(scriptInfo.fileName, offset);
        if (!definitions) {
          return;
        }
        return this.tsDefinitionsToLspLocationLinks(definitions);
      }
      onRenameRequest(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return;
        }
        const { languageService, scriptInfo } = lsInfo;
        const project = this.getDefaultProjectForScriptInfo(scriptInfo);
        if (project === void 0 || this.renameDisabledProjects.has(project)) {
          return;
        }
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const renameLocations = languageService.findRenameLocations(scriptInfo.fileName, offset, false, false);
        if (renameLocations === void 0) {
          return;
        }
        const changes = renameLocations.reduce((changes2, location) => {
          let uri = utils_1.filePathToUri(location.fileName);
          if (changes2[uri] === void 0) {
            changes2[uri] = [];
          }
          const fileEdits = changes2[uri];
          const lsInfo2 = this.getLSAndScriptInfo(location.fileName);
          if (lsInfo2 === null) {
            return changes2;
          }
          const range = utils_1.tsTextSpanToLspRange(lsInfo2.scriptInfo, location.textSpan);
          fileEdits.push({ range, newText: params.newName });
          return changes2;
        }, {});
        return { changes };
      }
      onPrepareRename(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return null;
        }
        const { languageService, scriptInfo } = lsInfo;
        const project = this.getDefaultProjectForScriptInfo(scriptInfo);
        if (project === void 0 || this.renameDisabledProjects.has(project)) {
          return null;
        }
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const renameInfo = languageService.getRenameInfo(scriptInfo.fileName, offset);
        if (!renameInfo.canRename) {
          return null;
        }
        const range = utils_1.tsTextSpanToLspRange(scriptInfo, renameInfo.triggerSpan);
        return {
          range,
          placeholder: renameInfo.displayName
        };
      }
      onReferences(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const references = languageService.getReferencesAtPosition(scriptInfo.fileName, offset);
        if (references === void 0) {
          return;
        }
        return references.map((ref) => {
          const scriptInfo2 = this.projectService.getScriptInfo(ref.fileName);
          const range = scriptInfo2 ? utils_1.tsTextSpanToLspRange(scriptInfo2, ref.textSpan) : EMPTY_RANGE;
          const uri = utils_1.filePathToUri(ref.fileName);
          return { uri, range };
        });
      }
      tsDefinitionsToLspLocationLinks(definitions, originSelectionRange) {
        const results = [];
        for (const d of definitions) {
          const scriptInfo = this.projectService.getScriptInfo(d.fileName);
          if (!scriptInfo && d.textSpan.length > 0) {
            continue;
          }
          const range = scriptInfo ? utils_1.tsTextSpanToLspRange(scriptInfo, d.textSpan) : EMPTY_RANGE;
          const targetUri = utils_1.filePathToUri(d.fileName);
          results.push({
            originSelectionRange,
            targetUri,
            targetRange: range,
            targetSelectionRange: range
          });
        }
        return results;
      }
      getLSAndScriptInfo(textDocumentOrFileName) {
        const filePath = lsp.TextDocumentIdentifier.is(textDocumentOrFileName) ? utils_1.uriToFilePath(textDocumentOrFileName.uri) : textDocumentOrFileName;
        const scriptInfo = this.projectService.getScriptInfo(filePath);
        if (!scriptInfo) {
          this.error(`Script info not found for ${filePath}`);
          return null;
        }
        const project = this.getDefaultProjectForScriptInfo(scriptInfo);
        if (!(project === null || project === void 0 ? void 0 : project.languageServiceEnabled)) {
          return null;
        }
        if (project.isClosed()) {
          scriptInfo.detachFromProject(project);
          this.logger.info(`Failed to get language service for closed project ${project.projectName}.`);
          return null;
        }
        const languageService = project.getLanguageService();
        if (!api_1.isNgLanguageService(languageService)) {
          return null;
        }
        return {
          languageService,
          scriptInfo
        };
      }
      onHover(params) {
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const info = languageService.getQuickInfoAtPosition(scriptInfo.fileName, offset);
        if (!info) {
          return;
        }
        const { kind, kindModifiers, textSpan, displayParts, documentation } = info;
        let desc = kindModifiers ? kindModifiers + " " : "";
        if (displayParts && displayParts.length > 0) {
          desc += displayParts.map((dp) => dp.text).join("");
        } else {
          desc += kind;
        }
        const contents = [{
          language: "typescript",
          value: desc
        }];
        if (documentation) {
          for (const d of documentation) {
            contents.push(d.text);
          }
        }
        return {
          contents,
          range: utils_1.tsTextSpanToLspRange(scriptInfo, textSpan)
        };
      }
      onCompletion(params) {
        var _a, _b, _c, _d;
        const lsInfo = this.getLSAndScriptInfo(params.textDocument);
        if (lsInfo === null) {
          return;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, params.position);
        const completions = languageService.getCompletionsAtPosition(scriptInfo.fileName, offset, {});
        if (!completions) {
          return;
        }
        const clientSupportsInsertReplaceCompletion = (_d = (_c = (_b = (_a = this.clientCapabilities.textDocument) === null || _a === void 0 ? void 0 : _a.completion) === null || _b === void 0 ? void 0 : _b.completionItem) === null || _c === void 0 ? void 0 : _c.insertReplaceSupport) !== null && _d !== void 0 ? _d : false;
        return completions.entries.map((e) => completion_1.tsCompletionEntryToLspCompletionItem(e, params.position, scriptInfo, clientSupportsInsertReplaceCompletion));
      }
      onCompletionResolve(item) {
        var _a;
        const data = completion_1.readNgCompletionData(item);
        if (data === null) {
          return item;
        }
        const { filePath, position } = data;
        const lsInfo = this.getLSAndScriptInfo(filePath);
        if (lsInfo === null) {
          return item;
        }
        const { languageService, scriptInfo } = lsInfo;
        const offset = utils_1.lspPositionToTsPosition(scriptInfo, position);
        const details = languageService.getCompletionEntryDetails(filePath, offset, (_a = item.insertText) !== null && _a !== void 0 ? _a : item.label, void 0, void 0, void 0, void 0);
        if (details === void 0) {
          return item;
        }
        const { kind, kindModifiers, displayParts, documentation } = details;
        let desc = kindModifiers ? kindModifiers + " " : "";
        if (displayParts && displayParts.length > 0) {
          desc += displayParts.map((dp) => dp.text).join("");
        } else {
          desc += kind;
        }
        item.detail = desc;
        item.documentation = documentation === null || documentation === void 0 ? void 0 : documentation.map((d) => d.text).join("");
        return item;
      }
      error(message) {
        if (this.logToConsole) {
          this.connection.console.error(message);
        }
        this.logger.msg(message, ts.server.Msg.Err);
      }
      warn(message) {
        if (this.logToConsole) {
          this.connection.console.warn(message);
        }
        this.logger.msg(`[WARN] ${message}`, ts.server.Msg.Info);
      }
      info(message) {
        if (this.logToConsole) {
          this.connection.console.info(message);
        }
        this.logger.msg(message, ts.server.Msg.Info);
      }
      listen() {
        this.connection.listen();
      }
      findAngularCore(project) {
        const { projectName } = project;
        if (!project.languageServiceEnabled) {
          this.info(`Language service is already disabled for ${projectName}. This could be due to non-TS files that exceeded the size limit (${ts.server.maxProgramSizeForNonTsFiles} bytes).Please check log file for details.`);
          return null;
        }
        if (!project.hasRoots() || project.isNonTsProject()) {
          return null;
        }
        const angularCore = project.getFileNames().find(isAngularCore);
        if (angularCore === void 0 && project.getExcludedFiles().some(isAngularCore)) {
          this.info(`Please check your tsconfig.json to make sure 'node_modules' directory is not excluded.`);
        }
        return angularCore !== null && angularCore !== void 0 ? angularCore : null;
      }
      async runNgcc(project) {
        if (!utils_1.isConfiguredProject(project)) {
          return;
        }
        this.disableLanguageServiceForProject(project, "ngcc is running");
        const configFilePath = project.getConfigFilePath();
        this.connection.sendProgress(progress_1.NgccProgressType, progress_1.NgccProgressToken, {
          done: false,
          configFilePath,
          message: `Running ngcc for ${configFilePath}`
        });
        let success = false;
        try {
          this.projectNgccQueue.push({ project, done: false });
          await ngcc_1.resolveAndRunNgcc(configFilePath, {
            report: (msg) => {
              this.connection.sendProgress(progress_1.NgccProgressType, progress_1.NgccProgressToken, {
                done: false,
                configFilePath,
                message: msg
              });
            }
          });
          success = true;
        } catch (e) {
          this.error(`Failed to run ngcc for ${configFilePath}, language service may not operate correctly:
    ${e.message}`);
        } finally {
          const loadingStatus = this.projectNgccQueue.find((p) => p.project === project);
          if (loadingStatus !== void 0) {
            loadingStatus.done = true;
          }
          this.connection.sendProgress(progress_1.NgccProgressType, progress_1.NgccProgressToken, {
            done: true,
            configFilePath,
            success
          });
        }
        for (let i = 0; i < this.projectNgccQueue.length && this.projectNgccQueue[i].done; i++) {
          this.enableLanguageServiceForProject(this.projectNgccQueue[i].project);
        }
        this.projectNgccQueue = this.projectNgccQueue.filter(({ done }) => !done);
      }
    };
    exports2.Session = Session;
    function toArray(it) {
      const results = [];
      for (let itResult = it.next(); !itResult.done; itResult = it.next()) {
        results.push(itResult.value);
      }
      return results;
    }
    function isAngularCore(path) {
      return isExternalAngularCore(path) || isInternalAngularCore(path);
    }
    function isExternalAngularCore(path) {
      return path.endsWith("@angular/core/core.d.ts");
    }
    function isInternalAngularCore(path) {
      return path.endsWith("angular2/rc/packages/core/index.d.ts");
    }
    function isTypeScriptFile(path) {
      return path.endsWith(".ts");
    }
    function isExternalTemplate(path) {
      return !isTypeScriptFile(path);
    }
  }
});

// dist/server/server.js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cmdline_utils_1 = require_cmdline_utils();
var logger_1 = require_logger();
var server_host_1 = require_server_host();
var session_1 = require_session();
var version_provider_1 = require_version_provider();
function main() {
  const options = cmdline_utils_1.parseCommandLine(process.argv);
  if (options.help) {
    console.error(cmdline_utils_1.generateHelpMessage(process.argv));
    process.exit(0);
  }
  const logger = logger_1.createLogger({
    logFile: options.logFile,
    logVerbosity: options.logVerbosity
  });
  const ts = version_provider_1.resolveTsServer(options.tsProbeLocations);
  const ng = version_provider_1.resolveNgLangSvc(options.ngProbeLocations);
  const isG3 = ts.resolvedPath.includes("/google3/");
  const host = new server_host_1.ServerHost(isG3);
  const session = new session_1.Session({
    host,
    logger,
    ngPlugin: "@angular/language-service",
    resolvedNgLsPath: ng.resolvedPath,
    ivy: isG3 ? true : options.ivy,
    logToConsole: options.logToConsole
  });
  session.info(`Angular language server process ID: ${process.pid}`);
  session.info(`Using ${ts.name} v${ts.version} from ${ts.resolvedPath}`);
  session.info(`Using ${ng.name} v${ng.version} from ${ng.resolvedPath}`);
  if (logger.loggingEnabled()) {
    session.info(`Log file: ${logger.getLogFileName()}`);
  } else {
    session.info(`Logging is turned off. To enable, run command 'Open Angular server log'.`);
  }
  if (process.env.NG_DEBUG === "true") {
    session.info("Angular Language Service is running under DEBUG mode");
  }
  session.listen();
}
main();
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
