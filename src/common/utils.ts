import {Position, Range, TextDocument, Uri} from "coc.nvim";

export const code2ProtocolConverter = {
  asTextDocumentIdentifier(td: TextDocument) {
    return {
      uri: td.uri
    }
  },
  asPosition(position: Position) {
    return position
  }
}

export const protocol2CodeConverter = {
  asRange(range: Range) {
    return range
  },
  asUri(uri: string) {
    return Uri.parse(uri)
  }
}
