import { ResolveCompletionItemSignature } from 'coc.nvim';
import {
  InsertTextFormat,
  CompletionItemKind,
  CompletionItem,
  CancellationToken,
} from 'vscode-languageserver-protocol';

export const completionResolve = (
  item: CompletionItem,
  token: CancellationToken,
  next: ResolveCompletionItemSignature,
) => {
  return Promise.resolve(next(item, token)).then((item: CompletionItem | null | undefined) => {
    if (!item) {
      return item;
    }
    return item;
  });
};
