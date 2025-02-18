/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as lsp from "coc.nvim";

export const GetComponentsWithTemplateFile = new lsp.RequestType<
  GetComponentsWithTemplateFileParams,
  GetComponentsWithTemplateFileResponse,
  /* error */ void
>("angular/getComponentsWithTemplateFile");

export interface GetComponentsWithTemplateFileParams {
  textDocument: lsp.TextDocumentIdentifier;
}

/** An array of locations that represent component declarations. */
export type GetComponentsWithTemplateFileResponse = Array<{
  uri: lsp.Uri;
  range: lsp.Range;
}>;

export const GetTemplateLocationForComponent = new lsp.RequestType<
  GetTemplateLocationForComponentParams,
  lsp.Location,
  /* error */ void
>("angular/getTemplateLocationForComponent");

export interface GetTemplateLocationForComponentParams {
  textDocument: lsp.TextDocumentIdentifier;
  position: lsp.Position;
}

export interface GetTcbParams {
  textDocument: lsp.TextDocumentIdentifier;
  position: lsp.Position;
}

export const GetTcbRequest = new lsp.RequestType<
  GetTcbParams,
  GetTcbResponse | null,
  /* error */ void
>("angular/getTcb");

export interface GetTcbResponse {
  uri: lsp.Uri;
  content: string;
  selections: lsp.Range[];
}

export const IsInAngularProject = new lsp.RequestType<
  IsInAngularProjectParams,
  boolean | null,
  /* error */ void
>("angular/isAngularCoreInOwningProject");

export interface IsInAngularProjectParams {
  textDocument: lsp.TextDocumentIdentifier;
}

export const GetHoverInfo = new lsp.RequestType<
  {
    textDocument: { uri: string };
    position: lsp.Position;
  },
  lsp.Hover | null,
  /* error */ void
>("textDocument/hover");

export const GetCompleteItems = new lsp.RequestType<
  {
    textDocument: { uri: string };
    position: lsp.Position;
    context: {
      triggerCharacter?: string;
    };
  },
  lsp.CompletionList | null,
  /* error */ void
>("textDocument/completion");
