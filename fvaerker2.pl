#!/usr/bin/perl

do 'fstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

if (!($ARGV[1] eq "")) {
    chop($ARGV[0]);
    chomp($ARGV[1]);
}
$LA=$ARGV[1];

fheaderHTML($ARGV[0]);

do 'fvaerker.ovs';

#Begynd kasse
print "<BR>";
beginwhitebox("Værker","","left");

#Vis de tilgængelige værker
$sth = $dbh->prepare("SELECT vhandle,titel,aar,findes FROM vaerker WHERE fhandle=? AND type='v' ORDER BY aar");
$sth->execute($fhandle);

if ($sth->rows) {
    $splitpos = ($sth->rows > 7) ? ($sth->rows / 2) : 0;
    print '*'.$splitpos.'*';
    print '<TABLE><TR><TD>';
    $nr = 0;
    print "<FONT SIZE=5>\n";
    while($d = $sth->fetchrow_hashref) {
	if ($d->{'findes'}) {
	    print '<A HREF="vaerktoc.pl?'.$fhandle."?".$d->{'vhandle'}."?$LA\">";
	    print '<IMG SRC="../../html/kalliope/gfx/book.gif" VALIGN="center" BORDER=0><FONT COLOR="black">';
	    print "</A>";
	} else {
	    print '<IMG SRC="../../html/kalliope/gfx/bookna.gif" VALIGN="center"><FONT COLOR="#808080">';
	}
	$aar = ($d->{'aar'} eq "\?") ? '' : '('.$d->{'aar'}.')';
	print '<i>'.$d->{'titel'}.'</i> '.$aar.'<br>';
	print '</TD><TD>' if ($nr++ == $splitpos);
    }
    print "</FONT>";   
    print '</TD></TR></TABLE>';
} else {
    print '<IMG SRC="../../html/kalliope/gfx/excl.gif">';
    #Der findes endnu ingen af ... værker i Kalliope
    print $ovs2{$LA};
}

endbox();
ffooterHTML();
