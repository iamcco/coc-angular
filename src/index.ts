/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as vscode from 'coc.nvim';
import {AngularLanguageClient} from './client';
import {registerCommands} from './commands';

export function activate(context: vscode.ExtensionContext) {
  const client = new AngularLanguageClient(context);
  const mutex = new vscode.Mutex()

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  registerCommands(client, context);

  // Restart the server on configuration change.
  const disposable = vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
      if (!e.affectsConfiguration('angular')) {
        return;
      }
      const release = await mutex.acquire();
      await client.stop();
      await client.start();
      release();
    });
  context.subscriptions.push(client, disposable);

  client.start();
}
