/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
        define("@angular/language-service", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var factory = function (tsModule) {
        var plugin;
        return {
            create: function (info) {
                var config = info.config;
                var bundleName = config.ivy ? 'ivy.js' : 'language-service.js';
                plugin = require("./bundles/" + bundleName)(tsModule);
                return plugin.create(info);
            },
            getExternalFiles: function (project) {
                var _a, _b;
                return (_b = (_a = plugin === null || plugin === void 0 ? void 0 : plugin.getExternalFiles) === null || _a === void 0 ? void 0 : _a.call(plugin, project)) !== null && _b !== void 0 ? _b : [];
            },
            onConfigurationChanged: function (config) {
                var _a;
                (_a = plugin === null || plugin === void 0 ? void 0 : plugin.onConfigurationChanged) === null || _a === void 0 ? void 0 : _a.call(plugin, config);
            },
        };
    };
    return factory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7SUFVSCxJQUFNLE9BQU8sR0FBa0MsVUFBQyxRQUFRO1FBQ3RELElBQUksTUFBb0IsQ0FBQztRQUV6QixPQUFPO1lBQ0wsTUFBTSxFQUFOLFVBQU8sSUFBZ0M7Z0JBQ3JDLElBQU0sTUFBTSxHQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUN6QyxJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO2dCQUNqRSxNQUFNLEdBQUcsT0FBTyxDQUFDLGVBQWEsVUFBWSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3RELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBQ0QsZ0JBQWdCLEVBQWhCLFVBQWlCLE9BQTBCOztnQkFDekMsT0FBTyxNQUFBLE1BQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLGdCQUFnQiwrQ0FBeEIsTUFBTSxFQUFxQixPQUFPLENBQUMsbUNBQUksRUFBRSxDQUFDO1lBQ25ELENBQUM7WUFDRCxzQkFBc0IsRUFBdEIsVUFBdUIsTUFBb0I7O2dCQUN6QyxNQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxzQkFBc0IsK0NBQTlCLE1BQU0sRUFBMkIsTUFBTSxDQUFDLENBQUM7WUFDM0MsQ0FBQztTQUNGLENBQUM7SUFDSixDQUFDLENBQUM7SUFPRixPQUFTLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0L2xpYi90c3NlcnZlcmxpYnJhcnknO1xuaW1wb3J0IHtOZ0xhbmd1YWdlU2VydmljZSwgUGx1Z2luQ29uZmlnfSBmcm9tICcuL2FwaSc7XG5cbmludGVyZmFjZSBQbHVnaW5Nb2R1bGUgZXh0ZW5kcyB0cy5zZXJ2ZXIuUGx1Z2luTW9kdWxlIHtcbiAgY3JlYXRlKGNyZWF0ZUluZm86IHRzLnNlcnZlci5QbHVnaW5DcmVhdGVJbmZvKTogTmdMYW5ndWFnZVNlcnZpY2U7XG4gIG9uQ29uZmlndXJhdGlvbkNoYW5nZWQ/KGNvbmZpZzogUGx1Z2luQ29uZmlnKTogdm9pZDtcbn1cblxuY29uc3QgZmFjdG9yeTogdHMuc2VydmVyLlBsdWdpbk1vZHVsZUZhY3RvcnkgPSAodHNNb2R1bGUpOiBQbHVnaW5Nb2R1bGUgPT4ge1xuICBsZXQgcGx1Z2luOiBQbHVnaW5Nb2R1bGU7XG5cbiAgcmV0dXJuIHtcbiAgICBjcmVhdGUoaW5mbzogdHMuc2VydmVyLlBsdWdpbkNyZWF0ZUluZm8pOiBOZ0xhbmd1YWdlU2VydmljZSB7XG4gICAgICBjb25zdCBjb25maWc6IFBsdWdpbkNvbmZpZyA9IGluZm8uY29uZmlnO1xuICAgICAgY29uc3QgYnVuZGxlTmFtZSA9IGNvbmZpZy5pdnkgPyAnaXZ5LmpzJyA6ICdsYW5ndWFnZS1zZXJ2aWNlLmpzJztcbiAgICAgIHBsdWdpbiA9IHJlcXVpcmUoYC4vYnVuZGxlcy8ke2J1bmRsZU5hbWV9YCkodHNNb2R1bGUpO1xuICAgICAgcmV0dXJuIHBsdWdpbi5jcmVhdGUoaW5mbyk7XG4gICAgfSxcbiAgICBnZXRFeHRlcm5hbEZpbGVzKHByb2plY3Q6IHRzLnNlcnZlci5Qcm9qZWN0KTogc3RyaW5nW10ge1xuICAgICAgcmV0dXJuIHBsdWdpbj8uZ2V0RXh0ZXJuYWxGaWxlcz8uKHByb2plY3QpID8/IFtdO1xuICAgIH0sXG4gICAgb25Db25maWd1cmF0aW9uQ2hhbmdlZChjb25maWc6IFBsdWdpbkNvbmZpZyk6IHZvaWQge1xuICAgICAgcGx1Z2luPy5vbkNvbmZpZ3VyYXRpb25DaGFuZ2VkPy4oY29uZmlnKTtcbiAgICB9LFxuICB9O1xufTtcblxuLyoqXG4gKiBUc3NlcnZlciBleHBlY3RzIGBAYW5ndWxhci9sYW5ndWFnZS1zZXJ2aWNlYCB0byBwcm92aWRlIGEgZmFjdG9yeSBmdW5jdGlvblxuICogYXMgdGhlIGRlZmF1bHQgZXhwb3J0IG9mIHRoZSBwYWNrYWdlLiBTZWVcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9ibG9iL2Y0ZDBlYTY1MzllZGI2ZDhmNzBiNjI2MTMyZDZmOWFjMWFjNDI4MWEvc3JjL3NlcnZlci9wcm9qZWN0LnRzI0wxNjExXG4gKi9cbmV4cG9ydCA9IGZhY3Rvcnk7XG4iXX0=