# Angular Language Service

> fork from [angular/vscode-ng-language-service](https://github.com/angular/vscode-ng-language-service) v0.901.0
> [commit](https://github.com/angular/vscode-ng-language-service/commit/880d87da3042f0fa1ac24470b2bf9302058be17a)

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

### Configuration

- `angular.trace.server` enable angular language server trace log
- `angular.ngdk` Specifies the folder path to `@angular/language-service`.
- `angular.log` Enables logging of the Angular server to a file. This log can be used to diagnose Angular Server issues. The log may contain file paths, source code, and other potentially sensitive information from your project.

## Versioning

The language service extension uses the `@angular/language-service` package for its backend. This
package is loaded either from the version bundled with the extension, or from the current workspace
project the extension is running on. Due to the behavior of TypeScript below version 3.8,
incompatible versions of the language service may sometimes be loaded. If you are using a version of
TypeScript below 3.8, we suggest either

- Not installing `@angular/language-service` in your project (recommended; will fallback on the
    version bundled with the extension)
- Installing and keeping updates for the latest version of `@angular/language-service`

For further information, please see [#594](https://github.com/angular/vscode-ng-language-service/issues/594).

### Buy Me A Coffee ☕️

![btc](https://img.shields.io/keybase/btc/iamcco.svg?style=popout-square)

![image](https://user-images.githubusercontent.com/5492542/42771079-962216b0-8958-11e8-81c0-520363ce1059.png)
