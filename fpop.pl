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

use CGI qw(:standard :html);
use Kalliope;
use DBI;
do 'fstdhead.pl';

$fhandle = url_param('fhandle');
$LA = url_param('sprog');

fheaderHTML($fhandle);

$sth =  $dbh->prepare("SELECT d.longdid,d.titel as titel,lasttime,hits,v.titel as vtitel,v.aar FROM fnavne as f, digte as d, digthits as dh, vaerker as v WHERE f.fhandle = ? AND f.fid = d.fid AND d.afsnit = 0 AND d.longdid = dh.longdid AND v.vid = d.vid ORDER BY dh.hits DESC LIMIT 10");
$sth->execute($fhandle);

beginwhitebox('Mest populære digte',"","left");
$i = 1;
print '<TABLE>';
print '<TR><TH></TH><TH>Titel</TH><TH>Hits</TH><TH>Senest</TH></TR>';
while ($h = $sth->fetchrow_hashref) {
    $aar = $h->{aar} ne '?' ? ' ('.$h->{aar}.')' : '';
    print '<TR><TD>'.$i++.'.</TD>';
    print '<TD><A HREF="digt.pl?'.$fhandle.'?'.$h->{longdid}.'?'.$LA.'">'.$h->{titel}.'</A><FONT COLOR=#808080> - <I>'.$h->{vtitel}.'</I>'.$aar.'</FONT></TD>';
    print '<TD ALIGN=right>'.$h->{'hits'}.'</TD>';
    print '<TD ALIGN=right>'.Kalliope::shortdate($h->{'lasttime'}).'</TD>';
}
print '</TABLE>';
endbox();

ffooterHTML($fhandle);
