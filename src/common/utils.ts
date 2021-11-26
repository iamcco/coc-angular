import {Range, TextDocument, Uri} from "coc.nvim";

export const code2ProtocolConverter = {
  asTextDocumentIdentifier(td: TextDocument) {
    return {
      uri: td.uri
    }
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
