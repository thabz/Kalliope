#!/usr/bin/perl

use CGI;
do 'kstdhead.pl';
$LA = $ARGV[0];
$LA = 'dk' unless ($LA);

&kheaderHTML("Gamle forteelser");
&kcenterpageheader("Gamle forteelser");

beginwhitebox("","75%","left");
open (NEWS,"data.$LA/news.html");
foreach (<NEWS>) {
    s/^\#//;
    print;
}
close (NEWS);
endbox();

&kfooterHTML;
