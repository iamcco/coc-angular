/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as vscode from 'coc.nvim';

import {ServerOptions} from './common/initialize';
import {AngularLanguageClient} from './client';
import {ANGULAR_SCHEME, TcbContentProvider} from './providers';

/**
 * Represent a vscode command with an ID and an impl function `execute`.
 */
type Command = {
  id: string,
  isTextEditorCommand: false,
  execute(): Promise<unknown>,
}|{
  id: string,
  isTextEditorCommand: true,
  execute(): Promise<unknown>,
};

/**
 * Restart the language server by killing the process then spanwing a new one.
 * @param client language client
 * @param context extension context for adding disposables
 */
function restartNgServer(client: AngularLanguageClient): Command {
  return {
    id: 'angular.restartNgServer',
    isTextEditorCommand: false,
    async execute() {
      await client.stop();
      await client.start();
    },
  };
}

/**
 * Open the current server log file in a new editor.
 */
function openLogFile(client: AngularLanguageClient): Command {
  return {
    id: 'angular.openLogFile',
    isTextEditorCommand: false,
    async execute() {
      const serverOptions: ServerOptions|undefined = client.initializeResult?.serverOptions;
      if (!serverOptions?.logFile) {
        // Show a MessageItem to help users automatically update the
        // configuration option then restart the server.
        const selection = await vscode.window.showPrompt(
            `Angular server logging is off. Please set 'angular.log' and restart the server.`,
        );
        if (selection) {
          const isGlobalConfig = false;
          vscode.workspace.getConfiguration().update('angular.log', 'verbose', isGlobalConfig);
          // Server will automatically restart because the config is changed
        }
        return;
      }
      await vscode.workspace.openResource(serverOptions.logFile);
    },
  };
}

/**
 * Command getTemplateTcb displays a typecheck block for the template a user has
 * an active selection over, if any.
 * @param ngClient LSP client for the active session
 * @param context extension context to which disposables are pushed
 */
function getTemplateTcb(ngClient: AngularLanguageClient): Command {

  const tcbProvider = new TcbContentProvider();

  return {
    id: 'angular.getTemplateTcb',
    isTextEditorCommand: true,
    async execute() {
      const response = await ngClient.getTcbUnderCursor();
      if (response === undefined) {
        return undefined;
      }
      // Change the scheme of the URI from `file` to `ng` so that the document
      // content is requested from our own `TcbContentProvider`.
      const tcbUri = response.uri.with({
        scheme: ANGULAR_SCHEME,
      });
      await tcbProvider.update(tcbUri, response.content);
      await tcbProvider.show(response.selections)
    }
  };
}

/**
 * Register all supported vscode commands for the Angular extension.
 * @param client language client
 * @param context extension context for adding disposables
 */
export function registerCommands(
    client: AngularLanguageClient, context: vscode.ExtensionContext): void {
  const commands: Command[] = [
    restartNgServer(client),
    openLogFile(client),
    getTemplateTcb(client),
  ];

  for (const command of commands) {
    const disposable = command.isTextEditorCommand ?
      vscode.commands.registerCommand(command.id, async () => {
        command.execute()
      }) :
      vscode.commands.registerCommand(command.id, command.execute);
    context.subscriptions.push(disposable);
  }
}
