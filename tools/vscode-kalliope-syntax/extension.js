const path = require('path');
const vscode = require('vscode');

const languageId = 'kalliope-old';

const isKalliopeOldText = document => {
  if (document.uri.scheme !== 'file') {
    return false;
  }
  if (path.extname(document.fileName).toLowerCase() !== '.txt') {
    return false;
  }
  return document.lineCount > 0 && /^KILDE:/.test(document.lineAt(0).text);
};

const updateLanguage = async document => {
  const shouldUseKalliopeSyntax = isKalliopeOldText(document);
  if (shouldUseKalliopeSyntax && document.languageId !== languageId) {
    await vscode.languages.setTextDocumentLanguage(document, languageId);
  } else if (!shouldUseKalliopeSyntax && document.languageId === languageId) {
    await vscode.languages.setTextDocumentLanguage(document, 'plaintext');
  }
};

const activate = context => {
  vscode.workspace.textDocuments.forEach(document => {
    updateLanguage(document);
  });

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      updateLanguage(document);
    }),
    vscode.workspace.onDidChangeTextDocument(event => {
      if (
        event.contentChanges.some(change => {
          return change.range.start.line === 0 || change.range.end.line === 0;
        })
      ) {
        updateLanguage(event.document);
      }
    })
  );
};

module.exports = {
  activate,
};
