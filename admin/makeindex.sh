#!/bin/sh

if test \! -d "dump"; then mkdir "dump"; fi

./swish/dump2swish.pl
swish-e -c swish/common.conf -S fs
rm -fr dump

echo
echo "Søg med swish-search -f ../index/swish.index -w Foraar"
echo

