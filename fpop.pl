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
use CGI (':standard');
use Kalliope::DB;
use Kalliope::Date;
use Kalliope::Person;
use Kalliope::Page;
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $LA = url_param('sprog') || 'dk';
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs();
push @crumbs,['Mest populære digte',''];

my $page = newAuthor Kalliope::Page ( poet => $poet, crumbs => \@crumbs,
	                              subtitle => _('Mest populære digte'),
                                      page => 'popular');

my $sth =  $dbh->prepare("SELECT d.longdid,d.linktitel as titel,lasttime,hits,v.titel as vtitel,v.aar FROM fnavne as f, digte as d, digthits as dh, vaerker as v WHERE f.fhandle = ? AND f.fhandle = d.fhandle AND d.type = 'poem' AND d.longdid = dh.longdid AND v.vid = d.vid ORDER BY dh.hits DESC LIMIT 10");
$sth->execute($fhandle);

my $i = 1;
my $HTML .= '<TABLE CLASS="oversigt" CELLSPACING="0" WIDTH="100%">';
$HTML .= '<TR><TH>&nbsp;</TH><TH ALIGN="left">'._("Titel").'</TH><TH ALIGN="right">'._("Hits").'</TH><TH ALIGN="right">'._("Senest").'</TH></TR>';
while (my $h = $sth->fetchrow_hashref) {
    my $aar = $h->{aar} ne '?' ? ' ('.$h->{aar}.')' : '';
    my $class = $i % 2 ? '' : ' CLASS="darker" ';
    $HTML .= qq|<TR $class><TD>|.$i++.'.</TD>';
    $HTML .= '<TD><A HREF="digt.pl?longdid='.$h->{longdid}.'">'.$h->{titel}.'</A><FONT COLOR="#808080"> - <I>'.$h->{vtitel}.'</I>'.$aar.'</FONT></TD>';
    $HTML .= '<TD ALIGN="right">'.$h->{'hits'}.'</TD>';
    $HTML .= '<TD NOWRAP ALIGN=right>'.Kalliope::Date::shortDate($h->{'lasttime'}).'</TD>';
}
$HTML .= '</TABLE>';

$page->addBox( width => '80%',
    coloumn => 1,
    content => $HTML );

$page->print;
