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
import {CompletionItem, CancellationToken} from 'vscode-languageserver-protocol';

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
  const forceDebug = !!process.env['NG_DEBUG'];
  const client =
      new coc.LanguageClient('angular', 'Angular Language Service', serverOptions, clientOptions, forceDebug);

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
      statusBar.text = 'Angular'
      statusBar.show()
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
  // If not, look in workspaces currently open
  const workspaceFolders = coc.workspace.workspaceFolders || [];
  for (const folder of workspaceFolders) {
    locations.push(coc.Uri.parse(folder.uri).fsPath);
  }
  // If all else fails, load the bundled version
  locations.push(bundled);
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

  // Due to a bug in tsserver, ngProbeLocation is not honored when tsserver
  // loads the plugin. tsserver would look for @angular/language-service in its
  // peer node_modules directory, and use that if it finds one. To work around
  // this bug, always load typescript from the bundled location for now, so that
  // the bundled @angular/language-service is always chosen.
  // See the following links:
  // 1. https://github.com/angular/vscode-ng-language-service/issues/437
  // 2. https://github.com/microsoft/TypeScript/issues/34616
  // 3. https://github.com/microsoft/TypeScript/pull/34656
  // TODO: Remove workaround once
  // https://github.com/microsoft/TypeScript/commit/f689982c9f2081bc90d2192eee96b404f75c4705
  // is released and Angular is switched over to the new TypeScript version.
  args.push('--ngProbeLocations', ctx.extensionPath);
  args.push('--tsProbeLocations', ctx.extensionPath);

  /*
  const ngdk: string|null = config.get('angular.ngdk', null);
  const ngProbeLocations = getProbeLocations(ngdk, ctx.asAbsolutePath('server'));
  args.push('--ngProbeLocations', ngProbeLocations.join(','));
  const tsdk: string|null = config.get('typescript.tsdk', null);
  const tsProbeLocations = getProbeLocations(tsdk, ctx.extensionPath);
  args.push('--tsProbeLocations', tsProbeLocations.join(','));
  */

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
