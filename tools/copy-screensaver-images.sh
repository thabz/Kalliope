#!/bin/sh

destdir="/Users/jec/Library/Mobile Documents/com~apple~CloudDocs/Photos/Kalliope screensaver" 

find static/images/* -type f -regex ".*images/[^/]*/[^/]*jpg" -size +300k -and -not -regex ".*square.*" -and -not -regex ".*webp" | while IFS= read -r pathname; do
    outname=`echo $pathname | sed 's/\//-/g'`
    cp "$pathname" "$destdir/$outname"
    
 #   base=$(basename "$pathname"); name=${base%.*}; ext=${base##*.}
 #   mv "$pathname" "foo/${name}.bar.${ext}"
done

#find static/images/* -type f -regex ".*images/[^/]*/[^/]*jpg" -size +300k -and -not -regex ".*square.*" -and -not -regex ".*webp" -exec cp {} "/Users/jec/Library/Mobile Documents/com~apple~CloudDocs/Photos/Kalliope screensaver" \;

