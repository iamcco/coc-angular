/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/language-service" />
import * as ts from 'typescript/lib/tsserverlibrary';
declare const factory: ts.server.PluginModuleFactory;
/**
 * Tsserver expects `@angular/language-service` to provide a factory function
 * as the default export of the package. See
 * https://github.com/microsoft/TypeScript/blob/f4d0ea6539edb6d8f70b626132d6f9ac1ac4281a/src/server/project.ts#L1611
 */
export = factory;
