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

use Kalliope;
use Kalliope::Server;
use Kalliope::Date;
use Kalliope::Forum;
use Kalliope::Poem;
use Kalliope::Date;
use Kalliope::DB;
use utf8;

my $time = localtime(time).'';
my $dbh = Kalliope::DB->connect;

my $totalHits = Kalliope::Server::totalHits;
my $uptime = Kalliope::Server::uptime;
my @lastVisitors = Kalliope::Server::lastVisitors;

#
# Last Visitors
#
$visitHTML =  '<FIELDSET><LEGEND>Sidste besøgende</LEGEND>';
$visitHTML .= "<TABLE>";
$visitHTML .= "<TR><TD ALIGN=center>Tidspunkt</TD><TD ALIGN=center>Host</TD></TR>\n";
foreach my $v (@lastVisitors) {
    $visitHTML .= qq|<TR><TD STYLE="color: rgb(69,102,143);">|;
    $visitHTML .= Kalliope::shortdate($$v[1]);
    $visitHTML .= qq|</TD><TD>|;
    $visitHTML .=  $$v[0];
    $visitHTML .= "</TD></TR>\n";
}
$visitHTML .= "</TABLE></FIELDSET>";

#
# Last weeks hits
#
my ($weektotal,@result) = Kalliope::Server::lastWeeksHits;
my $weekHTML = '<FIELDSET><LEGEND>Sidste uge</LEGEND>';
$weekHTML .= "<TABLE>";
$weekHTML .= qq|<TR><TD>Ugedag</TD><TD></TD><TD>Hits</TD></TR>|;
foreach my $d (@result) {
    $weekHTML .= '<TR><TD>'.Kalliope::Date::weekdayShortName($$d[0]).'</TD>';
    my $wid = $$d[2]/2;
    $weekHTML .= qq|<TD><IMG WIDTH="$wid" ALT="$wid" HEIGHT=10 SRC="gfx/barstrip.gif"></TD>|;
    $weekHTML .= '<TD>'.$$d[1].'</TD></TR>';
}
$weekHTML .= qq|<TR><TD><B>Total</B></TD><TD></TD><TD ALIGN="center">$weektotal</TD></TR>|;
$weekHTML .= "</TABLE></FIELDSET>";

#
# Latest forum entries
#

my $forumHTML;

foreach my $i (0..Kalliope::Forum::getNumberOfForas-1) {
    my $forum = new Kalliope::Forum($i);
    my $post = $forum->getLatestPost;
    next unless $post;

    $forumHTML .= '<B><A HREF="forumposting.cgi?id='.$post->id.'">'.$post->subject.'</A></B> ('.$post->dateForDisplay.')<BR>';
    $forumHTML .= $post->from.'<BR>';
    $forumHTML .= '<BR>';
}


#
# Sidste besøgte digte
#

my $sth = $dbh->prepare("select longdid,lasttime from digthits order by lasttime desc limit 10");
$sth->execute();
my @digte;
my $poemsHTML;
while (my ($longdid,$date) = $sth->fetchrow_array) {
    my $poem = new Kalliope::Poem('longdid' => $longdid);
    $poemsHTML .= $poem->clickableTitle." - ".Kalliope::Date::shortDate($date)."<BR>" if $poem;
}


print <<"EOF";
Content-type: text/html

<HTML>
<HEAD>
<META HTTP-EQUIV="Refresh" CONTENT="60">
<STYLE>
body,td {
    font-family: Arial, Helvetica;
    font-size: 7pt;
    background-color: #efefe0;
}

fieldset {
    border: 1px solid #808080;
}
legend {
    color: #808080;
}
a {
    color: rgb(49,82,123);
}
</STYLE>
</HEAD>
<BODY>
<BASE TARGET="_content"></BASE>
$visitHTML

$weekHTML

<FIELDSET ALIGN=center><LEGEND>Forum</LEGEND>
$forumHTML
</FIELDSET>

<FIELDSET ALIGN=center><LEGEND>Senest læste digte</LEGEND>
$poemsHTML
</FIELDSET>


<FIELDSET ALIGN=center><LEGEND>Hits</LEGEND>
$totalHits
</FIELDSET>



<FIELDSET ALIGN=center><LEGEND>Uptime</LEGEND>
$uptime
</FIELDSET>


<FIELDSET ALIGN=center><LEGEND>Dato</LEGEND>
$time
</FIELDSET>


</BODY>
</HTML>
EOF
