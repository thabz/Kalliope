#!/usr/bin/perl

use Kalliope;
do 'fstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

$fhandle = $ARGV[0];
$LA = $ARGV[1];
chop($fhandle);
chomp($LA);
fheaderHTML($fhandle);

#Begynd kasse
print "<FONT SIZE=3><BR>\n";

beginwhitebox("Portrætter","","center");

$i=1;
print "<CENTER><FONT SIZE=2>\n";
print "<TABLE><TR>";
while (-e "fdirs/".$fhandle."/p".$i.".jpg") {
    print '<TD WIDTH="33%" VALIGN="top" ALIGN="center">';
    print Kalliope::insertthumb({thumbfile=>"fdirs/$fhandle/_p$i.jpg",destfile=>"fdirs/$fhandle/p$i.jpg",alt=>'Klik for fuld størrelse'});
    print '<BR>';
    if (-e "fdirs/".$fhandle."/p".$i.".txt") {
	open(IN,"fdirs/".$fhandle."/p".$i.".txt");
	while (<IN>) {
	    print $_."<BR>";
	}
    }
    print '('.Kalliope::filesize("fdirs/$fhandle/p$i.jpg").')';
    print "</TD>";
    $i++;
    if ((($i-1)%3)==0) {
	print "</TR><TR>";
    }
}
print "</TR></TABLE>";
#if ($i==2) {
#    print "<BR><BR><I>Klik på billedet for at forstørre det</I>";
#} else {
#    print "<BR><BR><I>Klik på billed</I>";
#}

print "</FONT></CENTER>";

endbox();
ffooterHTML();
