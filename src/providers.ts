/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as vscode from 'coc.nvim';

export const ANGULAR_SCHEME = 'ng';

export class TcbContentProvider {
  private srcId = 'ng-tcb-range'
  private uri: string
  private buffer: vscode.Buffer

  async update(uri: vscode.Uri, content: string) {
    if (!this.buffer || !(await this.buffer.valid)) {
      this.buffer = await vscode.workspace.nvim.createNewBuffer(false, true)
    }
    if (this.uri !== uri.toString()) {
      this.uri = uri.toString()
      await this.buffer.setName(uri.toString())
      await this.buffer.setOption('filetype', 'typescript')
    }
    await this.buffer.setLines(content.split('\n'), { start: 0, end: -1, strictIndexing: false})
    await this.buffer.setOption('modified', false)
  }

  async show(ranges?: vscode.Range[]) {
    await vscode.workspace.nvim.command(`tabnew ${this.uri.toString()}`)
    if (ranges && ranges.length) {
      const w = await vscode.workspace.nvim.window
      this.buffer.highlightRanges(this.srcId, 'Visual', ranges)
      await w.setCursor([ranges[0].start.line + 1, ranges[0].start.character])
    }
  }
}
