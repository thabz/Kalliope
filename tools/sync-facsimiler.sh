#!/bin/sh

set -eu

target="jec@10.0.0.5:/Volumes/Alma/Faksimiler"

rsync -rva facsimiles/ "$target"
