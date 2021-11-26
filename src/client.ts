/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'coc.nvim';

import {ProjectLoadingFinish, ProjectLoadingStart, SuggestStrictMode, SuggestStrictModeParams} from './common/notifications';
import {NgccProgress, NgccProgressToken, NgccProgressType} from './common/progress';
import {GetTcbRequest} from './common/requests';
import {provideCompletionItem} from './middleware/provideCompletionItem';

import {isInsideComponentDecorator, isInsideInlineTemplateRegion} from './embedded_support';
import {ProgressReporter} from './progress-reporter';
import {code2ProtocolConverter, protocol2CodeConverter} from './common/utils';

interface GetTcbResponse {
  uri: vscode.Uri;
  content: string;
  selections: vscode.Range[];
}

export class AngularLanguageClient implements vscode.Disposable {
  private client: vscode.LanguageClient|null = null;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly outputChannel: vscode.OutputChannel;
  private readonly clientOptions: vscode.LanguageClientOptions;
  private readonly name = 'Angular Language Service';

  constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel(this.name);
    // Options to control the language client
    this.clientOptions = {
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
          vscode.workspace.createFileSystemWatcher('**/tsconfig.json'),
        ]
      },
      // Don't let our output console pop open
      revealOutputChannelOn: vscode.RevealOutputChannelOn.Never,
      outputChannel: this.outputChannel,
      // middleware
      middleware: {
        provideDefinition: async (
            document: vscode.TextDocument, position: vscode.Position,
            token: vscode.CancellationToken, next: vscode.ProvideDefinitionSignature) => {
          if (isInsideComponentDecorator(document, position)) {
            return next(document, position, token);
          }
        },
        provideTypeDefinition: async (
            document: vscode.TextDocument, position: vscode.Position,
            token: vscode.CancellationToken, next) => {
          if (isInsideInlineTemplateRegion(document, position)) {
            return next(document, position, token);
          }
        },
        provideHover: async (
            document: vscode.TextDocument, position: vscode.Position,
            token: vscode.CancellationToken, next: vscode.ProvideHoverSignature) => {
          if (isInsideInlineTemplateRegion(document, position)) {
            return next(document, position, token);
          }
        },
        provideCompletionItem: async (
          document: vscode.TextDocument, position: vscode.Position,
          context: vscode.CompletionContext, token: vscode.CancellationToken,
          next: vscode.ProvideCompletionItemsSignature) => {
          if (isInsideInlineTemplateRegion(document, position)) {
            return provideCompletionItem(document, position, context, token, next);
          }
        }
      }
    };
  }

  /**
   * Spin up the language server in a separate process and establish a connection.
   */
  async start(): Promise<void> {
    if (this.client !== null) {
      throw new Error(`An existing client is running. Call stop() first.`);
    }

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: vscode.ServerOptions = {
      run: getServerOptions(this.context, false /* debug */),
      debug: getServerOptions(this.context, true /* debug */),
    };

    // Create the language client and start the client.
    const forceDebug = process.env['NG_DEBUG'] === 'true';
    this.client = new vscode.LanguageClient(
        // This is the ID for Angular-specific configurations, like angular.log,
        // angular.ngdk, etc. See contributes.configuration in package.json.
        'angular',
        this.name,
        serverOptions,
        this.clientOptions,
        forceDebug,
    );
    this.disposables.push(this.client.start());
    await this.client.onReady();
    // Must wait for the client to be ready before registering notification
    // handlers.
    registerNotificationHandlers(this.client, this.context)
    registerProgressHandlers(this.client, this.context);
  }

  /**
   * Kill the language client and perform some clean ups.
   */
  async stop(): Promise<void> {
    if (this.client === null) {
      return;
    }
    await this.client.stop();
    this.outputChannel.clear();
    this.dispose();
    this.client = null;
  }

   /**
   * Requests a template typecheck block at the current cursor location in the
   * specified editor.
   */
  async getTcbUnderCursor(): Promise<GetTcbResponse|undefined> {
    if (this.client === null) {
      return undefined;
    }
    const doc = await vscode.workspace.document
    if (!doc) {
      return
    }
    const cursor = await vscode.window.getCursorPosition()
    if (!cursor) {
      return
    }
    const textDocument = doc.textDocument
    const c2pConverter = code2ProtocolConverter;
    // Craft a request by converting vscode params to LSP. The corresponding
    // response is in LSP.
    const response = await this.client.sendRequest(GetTcbRequest, {
      textDocument: c2pConverter.asTextDocumentIdentifier(textDocument),
      position: cursor,
    });
    if (response === null) {
      return undefined;
    }
    const p2cConverter = protocol2CodeConverter;
    // Convert the response from LSP back to vscode.
    return {
      uri: p2cConverter.asUri(response.uri),
      content: response.content,
      selections: response.selections || []
    };
  }

  get initializeResult(): vscode.InitializeResult|undefined {
    return this.client?.initializeResult;
  }

  dispose() {
    for (let d = this.disposables.pop(); d !== undefined; d = this.disposables.pop()) {
      d.dispose();
    }
  }
}

function registerNotificationHandlers(client: vscode.LanguageClient, context: vscode.ExtensionContext) {
  let task: {resolve: () => void}|undefined;
  client.onNotification(ProjectLoadingStart, () => {
    const statusBar = vscode.window.createStatusBarItem(0, { progress: true })
    statusBar.text = 'Angular'
    statusBar.show()
    task = {
      resolve: () => {
        statusBar.isProgress = false
        statusBar.hide()
        statusBar.dispose()
      }
    }
    client.onNotification(ProjectLoadingFinish, () => {
      task.resolve();
      task = undefined;
    });
  });
  context.subscriptions.push(vscode.Disposable.create(() => {
    if (task) {
      task.resolve()
      task = undefined
    }
  }))
  client.onNotification(SuggestStrictMode, async (params: SuggestStrictModeParams) => {
    const openTsConfig = 'Open tsconfig.json';
    // Markdown is not generally supported in `showInformationMessage()`,
    // but links are supported. See
    // https://github.com/microsoft/vscode/issues/20595#issuecomment-281099832
    const selection = await vscode.window.showInformationMessage(
      'Some language features are not available. To access all features, enable ' +
      '[strictTemplates](https://angular.io/guide/angular-compiler-options#stricttemplates) in ' +
      '[angularCompilerOptions](https://angular.io/guide/angular-compiler-options).',
      openTsConfig,
    );
    if (selection === openTsConfig) {
      await vscode.workspace.openResource(params.configFilePath);
    }
  });
}

function registerProgressHandlers(client: vscode.LanguageClient, context: vscode.ExtensionContext) {
  const progressReporters = new Map<string, ProgressReporter>();
  const disposable =
      client.onProgress(NgccProgressType, NgccProgressToken, async (params: NgccProgress) => {
        const {configFilePath} = params;
        if (!progressReporters.has(configFilePath)) {
          progressReporters.set(configFilePath, new ProgressReporter());
        }
        const reporter = progressReporters.get(configFilePath)!;
        if (params.done) {
          reporter.finish();
          progressReporters.delete(configFilePath);
          if (!params.success) {
            const selection = await vscode.window.showErrorMessage(
                `Angular extension might not work correctly because ngcc operation failed. ` +
                    `Try to invoke ngcc manually by running 'npm/yarn run ngcc'. ` +
                    `Please see the extension output for more information.`,
                'Show output',
            );
            if (selection) {
              client.outputChannel.show();
            }
          }
        } else {
          reporter.report(params.message);
        }
      });
  // Dispose the progress handler on exit
  context.subscriptions.push(disposable);
}

/**
 * Return the paths for the module that corresponds to the specified `configValue`,
 * and use the specified `bundled` as fallback if none is provided.
 * @param configName
 * @param bundled
 */
function getProbeLocations(configValue: string|null, bundled: string): string[] {
  const locations = [];
  // Always use config value if it's specified
  if (configValue) {
    locations.push(configValue);
  }
  // Prioritize the bundled version
  locations.push(bundled);
  // Look in workspaces currently open
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  for (const folder of workspaceFolders) {
    locations.push(vscode.Uri.parse(folder.uri).fsPath);
  }
  return locations;
}

/**
 * Construct the arguments that's used to spawn the server process.
 * @param ctx vscode extension context
 */
function constructArgs(ctx: vscode.ExtensionContext): string[] {
  const config = vscode.workspace.getConfiguration();
  const args: string[] = ['--logToConsole'];

  const ngLog: string = config.get('angular.log', 'off');
  if (ngLog !== 'off') {
    // Log file does not yet exist on disk. It is up to the server to create the file.
    const logFile = path.join(ctx.storagePath, 'nglangsvc.log');
    args.push('--logFile', logFile);
    args.push('--logVerbosity', ngLog);
  }

  const ngdk: string|null = config.get('angular.ngdk', null);
  const ngProbeLocations = getProbeLocations(ngdk, ctx.extensionPath);
  args.push('--ngProbeLocations', ngProbeLocations.join(','));

  const tsdk: string|null = config.get('typescript.tsdk', null);
  const tsProbeLocations = getProbeLocations(tsdk, ctx.extensionPath);
  args.push('--tsProbeLocations', tsProbeLocations.join(','));

  return args;
}

function getServerOptions(ctx: vscode.ExtensionContext, debug: boolean): vscode.NodeModule {
  // Environment variables for server process
  const prodEnv = {};
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
    transport: vscode.TransportKind.ipc,
    args: constructArgs(ctx),
    options: {
      env: debug ? devEnv : prodEnv,
      execArgv: debug ? devExecArgv : prodExecArgv,
    },
  };
}


