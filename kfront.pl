#!/usr/bin/perl

#  Udskriver Kalliopes forside: Nyheder, Dagen idag, Sonnetten på pletten.
#
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

use CGI qw(:standard);
use Kalliope;

do 'kstdhead.pl';
do 'kfront.ovs';

$LA = $ARGV[0];

$LA = 'dk' unless ($LA);

&kheaderHTML($ovs0{$LA},$LA);

do 'kfront.ovs';

if ($md eq "") {
	($sec,$min,$hour,$dg,$md,$year,$wday,$yday,$isdst)=localtime(time);
	$md++;
}
#Start siden

print '<TABLE WIDTH="100%"><TR><TD WIDTH="60%" VALIGN=top>';

beginwhitebox($ovs3{$LA},"100%","left");

open (NEWS,"data.dk/news.html");
foreach $line (<NEWS>) {
    Kalliope::buildhrefs(\$line);
    print $line unless ($line =~ /^\#/);
}
close (NEWS);

endbox('<A onclick="document.location = \'kallnews.pl\'" HREF="kallnews.pl?'.$LA.'"><IMG VALIGN=center BORDER=0 HEIGHT=16 WIDTH=16  SRC="gfx/rightarrow.gif" ALT="Vis gamle nyheder"></A>');
print '</TD><TD VALIGN=top>';
beginwhitebox('Dagen idag','100%','');

open(FILE,"data.$LA/dagenidag.txt");
$i=0;

if ($md<10) { $md="0".$md; };
if ($dg<10) { $dg="0".$dg; };

foreach (<FILE>) {
	if (/^$md\-$dg/) {
		($dato,$tekst)=split(/\%/);
		($tis,$prut,$aar)=split(/\-/,$dato);
                Kalliope::buildhrefs(\$tekst);
		print "<FONT COLOR=#ff0000>$aar</FONT> $tekst<BR>";
		$i++;
	}
}
print "Ingen begivenheder...<BR>" if $i==0;
endbox('<A HREF="kdagenidag.pl?'.$LA.'"><IMG  HEIGHT=16 WIDTH=16 VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Vælg dato"></A>');

beginwhitebox('Sonnetten på pletten','100%','');
$sth = $dbh->prepare("SELECT otherid FROM keywords_relation,keywords WHERE keywords.ord = 'sonnet' AND keywords_relation.keywordid = keywords.id AND keywords_relation.othertype = 'digt'");
$sth->execute();
$rnd = int rand ($sth->rows - 1);
$i = 0;
while ($h = $sth->fetchrow_hashref) {
    last if ($i++ == $rnd);
}
$did = $h->{'otherid'};
$sth = $dbh->prepare("SELECT indhold,fhandle,sprog,longdid FROM digte,fnavne WHERE digte.did = ? AND digte.fid = fnavne.fid");
$sth->execute($did);
$h = $sth->fetchrow_hashref;
$dindhold = $h->{'indhold'};
$dindhold =~ s/ /&nbsp;/g;
$dindhold =~ s/\n/<BR>/g;
print '<SMALL>'.$dindhold.'</SMALL>';

endbox('<A HREF="digt.pl?'.$h->{'fhandle'}.'?'.$h->{'longdid'}.'?'.$h->{'sprog'}.'"><IMG VALIGN=center BORDER=0 HEIGHT=16 WIDTH=16 SRC="gfx/rightarrow.gif" ALT="Vis digtet"></A>');


print '</TD></TR></TABLE>';
print "<P ALIGN=right><A HREF=\"kstats.pl?10?$LA\">";
#print '<FONT COLOR="#7394ad">'.$globalcounter.'</FONT></A></P>';

#$filedate = -C "kfront.pl";
#($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($filedate);
#print "Ændret: $mday / $mon / $year <BR>";

&kfooterHTML;

