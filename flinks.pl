#!/usr/bin/perl

do 'fstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

$fhandle = $ARGV[0];
$LA = $ARGV[1];
chop($fhandle);
chomp($LA);
fheaderHTML($fhandle);

print "<BR>";
beginwhitebox("Mere om $fnavn på nettet","75%","left");

#Vis de tilgængelige links

$sth = $dbh->prepare("SELECT url,beskrivelse FROM links WHERE fid=?");
$sth->execute($fid);
while ($h = $sth->fetchrow_hashref) {
    $out .= '<A TARGET="_top" HREF="'.$h->{'url'}.'"><IMG ALIGN="left" SRC="gfx/globesmall.gif" BORDER=0 ALT="Click her for at følge nævnte link"></A> ';
    $out .= $h->{'beskrivelse'}.'<BR><BR>';
}
$sth->finish;
$out =~ s/\<BR\>$//g;
print $out;

endbox();

ffooterHTML();
