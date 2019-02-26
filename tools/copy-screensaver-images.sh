#!/bin/sh

destdir="/Users/jec/Library/Mobile Documents/com~apple~CloudDocs/Photos/Kalliope screensaver" 

find static/images/* -type f -regex ".*images/[^/]*/[^/]*jpg" -size +300k -and -not -regex ".*square.*" -and -not -regex ".*webp" -and -not -regex ".*oval.*"| while IFS= read -r pathname; do
    outname=`echo $pathname | sed 's/\//-/g'`
    cp "$pathname" "$destdir/$outname"
done

