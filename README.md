# Angular Language Service

> fork from [angular/vscode-ng-language-service](https://github.com/angular/vscode-ng-language-service) v11.2.9
> [commit](https://github.com/angular/vscode-ng-language-service/commit/8b6e7afaef1b0f04d8deb9087158c5fc9ab5fe37)

An angular language service coc extension for (neo)vim 💖

## Install

``` vim
:CocInstall coc-angular
```

![image](https://user-images.githubusercontent.com/5492542/55223095-6826b180-5248-11e9-8bca-f0528c456850.png)

## Using

This extension provides a rich editing experience for Angular templates, both inline
and external templates including:

* Completions lists
* AOT Diagnostic messages
* Quick info
* Go to definition

### Commands

- `angular.restartNgServer` Restart Angular Language server
- `angular.openLogFile` Open Angular Server log
- `angular.getTemplateTcb` View Template Typecheck Block

### Configuration

- `angular.trace.server` enable angular language server trace log
- `angular.ngdk` Specifies the folder path to `@angular/language-service`.
- `angular.log` Enables logging of the Angular server to a file. This log can be used to diagnose Angular Server issues. The log may contain file paths, source code, and other potentially sensitive information from your project.
- `angular.experimental-ivy` This is an experimental feature that enables the Ivy language service.

## Versioning

The language service extension relies on the `@angular/language-service` and `typescript` packages for its backend. These packages are loaded, in order of priority, from:

- The path specified by `angular.ngdk` and `typescript.tsdk,` respectively, in project or global settings.
- *(Recommended)* The version of these packages bundled with the Angular Language Service extension.
- The version of these packages present in the current workspace's node_modules.

We suggest not specifying neither `angular.ngdk` nor `typescript.tsdk` in your VSCode settings per method (1) above.
If the `@angular/language-service` and typescript packages are loaded by methods (1) or (3), there is a potential
for a mismatch between the API expected by `@angular/language-service` and the API provided by `typescript`.
This could lead to a failure of the language service extension.

For more information, please see [#594](https://github.com/angular/vscode-ng-language-service/issues/594).

### Buy Me A Coffee ☕️

![btc](https://img.shields.io/keybase/btc/iamcco.svg?style=popout-square)

![image](https://user-images.githubusercontent.com/5492542/42771079-962216b0-8958-11e8-81c0-520363ce1059.png)
