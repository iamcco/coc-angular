import { TextDocument, Position, CompletionItem, CompletionItemKind, InsertTextFormat, Range } from 'coc.nvim';

export const provideCompletionItem = async (
  document: TextDocument,
  position: Position,
  items: CompletionItem[]
) => {
  const { line: lineNum, character: colNr } = position
  const line = document.getText(Range.create(
    Position.create(lineNum, 0),
    Position.create(lineNum + 1, 0)
  ))
  const charCol = colNr - 1
  const nextCharCol = colNr

  items = items.map(item => {
    if (item.insertTextFormat === InsertTextFormat.Snippet) {
      return item
    } else if (item.kind === CompletionItemKind.Method &&
      item.detail &&
      (item.detail === 'method' || item.detail.startsWith('(method)'))
    ) {
      /**
       * methodName()| => methodName(|)
       */
      if (item.textEdit) {
        item.insertTextFormat = InsertTextFormat.Snippet
        const textEdit = item.textEdit
        item.textEdit.newText = `${/\(\)$/.test(textEdit.newText) ? textEdit.newText.slice(0, -2) : textEdit.newText}(\${1})\${0}`
      }
    } else if (item.kind === CompletionItemKind.Property && item.detail === 'attribute') {
      const startCharacter = item.textEdit && (item.textEdit.range || (item.textEdit as any).replace) as Range
      const c = startCharacter && line[startCharacter.start.character - 1] || line[charCol]
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

  return items
};
