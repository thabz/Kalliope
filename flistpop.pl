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

$sth = $dbh->prepare("SELECT fornavn, efternavn, foedt, doed, f.fhandle, sum(hits) as hits, max(lasttime) as lasttime FROM digthits as dh,digte as d,fnavne as f WHERE dh.longdid = d.longdid AND d.fid = f.fid AND f.sprog=? GROUP BY f.fid ORDER BY hits DESC ".(defined($limit) ? 'LIMIT '.$limit : ''));
$sth->execute($LA);

beginwhitebox('Mest populære digtere',"","left");
$i = 1;
print '<TABLE WIDTH="100%">';
print '<TR><TH></TH><TH>Navn</TH><TH>Hits</TH><TH>Senest</TH></TR>';
while ($h = $sth->fetchrow_hashref) {
    print '<TR><TD>'.$i++.'.</TD>';
    print '<TD><A HREF="fvaerker.pl?'.$h->{fhandle}.'?'.$LA.'">'.$h->{fornavn}.' '.$h->{efternavn}.'<FONT COLOR=#808080> ('.$h->{foedt}.'-'.$h->{doed}.')</FONT></A></TD>';
    print '<TD ALIGN=right>'.$h->{'hits'}.'</TD>';
    print '<TD ALIGN=right>'.Kalliope::shortdate($h->{'lasttime'}).'</TD>';
    $total += $h->{'hits'};
}
if (defined($limit)) {
print '</TABLE>';
    endbox('<A HREF="flistpop.pl?sprog='.$LA.'"><IMG VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Hele listen"></A>');
} else {
    print "<TR><TD></TD><TD><B>Total</B></TD><TD ALIGN=right>$total</TD><TD></TD></TR>";
    print '</TABLE>';
    endbox();
}
kfooterHTML();
