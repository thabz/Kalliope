#!/usr/bin/perl
do 'fstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);
$fhandle = $ARGV[0];
$LA = $ARGV[1];
chop($fhandle);
chomp($LA);

fheaderHTML($fhandle);

print "<BR>";
beginwhitebox("Sekundær litteratur","75%","left");

open (FILE,"fdirs/".$fhandle."/sekundaer.txt");
print join '<BR><BR>',<FILE>;
close (FILE);

endbox();

ffooterHTML();

