import { ProvideCompletionItemsSignature, CompletionContext, TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind, CompletionList, InsertTextFormat, Range, workspace, window } from 'coc.nvim';

export const provideCompletionItem = async (
  document: TextDocument,
  position: Position,
  context: CompletionContext,
  token: CancellationToken,
  next: ProvideCompletionItemsSignature
) => {
  const res = await next(document, position, context, token)
  if (!res) {
    return res
  }
  let items: CompletionItem[] = []
  let isIncomplete: boolean

  if ((res as CompletionList).isIncomplete !== undefined) {
    isIncomplete = (res as CompletionList).isIncomplete
    items = (res as CompletionList).items
  } else {
    items = res as CompletionItem[]
  }

  const { line: lineNum, character: colNr } = position
  const line = document.getText(Range.create(
    Position.create(lineNum, 0),
    Position.create(lineNum + 1, 0)
  ))
  const charCol = colNr - 1
  const nextCharCol = colNr

  items = items.map(item => {
    if (item.kind === CompletionItemKind.Method && item.detail === 'method') {
      /**
       * methodName()| => methodName(|)
       */
      if (item.textEdit && /\(\)$/.test(item.textEdit.newText)) {
        item.insertTextFormat = InsertTextFormat.Snippet
        item.textEdit.newText = `${item.textEdit.newText.slice(0, -2)}(\${1})\${0}`
      }
    } else if (item.kind === CompletionItemKind.Property && item.detail === 'attribute') {
      const c = item.textEdit && line[item.textEdit.range.start.character - 1] || line[charCol]
      switch(c) {
        case '*':
          /**
           * type with *
           *   **ngIf => *ngIf="|"
           */
          if (line[nextCharCol] !== '=') {
            item.insertTextFormat = InsertTextFormat.Snippet
            item.textEdit.newText = `${item.textEdit.newText}="\${1}"\${0}`
          }
          break;
        case '(':
          /**
           * ((click)) => (click)="|"
           */
          if (item.textEdit) {
            const { start, end } = item.textEdit.range
            item.textEdit.range.start = Position.create(start.line, start.character - 1)
            if (line[nextCharCol] === ')') {
              item.textEdit.range.end = Position.create(end.line, end.character + 1)
            }
            if (item.textEdit.newText.startsWith('(')) {
              item.textEdit.newText = `${item.textEdit.newText}`
            } else {
              item.textEdit.newText = `(${item.textEdit.newText})`
            }
            if (line[nextCharCol] !== '=' && line[nextCharCol + 1] !== '=') {
              item.insertTextFormat = InsertTextFormat.Snippet
              item.textEdit.newText = `${item.textEdit.newText}="\${1}"\${0}`
            }
          }
          break;
        case '[':
          /**
           * [[xxx]] => [xxx]="|"
           */
          if (item.textEdit) {
            const { start, end } = item.textEdit.range
            item.textEdit.range.start = Position.create(start.line, start.character - 1)
            if (line[nextCharCol] === ']') {
              item.textEdit.range.end = Position.create(end.line, end.character + 1)
            }
            if (item.textEdit.newText.startsWith('[')) {
              item.textEdit.newText = `${item.textEdit.newText}`
            } else {
              item.textEdit.newText = `[${item.textEdit.newText}]`
            }
            if (line[nextCharCol] !== '=' && line[nextCharCol + 1] !== '=') {
              item.insertTextFormat = InsertTextFormat.Snippet
              item.textEdit.newText = `${item.textEdit.newText}="\${1}"\${0}`
            }
          }
          break;
        default:
          /**
           * xxx => xxx="|"
           */
          if (item.textEdit) {
            if (line[nextCharCol] !== '=' && line[nextCharCol + 1] !== '=') {
              item.insertTextFormat = InsertTextFormat.Snippet
              item.textEdit.newText = `${item.textEdit.newText}="\${1}"\${0}`
            }
          }
          break;
      }
    }
    return item
  })

  if (isIncomplete !== undefined) {
    return {
      isIncomplete,
      items
    }
  }

  return items
};
