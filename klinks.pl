#!/usr/bin/perl

#  Udskriver links.html filen
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

&kheaderHTML("Kalliope - Links");

print "<table align=center border=0 cellpadding=1 cellspacing=0 width=\"75%\"><tr width=\"100%\" ><td bgcolor=#000000>";
print "<TABLE align=center cellspacing=0 cellpadding=15 border=0 bgcolor=ffffff BORDER=5 WIDTH=\"100%\"><TR width=\"100%\" >\n";
print "<TD>";


open(FILE,"data.$LA/links.html");
foreach  (<FILE>) {
	print $_;
}
close(FILE);
open(FILE2,"data.$LA/fnavne.txt");
foreach (<FILE2>) {
    ($fhandle,$ffornavn,$fefternavn) = split(/=/);
    if (-e "fdirs/$fhandle/links.txt") {
	print "<A HREF=\"flinks.pl\?$fhandle?$LA\">";
	print "<B>$ffornavn $fefternavn</B>";
	print "</A><BR>\n";
    }
}
close(FILE2);

print "</TD></TR></TABLE>";
print "</td></tr></table>";

&kfooterHTML;
