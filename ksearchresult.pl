#!/usr/bin/perl

#  Copyright (C) 1999-2001 Jesper Christensen 
#
#  This script is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License as
#  published by the Free Software Foundation; either version 2 of the
#  License, or (at your option) any later version.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this script; if not, write to the Free Software
#  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
#
#  Author: Jesper Christensen <jesper@kalliope.org>
#
#  $Id$



# Krav til søgning:
#
# 1. Flere søgeord
# 2. Resultat sorteret efter relevans:
#    a. Antal ord der matcher (1 point pr. ord)
#    b. Ord i titel bedre end ord i body (2 point pr. ord)
#    c. Ord i samme verslinie  bedre (3 point pr. ord)
#    d. Samme rækkefølge
# 3. Digternavne (4 point pr. ord)
# 4. Nøgleordsbeskrivelser og titler. Titler bedst. (1 og 2 point)
# 5. Transparent overfor andre stavemåder.
# 6. Titler på værker (2 point pr. ord)

use CGI;
#use Text::Metaphone;

sub Metaphone { shift };

do 'kstdhead.pl';
do 'ksearch.ovs';

@ARGV = split(/\?/,$ARGV[0]);

if ($ARGV[1]) {
    $string = $ARGV[0];
    chop $string;
    $LA=$ARGV[1];
} else {
   $LA=$ARGV[0];
}

$wheretolinklanguage = 'ksearchform.pl';
&kheaderHTML($ovs12{$LA},$LA);

do 'ksearch.ovs';

unless ($string) {
    # Get the input
    read(STDIN, $data, $ENV{'CONTENT_LENGTH'});

    # Split the name-value pairs
    @pairs = split(/&/, $data);

    foreach $pair (@pairs) 
    {
	($name, $value) = split(/=/, $pair);
	
	# Convert the HTML encoding
	$value =~ tr/+/ /;
	$value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
	$value =~ s/<!--(.|\n)*-->//g;

	# Convert HTML stuff as necessary.
	$value =~ s/<([^>]|\n)*>//g;
	$FORM{$name} = $value;
    }
    $string = $FORM{'string'};
}
#Log alle søgninger
$q = new CGI;
$remotehost = $q->remote_host();
open (FIL,">>../stat/searches.log");
print FIL localtime()."\$\$".$remotehost."\$\$".$string."\$\$\n";
close FIL;


@queries = split(/\s+/,$string); #Split efter et eller flere space ie. [ \r\t\n\f]
$query = $queries[0];

$wtit= "Søgning efter ";
for ($i=0; $i < @queries-1; $i++) { $wtit.= "'".$queries[$i]."', " }
$wtit .= "'$queries[@queries-1]' ";
$query=$queries[0];

#Indled kasse til selve teksten
beginwhitebox($wtit,"90%","left");

$starttid = time;

$sql = "select ord,dids from dict where sprog='".$LA."' and (";

foreach (@queries) {
    $sql .= " ord like '%".$_."%' or";
}
$sql =~ s/or$/)/;

$sth = $dbh->prepare($sql);
$sth->execute();

#print "<BR>".$sql."<BR>";

while ($f = $sth->fetchrow_hashref)  {
#    print $f->{'ord'}."<BR>";
    $dids .= $f->{'dids'};
}
$sth->finish();

@dids = split(';',$dids);
foreach (@dids) {
    $didz{$_}++;
}

# Vælg de digte ud som kunne komme på tale...

$sql = "select fornavn, efternavn, fnavne.fhandle, digte.titel as dtitel, indhold, longdid, vaerker.titel as vtitel, aar from digte,fnavne,vaerker where digte.vid=vaerker.vid and digte.fid=fnavne.fid and ( ";
foreach (keys %didz) {
    $sql .= " digte.did = ".$_." or";
}
$sql =~ s/or$/) order by foedt/;

#print $sql."<BR>";

$sth = $dbh->prepare($sql);
$sth->execute();


$i=1;
while ($f = $sth->fetchrow_hashref)  {
    print $i++.". ";
    $vaar = ($f->{'aar'} eq "?") ? "" : "(".$f->{'aar'}.")";
    if ($f->{'dtitel'} =~ /$query/i) {
	$f->{'dtitel'} =~ s/($query)/<FONT COLOR=red>\1<\/FONT>/i;
	$r="<FONT COLOR=blue>&nbsp;&nbsp;".$f->{'fornavn'}." ".$f->{'efternavn'}."</FONT>: ";
	$r.='<A HREF="digt.pl?'.$f->{'fhandle'}.'?'.$f->{'longdid'}.'?'.$LA.'">&raquo;'.$f->{'dtitel'}.'&laquo;</A>';
	$r.=" in: <I>".$f->{'vtitel'}."</I> ".$vaar."</FONT><BR><BR>\n";
	print $r;
    } else {
	$f->{'indhold'} = "\n".$f->{'indhold'}."\n";
	$f->{'indhold'} =~ /[\n]([^\n]*$query[^\n]*)/i;
	$line = $1;
	$line =~ s/^\s+//;
	$line =~ s/\s+$//;

	$line =~ s/($query)/<FONT COLOR=red>\1<\/FONT>/i;
#print $f->{'dtitel'}."-->  $line<BR>";

	$r="&raquo;".$line."&laquo;<BR>&nbsp;&nbsp;&nbsp;&nbsp;\n";
	$r.="<FONT SIZE=2><FONT COLOR=blue>&nbsp;&nbsp;&nbsp;&nbsp;".$f->{'fornavn'}." ".$f->{'efternavn'}."</FONT>: ";
	$r.='<A HREF="digt.pl?'.$f->{'fhandle'}.'?'.$f->{'longdid'}.'?'.$LA.'">&raquo;'.$f->{'dtitel'}.'&laquo;</A>';

	$r.=" in: <I>".$f->{'vtitel'}."</I> ".$vaar."</FONT><BR><BR>\n";
	print $r;
    }
}
$sth->finish();

if ($i ==1) {
    print 'Søgningen gav intet resultat.<BR>';
}
endbox("Tid i sekunder: ".(time-$starttid));

print "<BR>";

# Fonetisk lignende ord
beginwhitebox("Fonetisk lignende ord","90%","left");
foreach (@queries) {
    $term = $_;
    $sth = $dbh->prepare("SELECT ord,antal FROM dict WHERE sound = ? AND ord != ? AND sprog=? ORDER BY antal DESC");
    $sth->execute(Metaphone($term),$term,$LA);
#"%".$term."%",
    if ($sth->rows) {
	print "<B>".$term."</B> lyder måske som: ";

	$out = "";
	while ($f = $sth->fetchrow_hashref)  {
	    $out .= '<A CLASS=green HREF="ksearchresult.pl?'.$f->{'ord'}."?$LA\">".$f->{'ord'}."</A>&nbsp;(".$f->{'antal'}."), ";
	} 
	$out =~ s/, $/./;
	print $out."<BR><BR>";
    } else {
	print "<B>".$term."</B> lyder ikke som noget andet ord.<BR><BR>";
    }
}
print "<I>Tallene i parentes efter hvert ord angiver hvor mange digte der mindst indeholder dette ord. Dette tal er fraregnet de sammensatte ord hvori ordet også er indeholdt.</I>";

endbox();

&kfooterHTML;


