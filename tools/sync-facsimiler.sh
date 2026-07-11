#!/bin/sh

set -eu

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if [ -z "${KALLIOPE_FACSIMILE_RSYNC_TARGET:-}" ]; then
  echo "KALLIOPE_FACSIMILE_RSYNC_TARGET mangler." >&2
  exit 1
fi

rsync -rva facsimiles/ "$KALLIOPE_FACSIMILE_RSYNC_TARGET"
