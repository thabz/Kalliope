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
use Kalliope::Poem;

do 'kstdhead.pl';

$LA = $ARGV[0] || 'dk';

&kheaderHTML('Kalliope - digtarkiv',$LA);


print '<TABLE WIDTH="100%"><TR><TD WIDTH="60%" VALIGN=top>';

#
# Nyheder -------------------------------------------------------------------
#

beginwhitebox('Sidste nyheder',"100%","left");

open (NEWS,"data.dk/news.html");
foreach $line (<NEWS>) {
    Kalliope::buildhrefs(\$line);
    print $line unless ($line =~ /^\#/);
}
close (NEWS);

endbox('<A onclick="document.location = \'kallnews.pl\'" HREF="kallnews.pl?'.$LA.'"><IMG VALIGN=center BORDER=0 HEIGHT=16 WIDTH=16  SRC="gfx/rightarrow.gif" ALT="Vis gamle nyheder"></A>');

print '</TD><TD VALIGN=top>';

#
# Dagen idag -----------------------------------------------------------------
#

beginwhitebox('Dagen idag','100%','');

if ($md eq "") {
	($sec,$min,$hour,$dg,$md,$year,$wday,$yday,$isdst)=localtime(time);
	$md++;
}
open(FILE,"data.$LA/dagenidag.txt");

$i = 0;

$md = "0".$md if $md < 10;
$dg = "0".$dg if $dg < 10;

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

#
# Sonnetten på pletten ------------------------------------------------------
#

beginwhitebox('Sonnetten på pletten','100%','');
$sth = $dbh->prepare("SELECT otherid FROM keywords_relation,keywords WHERE keywords.ord = 'sonnet' AND keywords_relation.keywordid = keywords.id AND keywords_relation.othertype = 'digt'");
$sth->execute();
$rnd = int rand ($sth->rows - 1);
$i = 0;
while ($h = $sth->fetchrow_hashref) {
    last if ($i++ == $rnd);
}
$did = $h->{'otherid'};

my $poem = new Kalliope::Poem(did => $did);

print '<SMALL>'.$poem->content.'</SMALL>';

endbox('<A TITLE="'.$poem->author->name.': »'.$poem->title.'«" HREF="digt.pl?longdid='.$poem->longdid.'"><IMG VALIGN=center BORDER=0 HEIGHT=16 WIDTH=16 SRC="gfx/rightarrow.gif" ALT="Vis digtet"></A>');
print '</TD></TR></TABLE>';

&kfooterHTML;

