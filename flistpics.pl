#!/usr/bin/perl
#Udskriv forfatterne med billeder...

use Kalliope;
do 'kstdhead.pl';
$LA = $ARGV[0];

$0 =~ /\/([^\/]*)$/;
$wheretolinklanguage = $1.'?';

&kheaderHTML('Digtere',$LA);

#Indled kasse til selve teksten
beginwhitebox("","","left");

@liste = ();

#Indlæs alle navnene
open (IN, "data.$LA/fnavne.txt");
while (<IN>) {
	chop($_);chop($_);
	($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed) = split(/=/);
	$fefternavn =~ s/^Aa/Å/;	#Et lille hack til at klare sorteringsproblemet med Aa.
	push(@liste,"$fefternavn%$ffornavn%$fhandle%$ffoedt%$fdoed");
}
close(IN);

#Udskriv navnene

print "<TABLE ALIGN=center border=0 cellspacing=10><TR>";
$i=0;
foreach (sort @liste) {
	@f = split(/%/);
	$f[0] =~ s/^Å/Aa/;
	if (-e "fdirs/$f[2]/thumb.jpg") {
	    print "<TD align=center valign=bottom>";
	    print Kalliope::insertthumb({thumbfile=>"fdirs/$f[2]/thumb.jpg",url=>"fpics.pl?$f[2]?$LA",alt=>"Vis portrætter af $f[1] $f[0]"});
	    print "<BR>$f[1] $f[0]<BR>";
	    print '<FONT COLOR="#808080">('.$f[3].'-'.$f[4].')</FONT><BR>';
	    print "</TD>";
	    $i++;
	    if ($i % 3 == 0) {
		print "</TR><TR>";
	    }
	}
    }
print "</TR></TABLE>";

endbox();
&kfooterHTML;
