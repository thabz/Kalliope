#!/usr/bin/perl

open(FILE,"../stat/searches.log");
while (<FILE>) {
    ($date,$host,$word) = split(/\$\$/,$_);
    $words{(lc $word)}++;
}
foreach (sort {$words{$a} <=> $words{$b}} keys %words) {
    print $words{$_}." ".$_."\n";
}
