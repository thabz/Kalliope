#!/bin/sh

swish-e -c swish/dk.conf -S prog 
swish-e -c swish/uk.conf -S prog 
swish-e -c swish/de.conf -S prog 
swish-e -c swish/fr.conf -S prog 
swish-e -c swish/se.conf -S prog 
swish-e -c swish/no.conf -S prog 
swish-e -c swish/it.conf -S prog 
swish-e -c swish/us.conf -S prog 

echo
echo "Søg med swish-search -w Foraar"
echo

