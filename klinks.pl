#!/usr/bin/perl

#Udskriver links.html filen

do 'kstdhead.pl';

&kheaderHTML("Kalliope - Links");

&kcenterpageheader("Weblinks ud af huset");


print "<table align=center border=0 cellpadding=1 cellspacing=0 width=\"75%\"><tr width=\"100%\" ><td bgcolor=#000000>";
print "<TABLE align=center cellspacing=0 cellpadding=15 border=0 bgcolor=ffffff BORDER=5 WIDTH=\"100%\"><TR width=\"100%\" >\n";
print "<TD>";


open(FILE,"data.$LA/links.html");
foreach  (<FILE>) {
	print $_;
}
close(FILE);
open(FILE2,"data.$LA/fnavne.txt");
foreach (<FILE2>) {
    ($fhandle,$ffornavn,$fefternavn) = split(/=/);
    if (-e "fdirs/$fhandle/links.txt") {
	print "<A HREF=\"flinks.pl\?$fhandle?$LA\">";
	print "<B>$ffornavn $fefternavn</B>";
	print "</A><BR>\n";
    }
}
close(FILE2);

print "</TD></TR></TABLE>";
print "</td></tr></table>";

do 'aboutrightmenu.pl';

&kfooterHTML;
