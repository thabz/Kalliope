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
use Kalliope::Persons;
use Kalliope::Strings;
use CGI qw(:standard);
do 'kstdhead.pl';

$LA = url_param('sprog');

$0 =~ /\/([^\/]*)$/;
$wheretolinklanguage = $1.'?';

&kheaderHTML('Digtere',$LA);

my @poets = Kalliope::Persons::getPoets($LA);

beginwhitebox("","","left");

print "<TABLE ALIGN=center border=0 cellspacing=10><TR>";
my $i=0;
foreach $poet (sort {$a->efternavn cmp $b->efternavn} @poets) {
    if ($poet->hasBio) {
	print "<TD align=center valign=top>";
        print '<DIV CLASS=biothumb>';
	print '<A CLASS=biothumb HREF="'.$poet->bioURI.'">';
        print Kalliope::Strings::abbr(Kalliope::Strings::stripHTML($poet->bio),200);
        print '</A>';
        print '</DIV>';
	print $poet->name."<BR>";
	print '<FONT COLOR="#808080">'.$poet->lifespan.'</FONT><BR>';
	print "</TD>";
	print "</TR><TR>" if (++$i % 3 == 0);
    }
}
print "</TR></TABLE>";

endbox();
&kfooterHTML;
