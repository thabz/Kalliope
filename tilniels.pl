#!/usr/bin/perl
# Hjælp til Niels Jensens automatiske links ind i Kalliope.

print "Content-type: text/plain\n\n";
open (FIL,"data.dk/fnavne.txt");

foreach (<FIL>) {
    ($fhandle) = split /=/;
    print $fhandle."=";
    print ((-e "fdirs/$fhandle/vaerker.txt") ? "Y=" : "N=");
    print ((-e "fdirs/$fhandle/bio.txt") ? "Y=" : "N=");
    print ((-e "fdirs/$fhandle/links.txt") ? "Y=" : "N=");
    print ((-e "fdirs/$fhandle/sekundaer.txt") ? "Y" : "N");
    print "\n";
}
