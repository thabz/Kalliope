#!/usr/bin/perl -w

#  Viser senest ændrede værker 
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

use Kalliope;
use Kalliope::Work;
use Kalliope::Page;
use Kalliope::DB;
use Kalliope::Date;
use strict;
use utf8;

my $DAYS_TO_SHOW = 14;

my @crumbs;
push @crumbs,['Værker',''];
push @crumbs,['Ændringer',''];


my $page = new Kalliope::Page (
		title => 'Senest ændrede værker',
                pagegroup => 'worklist',
                page => 'latest',
	        thumb => 'gfx/icons/works-h70.gif',
		crumbs => \@crumbs
           );

$page->addBox ( title => "",
                width => '90%',
                coloumn => 0,
                content => &latestWorks);

$page->print;

sub latestWorks {
    my $dbh = Kalliope::DB->connect();
    my $HTML = '<TABLE CLASS="oversigt">';
    $HTML .= '<TR><TH ALIGN="left">Værk</TH><TH ALIGN="right">Tidspunkt</TH></TR>';
    my $sth = $dbh->prepare("SELECT vid,cvstimestamp FROM vaerker ORDER BY cvstimestamp DESC LIMIT 50");
    $sth->execute();
    my $count = $sth->rows;
    while (my ($vhandle,$cvstimestamp) = $sth->fetchrow_array) {
	my $work = new Kalliope::Work (vid => $vhandle);
	$HTML .= '<TR>';
	$HTML .= '<TD>';
	$HTML .= $work->author->name.": ";
	$HTML .= $work->clickableTitle.'</TD>';
	$HTML .= '<TD>'.Kalliope::Date::veryLongDate($cvstimestamp).'</TD>';
	$HTML .= '</TR>';
    }
    $HTML .= '</TABLE>';
    return $HTML;
}

1;
