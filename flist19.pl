#!/usr/bin/perl

#  Udskriv forfatterne sorteret efter efternavn.
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

do 'kstdhead.pl';
$LA = $ARGV[0];

$0 =~ /\/([^\/]*)$/;
$wheretolinklanguage = $1.'?';


&kheaderHTML('Digtere');

@liste = ();

beginwhitebox("Digtere efter fødeår","","left");

#Indlæs alle navnene
open (IN, "data.$LA/fnavne.txt");
while (<IN>) {
    chop($_);chop($_);
    s/\\//g;
    ($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed) = split(/=/);
    push(@liste,"$ffoedt%$fefternavn%$ffornavn%$fhandle%$fdoed") if ($ffoedt);
}
close(IN);

#Udskriv navnene
$last = 0;
$notfirstukendt = 0;
$blocks = ();
$bi = -1;

foreach (sort @liste) {
	@f = split(/%/);
	if ($f[0]-$last >= 25) {
		$last=$f[0]-$f[0]%25;
		$last2=$last+24;
		print "<BR><DIV CLASS=listeoverskrifter>$last-$last2</DIV><BR>";
	}
	if ( ($f[0] eq "?") && ($notfirstukendt == 0) ) {
		print "<BR><SPAN DIV=listeoverskrifter>Ukendt fødeår</DIV><BR>\n";
		$notfirstukendt=1;
	}
	print "<A HREF=\"fvaerker.pl?".$f[3]."?$LA\">";
	print $f[2]." ".$f[1].' <FONT COLOR="#808080">('.$f[0]."-".$f[4].")</FONT></A><BR>";

}

# Udenfor kategori (dvs. folkeviser, o.l.)
$sth = $dbh->prepare("SELECT * FROM fnavne WHERE sprog=? AND foedt='' ORDER BY fornavn");
$sth->execute($LA);
if ($sth->rows) {
    print "<BR><DIV CLASS=listeoverskrifter>Ukendt digter</DIV><BR>";
    while ($f = $sth->fetchrow_hashref) {
	print '<A HREF="fvaerker.pl?'.$f->{'fhandle'}.'?'.$LA.'">';
	print $f->{'fornavn'}.'</A><BR>';
    }
}



endbox();

&kfooterHTML;
