/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as vscode from 'coc.nvim';

const EMPTY_DISPOSABLE = vscode.Disposable.create(() => {});

export class ProgressReporter implements vscode.Progress<unknown> {
  private lastMessage: vscode.Disposable = EMPTY_DISPOSABLE;

  report(value: unknown) {
    this.lastMessage.dispose();  // clear the last message
    // See https://code.visualstudio.com/api/references/icons-in-labels for
    // icons available in vscode. "~spin" animates the icon.
    const lastMessage = vscode.window.createStatusBarItem(0, { progress: true });
    lastMessage.text = `Angular: ${value}`
    this.lastMessage = lastMessage

  }

  finish() {
    this.lastMessage.dispose();
    this.lastMessage = EMPTY_DISPOSABLE;
  }
}
