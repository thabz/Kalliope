# Kalliope Syntax for VS Code

Syntax highlighting for Kalliope `old2kalliope` input files.

The language is selected automatically for files whose first line starts with `KILDE:`. It also associates `efterklang.txt`, `.old2kalliope`, and `.kalliope` files with the language.

## Install

Install the workspace copy as a symlink in VS Code's extension directory:

```sh
tools/install-vscode-kalliope-syntax.sh
```

Restart VS Code after installing.

The Kalliope workspace also contains `.vscode/settings.json` with token colors for this grammar. In that setup, text-header commands such as `T:`, `F:`, and text-level `DIGTER:` use the green `keyword.other.header.text.kalliope` scope, while work-header commands use `keyword.other.header.work.kalliope`.

VS Code does not load arbitrary extensions directly from a workspace folder. The install script is therefore needed once per machine; after that, starting VS Code in this source tree will use the workspace settings automatically.
