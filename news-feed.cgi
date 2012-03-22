#!/usr/bin/perl

#  Viser senest tilføjede digte som rss feed.
#
#  Copyright (C) 2005 Jesper Christensen 
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

use Kalliope::Page::Feed;
use Kalliope::Poem;
use strict;
use utf8;

my $DAYS_TO_SHOW = 200;

my $link = 'http://www.kalliope.org/';

my $page = new Kalliope::Page::Feed(
	rss_feed_title => 'Kalliope - nyheder',
	rss_feed_url => $link 
	);

my $dbh = Kalliope::DB->connect();

my $limit = "LIMIT 10";
my $sth = $dbh->prepare("SELECT entry, pubdate FROM news ORDER BY pubdate DESC $limit");
$sth->execute;
while (my $item = $sth->fetchrow_hashref) {
    my ($year,$month,$day) = split '-', $item->{'pubdate'};
    my $unixDate = Kalliope::Date::DMYtoUNIX($day,$month,$year);
    my $dateForDisplay = lc Kalliope::Date::longDate($unixDate);
    $page->addItem("Nyheder $dateForDisplay",
    	       $link,
    	       $item->{'entry'},
                   $unixDate);
}

$page->print;

