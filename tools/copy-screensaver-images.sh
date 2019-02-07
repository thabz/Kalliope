#!/bin/sh

find static/images/* -type f -regex ".*images/[^/]*/[^/]*jpg" -size +300k -and -not -regex ".*square.*" -and -not -regex ".*webp" -exec cp {} "/Users/jec/Library/Mobile Documents/com~apple~CloudDocs/Photos/Kalliope screensaver" \;

