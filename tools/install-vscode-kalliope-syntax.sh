#!/bin/sh
set -eu

extension_source=$(CDPATH= cd -- "$(dirname -- "$0")/vscode-kalliope-syntax" && pwd)
extension_target="$HOME/.vscode/extensions/thabz.kalliope-syntax"

if [ -e "$extension_target" ] && [ ! -L "$extension_target" ]; then
  echo "Refusing to replace existing non-symlink: $extension_target" >&2
  exit 1
fi

mkdir -p "$(dirname -- "$extension_target")"
ln -sfn "$extension_source" "$extension_target"

echo "Installed Kalliope VS Code syntax extension:"
echo "$extension_target -> $extension_source"
echo "Restart VS Code to load it."
