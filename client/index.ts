/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as coc from 'coc.nvim';
import * as lsp from 'vscode-languageclient';

import {registerCommands} from './commands';
import {projectLoadingNotification} from './protocol';

export function activate(context: coc.ExtensionContext) {
  // Log file does not yet exist on disk. It is up to the server to create the
  // file.
  const logFile = path.join(tmpdir(), 'nglangsvc.log');
  const ngProbeLocations = getProbeLocations('angular.ngdk', context.asAbsolutePath('server'));
  const tsProbeLocations = getProbeLocations('typescript.tsdk', context.extensionPath);
  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: lsp.ServerOptions = {
    run: {
      module: context.asAbsolutePath(path.join('server')),
      transport: lsp.TransportKind.ipc,
      args: [
        '--logFile',
        logFile,
        // TODO: Might want to turn off logging completely.
        '--ngProbeLocations',
        ngProbeLocations.join(','),
        '--tsProbeLocations',
        tsProbeLocations.join(','),
      ],
      options: {
        env: {
          // Force TypeScript to use the non-polling version of the file watchers.
          TSC_NONPOLLING_WATCHER: true,
        },
      },
    },
    debug: {
      module: context.asAbsolutePath(path.join('server', 'out', 'server.js')),
      transport: lsp.TransportKind.ipc,
      args: [
        '--logFile',
        logFile,
        '--logVerbosity',
        'verbose',
        '--ngProbeLocations',
        ngProbeLocations.join(','),
        '--tsProbeLocations',
        tsProbeLocations.join(','),
      ],
      options: {
        env: {
          // Force TypeScript to use the non-polling version of the file watchers.
          TSC_NONPOLLING_WATCHER: true,
          NG_DEBUG: true,
        },
        execArgv: [
          // do not lazily evaluate the code so all breakpoints are respected
          '--nolazy',
          // If debugging port is changed, update .vscode/launch.json as well
          '--inspect=6009',
        ]
      },
    },
  };

  // Options to control the language client
  const clientOptions: lsp.LanguageClientOptions = {
    // Register the server for Angular templates and TypeScript documents
    documentSelector: [
      // scheme: 'file' means listen to changes to files on disk only
      // other option is 'untitled', for buffer in the editor (like a new doc)
      {scheme: 'file', language: 'html'},
      {scheme: 'file', language: 'typescript'},
    ],

    synchronize: {
      fileEvents: [
        // Notify the server about file changes to tsconfig.json contained in the workspace
        coc.workspace.createFileSystemWatcher('**/tsconfig.json'),
      ]
    },

    // Don't let our output console pop open
    revealOutputChannelOn: lsp.RevealOutputChannelOn.Never
  };

  // Create the language client and start the client.
  const forceDebug = !!process.env['NG_DEBUG'];
  const client =
      new lsp.LanguageClient('Angular Language Service', serverOptions, clientOptions, forceDebug);

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(
      ...registerCommands(client),
      client.start(),
  );

  client.onReady().then(() => {
    const projectLoadingTasks = new Map<string, {resolve: () => void}>();

    client.onNotification(projectLoadingNotification.start, (projectName: string) => {
      const statusBar = coc.workspace.createStatusBarItem(0, { progress: true })
      statusBar.text = 'Initializing Angular language features'
      projectLoadingTasks.set(
        projectName,
        {
          resolve: () => {
            statusBar.isProgress = false
            statusBar.hide()
            statusBar.dispose()
          }
      })
    });

    client.onNotification(projectLoadingNotification.finish, (projectName: string) => {
      const task = projectLoadingTasks.get(projectName);
      if (task) {
        task.resolve();
        projectLoadingTasks.delete(projectName);
      }
    });
  });
}

function getProbeLocations(configName: string, bundled: string): string[] {
  const locations = [];
  // Always use config value if it's specified
  const configValue = coc.workspace.getConfiguration().get(configName);
  if (configValue) {
    locations.push(configValue as string);
  }
  // If not, look in workspaces currently open
  const workspaceFolders = coc.workspace.workspaceFolders || [];
  for (const folder of workspaceFolders) {
    locations.push(coc.Uri.parse(folder.uri).fsPath);
  }
  // If all else fails, load the bundled version
  locations.push(bundled);
  return locations;
}
