#!/bin/sh

for file in "$@"
do
    replaceregexp 's/<I>/<i>/g' $file;
    replaceregexp 's/<\/I>/<\/i>/g' $file;
    replaceregexp 's/<B>/<b>/g' $file;
    replaceregexp 's/<\/B>/<\/b>/g' $file;
    replaceregexp 's/<\/A>/<\/a>/g' $file;
    replaceregexp 's/<a +v=([^>]*)>/<a work=$1>/gi' $file;
    replaceregexp 's/<a +f=([^>]*)>/<a poet=$1>/gi' $file;
    replaceregexp 's/<a +d=([^>]*)>/<a poem=$1>/gi' $file;
    replaceregexp 's/<a  href/<a href/gi' $file;
done
