#!/usr/bin/perl -w

use CGI qw(:standard :html);
do 'fstdhead.pl';

my @ARGV = split(/\?/,$ARGV[0]);
chop($ARGV[0]);
chop($ARGV[1]);
chomp($ARGV[2]);
my $vhandle=$ARGV[1];
my $LA=$ARGV[2];

fheaderHTML($ARGV[0]);

my ($vtitel,$vaar,$vid,$noter) = $dbh->selectrow_array("SELECT titel, aar, vid,noter FROM vaerker WHERE vhandle = '$vhandle' AND fhandle = '$fhandle'");

print "<BR>\n";
print '<TABLE BORDER=0 CELLPADDING=0 CELLSPACING=0 WIDTH="100%"><TR><TD WIDTH="100%" VALIGN=top>';

beginwhitebox("","","center");
print '<SPAN CLASS=digtoverskrift><I>'.$vtitel."</I> ".(($vaar ne '?')?"($vaar)":'').'</SPAN>';
endbox();


beginwhitebox('&nbsp;&nbsp;Indhold&nbsp;&nbsp;',"","left");
my $sth = $dbh->prepare("SELECT longdid,titel,afsnit,did FROM digte WHERE vid=? ORDER BY vaerkpos");
$sth->execute($vid);
while(my $d = $sth->fetchrow_hashref) {
    if ($d->{'afsnit'} && !($d->{'titel'} =~ /^\s*$/)) {
	print "<BR><FONT SIZE=+1><I>".$d->{'titel'}."</I></FONT><BR>\n";
    } else {
	print "&nbsp;" x 4;
	print "<A HREF=\"digt.pl?longdid=".$d->{'longdid'}.'">';
	print $d->{'titel'}."</A><BR>\n";
    }
}
$sth->finish;

#Afslut kassen
endbox('<A HREF="fvaerker.pl?'.$fhandle.'?'.$LA.'"><IMG VALIGN=center ALIGN=left SRC="gfx/leftarrow.gif" BORDER=0 ALT="Tilbage til oversigten over værker"></A>');

print "</TD><TD ALIGN=right VALIGN=top>";
#Udskriv noter...

begindarkbluebox();

if ($noter) {
    beginnotebox("Noter","100%","left");
    $noter =~ s/<A /<A CLASS=green /g;
    @noter = split /\n/,$noter;
    foreach (@noter) {
	print '<IMG WIDTH=48 HEIGHT=48 SRC="gfx/clip.gif" BORDER=0 ALT="Note til »'.$vtitel.'«">';
	print $_."<BR><BR>";
    }
    endbox();
}

beginwhitebox("Værker",'100%','left');
$sth = $dbh->prepare("SELECT vhandle,titel,aar,findes FROM vaerker WHERE fhandle=? AND type='v' ORDER BY aar");
$sth->execute($fhandle);
while(my $d = $sth->fetchrow_hashref) {
    print '<P STYLE="font-size: 12px">';
    if ($d->{'findes'}) {
	print '<A HREF="vaerktoc.pl?'.$fhandle."?".$d->{'vhandle'}."?$LA\">";
    } else {
        print '<FONT COLOR="#808080">';
    }
    $aar = ($d->{'aar'} eq "\?") ? '' : '('.$d->{'aar'}.')';
    $myTitel = '<I>'.$d->{'titel'}.'</I> '.$aar;
    $myTitel = b($myTitel) if $d->{'vhandle'} eq $vhandle;
    print $myTitel;

    if ($d->{'findes'}) {
         print '</A>';
    } else {
         print '</FONT>';
    }
}
endbox();

beginwhitebox("Formater","100%",'center');
print '<A TARGET="_top" HREF="downloadvaerk.pl?'.$fhandle.'?'.$vhandle.'?XML?'.$LA.'"><IMG HEIGHT=48 WIDTH=48 SRC="gfx/floppy.gif" BORDER=0 ALT="»'.$vtitel.'« i XML format"></A><BR>XML<BR>';
print '<A TARGET="_top" HREF="downloadvaerk.pl?'.$fhandle.'?'.$vhandle.'?Printer?'.$LA.'"><IMG HEIGHT=48 WIDTH=48 SRC="gfx/floppy.gif" BORDER=0 ALT="»'.$vtitel.'« i printervenligt format"></A><BR>Printer venligt<BR>';
endbox();

enddarkbluebox();


print "</TD></TR></TABLE>";
ffooterHTML($ARGV[0]);
