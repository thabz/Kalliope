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

do 'fstdhead.pl';
use Kalliope;
use CGI (':standard');
use Kalliope::Person;

if (url_param('fhandle')) {
    $fhandle = url_param('fhandle');
    $LA = url_param('sprog');
} else {
    @ARGV = split(/\?/,$ARGV[0]);
    if (!($ARGV[1] eq "")) {
	chop($ARGV[0]);
	chomp($ARGV[1]);
    }
    $fhandle = $ARGV[0];
    $LA = $ARGV[1];
}

fheaderHTML($fhandle);
$poet = new Kalliope::Person(fhandle => $fhandle);

#
# Biografi ----------------------------------------------
#
print "<BR>";
beginwhitebox("Biografi","75%","left");
print '<P ALIGN="JUSTIFY">';
open (IN,"fdirs/$fhandle/bio.txt") or print "<IMG SRC=\"gfx/excl.gif\">Der er endnu ikke forfattet en biografi for $fnavn.";
my $text = join '',<IN>;
$text =~ s/<BR>/<BR>&nbsp;&nbsp;&nbsp;&nbsp;/gi;
Kalliope::buildhrefs(\$text);
print $text;
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
	print '<TR><TD><IMG SRC="gfx/flags/'.$h->{'sprog'}.'_light.gif"></TD><TD><A HREF="fbiografi.pl?'.$h->{'fhandle'}.'?'.$h->{'sprog'}.'">'.$h->{'fornavn'}.' '.$h->{'efternavn'}.' <FONT COLOR="#808080">('.$h->{'foedt'}.'-'.$h->{'doed'}.')</FONT></A></TD></TR>';
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


