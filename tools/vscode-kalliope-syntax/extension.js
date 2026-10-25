const path = require('path');
const fs = require('fs');
const { createHash, randomBytes } = require('crypto');
const vscode = require('vscode');
const { resolveFacsimileForPosition } = require('./facsimile.cjs');

const languageId = 'kalliope-text';
let facsimilePanel = null;

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

const escapeHtml = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const getWorkspaceFolder = document => {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (folder != null) {
    return folder;
  }
  return vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0]
    : null;
};

const configValue = (key, fallback) => {
  return vscode.workspace
    .getConfiguration('kalliope.facsimiles')
    .get(key, fallback);
};

const resolveLocalRoot = document => {
  const configuredRoot = configValue('localRoot', 'facsimiles');
  if (path.isAbsolute(configuredRoot)) {
    return configuredRoot;
  }
  const workspaceFolder = getWorkspaceFolder(document);
  const workspaceRoot = workspaceFolder
    ? workspaceFolder.uri.fsPath
    : path.dirname(document.fileName);
  return path.resolve(workspaceRoot, configuredRoot);
};

const pageImageUri = (webview, document, result, page) => {
  const localRoot = resolveLocalRoot(document);
  const localPath = path.join(
    localRoot,
    result.poetId,
    result.facsimile,
    page.filename
  );
  if (fs.existsSync(localPath)) {
    return webview.asWebviewUri(vscode.Uri.file(localPath)).toString();
  }
  const remoteBaseUrl = configValue(
    'remoteBaseUrl',
    'https://kalliope.org/static/facsimiles'
  ).replace(/\/+$/, '');
  return [
    remoteBaseUrl,
    encodeURIComponent(result.poetId),
    encodeURIComponent(result.facsimile),
    encodeURIComponent(page.filename),
  ].join('/');
};

const facsimileHtml = (webview, document, result) => {
  const cspSource = webview.cspSource;
  if (!result.ok) {
    return `<!doctype html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline';">
  <style>
    body { margin: 0; padding: 24px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    h1 { margin: 0 0 12px; font-size: 18px; font-weight: 600; }
    p { margin: 0; line-height: 1.5; color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <h1>Kalliope facsimile</h1>
  <p>${escapeHtml(result.reason)}</p>
</body>
</html>`;
  }

  const nonce = randomBytes(16).toString('hex');
  const pageKey = createHash('sha256')
    .update(JSON.stringify([document.fileName, result.poetId, result.facsimile, result.pages.map(page => page.filename)]))
    .digest('hex');
  const images = result.pages
    .map(page => {
      const src = pageImageUri(webview, document, result, page);
      return `<figure>
  <figcaption>Facsimile-side ${page.page}</figcaption>
  <img src="${escapeHtml(src)}" alt="Facsimile-side ${page.page}">
</figure>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; script-src 'nonce-${nonce}'; style-src ${cspSource} 'unsafe-inline';">
  <style>
    html, body { height: 100%; }
    body { display: flex; flex-direction: column; margin: 0; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    header { flex: 0 0 auto; padding: 12px 16px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); }
    h1 { margin: 0; font-size: 15px; line-height: 1.35; font-weight: 600; }
    .zoom-controls { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    button { color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; border-radius: 3px; padding: 3px 10px; font: inherit; cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
    button:disabled { opacity: 0.5; cursor: default; }
    output { min-width: 4ch; text-align: center; font-variant-numeric: tabular-nums; }
    .meta { margin-top: 4px; font-size: 12px; color: var(--vscode-descriptionForeground); }
    main { flex: 1 1 auto; min-height: 0; box-sizing: border-box; overflow: auto; padding: 16px; }
    figure { display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100%; margin: 0 0 18px; }
    figcaption { margin-bottom: 8px; font-size: 12px; color: var(--vscode-descriptionForeground); }
    img { display: block; width: 100%; height: 100%; min-height: 0; object-fit: contain; object-position: top center; background: var(--vscode-editorWidget-background); }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(result.title || result.textId || 'Kalliope facsimile')}</h1>
    <div class="meta">${escapeHtml(result.poetId)}/${escapeHtml(result.facsimile)} · side ${escapeHtml(result.facsimilePages.join('-'))}</div>
    <div class="zoom-controls" role="group" aria-label="Zoom">
      <button id="zoom-out" type="button" aria-label="Zoom ud" title="Zoom ud (Alt + rul ned)">−</button>
      <output id="zoom-level" aria-label="Zoomniveau">100 %</output>
      <button id="zoom-in" type="button" aria-label="Zoom ind" title="Zoom ind (Alt + rul op)">+</button>
    </div>
  </header>
  <main>${images}</main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const main = document.querySelector('main');
    const zoomOut = document.getElementById('zoom-out');
    const zoomIn = document.getElementById('zoom-in');
    const zoomLevel = document.getElementById('zoom-level');
    const pageKey = '${pageKey}';
    const savedState = vscode.getState();
    const savedZoom = savedState?.pageKey === pageKey ? savedState.zoom : 100;
    let zoom = Number.isFinite(savedZoom) ? Math.min(400, Math.max(50, savedZoom)) : 100;
    const renderZoom = () => {
      const width = Math.max(1, main.clientWidth - 32) * zoom / 100;
      const height = Math.max(1, main.clientHeight - 32) * zoom / 100;
      document.querySelectorAll('figure').forEach(figure => {
        figure.style.width = width + 'px';
        figure.style.height = height + 'px';
      });
      zoomLevel.textContent = zoom + ' %';
      zoomOut.disabled = zoom <= 50;
      zoomIn.disabled = zoom >= 400;
      vscode.setState({ zoom, pageKey });
    };
    const changeZoom = delta => {
      zoom = Math.min(400, Math.max(50, zoom + delta));
      renderZoom();
    };
    zoomOut.addEventListener('click', () => changeZoom(-10));
    zoomIn.addEventListener('click', () => changeZoom(10));
    main.addEventListener('wheel', event => {
      if (event.altKey === false || event.deltaY === 0) return;
      event.preventDefault();
      changeZoom(event.deltaY < 0 ? 10 : -10);
    }, { passive: false });
    new ResizeObserver(renderZoom).observe(main);
    renderZoom();
  </script>
</body>
</html>`;
};

const updateFacsimilePanel = editor => {
  if (editor == null || editor.document.uri.scheme !== 'file') {
    return;
  }
  const document = editor.document;
  const result = resolveFacsimileForPosition(
    document.getText(),
    document.fileName,
    document.offsetAt(editor.selection.active)
  );

  if (facsimilePanel == null) {
    facsimilePanel = vscode.window.createWebviewPanel(
      'kalliopeFacsimile',
      'Kalliope facsimile',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(resolveLocalRoot(document))],
      }
    );
    facsimilePanel.onDidDispose(() => {
      facsimilePanel = null;
    });
  } else {
    facsimilePanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(resolveLocalRoot(document))],
    };
  }

  facsimilePanel.title =
    result.ok && result.title
      ? `Facsimile: ${result.title}`
      : 'Kalliope facsimile';
  facsimilePanel.webview.html = facsimileHtml(
    facsimilePanel.webview,
    document,
    result
  );
};

const showFacsimileForCurrentText = () => {
  updateFacsimilePanel(vscode.window.activeTextEditor);
};

const shouldAutoUpdateFacsimile = () => {
  return (
    facsimilePanel != null &&
    configValue('autoUpdate', true)
  );
};

const activate = context => {
  vscode.workspace.textDocuments.forEach(document => {
    updateLanguage(document);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kalliope.showFacsimileForCurrentText',
      showFacsimileForCurrentText
    ),
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
      if (
        shouldAutoUpdateFacsimile() &&
        vscode.window.activeTextEditor &&
        event.document === vscode.window.activeTextEditor.document
      ) {
        updateFacsimilePanel(vscode.window.activeTextEditor);
      }
    }),
    vscode.window.onDidChangeTextEditorSelection(event => {
      if (shouldAutoUpdateFacsimile()) {
        updateFacsimilePanel(event.textEditor);
      }
    })
  );
};

module.exports = {
  activate,
};
