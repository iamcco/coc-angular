import {TextDocument, Uri} from "coc.nvim";

export const code2ProtocolConverter = {
  asTextDocumentIdentifier(td: TextDocument) {
    return {
      uri: td.uri
    }
  }
}

export const protocol2CodeConverter = {
  asUri(uri: string) {
    return Uri.parse(uri)
  }
}
