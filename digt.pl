#!/usr/bin/perl -w

#use strict;
use Kalliope;
use Kalliope::Poem;
use CGI qw(:standard);
do 'fstdhead.pl';

my ($longdid,$fhandle,$LA);

if (defined url_param('longdid')) {
    $longdid = url_param('longdid');
    my $sth = $dbh->prepare("SELECT fhandle,sprog FROM digte,fnavne WHERE
    digte.fid = fnavne.fid AND digte.longdid = ?");
    $sth->execute($longdid);
    ($fhandle,$LA) = $sth->fetchrow_array;
} else {
    @ARGV = split(/\?/,$ARGV[0]);
    if ($ARGV[3] eq '') {
	chop($ARGV[0]); 
	chop($ARGV[1]);
	chomp($ARGV[2]);
	$fhandle=$ARGV[0];
	$longdid=$ARGV[1];
	$LA=$ARGV[2];
    } elsif ($ARGV[4] =~ /(dk|uk|fr|de)/) {
	chop($ARGV[0]); 
	chop($ARGV[3]);
	chomp($ARGV[4]);
	$fhandle=$ARGV[0];
	$longdid=$ARGV[3];
	$LA=$ARGV[4];
    } else {
	chop($ARGV[0]); 
	chomp($ARGV[3]);
	$fhandle=$ARGV[0];
	$longdid=$ARGV[3];
	$LA='dk';
	}
}

fheaderHTML($fhandle);

# Find detaljer om dette digt.
($did,$dnoter,$vtitel,$vaar,$vhandle,$vid) = $dbh->selectrow_array("SELECT D.did, D.noter, V.titel, aar, vhandle, D.vid FROM digte D, vaerker V WHERE D.longdid = '$longdid' AND V.vid = D.vid");

my $poem = new Kalliope::Poem ('longdid' => $longdid);
$poem->updateHitCounter;
my $author = $poem->author;
my $work = $poem->work;

print '<TABLE ALIGN=center><TR><TD width="100%" VALIGN=top>';

#Begynd kasse til selve digtet.
beginwhitebox();
print '<SPAN CLASS="digtoverskrift"><I>'.$poem->title."</I></SPAN><BR>";
print '<SPAN CLASS="digtunderoverskrift">'.$poem->subtitle.'</SPAN><BR>' if $poem->subtitle;
print '<BR>';
print $poem->content;
endbox();

#Næste kolonne
print '</TD><TD WIDTH="100%" VALIGN=top>';

begindarkbluebox();

#Udskriv noter & nøgleord
$sth = $dbh->prepare("SELECT titel,id,ord FROM keywords,keywords_relation WHERE keywords_relation.otherid = ? AND keywords.id = keywords_relation.keywordid AND keywords_relation.othertype = 'digt'");
$sth->execute($did);

if ($dnoter || $sth->rows>0) {
    beginwhitebox("Noter","200","left");
    if ($dnoter) {
	foreach $line (split /\n/,$dnoter) {
	    print '<IMG ALIGN="left" SRC="gfx/clip.gif" BORDER=0 ALT="Note til »'.$poem->title.'«">';
	    Kalliope::buildhrefs(\$line);
	    print $line;
	    print "<BR><BR>";
	};
    }
    if ($sth->rows) {
	$keyhtml = '<B>Nøgleord:</B> ';
	while ($h = $sth->fetchrow_hashref) {
	    $keyhtml .= '<A CLASS=green HREF="keyword.cgi?keywordid='.$h->{'id'}.'&sprog='.$LA.'">'.$h->{'titel'}.'</A>, ';
	}
	$keyhtml =~ s/, $/./;
	print $keyhtml;
    }
    endbox();
    print "<br>";
}


#Udskriv indholdsfortegnelse for dette værk

$myvaar = ($vaar eq "\?") ? "" : " (".$vaar.")";
#beginbluebox("<I>$vtitel</I>".$myvaar,"175","left");
beginwhitebox("Indhold","200","left");
print '<FONT SIZE="-1">';

#Udskriv indholdsfortegnelse
$sth = $dbh->prepare("SELECT longdid,titel,afsnit,did FROM digte WHERE vid=? ORDER BY vaerkpos");
$sth->execute($vid);
while($d = $sth->fetchrow_hashref) {
    if ($d->{'afsnit'} && !($d->{'titel'} =~ /^\s*$/)) {
	print '<BR><FONT SIZE="+1"><I>'.$d->{'titel'}."</I></FONT><BR>";
    } else {
	print "&nbsp;" x 4;
	if ($d->{'longdid'} eq $longdid) {
	    print $d->{'titel'} = "<B>".$d->{'titel'}."</B><BR>";
	} else {
	    print "<A HREF=\"digt.pl?longdid=".$d->{'longdid'}."\">";
	    print $d->{'titel'}."</A><BR>";
	}
    }
}
$sth->finish;
print "</font>";
endbox(qq(<A HREF="vaerktoc.pl?$fhandle?$vhandle?$LA"><IMG VALIGN=center ALIGN=left SRC="gfx/leftarrow.gif" BORDER=0 TITLE="$vtitel $myvaar" ALT="$vtitel $myvaar"></A>));

enddarkbluebox();

#Afslut kolonne-tabellen (digt,note)
print "</TD></TR></TABLE>";


$forfatterekstramenu{'titel'} = 'Formater';
$forfatterekstramenu{'indhold'} = "<A HREF=\"digtprinter.pl?$fhandle?$longdid?$LA\"><IMG SRC=\"gfxold/gfx/printer.gif\" BORDER=0 ALT=\"Vis dette digt opsat på en side lige til at printe ud.\"></A><BR>Printer venligt<BR>";


ffooterHTML();
