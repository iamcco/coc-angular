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
        define("@angular/language-service/src/reflector_host", ["require", "exports", "@angular/compiler-cli/src/language_services", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var language_services_1 = require("@angular/compiler-cli/src/language_services");
    var path = require("path");
    var ts = require("typescript");
    var ReflectorModuleModuleResolutionHost = /** @class */ (function () {
        function ReflectorModuleModuleResolutionHost(host, getProgram) {
            var _this = this;
            this.host = host;
            this.getProgram = getProgram;
            // Note: verboseInvalidExpressions is important so that
            // the collector will collect errors instead of throwing
            this.metadataCollector = new language_services_1.MetadataCollector({ verboseInvalidExpression: true });
            if (host.directoryExists)
                this.directoryExists = function (directoryName) { return _this.host.directoryExists(directoryName); };
        }
        ReflectorModuleModuleResolutionHost.prototype.fileExists = function (fileName) { return !!this.host.getScriptSnapshot(fileName); };
        ReflectorModuleModuleResolutionHost.prototype.readFile = function (fileName) {
            var snapshot = this.host.getScriptSnapshot(fileName);
            if (snapshot) {
                return snapshot.getText(0, snapshot.getLength());
            }
            // Typescript readFile() declaration should be `readFile(fileName: string): string | undefined
            return undefined;
        };
        ReflectorModuleModuleResolutionHost.prototype.getSourceFileMetadata = function (fileName) {
            var sf = this.getProgram().getSourceFile(fileName);
            return sf ? this.metadataCollector.getMetadata(sf) : undefined;
        };
        ReflectorModuleModuleResolutionHost.prototype.cacheMetadata = function (fileName) {
            // Don't cache the metadata for .ts files as they might change in the editor!
            return fileName.endsWith('.d.ts');
        };
        return ReflectorModuleModuleResolutionHost;
    }());
    var ReflectorHost = /** @class */ (function () {
        function ReflectorHost(getProgram, serviceHost, options) {
            this.options = options;
            this.metadataReaderCache = language_services_1.createMetadataReaderCache();
            this.hostAdapter = new ReflectorModuleModuleResolutionHost(serviceHost, getProgram);
        }
        ReflectorHost.prototype.getMetadataFor = function (modulePath) {
            return language_services_1.readMetadata(modulePath, this.hostAdapter, this.metadataReaderCache);
        };
        ReflectorHost.prototype.moduleNameToFileName = function (moduleName, containingFile) {
            if (!containingFile) {
                if (moduleName.indexOf('.') === 0) {
                    throw new Error('Resolution of relative paths requires a containing file.');
                }
                // Any containing file gives the same result for absolute imports
                containingFile = path.join(this.options.basePath, 'index.ts').replace(/\\/g, '/');
            }
            var resolved = ts.resolveModuleName(moduleName, containingFile, this.options, this.hostAdapter)
                .resolvedModule;
            return resolved ? resolved.resolvedFileName : null;
        };
        ReflectorHost.prototype.getOutputName = function (filePath) { return filePath; };
        return ReflectorHost;
    }());
    exports.ReflectorHost = ReflectorHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdG9yX2hvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9yZWZsZWN0b3JfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILGlGQUE0SjtJQUM1SiwyQkFBNkI7SUFDN0IsK0JBQWlDO0lBRWpDO1FBS0UsNkNBQW9CLElBQTRCLEVBQVUsVUFBNEI7WUFBdEYsaUJBR0M7WUFIbUIsU0FBSSxHQUFKLElBQUksQ0FBd0I7WUFBVSxlQUFVLEdBQVYsVUFBVSxDQUFrQjtZQUp0Rix1REFBdUQ7WUFDdkQsd0RBQXdEO1lBQ2hELHNCQUFpQixHQUFHLElBQUkscUNBQWlCLENBQUMsRUFBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1lBR2xGLElBQUksSUFBSSxDQUFDLGVBQWU7Z0JBQ3RCLElBQUksQ0FBQyxlQUFlLEdBQUcsVUFBQSxhQUFhLElBQUksT0FBQSxLQUFJLENBQUMsSUFBSSxDQUFDLGVBQWlCLENBQUMsYUFBYSxDQUFDLEVBQTFDLENBQTBDLENBQUM7UUFDdkYsQ0FBQztRQUVELHdEQUFVLEdBQVYsVUFBVyxRQUFnQixJQUFhLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXpGLHNEQUFRLEdBQVIsVUFBUyxRQUFnQjtZQUN2QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELElBQUksUUFBUSxFQUFFO2dCQUNaLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7YUFDbEQ7WUFFRCw4RkFBOEY7WUFDOUYsT0FBTyxTQUFXLENBQUM7UUFDckIsQ0FBQztRQUtELG1FQUFxQixHQUFyQixVQUFzQixRQUFnQjtZQUNwQyxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDakUsQ0FBQztRQUVELDJEQUFhLEdBQWIsVUFBYyxRQUFnQjtZQUM1Qiw2RUFBNkU7WUFDN0UsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDSCwwQ0FBQztJQUFELENBQUMsQUFsQ0QsSUFrQ0M7SUFFRDtRQUlFLHVCQUNJLFVBQTRCLEVBQUUsV0FBbUMsRUFDekQsT0FBd0I7WUFBeEIsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7WUFKNUIsd0JBQW1CLEdBQUcsNkNBQXlCLEVBQUUsQ0FBQztZQUt4RCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksbUNBQW1DLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFRCxzQ0FBYyxHQUFkLFVBQWUsVUFBa0I7WUFDL0IsT0FBTyxnQ0FBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFFRCw0Q0FBb0IsR0FBcEIsVUFBcUIsVUFBa0IsRUFBRSxjQUF1QjtZQUM5RCxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNuQixJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7aUJBQzdFO2dCQUNELGlFQUFpRTtnQkFDakUsY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFVLEVBQUUsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNyRjtZQUNELElBQU0sUUFBUSxHQUNWLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsY0FBZ0IsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUM7aUJBQzdFLGNBQWMsQ0FBQztZQUN4QixPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDckQsQ0FBQztRQUVELHFDQUFhLEdBQWIsVUFBYyxRQUFnQixJQUFJLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN0RCxvQkFBQztJQUFELENBQUMsQUE3QkQsSUE2QkM7SUE3Qlksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3RhdGljU3ltYm9sUmVzb2x2ZXJIb3N0fSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0NvbXBpbGVyT3B0aW9ucywgTWV0YWRhdGFDb2xsZWN0b3IsIE1ldGFkYXRhUmVhZGVySG9zdCwgY3JlYXRlTWV0YWRhdGFSZWFkZXJDYWNoZSwgcmVhZE1ldGFkYXRhfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL2xhbmd1YWdlX3NlcnZpY2VzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuY2xhc3MgUmVmbGVjdG9yTW9kdWxlTW9kdWxlUmVzb2x1dGlvbkhvc3QgaW1wbGVtZW50cyB0cy5Nb2R1bGVSZXNvbHV0aW9uSG9zdCwgTWV0YWRhdGFSZWFkZXJIb3N0IHtcbiAgLy8gTm90ZTogdmVyYm9zZUludmFsaWRFeHByZXNzaW9ucyBpcyBpbXBvcnRhbnQgc28gdGhhdFxuICAvLyB0aGUgY29sbGVjdG9yIHdpbGwgY29sbGVjdCBlcnJvcnMgaW5zdGVhZCBvZiB0aHJvd2luZ1xuICBwcml2YXRlIG1ldGFkYXRhQ29sbGVjdG9yID0gbmV3IE1ldGFkYXRhQ29sbGVjdG9yKHt2ZXJib3NlSW52YWxpZEV4cHJlc3Npb246IHRydWV9KTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGhvc3Q6IHRzLkxhbmd1YWdlU2VydmljZUhvc3QsIHByaXZhdGUgZ2V0UHJvZ3JhbTogKCkgPT4gdHMuUHJvZ3JhbSkge1xuICAgIGlmIChob3N0LmRpcmVjdG9yeUV4aXN0cylcbiAgICAgIHRoaXMuZGlyZWN0b3J5RXhpc3RzID0gZGlyZWN0b3J5TmFtZSA9PiB0aGlzLmhvc3QuZGlyZWN0b3J5RXhpc3RzICEoZGlyZWN0b3J5TmFtZSk7XG4gIH1cblxuICBmaWxlRXhpc3RzKGZpbGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuICEhdGhpcy5ob3N0LmdldFNjcmlwdFNuYXBzaG90KGZpbGVOYW1lKTsgfVxuXG4gIHJlYWRGaWxlKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCBzbmFwc2hvdCA9IHRoaXMuaG9zdC5nZXRTY3JpcHRTbmFwc2hvdChmaWxlTmFtZSk7XG4gICAgaWYgKHNuYXBzaG90KSB7XG4gICAgICByZXR1cm4gc25hcHNob3QuZ2V0VGV4dCgwLCBzbmFwc2hvdC5nZXRMZW5ndGgoKSk7XG4gICAgfVxuXG4gICAgLy8gVHlwZXNjcmlwdCByZWFkRmlsZSgpIGRlY2xhcmF0aW9uIHNob3VsZCBiZSBgcmVhZEZpbGUoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgIHJldHVybiB1bmRlZmluZWQgITtcbiAgfVxuXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBkaXJlY3RvcnlFeGlzdHMgITogKGRpcmVjdG9yeU5hbWU6IHN0cmluZykgPT4gYm9vbGVhbjtcblxuICBnZXRTb3VyY2VGaWxlTWV0YWRhdGEoZmlsZU5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IHNmID0gdGhpcy5nZXRQcm9ncmFtKCkuZ2V0U291cmNlRmlsZShmaWxlTmFtZSk7XG4gICAgcmV0dXJuIHNmID8gdGhpcy5tZXRhZGF0YUNvbGxlY3Rvci5nZXRNZXRhZGF0YShzZikgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBjYWNoZU1ldGFkYXRhKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgICAvLyBEb24ndCBjYWNoZSB0aGUgbWV0YWRhdGEgZm9yIC50cyBmaWxlcyBhcyB0aGV5IG1pZ2h0IGNoYW5nZSBpbiB0aGUgZWRpdG9yIVxuICAgIHJldHVybiBmaWxlTmFtZS5lbmRzV2l0aCgnLmQudHMnKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVmbGVjdG9ySG9zdCBpbXBsZW1lbnRzIFN0YXRpY1N5bWJvbFJlc29sdmVySG9zdCB7XG4gIHByaXZhdGUgaG9zdEFkYXB0ZXI6IFJlZmxlY3Rvck1vZHVsZU1vZHVsZVJlc29sdXRpb25Ib3N0O1xuICBwcml2YXRlIG1ldGFkYXRhUmVhZGVyQ2FjaGUgPSBjcmVhdGVNZXRhZGF0YVJlYWRlckNhY2hlKCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBnZXRQcm9ncmFtOiAoKSA9PiB0cy5Qcm9ncmFtLCBzZXJ2aWNlSG9zdDogdHMuTGFuZ3VhZ2VTZXJ2aWNlSG9zdCxcbiAgICAgIHByaXZhdGUgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zKSB7XG4gICAgdGhpcy5ob3N0QWRhcHRlciA9IG5ldyBSZWZsZWN0b3JNb2R1bGVNb2R1bGVSZXNvbHV0aW9uSG9zdChzZXJ2aWNlSG9zdCwgZ2V0UHJvZ3JhbSk7XG4gIH1cblxuICBnZXRNZXRhZGF0YUZvcihtb2R1bGVQYXRoOiBzdHJpbmcpOiB7W2tleTogc3RyaW5nXTogYW55fVtdfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHJlYWRNZXRhZGF0YShtb2R1bGVQYXRoLCB0aGlzLmhvc3RBZGFwdGVyLCB0aGlzLm1ldGFkYXRhUmVhZGVyQ2FjaGUpO1xuICB9XG5cbiAgbW9kdWxlTmFtZVRvRmlsZU5hbWUobW9kdWxlTmFtZTogc3RyaW5nLCBjb250YWluaW5nRmlsZT86IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgICBpZiAoIWNvbnRhaW5pbmdGaWxlKSB7XG4gICAgICBpZiAobW9kdWxlTmFtZS5pbmRleE9mKCcuJykgPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHV0aW9uIG9mIHJlbGF0aXZlIHBhdGhzIHJlcXVpcmVzIGEgY29udGFpbmluZyBmaWxlLicpO1xuICAgICAgfVxuICAgICAgLy8gQW55IGNvbnRhaW5pbmcgZmlsZSBnaXZlcyB0aGUgc2FtZSByZXN1bHQgZm9yIGFic29sdXRlIGltcG9ydHNcbiAgICAgIGNvbnRhaW5pbmdGaWxlID0gcGF0aC5qb2luKHRoaXMub3B0aW9ucy5iYXNlUGF0aCAhLCAnaW5kZXgudHMnKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID1cbiAgICAgICAgdHMucmVzb2x2ZU1vZHVsZU5hbWUobW9kdWxlTmFtZSwgY29udGFpbmluZ0ZpbGUgISwgdGhpcy5vcHRpb25zLCB0aGlzLmhvc3RBZGFwdGVyKVxuICAgICAgICAgICAgLnJlc29sdmVkTW9kdWxlO1xuICAgIHJldHVybiByZXNvbHZlZCA/IHJlc29sdmVkLnJlc29sdmVkRmlsZU5hbWUgOiBudWxsO1xuICB9XG5cbiAgZ2V0T3V0cHV0TmFtZShmaWxlUGF0aDogc3RyaW5nKSB7IHJldHVybiBmaWxlUGF0aDsgfVxufVxuIl19