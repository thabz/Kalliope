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

@ARGV = split(/\?/,$ARGV[0]);

$fhandle = $ARGV[0];
$LA = $ARGV[1];
chop($fhandle);
chomp($LA);
fheaderHTML($fhandle);

beginwhitebox("Mere om $fnavn på nettet","75%","left");

#Vis de tilgængelige links

print "<TABLE>";
$sth = $dbh->prepare("SELECT url,beskrivelse FROM links WHERE fid=?");
$sth->execute($fid);
while ($h = $sth->fetchrow_hashref) {
    $out .= '<TR><TD><A TARGET="_top" HREF="'.$h->{'url'}.'"><IMG ALIGN="left" SRC="gfx/globesmall.gif" BORDER=0 ALT="Click her for at følge nævnte link"></A></TD>';
    $out .= '<TD>'.$h->{'beskrivelse'}.'</TD></TR>';
}
$sth->finish;

print $out;
print "</TABLE>";

endbox();

ffooterHTML();
