#!/usr/bin/perl

use CGI qw(:standard);
use Kalliope;

do 'fstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

if (!($ARGV[1] eq "")) {
    chop($ARGV[0]);
    chomp($ARGV[1]);
}
$LA=$ARGV[1];

fheaderHTML($ARGV[0]);

do 'fvaerker.ovs';

print '<TABLE WIDTH="100%"><TR><TD VALIGN=top>';
beginwhitebox("Værker","","left","gfx/ikon06.gif");

$sth = $dbh->prepare("SELECT vhandle,titel,aar,findes FROM vaerker WHERE fhandle=? AND type='v' ORDER BY aar");
$sth->execute($fhandle);

if ($sth->rows) {
    $splitpos = ($sth->rows > 6) ? int($sth->rows / 2 + 0.5 ) : 0;
    print '<TABLE HEIGHT="100%" CELLPADDING=0 CELLSPACING=10><TR><TD VALIGN=top>';
    print '<TABLE>';
    while($d = $sth->fetchrow_hashref) {
	print '<TR><TD>';
	if ($d->{'findes'}) {
	    $iconfile = ($d->{'aar'} eq '?') ? 'book_40.GIF' : 'book_40.GIF';
	    print '<A HREF="vaerktoc.pl?'.$fhandle."?".$d->{'vhandle'}."?$LA\">";
	    print qq|<IMG HEIGHT=40 WIDTH=27 ALT="" BORDER=0 
		SRC="gfx/$iconfile" VALIGN="middle"></A>
		</TD><TD><FONT COLOR="black">|;
	    print '<A HREF="vaerktoc.pl?'.$fhandle."?".$d->{'vhandle'}."?$LA\">";

	} else {
	    $iconfilena = ($d->{'aar'} eq '?') ? 'book_40_high.GIF' : 'book_40_high.GIF';
	    print qq|<IMG HEIGHT=40 WIDTH=27 ALT="" BORDER=0  
		SRC="gfx/$iconfilena" VALIGN="center">
		</TD><TD><FONT COLOR="#808080">|;
	}
	$aar = ($d->{'aar'} eq "\?") ? '' : '('.$d->{'aar'}.')';
	print '<I>'.$d->{'titel'}.'</I> '.$aar.'</FONT>';
	print '</A>' if ($d->{'findes'});
	
	print '</TD></TR>';
	if (++$nr == $splitpos) {
	    print '</TABLE></TD><TD BGCOLOR=black><IMG WIDTH=1 HEIGHT=1 SRC="gfx/trans1x1.gif" ALT="">';
	    print '</TD><TD VALIGN=top><TABLE>' ;
	}
    }
    print "</TABLE>";   
    print '</TD></TR></TABLE>';
} else {
    print qq|<IMG SRC="gfx/excl.gif">
	Der findes endnu ingen af ${fefternavn}s værker i Kalliope|;
}
endbox();

print '</TD>';
if ($fdoed>1930) {
    print '<TD VALIGN="top" WIDTH="150">';
    beginwhitebox('Bemærk');
    print qq|<IMG ALIGN="left" SRC="gfx/excl.gif">Ifølge reglerne om ophavsret, må ${fefternavn}s værker ikke kunne blive tilføjet Kalliope før 70 år efter digterens død.|;
    endbox();
    print '</TD>';
}
print '</TR></TABLE>';

ffooterHTML();
