/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as coc from 'coc.nvim';

/**
 * Represent a vscode command with an ID and an impl function `execute`.
 */
interface Command {
  id: string;
  execute(): Promise<coc.Disposable>;
}

/**
 * Restart the language server by killing the process then spanwing a new one.
 * @param client language client
 */
function restartNgServer(client: coc.LanguageClient): Command {
  return {
    id: 'angular.restartNgServer',
    async execute() {
      await client.stop();
      return client.start();
    },
  };
}

/**
 * Register all supported vscode commands for the Angular extension.
 * @param client language client
 */
export function registerCommands(client: coc.LanguageClient): coc.Disposable[] {
  const commands: Command[] = [
    restartNgServer(client),
  ];

  const disposables = commands.map((command) => {
    return coc.commands.registerCommand(command.id, command.execute);
  });

  return disposables;
}
