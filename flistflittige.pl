#!/usr/bin/perl -w

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

use CGI qw(:standard :html);
use Kalliope;
use DBI;
do 'fstdhead.pl';

$LA = url_param('sprog');
$limit = url_param('limit') if (defined(url_param('limit')));

$0 =~ /\/([^\/]*)$/;
$wheretolinklanguage = $1.'?sprog=';

kheaderHTML('Værker');

$sth = $dbh->prepare("select fornavn,efternavn,foedt, doed, fhandle, count(did) as val from fnavne, digte where foedt != '' AND digte.fid=fnavne.fid and fnavne.sprog=? and afsnit=0 group by fnavne.fid order by val desc, efternavn ".(defined($limit) ? 'LIMIT '.$limit : ''));
$sth->execute($LA);

beginwhitebox('Mest flittige digtere',"","left");
$i = 1;
print '<TABLE WIDTH="100%">';
print '<TR><TH></TH><TH>Navn</TH><TH>Digte</TH></TR>';
while ($h = $sth->fetchrow_hashref) {
    print '<TR><TD>'.$i++.'.</TD>';
    print '<TD><A HREF="fvaerker.pl?'.$h->{fhandle}.'?'.$LA.'">'.$h->{fornavn}.' '.$h->{efternavn}.'<FONT COLOR=#808080> ('.$h->{foedt}.'-'.$h->{doed}.')</FONT></A></TD>';
    print '<TD ALIGN=right>'.$h->{'val'}.'</TD>';
    $total += $h->{val};
}
if (defined($limit)) {
    print '</TABLE>';
    endbox('<A HREF="flistflittige.pl?sprog='.$LA.'"><IMG VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Hele listen"></A>');
} else {
    print "<TR><TD></TD><TD><B>Total</B></TD><TD ALIGN=right>$total</TD></TR>";
    print '</TABLE>';
    endbox();
}
kfooterHTML();
