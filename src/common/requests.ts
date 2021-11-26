/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { DocumentUri } from 'vscode-languageserver-protocol';
import * as lsp from 'coc.nvim';

export const GetComponentsWithTemplateFile = new lsp.RequestType<
    GetComponentsWithTemplateFileParams, GetComponentsWithTemplateFileResponse,
    /* error */ void>('angular/getComponentsWithTemplateFile');

export interface GetComponentsWithTemplateFileParams {
  textDocument: lsp.TextDocumentIdentifier;
}

/** An array of locations that represent component declarations. */
export type GetComponentsWithTemplateFileResponse = Array<{uri: DocumentUri , range: lsp.Range}>;

export interface GetTcbParams {
  textDocument: lsp.TextDocumentIdentifier;
  position: lsp.Position;
}

export const GetTcbRequest =
  new lsp.RequestType<GetTcbParams, GetTcbResponse|null, /* error */ void>('angular/getTcb');

export interface GetTcbResponse {
  uri: DocumentUri;
  content: string;
  selections: lsp.Range[]
}


export const IsInAngularProject =
    new lsp.RequestType<IsInAngularProjectParams, boolean, /* error */ void>(
        'angular/isAngularCoreInOwningProject');

export interface IsInAngularProjectParams {
  textDocument: lsp.TextDocumentIdentifier;
}
