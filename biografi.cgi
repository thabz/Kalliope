#!/usr/bin/perl

do 'fstdhead.pl';
use Kalliope;
use CGI (':standard');
use Kalliope::Person;

$fhandle = url_param('fhandle');
$LA = url_param('sprog');
fheaderHTML($fhandle);
$poet = new Kalliope::Person(fhandle => $fhandle);

#
# Biografi ----------------------------------------------
#
beginwhitebox("Biografi","75%","left");
print '<P ALIGN="JUSTIFY">';
print $poet->bio || '<IMG SRC="gfx/excl.gif">Der er endnu ikke forfattet en biografi for '.$poet->name;
print "<BR></P>";
endbox();

#
# Samtidige digtere -------------------------------------
#

$sth = $dbh->prepare("SELECT DISTINCT f.* FROM fnavne as f,vaerker as v WHERE v.fid = f.fid AND v.aar > ? AND v.aar < ? AND f.fid != ? ORDER BY f.foedt");
$sth->execute($ffoedt,$fdoed,$fid);
$antal=$sth->rows;
if ($antal) {
    $i = 0;
    beginwhitebox("Samtidige","75%","left");
    print '<TABLE WIDTH="100%"><TR><TD VALIGN=top>';
    print '<TABLE BORDER=0 CELLPADDING=0 CELLSPADING=0>';
    while ($h = $sth->fetchrow_hashref) {
	print '<TR><TD><IMG SRC="gfx/flags/'.$h->{'sprog'}.'_light.gif"></TD><TD><A HREF="biografi.cgi?fhandle='.$h->{'fhandle'}.'">'.$h->{'fornavn'}.' '.$h->{'efternavn'}.' <FONT COLOR="#808080">('.$h->{'foedt'}.'-'.$h->{'doed'}.')</FONT></A></TD></TR>';
	if ($i == int($antal/2)) {
	    print '</TABLE></TD><TD VALIGN=top>';
	    print '<TABLE BORDER=0 CELLPADDING=0 CELLSPADING=0>';
	}
        $i++;
    }
    print '</TABLE>';
    print '</TD></TR></TABLE>';
    print '<BR><SMALL><I>Oversigt over digtere som udgav værker i '.$fefternavn.'s levetid.</I></SMALL>';
    endbox();
}
ffooterHTML();


