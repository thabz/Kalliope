#!/bin/sh

set -eu

source_dir="${KALLIOPE_FACSIMILE_SOURCE_DIR:-facsimiles}"
target="${KALLIOPE_FACSIMILE_RSYNC_TARGET:-jec@10.0.0.5:/Volumes/Alma/Faksimiler}"

find "$source_dir" -type d -exec chmod 755 {} +
find "$source_dir" -type f -exec chmod 644 {} +
rsync -rva "$source_dir/" "$target"
