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

do 'kstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);
chomp($ARGV[0]);
$LA = $ARGV[0];


&kheaderHTML("Kalliope - Hjælp til søgning",$LA);

print "<table border=0 cellpadding=1 cellspacing=0 width=\"100%\"><tr width=\"100%\" ><td bgcolor=#000000>";
print "<TABLE align=center cellspacing=0 cellpadding=15 border=0 bgcolor=ffffff BORDER=5 WIDTH=\"100%\"><TR width=\"100%\" >\n";

print "         <TD WIDTH=\"100%\" BORDER=0 VALIGN=center align=center>";
print "         <FONT SIZE=24><I>Hjælp til søgning</I></FONT>";
print "         </TD>";
print "</TR></TABLE>";
print "</td></tr></table>";
print "<BR>";


#Indled kasse til selve teksten
print "<table width=\"75%\" align=center border=0 cellpadding=1 cellspacing=0><tr width=\"100%\" ><td bgcolor=#000000>";
print "<TABLE cellspacing=0 cellpadding=15 border=0 bgcolor=ffffff BORDER=5 WIDTH=\"100%\"><TR width=\"100%\" ><TD>\n";

open(FILE,"data.$LA/searchhelp.html");
foreach  (<FILE>) {
	print $_;
}

#Afslut kassen
print "</TD></TR></TABLE>";
print "</td></tr></table>";


&kfooterHTML;
