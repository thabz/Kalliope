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

use Kalliope;
do 'fstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

$fhandle = $ARGV[0];
$LA = $ARGV[1];
chop($fhandle);
chomp($LA);
fheaderHTML($fhandle);

beginwhitebox("Portrætter","","center");

$i=1;
print "<TABLE><TR>";
while (-e "fdirs/".$fhandle."/p".$i.".jpg") {
    print '<TD WIDTH="33%" VALIGN="top" ALIGN="center">';
    print Kalliope::insertthumb({thumbfile=>"fdirs/$fhandle/_p$i.jpg",destfile=>"fdirs/$fhandle/p$i.jpg",alt=>'Klik for fuld størrelse'});
    print '<BR>';
    if (-e "fdirs/".$fhandle."/p".$i.".txt") {
	open(IN,"fdirs/".$fhandle."/p".$i.".txt");
	while (<IN>) {
	    print $_."<BR>";
	}
    }
    print '('.Kalliope::filesize("fdirs/$fhandle/p$i.jpg").')';
    print "</TD>";
    $i++;
    if ((($i-1)%3)==0) {
	print "</TR><TR>";
    }
}
print "</TR></TABLE>";

endbox();
ffooterHTML();
