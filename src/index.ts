/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as coc from 'coc.nvim';

import {registerCommands} from './commands';
import {projectLoadingNotification} from './protocol';
import {provideCompletionItem} from './middleware/provideCompletionItem';

export function activate(context: coc.ExtensionContext) {
  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: coc.ServerOptions = {
    run: getServerOptions(context, false /* debug */),
    debug: getServerOptions(context, true /* debug */),
  };

  // Options to control the language client
  const clientOptions: coc.LanguageClientOptions = {
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
    revealOutputChannelOn: coc.RevealOutputChannelOn.Never,

    // middleware
    middleware: {
      provideCompletionItem
    }
  };

  // Create the language client and start the client.
  const forceDebug = process.env['NG_DEBUG'] === 'true';
  const client =
      new coc.LanguageClient('angular', 'Angular Language Service', serverOptions, clientOptions, forceDebug);

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(
      ...registerCommands(client),
      client.start(),
  );

   client.onDidChangeState((e) => {
    let task: {resolve: () => void}|undefined;
    if (e.newState == coc.State.Running) {
      client.onNotification(projectLoadingNotification.start, () => {
        if (task) {
          task.resolve();
          task = undefined;
        }
        const statusBar = coc.workspace.createStatusBarItem(0, { progress: true })
        statusBar.text = 'Angular'
        statusBar.show()
        task = {
          resolve: () => {
            statusBar.isProgress = false
            statusBar.hide()
            statusBar.dispose()
          }
        }
      });

      client.onNotification(projectLoadingNotification.finish, () => {
        if (task) {
          task.resolve();
          task = undefined;
        }
      });
    }
  });
}

/**
 * Return the paths for the module that corresponds to the specified `configValue`,
 * and use the specified `bundled` as fallback if none is provided.
 * @param configName
 * @param bundled
 */
function getProbeLocations(configValue: string | null, bundled: string): string[] {
  const locations = [];
  // Always use config value if it's specified
  if (configValue) {
    locations.push(configValue);
  }
  // Prioritize the bundled version
  locations.push(bundled);
  // Look in workspaces currently open
  const workspaceFolders = coc.workspace.workspaceFolders || [];
  for (const folder of workspaceFolders) {
    locations.push(coc.Uri.parse(folder.uri).fsPath);
  }
  return locations;
}

/**
 * Construct the arguments that's used to spawn the server process.
 * @param ctx vscode extension context
 * @param debug true if debug mode is on
 */
function constructArgs(ctx: coc.ExtensionContext, debug: boolean): string[] {
  const config = coc.workspace.getConfiguration();
  const args: string[] = [];

  const ngLog: string = config.get('angular.log', 'off');
  if (ngLog !== 'off') {
    // Log file does not yet exist on disk. It is up to the server to create the file.
    const logFile = path.join(os.tmpdir(), 'nglangsvc.log');
    args.push('--logFile', logFile);
    args.push('--logVerbosity', debug ? 'verbose' : ngLog);
  }

  const ngdk: string|null = config.get('angular.ngdk', null);
  const ngProbeLocations = getProbeLocations(ngdk, ctx.asAbsolutePath('server'));
  args.push('--ngProbeLocations', ngProbeLocations.join(','));
  const tsdk: string|null = config.get('typescript.tsdk', null);
  const tsProbeLocations = getProbeLocations(tsdk, ctx.extensionPath);
  args.push('--tsProbeLocations', tsProbeLocations.join(','));

  return args;
}

function getServerOptions(ctx: coc.ExtensionContext, debug: boolean): coc.NodeModule {
  // Environment variables for server process
  const prodEnv = {
    // Force TypeScript to use the non-polling version of the file watchers.
    TSC_NONPOLLING_WATCHER: true,
  };
  const devEnv = {
    ...prodEnv,
    NG_DEBUG: true,
  };

  // Node module for the language server
  const prodBundle = ctx.asAbsolutePath(path.join('node_modules', '@angular', 'language-server'));
  const devBundle = ctx.asAbsolutePath(path.join('node_modules', '@angular', 'language-server'));

  // Argv options for Node.js
  const prodExecArgv: string[] = [];
  const devExecArgv: string[] = [
    // do not lazily evaluate the code so all breakpoints are respected
    '--nolazy',
    // If debugging port is changed, update .vscode/launch.json as well
    '--inspect=6009',
  ];

  return {
    // VS Code Insider launches extensions in debug mode by default but users
    // install prod bundle so we have to check whether dev bundle exists.
    module: debug && fs.existsSync(devBundle) ? devBundle : prodBundle,
    transport: coc.TransportKind.ipc,
    args: constructArgs(ctx, debug),
    options: {
      env: debug ? devEnv : prodEnv,
      execArgv: debug ? devExecArgv : prodExecArgv,
    },
  };
}
