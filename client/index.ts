import {
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  RevealOutputChannelOn,
  workspace,
  services
} from 'coc.nvim';

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('angular')
  const isEnableDebug = config.get<boolean>('angular.debug')
  // The server is implemented in node
  const serverModule = require.resolve('angular-lsp-service')

  const options = {
    module: serverModule,
    transport: TransportKind.ipc,
    options: {
      env: {
        // Force TypeScript to use the non-polling version of the file watchers.
        TSC_NONPOLLING_WATCHER: true,
      },
    },
  };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run : options,
    debug: options
  }

  // The debug options for the server
  if (isEnableDebug) {
    serverOptions.debug.options = {
      execArgv: [
        "--nolazy",
        "--debug=6009"
      ]
    }
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Angular templates
    documentSelector: ['ng-template', 'html', 'typescript'],

    // Information in the TypeScript project is necessary to generate Angular template completions
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher('**/tsconfig.json'),
        workspace.createFileSystemWatcher('**/*.ts')
      ]
    },

    // Don't let our output console pop open
    revealOutputChannelOn: RevealOutputChannelOn.Never
  }

  // Create the language client and start the client.
  let client = new LanguageClient(
    'angularls',
    'Angular Language Service',
    serverOptions,
    clientOptions
  );

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(services.registLanguageClient(client));
}
