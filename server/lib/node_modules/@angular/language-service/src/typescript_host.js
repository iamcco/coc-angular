/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/language-service/src/typescript_host", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/language_services", "@angular/core", "fs", "path", "typescript", "@angular/language-service/src/language_service", "@angular/language-service/src/reflector_host", "@angular/language-service/src/types"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var language_services_1 = require("@angular/compiler-cli/src/language_services");
    var core_1 = require("@angular/core");
    var fs = require("fs");
    var path = require("path");
    var ts = require("typescript");
    var language_service_1 = require("@angular/language-service/src/language_service");
    var reflector_host_1 = require("@angular/language-service/src/reflector_host");
    var types_1 = require("@angular/language-service/src/types");
    /**
     * Create a `LanguageServiceHost`
     */
    function createLanguageServiceFromTypescript(host, service) {
        var ngHost = new TypeScriptServiceHost(host, service);
        var ngServer = language_service_1.createLanguageService(ngHost);
        return ngServer;
    }
    exports.createLanguageServiceFromTypescript = createLanguageServiceFromTypescript;
    /**
     * The language service never needs the normalized versions of the metadata. To avoid parsing
     * the content and resolving references, return an empty file. This also allows normalizing
     * template that are syntatically incorrect which is required to provide completions in
     * syntactically incorrect templates.
     */
    var DummyHtmlParser = /** @class */ (function (_super) {
        tslib_1.__extends(DummyHtmlParser, _super);
        function DummyHtmlParser() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DummyHtmlParser.prototype.parse = function () { return new compiler_1.ParseTreeResult([], []); };
        return DummyHtmlParser;
    }(compiler_1.HtmlParser));
    exports.DummyHtmlParser = DummyHtmlParser;
    /**
     * Avoid loading resources in the language servcie by using a dummy loader.
     */
    var DummyResourceLoader = /** @class */ (function (_super) {
        tslib_1.__extends(DummyResourceLoader, _super);
        function DummyResourceLoader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DummyResourceLoader.prototype.get = function (url) { return Promise.resolve(''); };
        return DummyResourceLoader;
    }(compiler_1.ResourceLoader));
    exports.DummyResourceLoader = DummyResourceLoader;
    /**
     * An implementation of a `LanguageServiceHost` for a TypeScript project.
     *
     * The `TypeScriptServiceHost` implements the Angular `LanguageServiceHost` using
     * the TypeScript language services.
     *
     * @publicApi
     */
    var TypeScriptServiceHost = /** @class */ (function () {
        function TypeScriptServiceHost(host, tsService) {
            this.host = host;
            this.tsService = tsService;
            this._staticSymbolCache = new compiler_1.StaticSymbolCache();
            this._typeCache = [];
            this.modulesOutOfDate = true;
            this.fileVersions = new Map();
        }
        Object.defineProperty(TypeScriptServiceHost.prototype, "resolver", {
            /**
             * Angular LanguageServiceHost implementation
             */
            get: function () {
                var _this = this;
                this.validate();
                var result = this._resolver;
                if (!result) {
                    var moduleResolver = new compiler_1.NgModuleResolver(this.reflector);
                    var directiveResolver = new compiler_1.DirectiveResolver(this.reflector);
                    var pipeResolver = new compiler_1.PipeResolver(this.reflector);
                    var elementSchemaRegistry = new compiler_1.DomElementSchemaRegistry();
                    var resourceLoader = new DummyResourceLoader();
                    var urlResolver = compiler_1.createOfflineCompileUrlResolver();
                    var htmlParser = new DummyHtmlParser();
                    // This tracks the CompileConfig in codegen.ts. Currently these options
                    // are hard-coded.
                    var config = new compiler_1.CompilerConfig({ defaultEncapsulation: core_1.ViewEncapsulation.Emulated, useJit: false });
                    var directiveNormalizer = new compiler_1.DirectiveNormalizer(resourceLoader, urlResolver, htmlParser, config);
                    result = this._resolver = new compiler_1.CompileMetadataResolver(config, htmlParser, moduleResolver, directiveResolver, pipeResolver, new compiler_1.JitSummaryResolver(), elementSchemaRegistry, directiveNormalizer, new core_1.ɵConsole(), this._staticSymbolCache, this.reflector, function (error, type) { return _this.collectError(error, type && type.filePath); });
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.getTemplateReferences = function () {
            this.ensureTemplateMap();
            return this.templateReferences || [];
        };
        TypeScriptServiceHost.prototype.getTemplateAt = function (fileName, position) {
            var sourceFile = this.getSourceFile(fileName);
            if (sourceFile) {
                this.context = sourceFile.fileName;
                var node = this.findNode(sourceFile, position);
                if (node) {
                    return this.getSourceFromNode(fileName, this.host.getScriptVersion(sourceFile.fileName), node);
                }
            }
            else {
                this.ensureTemplateMap();
                // TODO: Cannocalize the file?
                var componentType = this.fileToComponent.get(fileName);
                if (componentType) {
                    return this.getSourceFromType(fileName, this.host.getScriptVersion(fileName), componentType);
                }
            }
            return undefined;
        };
        TypeScriptServiceHost.prototype.getAnalyzedModules = function () {
            this.updateAnalyzedModules();
            return this.ensureAnalyzedModules();
        };
        TypeScriptServiceHost.prototype.ensureAnalyzedModules = function () {
            var analyzedModules = this.analyzedModules;
            if (!analyzedModules) {
                if (this.host.getScriptFileNames().length === 0) {
                    analyzedModules = {
                        files: [],
                        ngModuleByPipeOrDirective: new Map(),
                        ngModules: [],
                    };
                }
                else {
                    var analyzeHost = { isSourceFile: function (filePath) { return true; } };
                    var programFiles = this.program.getSourceFiles().map(function (sf) { return sf.fileName; });
                    analyzedModules =
                        compiler_1.analyzeNgModules(programFiles, analyzeHost, this.staticSymbolResolver, this.resolver);
                }
                this.analyzedModules = analyzedModules;
            }
            return analyzedModules;
        };
        TypeScriptServiceHost.prototype.getTemplates = function (fileName) {
            var _this = this;
            this.ensureTemplateMap();
            var componentType = this.fileToComponent.get(fileName);
            if (componentType) {
                var templateSource = this.getTemplateAt(fileName, 0);
                if (templateSource) {
                    return [templateSource];
                }
            }
            else {
                var version_1 = this.host.getScriptVersion(fileName);
                var result_1 = [];
                // Find each template string in the file
                var visit_1 = function (child) {
                    var templateSource = _this.getSourceFromNode(fileName, version_1, child);
                    if (templateSource) {
                        result_1.push(templateSource);
                    }
                    else {
                        ts.forEachChild(child, visit_1);
                    }
                };
                var sourceFile = this.getSourceFile(fileName);
                if (sourceFile) {
                    this.context = sourceFile.path || sourceFile.fileName;
                    ts.forEachChild(sourceFile, visit_1);
                }
                return result_1.length ? result_1 : undefined;
            }
        };
        TypeScriptServiceHost.prototype.getDeclarations = function (fileName) {
            var _this = this;
            var result = [];
            var sourceFile = this.getSourceFile(fileName);
            if (sourceFile) {
                var visit_2 = function (child) {
                    var declaration = _this.getDeclarationFromNode(sourceFile, child);
                    if (declaration) {
                        result.push(declaration);
                    }
                    else {
                        ts.forEachChild(child, visit_2);
                    }
                };
                ts.forEachChild(sourceFile, visit_2);
            }
            return result;
        };
        TypeScriptServiceHost.prototype.getSourceFile = function (fileName) {
            return this.tsService.getProgram().getSourceFile(fileName);
        };
        TypeScriptServiceHost.prototype.updateAnalyzedModules = function () {
            this.validate();
            if (this.modulesOutOfDate) {
                this.analyzedModules = null;
                this._reflector = null;
                this.templateReferences = null;
                this.fileToComponent = null;
                this.ensureAnalyzedModules();
                this.modulesOutOfDate = false;
            }
        };
        Object.defineProperty(TypeScriptServiceHost.prototype, "program", {
            get: function () { return this.tsService.getProgram(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypeScriptServiceHost.prototype, "checker", {
            get: function () {
                var checker = this._checker;
                if (!checker) {
                    checker = this._checker = this.program.getTypeChecker();
                }
                return checker;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.validate = function () {
            var _this = this;
            var e_1, _a;
            var program = this.program;
            if (this.lastProgram !== program) {
                // Invalidate file that have changed in the static symbol resolver
                var invalidateFile = function (fileName) {
                    return _this._staticSymbolResolver.invalidateFile(fileName);
                };
                this.clearCaches();
                var seen_1 = new Set();
                try {
                    for (var _b = tslib_1.__values(this.program.getSourceFiles()), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var sourceFile = _c.value;
                        var fileName = sourceFile.fileName;
                        seen_1.add(fileName);
                        var version = this.host.getScriptVersion(fileName);
                        var lastVersion = this.fileVersions.get(fileName);
                        if (version != lastVersion) {
                            this.fileVersions.set(fileName, version);
                            if (this._staticSymbolResolver) {
                                invalidateFile(fileName);
                            }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                // Remove file versions that are no longer in the file and invalidate them.
                var missing = Array.from(this.fileVersions.keys()).filter(function (f) { return !seen_1.has(f); });
                missing.forEach(function (f) { return _this.fileVersions.delete(f); });
                if (this._staticSymbolResolver) {
                    missing.forEach(invalidateFile);
                }
                this.lastProgram = program;
            }
        };
        TypeScriptServiceHost.prototype.clearCaches = function () {
            this._checker = null;
            this._typeCache = [];
            this._resolver = null;
            this.collectedErrors = null;
            this.modulesOutOfDate = true;
        };
        TypeScriptServiceHost.prototype.ensureTemplateMap = function () {
            var e_2, _a, e_3, _b;
            if (!this.fileToComponent || !this.templateReferences) {
                var fileToComponent = new Map();
                var templateReference = [];
                var ngModuleSummary = this.getAnalyzedModules();
                var urlResolver = compiler_1.createOfflineCompileUrlResolver();
                try {
                    for (var _c = tslib_1.__values(ngModuleSummary.ngModules), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var module_1 = _d.value;
                        try {
                            for (var _e = tslib_1.__values(module_1.declaredDirectives), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var directive = _f.value;
                                var metadata = this.resolver.getNonNormalizedDirectiveMetadata(directive.reference).metadata;
                                if (metadata.isComponent && metadata.template && metadata.template.templateUrl) {
                                    var templateName = urlResolver.resolve(this.reflector.componentModuleUrl(directive.reference), metadata.template.templateUrl);
                                    fileToComponent.set(templateName, directive.reference);
                                    templateReference.push(templateName);
                                }
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                this.fileToComponent = fileToComponent;
                this.templateReferences = templateReference;
            }
        };
        TypeScriptServiceHost.prototype.getSourceFromDeclaration = function (fileName, version, source, span, type, declaration, node, sourceFile) {
            var queryCache = undefined;
            var t = this;
            if (declaration) {
                return {
                    version: version,
                    source: source,
                    span: span,
                    type: type,
                    get members() {
                        return language_services_1.getClassMembersFromDeclaration(t.program, t.checker, sourceFile, declaration);
                    },
                    get query() {
                        if (!queryCache) {
                            var pipes_1 = [];
                            var templateInfo = t.getTemplateAstAtPosition(fileName, node.getStart());
                            if (templateInfo) {
                                pipes_1 = templateInfo.pipes;
                            }
                            queryCache = language_services_1.getSymbolQuery(t.program, t.checker, sourceFile, function () { return language_services_1.getPipesTable(sourceFile, t.program, t.checker, pipes_1); });
                        }
                        return queryCache;
                    }
                };
            }
        };
        TypeScriptServiceHost.prototype.getSourceFromNode = function (fileName, version, node) {
            var result = undefined;
            var t = this;
            switch (node.kind) {
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                case ts.SyntaxKind.StringLiteral:
                    var _a = tslib_1.__read(this.getTemplateClassDeclFromNode(node), 2), declaration = _a[0], decorator = _a[1];
                    if (declaration && declaration.name) {
                        var sourceFile = this.getSourceFile(fileName);
                        if (sourceFile) {
                            return this.getSourceFromDeclaration(fileName, version, this.stringOf(node) || '', shrink(spanOf(node)), this.reflector.getStaticSymbol(sourceFile.fileName, declaration.name.text), declaration, node, sourceFile);
                        }
                    }
                    break;
            }
            return result;
        };
        TypeScriptServiceHost.prototype.getSourceFromType = function (fileName, version, type) {
            var result = undefined;
            var declaration = this.getTemplateClassFromStaticSymbol(type);
            if (declaration) {
                var snapshot = this.host.getScriptSnapshot(fileName);
                if (snapshot) {
                    var source = snapshot.getText(0, snapshot.getLength());
                    result = this.getSourceFromDeclaration(fileName, version, source, { start: 0, end: source.length }, type, declaration, declaration, declaration.getSourceFile());
                }
            }
            return result;
        };
        Object.defineProperty(TypeScriptServiceHost.prototype, "reflectorHost", {
            get: function () {
                var _this = this;
                var result = this._reflectorHost;
                if (!result) {
                    if (!this.context) {
                        // Make up a context by finding the first script and using that as the base dir.
                        var scriptFileNames = this.host.getScriptFileNames();
                        if (0 === scriptFileNames.length) {
                            throw new Error('Internal error: no script file names found');
                        }
                        this.context = scriptFileNames[0];
                    }
                    // Use the file context's directory as the base directory.
                    // The host's getCurrentDirectory() is not reliable as it is always "" in
                    // tsserver. We don't need the exact base directory, just one that contains
                    // a source file.
                    var source = this.tsService.getProgram().getSourceFile(this.context);
                    if (!source) {
                        throw new Error('Internal error: no context could be determined');
                    }
                    var tsConfigPath = findTsConfig(source.fileName);
                    var basePath = path.dirname(tsConfigPath || this.context);
                    var options = { basePath: basePath, genDir: basePath };
                    var compilerOptions = this.host.getCompilationSettings();
                    if (compilerOptions && compilerOptions.baseUrl) {
                        options.baseUrl = compilerOptions.baseUrl;
                    }
                    if (compilerOptions && compilerOptions.paths) {
                        options.paths = compilerOptions.paths;
                    }
                    result = this._reflectorHost =
                        new reflector_host_1.ReflectorHost(function () { return _this.tsService.getProgram(); }, this.host, options);
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.collectError = function (error, filePath) {
            if (filePath) {
                var errorMap = this.collectedErrors;
                if (!errorMap || !this.collectedErrors) {
                    errorMap = this.collectedErrors = new Map();
                }
                var errors = errorMap.get(filePath);
                if (!errors) {
                    errors = [];
                    this.collectedErrors.set(filePath, errors);
                }
                errors.push(error);
            }
        };
        Object.defineProperty(TypeScriptServiceHost.prototype, "staticSymbolResolver", {
            get: function () {
                var _this = this;
                var result = this._staticSymbolResolver;
                if (!result) {
                    this._summaryResolver = new compiler_1.AotSummaryResolver({
                        loadSummary: function (filePath) { return null; },
                        isSourceFile: function (sourceFilePath) { return true; },
                        toSummaryFileName: function (sourceFilePath) { return sourceFilePath; },
                        fromSummaryFileName: function (filePath) { return filePath; },
                    }, this._staticSymbolCache);
                    result = this._staticSymbolResolver = new compiler_1.StaticSymbolResolver(this.reflectorHost, this._staticSymbolCache, this._summaryResolver, function (e, filePath) { return _this.collectError(e, filePath); });
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypeScriptServiceHost.prototype, "reflector", {
            get: function () {
                var _this = this;
                var result = this._reflector;
                if (!result) {
                    var ssr = this.staticSymbolResolver;
                    result = this._reflector = new compiler_1.StaticReflector(this._summaryResolver, ssr, [], [], function (e, filePath) { return _this.collectError(e, filePath); });
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        TypeScriptServiceHost.prototype.getTemplateClassFromStaticSymbol = function (type) {
            var source = this.getSourceFile(type.filePath);
            if (source) {
                var declarationNode = ts.forEachChild(source, function (child) {
                    if (child.kind === ts.SyntaxKind.ClassDeclaration) {
                        var classDeclaration = child;
                        if (classDeclaration.name != null && classDeclaration.name.text === type.name) {
                            return classDeclaration;
                        }
                    }
                });
                return declarationNode;
            }
            return undefined;
        };
        /**
         * Given a template string node, see if it is an Angular template string, and if so return the
         * containing class.
         */
        TypeScriptServiceHost.prototype.getTemplateClassDeclFromNode = function (currentToken) {
            // Verify we are in a 'template' property assignment, in an object literal, which is an call
            // arg, in a decorator
            var parentNode = currentToken.parent; // PropertyAssignment
            if (!parentNode) {
                return TypeScriptServiceHost.missingTemplate;
            }
            if (parentNode.kind !== ts.SyntaxKind.PropertyAssignment) {
                return TypeScriptServiceHost.missingTemplate;
            }
            else {
                // TODO: Is this different for a literal, i.e. a quoted property name like "template"?
                if (parentNode.name.text !== 'template') {
                    return TypeScriptServiceHost.missingTemplate;
                }
            }
            parentNode = parentNode.parent; // ObjectLiteralExpression
            if (!parentNode || parentNode.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
                return TypeScriptServiceHost.missingTemplate;
            }
            parentNode = parentNode.parent; // CallExpression
            if (!parentNode || parentNode.kind !== ts.SyntaxKind.CallExpression) {
                return TypeScriptServiceHost.missingTemplate;
            }
            var callTarget = parentNode.expression;
            var decorator = parentNode.parent; // Decorator
            if (!decorator || decorator.kind !== ts.SyntaxKind.Decorator) {
                return TypeScriptServiceHost.missingTemplate;
            }
            var declaration = decorator.parent; // ClassDeclaration
            if (!declaration || declaration.kind !== ts.SyntaxKind.ClassDeclaration) {
                return TypeScriptServiceHost.missingTemplate;
            }
            return [declaration, callTarget];
        };
        TypeScriptServiceHost.prototype.getCollectedErrors = function (defaultSpan, sourceFile) {
            var errors = (this.collectedErrors && this.collectedErrors.get(sourceFile.fileName));
            return (errors && errors.map(function (e) {
                var line = e.line || (e.position && e.position.line);
                var column = e.column || (e.position && e.position.column);
                var span = spanAt(sourceFile, line, column) || defaultSpan;
                if (compiler_1.isFormattedError(e)) {
                    return errorToDiagnosticWithChain(e, span);
                }
                return { message: e.message, span: span };
            })) ||
                [];
        };
        TypeScriptServiceHost.prototype.getDeclarationFromNode = function (sourceFile, node) {
            var e_4, _a;
            if (node.kind == ts.SyntaxKind.ClassDeclaration && node.decorators &&
                node.name) {
                try {
                    for (var _b = tslib_1.__values(node.decorators), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var decorator = _c.value;
                        if (decorator.expression && decorator.expression.kind == ts.SyntaxKind.CallExpression) {
                            var classDeclaration = node;
                            if (classDeclaration.name) {
                                var call = decorator.expression;
                                var target = call.expression;
                                var type = this.checker.getTypeAtLocation(target);
                                if (type) {
                                    var staticSymbol = this.reflector.getStaticSymbol(sourceFile.fileName, classDeclaration.name.text);
                                    try {
                                        if (this.resolver.isDirective(staticSymbol)) {
                                            var metadata = this.resolver.getNonNormalizedDirectiveMetadata(staticSymbol).metadata;
                                            var declarationSpan = spanOf(target);
                                            return {
                                                type: staticSymbol,
                                                declarationSpan: declarationSpan,
                                                metadata: metadata,
                                                errors: this.getCollectedErrors(declarationSpan, sourceFile)
                                            };
                                        }
                                    }
                                    catch (e) {
                                        if (e.message) {
                                            this.collectError(e, sourceFile.fileName);
                                            var declarationSpan = spanOf(target);
                                            return {
                                                type: staticSymbol,
                                                declarationSpan: declarationSpan,
                                                errors: this.getCollectedErrors(declarationSpan, sourceFile)
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        };
        TypeScriptServiceHost.prototype.stringOf = function (node) {
            switch (node.kind) {
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                    return node.text;
                case ts.SyntaxKind.StringLiteral:
                    return node.text;
            }
        };
        TypeScriptServiceHost.prototype.findNode = function (sourceFile, position) {
            function find(node) {
                if (position >= node.getStart() && position < node.getEnd()) {
                    return ts.forEachChild(node, find) || node;
                }
            }
            return find(sourceFile);
        };
        TypeScriptServiceHost.prototype.getTemplateAstAtPosition = function (fileName, position) {
            var template = this.getTemplateAt(fileName, position);
            if (template) {
                var astResult = this.getTemplateAst(template, fileName);
                if (astResult && astResult.htmlAst && astResult.templateAst && astResult.directive &&
                    astResult.directives && astResult.pipes && astResult.expressionParser)
                    return {
                        position: position,
                        fileName: fileName,
                        template: template,
                        htmlAst: astResult.htmlAst,
                        directive: astResult.directive,
                        directives: astResult.directives,
                        pipes: astResult.pipes,
                        templateAst: astResult.templateAst,
                        expressionParser: astResult.expressionParser
                    };
            }
            return undefined;
        };
        TypeScriptServiceHost.prototype.getTemplateAst = function (template, contextFile) {
            var _this = this;
            var result = undefined;
            try {
                var resolvedMetadata = this.resolver.getNonNormalizedDirectiveMetadata(template.type);
                var metadata = resolvedMetadata && resolvedMetadata.metadata;
                if (metadata) {
                    var rawHtmlParser = new compiler_1.HtmlParser();
                    var htmlParser = new compiler_1.I18NHtmlParser(rawHtmlParser);
                    var expressionParser = new compiler_1.Parser(new compiler_1.Lexer());
                    var config = new compiler_1.CompilerConfig();
                    var parser = new compiler_1.TemplateParser(config, this.resolver.getReflector(), expressionParser, new compiler_1.DomElementSchemaRegistry(), htmlParser, null, []);
                    var htmlResult = htmlParser.parse(template.source, '', { tokenizeExpansionForms: true });
                    var analyzedModules = this.getAnalyzedModules();
                    var errors = undefined;
                    var ngModule = analyzedModules.ngModuleByPipeOrDirective.get(template.type);
                    if (!ngModule) {
                        // Reported by the the declaration diagnostics.
                        ngModule = findSuitableDefaultModule(analyzedModules);
                    }
                    if (ngModule) {
                        var directives = ngModule.transitiveModule.directives
                            .map(function (d) { return _this.resolver.getNonNormalizedDirectiveMetadata(d.reference); })
                            .filter(function (d) { return d; })
                            .map(function (d) { return d.metadata.toSummary(); });
                        var pipes = ngModule.transitiveModule.pipes.map(function (p) { return _this.resolver.getOrLoadPipeMetadata(p.reference).toSummary(); });
                        var schemas = ngModule.schemas;
                        var parseResult = parser.tryParseHtml(htmlResult, metadata, directives, pipes, schemas);
                        result = {
                            htmlAst: htmlResult.rootNodes,
                            templateAst: parseResult.templateAst,
                            directive: metadata, directives: directives, pipes: pipes,
                            parseErrors: parseResult.errors, expressionParser: expressionParser, errors: errors
                        };
                    }
                }
            }
            catch (e) {
                var span = template.span;
                if (e.fileName == contextFile) {
                    span = template.query.getSpanAt(e.line, e.column) || span;
                }
                result = { errors: [{ kind: types_1.DiagnosticKind.Error, message: e.message, span: span }] };
            }
            return result || {};
        };
        TypeScriptServiceHost.missingTemplate = [undefined, undefined];
        return TypeScriptServiceHost;
    }());
    exports.TypeScriptServiceHost = TypeScriptServiceHost;
    function findSuitableDefaultModule(modules) {
        var e_5, _a;
        var result = undefined;
        var resultSize = 0;
        try {
            for (var _b = tslib_1.__values(modules.ngModules), _c = _b.next(); !_c.done; _c = _b.next()) {
                var module_2 = _c.value;
                var moduleSize = module_2.transitiveModule.directives.length;
                if (moduleSize > resultSize) {
                    result = module_2;
                    resultSize = moduleSize;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return result;
    }
    function findTsConfig(fileName) {
        var dir = path.dirname(fileName);
        while (fs.existsSync(dir)) {
            var candidate = path.join(dir, 'tsconfig.json');
            if (fs.existsSync(candidate))
                return candidate;
            var parentDir = path.dirname(dir);
            if (parentDir === dir)
                break;
            dir = parentDir;
        }
    }
    function spanOf(node) {
        return { start: node.getStart(), end: node.getEnd() };
    }
    function shrink(span, offset) {
        if (offset == null)
            offset = 1;
        return { start: span.start + offset, end: span.end - offset };
    }
    function spanAt(sourceFile, line, column) {
        if (line != null && column != null) {
            var position_1 = ts.getPositionOfLineAndCharacter(sourceFile, line, column);
            var findChild = function findChild(node) {
                if (node.kind > ts.SyntaxKind.LastToken && node.pos <= position_1 && node.end > position_1) {
                    var betterNode = ts.forEachChild(node, findChild);
                    return betterNode || node;
                }
            };
            var node = ts.forEachChild(sourceFile, findChild);
            if (node) {
                return { start: node.getStart(), end: node.getEnd() };
            }
        }
    }
    function chainedMessage(chain, indent) {
        if (indent === void 0) { indent = ''; }
        return indent + chain.message + (chain.next ? chainedMessage(chain.next, indent + '  ') : '');
    }
    var DiagnosticMessageChainImpl = /** @class */ (function () {
        function DiagnosticMessageChainImpl(message, next) {
            this.message = message;
            this.next = next;
        }
        DiagnosticMessageChainImpl.prototype.toString = function () { return chainedMessage(this); };
        return DiagnosticMessageChainImpl;
    }());
    function convertChain(chain) {
        return { message: chain.message, next: chain.next ? convertChain(chain.next) : undefined };
    }
    function errorToDiagnosticWithChain(error, span) {
        return { message: error.chain ? convertChain(error.chain) : error.message, span: span };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdF9ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbGFuZ3VhZ2Utc2VydmljZS9zcmMvdHlwZXNjcmlwdF9ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILDhDQUFvaUI7SUFDcGlCLGlGQUEySTtJQUMzSSxzQ0FBcUU7SUFDckUsdUJBQXlCO0lBQ3pCLDJCQUE2QjtJQUM3QiwrQkFBaUM7SUFHakMsbUZBQXlEO0lBQ3pELCtFQUErQztJQUMvQyw2REFBME47SUFJMU47O09BRUc7SUFDSCxTQUFnQixtQ0FBbUMsQ0FDL0MsSUFBNEIsRUFBRSxPQUEyQjtRQUMzRCxJQUFNLE1BQU0sR0FBRyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RCxJQUFNLFFBQVEsR0FBRyx3Q0FBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQyxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBTEQsa0ZBS0M7SUFFRDs7Ozs7T0FLRztJQUNIO1FBQXFDLDJDQUFVO1FBQS9DOztRQUVBLENBQUM7UUFEQywrQkFBSyxHQUFMLGNBQTJCLE9BQU8sSUFBSSwwQkFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsc0JBQUM7SUFBRCxDQUFDLEFBRkQsQ0FBcUMscUJBQVUsR0FFOUM7SUFGWSwwQ0FBZTtJQUk1Qjs7T0FFRztJQUNIO1FBQXlDLCtDQUFjO1FBQXZEOztRQUVBLENBQUM7UUFEQyxpQ0FBRyxHQUFILFVBQUksR0FBVyxJQUFxQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25FLDBCQUFDO0lBQUQsQ0FBQyxBQUZELENBQXlDLHlCQUFjLEdBRXREO0lBRlksa0RBQW1CO0lBSWhDOzs7Ozs7O09BT0c7SUFD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QUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDO0lBQzNGLENBQUM7SUFFRCxTQUFTLDBCQUEwQixDQUFDLEtBQXFCLEVBQUUsSUFBVTtRQUNuRSxPQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxNQUFBLEVBQUMsQ0FBQztJQUNsRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FvdFN1bW1hcnlSZXNvbHZlciwgQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIsIENvbXBpbGVOZ01vZHVsZU1ldGFkYXRhLCBDb21waWxlUGlwZVN1bW1hcnksIENvbXBpbGVyQ29uZmlnLCBEaXJlY3RpdmVOb3JtYWxpemVyLCBEaXJlY3RpdmVSZXNvbHZlciwgRG9tRWxlbWVudFNjaGVtYVJlZ2lzdHJ5LCBGb3JtYXR0ZWRFcnJvciwgRm9ybWF0dGVkTWVzc2FnZUNoYWluLCBIdG1sUGFyc2VyLCBJMThOSHRtbFBhcnNlciwgSml0U3VtbWFyeVJlc29sdmVyLCBMZXhlciwgTmdBbmFseXplZE1vZHVsZXMsIE5nTW9kdWxlUmVzb2x2ZXIsIFBhcnNlVHJlZVJlc3VsdCwgUGFyc2VyLCBQaXBlUmVzb2x2ZXIsIFJlc291cmNlTG9hZGVyLCBTdGF0aWNSZWZsZWN0b3IsIFN0YXRpY1N5bWJvbCwgU3RhdGljU3ltYm9sQ2FjaGUsIFN0YXRpY1N5bWJvbFJlc29sdmVyLCBUZW1wbGF0ZVBhcnNlciwgYW5hbHl6ZU5nTW9kdWxlcywgY3JlYXRlT2ZmbGluZUNvbXBpbGVVcmxSZXNvbHZlciwgaXNGb3JtYXR0ZWRFcnJvcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtDb21waWxlck9wdGlvbnMsIGdldENsYXNzTWVtYmVyc0Zyb21EZWNsYXJhdGlvbiwgZ2V0UGlwZXNUYWJsZSwgZ2V0U3ltYm9sUXVlcnl9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbGFuZ3VhZ2Vfc2VydmljZXMnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbiwgybVDb25zb2xlIGFzIENvbnNvbGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0FzdFJlc3VsdCwgVGVtcGxhdGVJbmZvfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQge2NyZWF0ZUxhbmd1YWdlU2VydmljZX0gZnJvbSAnLi9sYW5ndWFnZV9zZXJ2aWNlJztcbmltcG9ydCB7UmVmbGVjdG9ySG9zdH0gZnJvbSAnLi9yZWZsZWN0b3JfaG9zdCc7XG5pbXBvcnQge0RlY2xhcmF0aW9uLCBEZWNsYXJhdGlvbkVycm9yLCBEZWNsYXJhdGlvbnMsIERpYWdub3N0aWMsIERpYWdub3N0aWNLaW5kLCBEaWFnbm9zdGljTWVzc2FnZUNoYWluLCBMYW5ndWFnZVNlcnZpY2UsIExhbmd1YWdlU2VydmljZUhvc3QsIFNwYW4sIFN5bWJvbCwgU3ltYm9sUXVlcnksIFRlbXBsYXRlU291cmNlLCBUZW1wbGF0ZVNvdXJjZXN9IGZyb20gJy4vdHlwZXMnO1xuXG5cblxuLyoqXG4gKiBDcmVhdGUgYSBgTGFuZ3VhZ2VTZXJ2aWNlSG9zdGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxhbmd1YWdlU2VydmljZUZyb21UeXBlc2NyaXB0KFxuICAgIGhvc3Q6IHRzLkxhbmd1YWdlU2VydmljZUhvc3QsIHNlcnZpY2U6IHRzLkxhbmd1YWdlU2VydmljZSk6IExhbmd1YWdlU2VydmljZSB7XG4gIGNvbnN0IG5nSG9zdCA9IG5ldyBUeXBlU2NyaXB0U2VydmljZUhvc3QoaG9zdCwgc2VydmljZSk7XG4gIGNvbnN0IG5nU2VydmVyID0gY3JlYXRlTGFuZ3VhZ2VTZXJ2aWNlKG5nSG9zdCk7XG4gIHJldHVybiBuZ1NlcnZlcjtcbn1cblxuLyoqXG4gKiBUaGUgbGFuZ3VhZ2Ugc2VydmljZSBuZXZlciBuZWVkcyB0aGUgbm9ybWFsaXplZCB2ZXJzaW9ucyBvZiB0aGUgbWV0YWRhdGEuIFRvIGF2b2lkIHBhcnNpbmdcbiAqIHRoZSBjb250ZW50IGFuZCByZXNvbHZpbmcgcmVmZXJlbmNlcywgcmV0dXJuIGFuIGVtcHR5IGZpbGUuIFRoaXMgYWxzbyBhbGxvd3Mgbm9ybWFsaXppbmdcbiAqIHRlbXBsYXRlIHRoYXQgYXJlIHN5bnRhdGljYWxseSBpbmNvcnJlY3Qgd2hpY2ggaXMgcmVxdWlyZWQgdG8gcHJvdmlkZSBjb21wbGV0aW9ucyBpblxuICogc3ludGFjdGljYWxseSBpbmNvcnJlY3QgdGVtcGxhdGVzLlxuICovXG5leHBvcnQgY2xhc3MgRHVtbXlIdG1sUGFyc2VyIGV4dGVuZHMgSHRtbFBhcnNlciB7XG4gIHBhcnNlKCk6IFBhcnNlVHJlZVJlc3VsdCB7IHJldHVybiBuZXcgUGFyc2VUcmVlUmVzdWx0KFtdLCBbXSk7IH1cbn1cblxuLyoqXG4gKiBBdm9pZCBsb2FkaW5nIHJlc291cmNlcyBpbiB0aGUgbGFuZ3VhZ2Ugc2VydmNpZSBieSB1c2luZyBhIGR1bW15IGxvYWRlci5cbiAqL1xuZXhwb3J0IGNsYXNzIER1bW15UmVzb3VyY2VMb2FkZXIgZXh0ZW5kcyBSZXNvdXJjZUxvYWRlciB7XG4gIGdldCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBQcm9taXNlLnJlc29sdmUoJycpOyB9XG59XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgYSBgTGFuZ3VhZ2VTZXJ2aWNlSG9zdGAgZm9yIGEgVHlwZVNjcmlwdCBwcm9qZWN0LlxuICpcbiAqIFRoZSBgVHlwZVNjcmlwdFNlcnZpY2VIb3N0YCBpbXBsZW1lbnRzIHRoZSBBbmd1bGFyIGBMYW5ndWFnZVNlcnZpY2VIb3N0YCB1c2luZ1xuICogdGhlIFR5cGVTY3JpcHQgbGFuZ3VhZ2Ugc2VydmljZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgVHlwZVNjcmlwdFNlcnZpY2VIb3N0IGltcGxlbWVudHMgTGFuZ3VhZ2VTZXJ2aWNlSG9zdCB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9yZXNvbHZlciAhOiBDb21waWxlTWV0YWRhdGFSZXNvbHZlciB8IG51bGw7XG4gIHByaXZhdGUgX3N0YXRpY1N5bWJvbENhY2hlID0gbmV3IFN0YXRpY1N5bWJvbENhY2hlKCk7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9zdW1tYXJ5UmVzb2x2ZXIgITogQW90U3VtbWFyeVJlc29sdmVyO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfc3RhdGljU3ltYm9sUmVzb2x2ZXIgITogU3RhdGljU3ltYm9sUmVzb2x2ZXI7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9yZWZsZWN0b3IgITogU3RhdGljUmVmbGVjdG9yIHwgbnVsbDtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX3JlZmxlY3Rvckhvc3QgITogUmVmbGVjdG9ySG9zdDtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX2NoZWNrZXIgITogdHMuVHlwZUNoZWNrZXIgfCBudWxsO1xuICBwcml2YXRlIF90eXBlQ2FjaGU6IFN5bWJvbFtdID0gW107XG4gIHByaXZhdGUgY29udGV4dDogc3RyaW5nfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBsYXN0UHJvZ3JhbTogdHMuUHJvZ3JhbXx1bmRlZmluZWQ7XG4gIHByaXZhdGUgbW9kdWxlc091dE9mRGF0ZTogYm9vbGVhbiA9IHRydWU7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIGFuYWx5emVkTW9kdWxlcyAhOiBOZ0FuYWx5emVkTW9kdWxlcyB8IG51bGw7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIGZpbGVUb0NvbXBvbmVudCAhOiBNYXA8c3RyaW5nLCBTdGF0aWNTeW1ib2w+fCBudWxsO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSB0ZW1wbGF0ZVJlZmVyZW5jZXMgITogc3RyaW5nW10gfCBudWxsO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBjb2xsZWN0ZWRFcnJvcnMgITogTWFwPHN0cmluZywgYW55W10+fCBudWxsO1xuICBwcml2YXRlIGZpbGVWZXJzaW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBob3N0OiB0cy5MYW5ndWFnZVNlcnZpY2VIb3N0LCBwcml2YXRlIHRzU2VydmljZTogdHMuTGFuZ3VhZ2VTZXJ2aWNlKSB7fVxuXG4gIC8qKlxuICAgKiBBbmd1bGFyIExhbmd1YWdlU2VydmljZUhvc3QgaW1wbGVtZW50YXRpb25cbiAgICovXG4gIGdldCByZXNvbHZlcigpOiBDb21waWxlTWV0YWRhdGFSZXNvbHZlciB7XG4gICAgdGhpcy52YWxpZGF0ZSgpO1xuICAgIGxldCByZXN1bHQgPSB0aGlzLl9yZXNvbHZlcjtcbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgY29uc3QgbW9kdWxlUmVzb2x2ZXIgPSBuZXcgTmdNb2R1bGVSZXNvbHZlcih0aGlzLnJlZmxlY3Rvcik7XG4gICAgICBjb25zdCBkaXJlY3RpdmVSZXNvbHZlciA9IG5ldyBEaXJlY3RpdmVSZXNvbHZlcih0aGlzLnJlZmxlY3Rvcik7XG4gICAgICBjb25zdCBwaXBlUmVzb2x2ZXIgPSBuZXcgUGlwZVJlc29sdmVyKHRoaXMucmVmbGVjdG9yKTtcbiAgICAgIGNvbnN0IGVsZW1lbnRTY2hlbWFSZWdpc3RyeSA9IG5ldyBEb21FbGVtZW50U2NoZW1hUmVnaXN0cnkoKTtcbiAgICAgIGNvbnN0IHJlc291cmNlTG9hZGVyID0gbmV3IER1bW15UmVzb3VyY2VMb2FkZXIoKTtcbiAgICAgIGNvbnN0IHVybFJlc29sdmVyID0gY3JlYXRlT2ZmbGluZUNvbXBpbGVVcmxSZXNvbHZlcigpO1xuICAgICAgY29uc3QgaHRtbFBhcnNlciA9IG5ldyBEdW1teUh0bWxQYXJzZXIoKTtcbiAgICAgIC8vIFRoaXMgdHJhY2tzIHRoZSBDb21waWxlQ29uZmlnIGluIGNvZGVnZW4udHMuIEN1cnJlbnRseSB0aGVzZSBvcHRpb25zXG4gICAgICAvLyBhcmUgaGFyZC1jb2RlZC5cbiAgICAgIGNvbnN0IGNvbmZpZyA9XG4gICAgICAgICAgbmV3IENvbXBpbGVyQ29uZmlnKHtkZWZhdWx0RW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQsIHVzZUppdDogZmFsc2V9KTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZU5vcm1hbGl6ZXIgPVxuICAgICAgICAgIG5ldyBEaXJlY3RpdmVOb3JtYWxpemVyKHJlc291cmNlTG9hZGVyLCB1cmxSZXNvbHZlciwgaHRtbFBhcnNlciwgY29uZmlnKTtcblxuICAgICAgcmVzdWx0ID0gdGhpcy5fcmVzb2x2ZXIgPSBuZXcgQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXIoXG4gICAgICAgICAgY29uZmlnLCBodG1sUGFyc2VyLCBtb2R1bGVSZXNvbHZlciwgZGlyZWN0aXZlUmVzb2x2ZXIsIHBpcGVSZXNvbHZlcixcbiAgICAgICAgICBuZXcgSml0U3VtbWFyeVJlc29sdmVyKCksIGVsZW1lbnRTY2hlbWFSZWdpc3RyeSwgZGlyZWN0aXZlTm9ybWFsaXplciwgbmV3IENvbnNvbGUoKSxcbiAgICAgICAgICB0aGlzLl9zdGF0aWNTeW1ib2xDYWNoZSwgdGhpcy5yZWZsZWN0b3IsXG4gICAgICAgICAgKGVycm9yLCB0eXBlKSA9PiB0aGlzLmNvbGxlY3RFcnJvcihlcnJvciwgdHlwZSAmJiB0eXBlLmZpbGVQYXRoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRUZW1wbGF0ZVJlZmVyZW5jZXMoKTogc3RyaW5nW10ge1xuICAgIHRoaXMuZW5zdXJlVGVtcGxhdGVNYXAoKTtcbiAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZmVyZW5jZXMgfHwgW107XG4gIH1cblxuICBnZXRUZW1wbGF0ZUF0KGZpbGVOYW1lOiBzdHJpbmcsIHBvc2l0aW9uOiBudW1iZXIpOiBUZW1wbGF0ZVNvdXJjZXx1bmRlZmluZWQge1xuICAgIGxldCBzb3VyY2VGaWxlID0gdGhpcy5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKTtcbiAgICBpZiAoc291cmNlRmlsZSkge1xuICAgICAgdGhpcy5jb250ZXh0ID0gc291cmNlRmlsZS5maWxlTmFtZTtcbiAgICAgIGxldCBub2RlID0gdGhpcy5maW5kTm9kZShzb3VyY2VGaWxlLCBwb3NpdGlvbik7XG4gICAgICBpZiAobm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRTb3VyY2VGcm9tTm9kZShcbiAgICAgICAgICAgIGZpbGVOYW1lLCB0aGlzLmhvc3QuZ2V0U2NyaXB0VmVyc2lvbihzb3VyY2VGaWxlLmZpbGVOYW1lKSwgbm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5zdXJlVGVtcGxhdGVNYXAoKTtcbiAgICAgIC8vIFRPRE86IENhbm5vY2FsaXplIHRoZSBmaWxlP1xuICAgICAgY29uc3QgY29tcG9uZW50VHlwZSA9IHRoaXMuZmlsZVRvQ29tcG9uZW50ICEuZ2V0KGZpbGVOYW1lKTtcbiAgICAgIGlmIChjb21wb25lbnRUeXBlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFNvdXJjZUZyb21UeXBlKFxuICAgICAgICAgICAgZmlsZU5hbWUsIHRoaXMuaG9zdC5nZXRTY3JpcHRWZXJzaW9uKGZpbGVOYW1lKSwgY29tcG9uZW50VHlwZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXRBbmFseXplZE1vZHVsZXMoKTogTmdBbmFseXplZE1vZHVsZXMge1xuICAgIHRoaXMudXBkYXRlQW5hbHl6ZWRNb2R1bGVzKCk7XG4gICAgcmV0dXJuIHRoaXMuZW5zdXJlQW5hbHl6ZWRNb2R1bGVzKCk7XG4gIH1cblxuICBwcml2YXRlIGVuc3VyZUFuYWx5emVkTW9kdWxlcygpOiBOZ0FuYWx5emVkTW9kdWxlcyB7XG4gICAgbGV0IGFuYWx5emVkTW9kdWxlcyA9IHRoaXMuYW5hbHl6ZWRNb2R1bGVzO1xuICAgIGlmICghYW5hbHl6ZWRNb2R1bGVzKSB7XG4gICAgICBpZiAodGhpcy5ob3N0LmdldFNjcmlwdEZpbGVOYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBhbmFseXplZE1vZHVsZXMgPSB7XG4gICAgICAgICAgZmlsZXM6IFtdLFxuICAgICAgICAgIG5nTW9kdWxlQnlQaXBlT3JEaXJlY3RpdmU6IG5ldyBNYXAoKSxcbiAgICAgICAgICBuZ01vZHVsZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgYW5hbHl6ZUhvc3QgPSB7aXNTb3VyY2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHsgcmV0dXJuIHRydWU7IH19O1xuICAgICAgICBjb25zdCBwcm9ncmFtRmlsZXMgPSB0aGlzLnByb2dyYW0gIS5nZXRTb3VyY2VGaWxlcygpLm1hcChzZiA9PiBzZi5maWxlTmFtZSk7XG4gICAgICAgIGFuYWx5emVkTW9kdWxlcyA9XG4gICAgICAgICAgICBhbmFseXplTmdNb2R1bGVzKHByb2dyYW1GaWxlcywgYW5hbHl6ZUhvc3QsIHRoaXMuc3RhdGljU3ltYm9sUmVzb2x2ZXIsIHRoaXMucmVzb2x2ZXIpO1xuICAgICAgfVxuICAgICAgdGhpcy5hbmFseXplZE1vZHVsZXMgPSBhbmFseXplZE1vZHVsZXM7XG4gICAgfVxuICAgIHJldHVybiBhbmFseXplZE1vZHVsZXM7XG4gIH1cblxuICBnZXRUZW1wbGF0ZXMoZmlsZU5hbWU6IHN0cmluZyk6IFRlbXBsYXRlU291cmNlcyB7XG4gICAgdGhpcy5lbnN1cmVUZW1wbGF0ZU1hcCgpO1xuICAgIGNvbnN0IGNvbXBvbmVudFR5cGUgPSB0aGlzLmZpbGVUb0NvbXBvbmVudCAhLmdldChmaWxlTmFtZSk7XG4gICAgaWYgKGNvbXBvbmVudFR5cGUpIHtcbiAgICAgIGNvbnN0IHRlbXBsYXRlU291cmNlID0gdGhpcy5nZXRUZW1wbGF0ZUF0KGZpbGVOYW1lLCAwKTtcbiAgICAgIGlmICh0ZW1wbGF0ZVNvdXJjZSkge1xuICAgICAgICByZXR1cm4gW3RlbXBsYXRlU291cmNlXTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHZlcnNpb24gPSB0aGlzLmhvc3QuZ2V0U2NyaXB0VmVyc2lvbihmaWxlTmFtZSk7XG4gICAgICBsZXQgcmVzdWx0OiBUZW1wbGF0ZVNvdXJjZVtdID0gW107XG5cbiAgICAgIC8vIEZpbmQgZWFjaCB0ZW1wbGF0ZSBzdHJpbmcgaW4gdGhlIGZpbGVcbiAgICAgIGxldCB2aXNpdCA9IChjaGlsZDogdHMuTm9kZSkgPT4ge1xuICAgICAgICBsZXQgdGVtcGxhdGVTb3VyY2UgPSB0aGlzLmdldFNvdXJjZUZyb21Ob2RlKGZpbGVOYW1lLCB2ZXJzaW9uLCBjaGlsZCk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZVNvdXJjZSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHRlbXBsYXRlU291cmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cy5mb3JFYWNoQ2hpbGQoY2hpbGQsIHZpc2l0KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgbGV0IHNvdXJjZUZpbGUgPSB0aGlzLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpO1xuICAgICAgaWYgKHNvdXJjZUZpbGUpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gKHNvdXJjZUZpbGUgYXMgYW55KS5wYXRoIHx8IHNvdXJjZUZpbGUuZmlsZU5hbWU7XG4gICAgICAgIHRzLmZvckVhY2hDaGlsZChzb3VyY2VGaWxlLCB2aXNpdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0Lmxlbmd0aCA/IHJlc3VsdCA6IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICBnZXREZWNsYXJhdGlvbnMoZmlsZU5hbWU6IHN0cmluZyk6IERlY2xhcmF0aW9ucyB7XG4gICAgY29uc3QgcmVzdWx0OiBEZWNsYXJhdGlvbnMgPSBbXTtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gdGhpcy5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKTtcbiAgICBpZiAoc291cmNlRmlsZSkge1xuICAgICAgbGV0IHZpc2l0ID0gKGNoaWxkOiB0cy5Ob2RlKSA9PiB7XG4gICAgICAgIGxldCBkZWNsYXJhdGlvbiA9IHRoaXMuZ2V0RGVjbGFyYXRpb25Gcm9tTm9kZShzb3VyY2VGaWxlLCBjaGlsZCk7XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbikge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGRlY2xhcmF0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cy5mb3JFYWNoQ2hpbGQoY2hpbGQsIHZpc2l0KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHRzLmZvckVhY2hDaGlsZChzb3VyY2VGaWxlLCB2aXNpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRTb3VyY2VGaWxlKGZpbGVOYW1lOiBzdHJpbmcpOiB0cy5Tb3VyY2VGaWxlfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMudHNTZXJ2aWNlLmdldFByb2dyYW0oKSAhLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpO1xuICB9XG5cbiAgdXBkYXRlQW5hbHl6ZWRNb2R1bGVzKCkge1xuICAgIHRoaXMudmFsaWRhdGUoKTtcbiAgICBpZiAodGhpcy5tb2R1bGVzT3V0T2ZEYXRlKSB7XG4gICAgICB0aGlzLmFuYWx5emVkTW9kdWxlcyA9IG51bGw7XG4gICAgICB0aGlzLl9yZWZsZWN0b3IgPSBudWxsO1xuICAgICAgdGhpcy50ZW1wbGF0ZVJlZmVyZW5jZXMgPSBudWxsO1xuICAgICAgdGhpcy5maWxlVG9Db21wb25lbnQgPSBudWxsO1xuICAgICAgdGhpcy5lbnN1cmVBbmFseXplZE1vZHVsZXMoKTtcbiAgICAgIHRoaXMubW9kdWxlc091dE9mRGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0IHByb2dyYW0oKSB7IHJldHVybiB0aGlzLnRzU2VydmljZS5nZXRQcm9ncmFtKCk7IH1cblxuICBwcml2YXRlIGdldCBjaGVja2VyKCkge1xuICAgIGxldCBjaGVja2VyID0gdGhpcy5fY2hlY2tlcjtcbiAgICBpZiAoIWNoZWNrZXIpIHtcbiAgICAgIGNoZWNrZXIgPSB0aGlzLl9jaGVja2VyID0gdGhpcy5wcm9ncmFtICEuZ2V0VHlwZUNoZWNrZXIoKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrZXI7XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlKCkge1xuICAgIGNvbnN0IHByb2dyYW0gPSB0aGlzLnByb2dyYW07XG4gICAgaWYgKHRoaXMubGFzdFByb2dyYW0gIT09IHByb2dyYW0pIHtcbiAgICAgIC8vIEludmFsaWRhdGUgZmlsZSB0aGF0IGhhdmUgY2hhbmdlZCBpbiB0aGUgc3RhdGljIHN5bWJvbCByZXNvbHZlclxuICAgICAgY29uc3QgaW52YWxpZGF0ZUZpbGUgPSAoZmlsZU5hbWU6IHN0cmluZykgPT5cbiAgICAgICAgICB0aGlzLl9zdGF0aWNTeW1ib2xSZXNvbHZlci5pbnZhbGlkYXRlRmlsZShmaWxlTmFtZSk7XG4gICAgICB0aGlzLmNsZWFyQ2FjaGVzKCk7XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBmb3IgKGxldCBzb3VyY2VGaWxlIG9mIHRoaXMucHJvZ3JhbSAhLmdldFNvdXJjZUZpbGVzKCkpIHtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBzb3VyY2VGaWxlLmZpbGVOYW1lO1xuICAgICAgICBzZWVuLmFkZChmaWxlTmFtZSk7XG4gICAgICAgIGNvbnN0IHZlcnNpb24gPSB0aGlzLmhvc3QuZ2V0U2NyaXB0VmVyc2lvbihmaWxlTmFtZSk7XG4gICAgICAgIGNvbnN0IGxhc3RWZXJzaW9uID0gdGhpcy5maWxlVmVyc2lvbnMuZ2V0KGZpbGVOYW1lKTtcbiAgICAgICAgaWYgKHZlcnNpb24gIT0gbGFzdFZlcnNpb24pIHtcbiAgICAgICAgICB0aGlzLmZpbGVWZXJzaW9ucy5zZXQoZmlsZU5hbWUsIHZlcnNpb24pO1xuICAgICAgICAgIGlmICh0aGlzLl9zdGF0aWNTeW1ib2xSZXNvbHZlcikge1xuICAgICAgICAgICAgaW52YWxpZGF0ZUZpbGUoZmlsZU5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgZmlsZSB2ZXJzaW9ucyB0aGF0IGFyZSBubyBsb25nZXIgaW4gdGhlIGZpbGUgYW5kIGludmFsaWRhdGUgdGhlbS5cbiAgICAgIGNvbnN0IG1pc3NpbmcgPSBBcnJheS5mcm9tKHRoaXMuZmlsZVZlcnNpb25zLmtleXMoKSkuZmlsdGVyKGYgPT4gIXNlZW4uaGFzKGYpKTtcbiAgICAgIG1pc3NpbmcuZm9yRWFjaChmID0+IHRoaXMuZmlsZVZlcnNpb25zLmRlbGV0ZShmKSk7XG4gICAgICBpZiAodGhpcy5fc3RhdGljU3ltYm9sUmVzb2x2ZXIpIHtcbiAgICAgICAgbWlzc2luZy5mb3JFYWNoKGludmFsaWRhdGVGaWxlKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sYXN0UHJvZ3JhbSA9IHByb2dyYW07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjbGVhckNhY2hlcygpIHtcbiAgICB0aGlzLl9jaGVja2VyID0gbnVsbDtcbiAgICB0aGlzLl90eXBlQ2FjaGUgPSBbXTtcbiAgICB0aGlzLl9yZXNvbHZlciA9IG51bGw7XG4gICAgdGhpcy5jb2xsZWN0ZWRFcnJvcnMgPSBudWxsO1xuICAgIHRoaXMubW9kdWxlc091dE9mRGF0ZSA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGVuc3VyZVRlbXBsYXRlTWFwKCkge1xuICAgIGlmICghdGhpcy5maWxlVG9Db21wb25lbnQgfHwgIXRoaXMudGVtcGxhdGVSZWZlcmVuY2VzKSB7XG4gICAgICBjb25zdCBmaWxlVG9Db21wb25lbnQgPSBuZXcgTWFwPHN0cmluZywgU3RhdGljU3ltYm9sPigpO1xuICAgICAgY29uc3QgdGVtcGxhdGVSZWZlcmVuY2U6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBuZ01vZHVsZVN1bW1hcnkgPSB0aGlzLmdldEFuYWx5emVkTW9kdWxlcygpO1xuICAgICAgY29uc3QgdXJsUmVzb2x2ZXIgPSBjcmVhdGVPZmZsaW5lQ29tcGlsZVVybFJlc29sdmVyKCk7XG4gICAgICBmb3IgKGNvbnN0IG1vZHVsZSBvZiBuZ01vZHVsZVN1bW1hcnkubmdNb2R1bGVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGlyZWN0aXZlIG9mIG1vZHVsZS5kZWNsYXJlZERpcmVjdGl2ZXMpIHtcbiAgICAgICAgICBjb25zdCB7bWV0YWRhdGF9ID0gdGhpcy5yZXNvbHZlci5nZXROb25Ob3JtYWxpemVkRGlyZWN0aXZlTWV0YWRhdGEoZGlyZWN0aXZlLnJlZmVyZW5jZSkgITtcbiAgICAgICAgICBpZiAobWV0YWRhdGEuaXNDb21wb25lbnQgJiYgbWV0YWRhdGEudGVtcGxhdGUgJiYgbWV0YWRhdGEudGVtcGxhdGUudGVtcGxhdGVVcmwpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IHVybFJlc29sdmVyLnJlc29sdmUoXG4gICAgICAgICAgICAgICAgdGhpcy5yZWZsZWN0b3IuY29tcG9uZW50TW9kdWxlVXJsKGRpcmVjdGl2ZS5yZWZlcmVuY2UpLFxuICAgICAgICAgICAgICAgIG1ldGFkYXRhLnRlbXBsYXRlLnRlbXBsYXRlVXJsKTtcbiAgICAgICAgICAgIGZpbGVUb0NvbXBvbmVudC5zZXQodGVtcGxhdGVOYW1lLCBkaXJlY3RpdmUucmVmZXJlbmNlKTtcbiAgICAgICAgICAgIHRlbXBsYXRlUmVmZXJlbmNlLnB1c2godGVtcGxhdGVOYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZmlsZVRvQ29tcG9uZW50ID0gZmlsZVRvQ29tcG9uZW50O1xuICAgICAgdGhpcy50ZW1wbGF0ZVJlZmVyZW5jZXMgPSB0ZW1wbGF0ZVJlZmVyZW5jZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFNvdXJjZUZyb21EZWNsYXJhdGlvbihcbiAgICAgIGZpbGVOYW1lOiBzdHJpbmcsIHZlcnNpb246IHN0cmluZywgc291cmNlOiBzdHJpbmcsIHNwYW46IFNwYW4sIHR5cGU6IFN0YXRpY1N5bWJvbCxcbiAgICAgIGRlY2xhcmF0aW9uOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBub2RlOiB0cy5Ob2RlLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogVGVtcGxhdGVTb3VyY2VcbiAgICAgIHx1bmRlZmluZWQge1xuICAgIGxldCBxdWVyeUNhY2hlOiBTeW1ib2xRdWVyeXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgY29uc3QgdCA9IHRoaXM7XG4gICAgaWYgKGRlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uLFxuICAgICAgICBzb3VyY2UsXG4gICAgICAgIHNwYW4sXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGdldCBtZW1iZXJzKCkge1xuICAgICAgICAgIHJldHVybiBnZXRDbGFzc01lbWJlcnNGcm9tRGVjbGFyYXRpb24odC5wcm9ncmFtICEsIHQuY2hlY2tlciwgc291cmNlRmlsZSwgZGVjbGFyYXRpb24pO1xuICAgICAgICB9LFxuICAgICAgICBnZXQgcXVlcnkoKSB7XG4gICAgICAgICAgaWYgKCFxdWVyeUNhY2hlKSB7XG4gICAgICAgICAgICBsZXQgcGlwZXM6IENvbXBpbGVQaXBlU3VtbWFyeVtdID0gW107XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUluZm8gPSB0LmdldFRlbXBsYXRlQXN0QXRQb3NpdGlvbihmaWxlTmFtZSwgbm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZUluZm8pIHtcbiAgICAgICAgICAgICAgcGlwZXMgPSB0ZW1wbGF0ZUluZm8ucGlwZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxdWVyeUNhY2hlID0gZ2V0U3ltYm9sUXVlcnkoXG4gICAgICAgICAgICAgICAgdC5wcm9ncmFtICEsIHQuY2hlY2tlciwgc291cmNlRmlsZSxcbiAgICAgICAgICAgICAgICAoKSA9PiBnZXRQaXBlc1RhYmxlKHNvdXJjZUZpbGUsIHQucHJvZ3JhbSAhLCB0LmNoZWNrZXIsIHBpcGVzKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBxdWVyeUNhY2hlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0U291cmNlRnJvbU5vZGUoZmlsZU5hbWU6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nLCBub2RlOiB0cy5Ob2RlKTogVGVtcGxhdGVTb3VyY2VcbiAgICAgIHx1bmRlZmluZWQge1xuICAgIGxldCByZXN1bHQ6IFRlbXBsYXRlU291cmNlfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0ID0gdGhpcztcbiAgICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLk5vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsOlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIGxldCBbZGVjbGFyYXRpb24sIGRlY29yYXRvcl0gPSB0aGlzLmdldFRlbXBsYXRlQ2xhc3NEZWNsRnJvbU5vZGUobm9kZSk7XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbiAmJiBkZWNsYXJhdGlvbi5uYW1lKSB7XG4gICAgICAgICAgY29uc3Qgc291cmNlRmlsZSA9IHRoaXMuZ2V0U291cmNlRmlsZShmaWxlTmFtZSk7XG4gICAgICAgICAgaWYgKHNvdXJjZUZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFNvdXJjZUZyb21EZWNsYXJhdGlvbihcbiAgICAgICAgICAgICAgICBmaWxlTmFtZSwgdmVyc2lvbiwgdGhpcy5zdHJpbmdPZihub2RlKSB8fCAnJywgc2hyaW5rKHNwYW5PZihub2RlKSksXG4gICAgICAgICAgICAgICAgdGhpcy5yZWZsZWN0b3IuZ2V0U3RhdGljU3ltYm9sKHNvdXJjZUZpbGUuZmlsZU5hbWUsIGRlY2xhcmF0aW9uLm5hbWUudGV4dCksXG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb24sIG5vZGUsIHNvdXJjZUZpbGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U291cmNlRnJvbVR5cGUoZmlsZU5hbWU6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nLCB0eXBlOiBTdGF0aWNTeW1ib2wpOiBUZW1wbGF0ZVNvdXJjZVxuICAgICAgfHVuZGVmaW5lZCB7XG4gICAgbGV0IHJlc3VsdDogVGVtcGxhdGVTb3VyY2V8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gdGhpcy5nZXRUZW1wbGF0ZUNsYXNzRnJvbVN0YXRpY1N5bWJvbCh0eXBlKTtcbiAgICBpZiAoZGVjbGFyYXRpb24pIHtcbiAgICAgIGNvbnN0IHNuYXBzaG90ID0gdGhpcy5ob3N0LmdldFNjcmlwdFNuYXBzaG90KGZpbGVOYW1lKTtcbiAgICAgIGlmIChzbmFwc2hvdCkge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBzbmFwc2hvdC5nZXRUZXh0KDAsIHNuYXBzaG90LmdldExlbmd0aCgpKTtcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5nZXRTb3VyY2VGcm9tRGVjbGFyYXRpb24oXG4gICAgICAgICAgICBmaWxlTmFtZSwgdmVyc2lvbiwgc291cmNlLCB7c3RhcnQ6IDAsIGVuZDogc291cmNlLmxlbmd0aH0sIHR5cGUsIGRlY2xhcmF0aW9uLFxuICAgICAgICAgICAgZGVjbGFyYXRpb24sIGRlY2xhcmF0aW9uLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGdldCByZWZsZWN0b3JIb3N0KCk6IFJlZmxlY3Rvckhvc3Qge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLl9yZWZsZWN0b3JIb3N0O1xuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICBpZiAoIXRoaXMuY29udGV4dCkge1xuICAgICAgICAvLyBNYWtlIHVwIGEgY29udGV4dCBieSBmaW5kaW5nIHRoZSBmaXJzdCBzY3JpcHQgYW5kIHVzaW5nIHRoYXQgYXMgdGhlIGJhc2UgZGlyLlxuICAgICAgICBjb25zdCBzY3JpcHRGaWxlTmFtZXMgPSB0aGlzLmhvc3QuZ2V0U2NyaXB0RmlsZU5hbWVzKCk7XG4gICAgICAgIGlmICgwID09PSBzY3JpcHRGaWxlTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnRlcm5hbCBlcnJvcjogbm8gc2NyaXB0IGZpbGUgbmFtZXMgZm91bmQnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRleHQgPSBzY3JpcHRGaWxlTmFtZXNbMF07XG4gICAgICB9XG5cbiAgICAgIC8vIFVzZSB0aGUgZmlsZSBjb250ZXh0J3MgZGlyZWN0b3J5IGFzIHRoZSBiYXNlIGRpcmVjdG9yeS5cbiAgICAgIC8vIFRoZSBob3N0J3MgZ2V0Q3VycmVudERpcmVjdG9yeSgpIGlzIG5vdCByZWxpYWJsZSBhcyBpdCBpcyBhbHdheXMgXCJcIiBpblxuICAgICAgLy8gdHNzZXJ2ZXIuIFdlIGRvbid0IG5lZWQgdGhlIGV4YWN0IGJhc2UgZGlyZWN0b3J5LCBqdXN0IG9uZSB0aGF0IGNvbnRhaW5zXG4gICAgICAvLyBhIHNvdXJjZSBmaWxlLlxuICAgICAgY29uc3Qgc291cmNlID0gdGhpcy50c1NlcnZpY2UuZ2V0UHJvZ3JhbSgpICEuZ2V0U291cmNlRmlsZSh0aGlzLmNvbnRleHQpO1xuICAgICAgaWYgKCFzb3VyY2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnRlcm5hbCBlcnJvcjogbm8gY29udGV4dCBjb3VsZCBiZSBkZXRlcm1pbmVkJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRzQ29uZmlnUGF0aCA9IGZpbmRUc0NvbmZpZyhzb3VyY2UuZmlsZU5hbWUpO1xuICAgICAgY29uc3QgYmFzZVBhdGggPSBwYXRoLmRpcm5hbWUodHNDb25maWdQYXRoIHx8IHRoaXMuY29udGV4dCk7XG4gICAgICBjb25zdCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMgPSB7YmFzZVBhdGgsIGdlbkRpcjogYmFzZVBhdGh9O1xuICAgICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gdGhpcy5ob3N0LmdldENvbXBpbGF0aW9uU2V0dGluZ3MoKTtcbiAgICAgIGlmIChjb21waWxlck9wdGlvbnMgJiYgY29tcGlsZXJPcHRpb25zLmJhc2VVcmwpIHtcbiAgICAgICAgb3B0aW9ucy5iYXNlVXJsID0gY29tcGlsZXJPcHRpb25zLmJhc2VVcmw7XG4gICAgICB9XG4gICAgICBpZiAoY29tcGlsZXJPcHRpb25zICYmIGNvbXBpbGVyT3B0aW9ucy5wYXRocykge1xuICAgICAgICBvcHRpb25zLnBhdGhzID0gY29tcGlsZXJPcHRpb25zLnBhdGhzO1xuICAgICAgfVxuICAgICAgcmVzdWx0ID0gdGhpcy5fcmVmbGVjdG9ySG9zdCA9XG4gICAgICAgICAgbmV3IFJlZmxlY3Rvckhvc3QoKCkgPT4gdGhpcy50c1NlcnZpY2UuZ2V0UHJvZ3JhbSgpICEsIHRoaXMuaG9zdCwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGNvbGxlY3RFcnJvcihlcnJvcjogYW55LCBmaWxlUGF0aDogc3RyaW5nfG51bGwpIHtcbiAgICBpZiAoZmlsZVBhdGgpIHtcbiAgICAgIGxldCBlcnJvck1hcCA9IHRoaXMuY29sbGVjdGVkRXJyb3JzO1xuICAgICAgaWYgKCFlcnJvck1hcCB8fCAhdGhpcy5jb2xsZWN0ZWRFcnJvcnMpIHtcbiAgICAgICAgZXJyb3JNYXAgPSB0aGlzLmNvbGxlY3RlZEVycm9ycyA9IG5ldyBNYXAoKTtcbiAgICAgIH1cbiAgICAgIGxldCBlcnJvcnMgPSBlcnJvck1hcC5nZXQoZmlsZVBhdGgpO1xuICAgICAgaWYgKCFlcnJvcnMpIHtcbiAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgIHRoaXMuY29sbGVjdGVkRXJyb3JzLnNldChmaWxlUGF0aCwgZXJyb3JzKTtcbiAgICAgIH1cbiAgICAgIGVycm9ycy5wdXNoKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldCBzdGF0aWNTeW1ib2xSZXNvbHZlcigpOiBTdGF0aWNTeW1ib2xSZXNvbHZlciB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMuX3N0YXRpY1N5bWJvbFJlc29sdmVyO1xuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICB0aGlzLl9zdW1tYXJ5UmVzb2x2ZXIgPSBuZXcgQW90U3VtbWFyeVJlc29sdmVyKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxvYWRTdW1tYXJ5KGZpbGVQYXRoOiBzdHJpbmcpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgICAgICBpc1NvdXJjZUZpbGUoc291cmNlRmlsZVBhdGg6IHN0cmluZykgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgICAgICAgIHRvU3VtbWFyeUZpbGVOYW1lKHNvdXJjZUZpbGVQYXRoOiBzdHJpbmcpIHsgcmV0dXJuIHNvdXJjZUZpbGVQYXRoOyB9LFxuICAgICAgICAgICAgZnJvbVN1bW1hcnlGaWxlTmFtZShmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5ne3JldHVybiBmaWxlUGF0aDt9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGhpcy5fc3RhdGljU3ltYm9sQ2FjaGUpO1xuICAgICAgcmVzdWx0ID0gdGhpcy5fc3RhdGljU3ltYm9sUmVzb2x2ZXIgPSBuZXcgU3RhdGljU3ltYm9sUmVzb2x2ZXIoXG4gICAgICAgICAgdGhpcy5yZWZsZWN0b3JIb3N0IGFzIGFueSwgdGhpcy5fc3RhdGljU3ltYm9sQ2FjaGUsIHRoaXMuX3N1bW1hcnlSZXNvbHZlcixcbiAgICAgICAgICAoZSwgZmlsZVBhdGgpID0+IHRoaXMuY29sbGVjdEVycm9yKGUsIGZpbGVQYXRoICEpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IHJlZmxlY3RvcigpOiBTdGF0aWNSZWZsZWN0b3Ige1xuICAgIGxldCByZXN1bHQgPSB0aGlzLl9yZWZsZWN0b3I7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIGNvbnN0IHNzciA9IHRoaXMuc3RhdGljU3ltYm9sUmVzb2x2ZXI7XG4gICAgICByZXN1bHQgPSB0aGlzLl9yZWZsZWN0b3IgPSBuZXcgU3RhdGljUmVmbGVjdG9yKFxuICAgICAgICAgIHRoaXMuX3N1bW1hcnlSZXNvbHZlciwgc3NyLCBbXSwgW10sIChlLCBmaWxlUGF0aCkgPT4gdGhpcy5jb2xsZWN0RXJyb3IoZSwgZmlsZVBhdGggISkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUZW1wbGF0ZUNsYXNzRnJvbVN0YXRpY1N5bWJvbCh0eXBlOiBTdGF0aWNTeW1ib2wpOiB0cy5DbGFzc0RlY2xhcmF0aW9ufHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc291cmNlID0gdGhpcy5nZXRTb3VyY2VGaWxlKHR5cGUuZmlsZVBhdGgpO1xuICAgIGlmIChzb3VyY2UpIHtcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uTm9kZSA9IHRzLmZvckVhY2hDaGlsZChzb3VyY2UsIGNoaWxkID0+IHtcbiAgICAgICAgaWYgKGNoaWxkLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgICAgICAgIGNvbnN0IGNsYXNzRGVjbGFyYXRpb24gPSBjaGlsZCBhcyB0cy5DbGFzc0RlY2xhcmF0aW9uO1xuICAgICAgICAgIGlmIChjbGFzc0RlY2xhcmF0aW9uLm5hbWUgIT0gbnVsbCAmJiBjbGFzc0RlY2xhcmF0aW9uLm5hbWUudGV4dCA9PT0gdHlwZS5uYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gY2xhc3NEZWNsYXJhdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uTm9kZSBhcyB0cy5DbGFzc0RlY2xhcmF0aW9uO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBtaXNzaW5nVGVtcGxhdGU6IFt0cy5DbGFzc0RlY2xhcmF0aW9uIHwgdW5kZWZpbmVkLCB0cy5FeHByZXNzaW9ufHVuZGVmaW5lZF0gPVxuICAgICAgW3VuZGVmaW5lZCwgdW5kZWZpbmVkXTtcblxuICAvKipcbiAgICogR2l2ZW4gYSB0ZW1wbGF0ZSBzdHJpbmcgbm9kZSwgc2VlIGlmIGl0IGlzIGFuIEFuZ3VsYXIgdGVtcGxhdGUgc3RyaW5nLCBhbmQgaWYgc28gcmV0dXJuIHRoZVxuICAgKiBjb250YWluaW5nIGNsYXNzLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRUZW1wbGF0ZUNsYXNzRGVjbEZyb21Ob2RlKGN1cnJlbnRUb2tlbjogdHMuTm9kZSk6XG4gICAgICBbdHMuQ2xhc3NEZWNsYXJhdGlvbiB8IHVuZGVmaW5lZCwgdHMuRXhwcmVzc2lvbnx1bmRlZmluZWRdIHtcbiAgICAvLyBWZXJpZnkgd2UgYXJlIGluIGEgJ3RlbXBsYXRlJyBwcm9wZXJ0eSBhc3NpZ25tZW50LCBpbiBhbiBvYmplY3QgbGl0ZXJhbCwgd2hpY2ggaXMgYW4gY2FsbFxuICAgIC8vIGFyZywgaW4gYSBkZWNvcmF0b3JcbiAgICBsZXQgcGFyZW50Tm9kZSA9IGN1cnJlbnRUb2tlbi5wYXJlbnQ7ICAvLyBQcm9wZXJ0eUFzc2lnbm1lbnRcbiAgICBpZiAoIXBhcmVudE5vZGUpIHtcbiAgICAgIHJldHVybiBUeXBlU2NyaXB0U2VydmljZUhvc3QubWlzc2luZ1RlbXBsYXRlO1xuICAgIH1cbiAgICBpZiAocGFyZW50Tm9kZS5raW5kICE9PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QXNzaWdubWVudCkge1xuICAgICAgcmV0dXJuIFR5cGVTY3JpcHRTZXJ2aWNlSG9zdC5taXNzaW5nVGVtcGxhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IElzIHRoaXMgZGlmZmVyZW50IGZvciBhIGxpdGVyYWwsIGkuZS4gYSBxdW90ZWQgcHJvcGVydHkgbmFtZSBsaWtlIFwidGVtcGxhdGVcIj9cbiAgICAgIGlmICgocGFyZW50Tm9kZSBhcyBhbnkpLm5hbWUudGV4dCAhPT0gJ3RlbXBsYXRlJykge1xuICAgICAgICByZXR1cm4gVHlwZVNjcmlwdFNlcnZpY2VIb3N0Lm1pc3NpbmdUZW1wbGF0ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcGFyZW50Tm9kZSA9IHBhcmVudE5vZGUucGFyZW50OyAgLy8gT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb25cbiAgICBpZiAoIXBhcmVudE5vZGUgfHwgcGFyZW50Tm9kZS5raW5kICE9PSB0cy5TeW50YXhLaW5kLk9iamVjdExpdGVyYWxFeHByZXNzaW9uKSB7XG4gICAgICByZXR1cm4gVHlwZVNjcmlwdFNlcnZpY2VIb3N0Lm1pc3NpbmdUZW1wbGF0ZTtcbiAgICB9XG5cbiAgICBwYXJlbnROb2RlID0gcGFyZW50Tm9kZS5wYXJlbnQ7ICAvLyBDYWxsRXhwcmVzc2lvblxuICAgIGlmICghcGFyZW50Tm9kZSB8fCBwYXJlbnROb2RlLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICAgIHJldHVybiBUeXBlU2NyaXB0U2VydmljZUhvc3QubWlzc2luZ1RlbXBsYXRlO1xuICAgIH1cbiAgICBjb25zdCBjYWxsVGFyZ2V0ID0gKDx0cy5DYWxsRXhwcmVzc2lvbj5wYXJlbnROb2RlKS5leHByZXNzaW9uO1xuXG4gICAgbGV0IGRlY29yYXRvciA9IHBhcmVudE5vZGUucGFyZW50OyAgLy8gRGVjb3JhdG9yXG4gICAgaWYgKCFkZWNvcmF0b3IgfHwgZGVjb3JhdG9yLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuRGVjb3JhdG9yKSB7XG4gICAgICByZXR1cm4gVHlwZVNjcmlwdFNlcnZpY2VIb3N0Lm1pc3NpbmdUZW1wbGF0ZTtcbiAgICB9XG5cbiAgICBsZXQgZGVjbGFyYXRpb24gPSA8dHMuQ2xhc3NEZWNsYXJhdGlvbj5kZWNvcmF0b3IucGFyZW50OyAgLy8gQ2xhc3NEZWNsYXJhdGlvblxuICAgIGlmICghZGVjbGFyYXRpb24gfHwgZGVjbGFyYXRpb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm4gVHlwZVNjcmlwdFNlcnZpY2VIb3N0Lm1pc3NpbmdUZW1wbGF0ZTtcbiAgICB9XG4gICAgcmV0dXJuIFtkZWNsYXJhdGlvbiwgY2FsbFRhcmdldF07XG4gIH1cblxuICBwcml2YXRlIGdldENvbGxlY3RlZEVycm9ycyhkZWZhdWx0U3BhbjogU3Bhbiwgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IERlY2xhcmF0aW9uRXJyb3JbXSB7XG4gICAgY29uc3QgZXJyb3JzID0gKHRoaXMuY29sbGVjdGVkRXJyb3JzICYmIHRoaXMuY29sbGVjdGVkRXJyb3JzLmdldChzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG4gICAgcmV0dXJuIChlcnJvcnMgJiYgZXJyb3JzLm1hcCgoZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgY29uc3QgbGluZSA9IGUubGluZSB8fCAoZS5wb3NpdGlvbiAmJiBlLnBvc2l0aW9uLmxpbmUpO1xuICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9IGUuY29sdW1uIHx8IChlLnBvc2l0aW9uICYmIGUucG9zaXRpb24uY29sdW1uKTtcbiAgICAgICAgICAgICBjb25zdCBzcGFuID0gc3BhbkF0KHNvdXJjZUZpbGUsIGxpbmUsIGNvbHVtbikgfHwgZGVmYXVsdFNwYW47XG4gICAgICAgICAgICAgaWYgKGlzRm9ybWF0dGVkRXJyb3IoZSkpIHtcbiAgICAgICAgICAgICAgIHJldHVybiBlcnJvclRvRGlhZ25vc3RpY1dpdGhDaGFpbihlLCBzcGFuKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgcmV0dXJuIHttZXNzYWdlOiBlLm1lc3NhZ2UsIHNwYW59O1xuICAgICAgICAgICB9KSkgfHxcbiAgICAgICAgW107XG4gIH1cblxuICBwcml2YXRlIGdldERlY2xhcmF0aW9uRnJvbU5vZGUoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgbm9kZTogdHMuTm9kZSk6IERlY2xhcmF0aW9ufHVuZGVmaW5lZCB7XG4gICAgaWYgKG5vZGUua2luZCA9PSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb24gJiYgbm9kZS5kZWNvcmF0b3JzICYmXG4gICAgICAgIChub2RlIGFzIHRzLkNsYXNzRGVjbGFyYXRpb24pLm5hbWUpIHtcbiAgICAgIGZvciAoY29uc3QgZGVjb3JhdG9yIG9mIG5vZGUuZGVjb3JhdG9ycykge1xuICAgICAgICBpZiAoZGVjb3JhdG9yLmV4cHJlc3Npb24gJiYgZGVjb3JhdG9yLmV4cHJlc3Npb24ua2luZCA9PSB0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uKSB7XG4gICAgICAgICAgY29uc3QgY2xhc3NEZWNsYXJhdGlvbiA9IG5vZGUgYXMgdHMuQ2xhc3NEZWNsYXJhdGlvbjtcbiAgICAgICAgICBpZiAoY2xhc3NEZWNsYXJhdGlvbi5uYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsID0gZGVjb3JhdG9yLmV4cHJlc3Npb24gYXMgdHMuQ2FsbEV4cHJlc3Npb247XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBjYWxsLmV4cHJlc3Npb247XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gdGhpcy5jaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKHRhcmdldCk7XG4gICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICBjb25zdCBzdGF0aWNTeW1ib2wgPVxuICAgICAgICAgICAgICAgICAgdGhpcy5yZWZsZWN0b3IuZ2V0U3RhdGljU3ltYm9sKHNvdXJjZUZpbGUuZmlsZU5hbWUsIGNsYXNzRGVjbGFyYXRpb24ubmFtZS50ZXh0KTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNvbHZlci5pc0RpcmVjdGl2ZShzdGF0aWNTeW1ib2wgYXMgYW55KSkge1xuICAgICAgICAgICAgICAgICAgY29uc3Qge21ldGFkYXRhfSA9XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlci5nZXROb25Ob3JtYWxpemVkRGlyZWN0aXZlTWV0YWRhdGEoc3RhdGljU3ltYm9sIGFzIGFueSkgITtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uU3BhbiA9IHNwYW5PZih0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogc3RhdGljU3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICBkZWNsYXJhdGlvblNwYW4sXG4gICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnM6IHRoaXMuZ2V0Q29sbGVjdGVkRXJyb3JzKGRlY2xhcmF0aW9uU3Bhbiwgc291cmNlRmlsZSlcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0RXJyb3IoZSwgc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBkZWNsYXJhdGlvblNwYW4gPSBzcGFuT2YodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHN0YXRpY1N5bWJvbCxcbiAgICAgICAgICAgICAgICAgICAgZGVjbGFyYXRpb25TcGFuLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnM6IHRoaXMuZ2V0Q29sbGVjdGVkRXJyb3JzKGRlY2xhcmF0aW9uU3Bhbiwgc291cmNlRmlsZSlcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdHJpbmdPZihub2RlOiB0cy5Ob2RlKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Ob1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuICg8dHMuTGl0ZXJhbEV4cHJlc3Npb24+bm9kZSkudGV4dDtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsOlxuICAgICAgICByZXR1cm4gKDx0cy5TdHJpbmdMaXRlcmFsPm5vZGUpLnRleHQ7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kTm9kZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBwb3NpdGlvbjogbnVtYmVyKTogdHMuTm9kZXx1bmRlZmluZWQge1xuICAgIGZ1bmN0aW9uIGZpbmQobm9kZTogdHMuTm9kZSk6IHRzLk5vZGV8dW5kZWZpbmVkIHtcbiAgICAgIGlmIChwb3NpdGlvbiA+PSBub2RlLmdldFN0YXJ0KCkgJiYgcG9zaXRpb24gPCBub2RlLmdldEVuZCgpKSB7XG4gICAgICAgIHJldHVybiB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgZmluZCkgfHwgbm9kZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmluZChzb3VyY2VGaWxlKTtcbiAgfVxuXG4gIGdldFRlbXBsYXRlQXN0QXRQb3NpdGlvbihmaWxlTmFtZTogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKTogVGVtcGxhdGVJbmZvfHVuZGVmaW5lZCB7XG4gICAgbGV0IHRlbXBsYXRlID0gdGhpcy5nZXRUZW1wbGF0ZUF0KGZpbGVOYW1lLCBwb3NpdGlvbik7XG4gICAgaWYgKHRlbXBsYXRlKSB7XG4gICAgICBsZXQgYXN0UmVzdWx0ID0gdGhpcy5nZXRUZW1wbGF0ZUFzdCh0ZW1wbGF0ZSwgZmlsZU5hbWUpO1xuICAgICAgaWYgKGFzdFJlc3VsdCAmJiBhc3RSZXN1bHQuaHRtbEFzdCAmJiBhc3RSZXN1bHQudGVtcGxhdGVBc3QgJiYgYXN0UmVzdWx0LmRpcmVjdGl2ZSAmJlxuICAgICAgICAgIGFzdFJlc3VsdC5kaXJlY3RpdmVzICYmIGFzdFJlc3VsdC5waXBlcyAmJiBhc3RSZXN1bHQuZXhwcmVzc2lvblBhcnNlcilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICBodG1sQXN0OiBhc3RSZXN1bHQuaHRtbEFzdCxcbiAgICAgICAgICBkaXJlY3RpdmU6IGFzdFJlc3VsdC5kaXJlY3RpdmUsXG4gICAgICAgICAgZGlyZWN0aXZlczogYXN0UmVzdWx0LmRpcmVjdGl2ZXMsXG4gICAgICAgICAgcGlwZXM6IGFzdFJlc3VsdC5waXBlcyxcbiAgICAgICAgICB0ZW1wbGF0ZUFzdDogYXN0UmVzdWx0LnRlbXBsYXRlQXN0LFxuICAgICAgICAgIGV4cHJlc3Npb25QYXJzZXI6IGFzdFJlc3VsdC5leHByZXNzaW9uUGFyc2VyXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBnZXRUZW1wbGF0ZUFzdCh0ZW1wbGF0ZTogVGVtcGxhdGVTb3VyY2UsIGNvbnRleHRGaWxlOiBzdHJpbmcpOiBBc3RSZXN1bHQge1xuICAgIGxldCByZXN1bHQ6IEFzdFJlc3VsdHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc29sdmVkTWV0YWRhdGEgPVxuICAgICAgICAgIHRoaXMucmVzb2x2ZXIuZ2V0Tm9uTm9ybWFsaXplZERpcmVjdGl2ZU1ldGFkYXRhKHRlbXBsYXRlLnR5cGUgYXMgYW55KTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gcmVzb2x2ZWRNZXRhZGF0YSAmJiByZXNvbHZlZE1ldGFkYXRhLm1ldGFkYXRhO1xuICAgICAgaWYgKG1ldGFkYXRhKSB7XG4gICAgICAgIGNvbnN0IHJhd0h0bWxQYXJzZXIgPSBuZXcgSHRtbFBhcnNlcigpO1xuICAgICAgICBjb25zdCBodG1sUGFyc2VyID0gbmV3IEkxOE5IdG1sUGFyc2VyKHJhd0h0bWxQYXJzZXIpO1xuICAgICAgICBjb25zdCBleHByZXNzaW9uUGFyc2VyID0gbmV3IFBhcnNlcihuZXcgTGV4ZXIoKSk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IG5ldyBDb21waWxlckNvbmZpZygpO1xuICAgICAgICBjb25zdCBwYXJzZXIgPSBuZXcgVGVtcGxhdGVQYXJzZXIoXG4gICAgICAgICAgICBjb25maWcsIHRoaXMucmVzb2x2ZXIuZ2V0UmVmbGVjdG9yKCksIGV4cHJlc3Npb25QYXJzZXIsIG5ldyBEb21FbGVtZW50U2NoZW1hUmVnaXN0cnkoKSxcbiAgICAgICAgICAgIGh0bWxQYXJzZXIsIG51bGwgISwgW10pO1xuICAgICAgICBjb25zdCBodG1sUmVzdWx0ID0gaHRtbFBhcnNlci5wYXJzZSh0ZW1wbGF0ZS5zb3VyY2UsICcnLCB7dG9rZW5pemVFeHBhbnNpb25Gb3JtczogdHJ1ZX0pO1xuICAgICAgICBjb25zdCBhbmFseXplZE1vZHVsZXMgPSB0aGlzLmdldEFuYWx5emVkTW9kdWxlcygpO1xuICAgICAgICBsZXQgZXJyb3JzOiBEaWFnbm9zdGljW118dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgbmdNb2R1bGUgPSBhbmFseXplZE1vZHVsZXMubmdNb2R1bGVCeVBpcGVPckRpcmVjdGl2ZS5nZXQodGVtcGxhdGUudHlwZSk7XG4gICAgICAgIGlmICghbmdNb2R1bGUpIHtcbiAgICAgICAgICAvLyBSZXBvcnRlZCBieSB0aGUgdGhlIGRlY2xhcmF0aW9uIGRpYWdub3N0aWNzLlxuICAgICAgICAgIG5nTW9kdWxlID0gZmluZFN1aXRhYmxlRGVmYXVsdE1vZHVsZShhbmFseXplZE1vZHVsZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZ01vZHVsZSkge1xuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZXMgPVxuICAgICAgICAgICAgICBuZ01vZHVsZS50cmFuc2l0aXZlTW9kdWxlLmRpcmVjdGl2ZXNcbiAgICAgICAgICAgICAgICAgIC5tYXAoZCA9PiB0aGlzLnJlc29sdmVyLmdldE5vbk5vcm1hbGl6ZWREaXJlY3RpdmVNZXRhZGF0YShkLnJlZmVyZW5jZSkpXG4gICAgICAgICAgICAgICAgICAuZmlsdGVyKGQgPT4gZClcbiAgICAgICAgICAgICAgICAgIC5tYXAoZCA9PiBkICEubWV0YWRhdGEudG9TdW1tYXJ5KCkpO1xuICAgICAgICAgIGNvbnN0IHBpcGVzID0gbmdNb2R1bGUudHJhbnNpdGl2ZU1vZHVsZS5waXBlcy5tYXAoXG4gICAgICAgICAgICAgIHAgPT4gdGhpcy5yZXNvbHZlci5nZXRPckxvYWRQaXBlTWV0YWRhdGEocC5yZWZlcmVuY2UpLnRvU3VtbWFyeSgpKTtcbiAgICAgICAgICBjb25zdCBzY2hlbWFzID0gbmdNb2R1bGUuc2NoZW1hcztcbiAgICAgICAgICBjb25zdCBwYXJzZVJlc3VsdCA9IHBhcnNlci50cnlQYXJzZUh0bWwoaHRtbFJlc3VsdCwgbWV0YWRhdGEsIGRpcmVjdGl2ZXMsIHBpcGVzLCBzY2hlbWFzKTtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBodG1sQXN0OiBodG1sUmVzdWx0LnJvb3ROb2RlcyxcbiAgICAgICAgICAgIHRlbXBsYXRlQXN0OiBwYXJzZVJlc3VsdC50ZW1wbGF0ZUFzdCxcbiAgICAgICAgICAgIGRpcmVjdGl2ZTogbWV0YWRhdGEsIGRpcmVjdGl2ZXMsIHBpcGVzLFxuICAgICAgICAgICAgcGFyc2VFcnJvcnM6IHBhcnNlUmVzdWx0LmVycm9ycywgZXhwcmVzc2lvblBhcnNlciwgZXJyb3JzXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxldCBzcGFuID0gdGVtcGxhdGUuc3BhbjtcbiAgICAgIGlmIChlLmZpbGVOYW1lID09IGNvbnRleHRGaWxlKSB7XG4gICAgICAgIHNwYW4gPSB0ZW1wbGF0ZS5xdWVyeS5nZXRTcGFuQXQoZS5saW5lLCBlLmNvbHVtbikgfHwgc3BhbjtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHtlcnJvcnM6IFt7a2luZDogRGlhZ25vc3RpY0tpbmQuRXJyb3IsIG1lc3NhZ2U6IGUubWVzc2FnZSwgc3Bhbn1dfTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdCB8fCB7fTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kU3VpdGFibGVEZWZhdWx0TW9kdWxlKG1vZHVsZXM6IE5nQW5hbHl6ZWRNb2R1bGVzKTogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGF8dW5kZWZpbmVkIHtcbiAgbGV0IHJlc3VsdDogQ29tcGlsZU5nTW9kdWxlTWV0YWRhdGF8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgcmVzdWx0U2l6ZSA9IDA7XG4gIGZvciAoY29uc3QgbW9kdWxlIG9mIG1vZHVsZXMubmdNb2R1bGVzKSB7XG4gICAgY29uc3QgbW9kdWxlU2l6ZSA9IG1vZHVsZS50cmFuc2l0aXZlTW9kdWxlLmRpcmVjdGl2ZXMubGVuZ3RoO1xuICAgIGlmIChtb2R1bGVTaXplID4gcmVzdWx0U2l6ZSkge1xuICAgICAgcmVzdWx0ID0gbW9kdWxlO1xuICAgICAgcmVzdWx0U2l6ZSA9IG1vZHVsZVNpemU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGZpbmRUc0NvbmZpZyhmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIGxldCBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICB3aGlsZSAoZnMuZXhpc3RzU3luYyhkaXIpKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gcGF0aC5qb2luKGRpciwgJ3RzY29uZmlnLmpzb24nKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhjYW5kaWRhdGUpKSByZXR1cm4gY2FuZGlkYXRlO1xuICAgIGNvbnN0IHBhcmVudERpciA9IHBhdGguZGlybmFtZShkaXIpO1xuICAgIGlmIChwYXJlbnREaXIgPT09IGRpcikgYnJlYWs7XG4gICAgZGlyID0gcGFyZW50RGlyO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNwYW5PZihub2RlOiB0cy5Ob2RlKTogU3BhbiB7XG4gIHJldHVybiB7c3RhcnQ6IG5vZGUuZ2V0U3RhcnQoKSwgZW5kOiBub2RlLmdldEVuZCgpfTtcbn1cblxuZnVuY3Rpb24gc2hyaW5rKHNwYW46IFNwYW4sIG9mZnNldD86IG51bWJlcikge1xuICBpZiAob2Zmc2V0ID09IG51bGwpIG9mZnNldCA9IDE7XG4gIHJldHVybiB7c3RhcnQ6IHNwYW4uc3RhcnQgKyBvZmZzZXQsIGVuZDogc3Bhbi5lbmQgLSBvZmZzZXR9O1xufVxuXG5mdW5jdGlvbiBzcGFuQXQoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgbGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IFNwYW58dW5kZWZpbmVkIHtcbiAgaWYgKGxpbmUgIT0gbnVsbCAmJiBjb2x1bW4gIT0gbnVsbCkge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdHMuZ2V0UG9zaXRpb25PZkxpbmVBbmRDaGFyYWN0ZXIoc291cmNlRmlsZSwgbGluZSwgY29sdW1uKTtcbiAgICBjb25zdCBmaW5kQ2hpbGQgPSBmdW5jdGlvbiBmaW5kQ2hpbGQobm9kZTogdHMuTm9kZSk6IHRzLk5vZGUgfCB1bmRlZmluZWQge1xuICAgICAgaWYgKG5vZGUua2luZCA+IHRzLlN5bnRheEtpbmQuTGFzdFRva2VuICYmIG5vZGUucG9zIDw9IHBvc2l0aW9uICYmIG5vZGUuZW5kID4gcG9zaXRpb24pIHtcbiAgICAgICAgY29uc3QgYmV0dGVyTm9kZSA9IHRzLmZvckVhY2hDaGlsZChub2RlLCBmaW5kQ2hpbGQpO1xuICAgICAgICByZXR1cm4gYmV0dGVyTm9kZSB8fCBub2RlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBub2RlID0gdHMuZm9yRWFjaENoaWxkKHNvdXJjZUZpbGUsIGZpbmRDaGlsZCk7XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIHJldHVybiB7c3RhcnQ6IG5vZGUuZ2V0U3RhcnQoKSwgZW5kOiBub2RlLmdldEVuZCgpfTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hhaW5lZE1lc3NhZ2UoY2hhaW46IERpYWdub3N0aWNNZXNzYWdlQ2hhaW4sIGluZGVudCA9ICcnKTogc3RyaW5nIHtcbiAgcmV0dXJuIGluZGVudCArIGNoYWluLm1lc3NhZ2UgKyAoY2hhaW4ubmV4dCA/IGNoYWluZWRNZXNzYWdlKGNoYWluLm5leHQsIGluZGVudCArICcgICcpIDogJycpO1xufVxuXG5jbGFzcyBEaWFnbm9zdGljTWVzc2FnZUNoYWluSW1wbCBpbXBsZW1lbnRzIERpYWdub3N0aWNNZXNzYWdlQ2hhaW4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbWVzc2FnZTogc3RyaW5nLCBwdWJsaWMgbmV4dD86IERpYWdub3N0aWNNZXNzYWdlQ2hhaW4pIHt9XG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiBjaGFpbmVkTWVzc2FnZSh0aGlzKTsgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2hhaW4oY2hhaW46IEZvcm1hdHRlZE1lc3NhZ2VDaGFpbik6IERpYWdub3N0aWNNZXNzYWdlQ2hhaW4ge1xuICByZXR1cm4ge21lc3NhZ2U6IGNoYWluLm1lc3NhZ2UsIG5leHQ6IGNoYWluLm5leHQgPyBjb252ZXJ0Q2hhaW4oY2hhaW4ubmV4dCkgOiB1bmRlZmluZWR9O1xufVxuXG5mdW5jdGlvbiBlcnJvclRvRGlhZ25vc3RpY1dpdGhDaGFpbihlcnJvcjogRm9ybWF0dGVkRXJyb3IsIHNwYW46IFNwYW4pOiBEZWNsYXJhdGlvbkVycm9yIHtcbiAgcmV0dXJuIHttZXNzYWdlOiBlcnJvci5jaGFpbiA/IGNvbnZlcnRDaGFpbihlcnJvci5jaGFpbikgOiBlcnJvci5tZXNzYWdlLCBzcGFufTtcbn1cbiJdfQ==