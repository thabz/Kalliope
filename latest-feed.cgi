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

my $link = 'http://www.kalliope.org/latest.cgi';

my $page = new Kalliope::Page::Feed(
	rss_feed_title => 'Kalliope - seneste tilføjelser',
	rss_feed_url => $link 
	);

my $dbh = Kalliope::DB->connect();
my @blocks;
my $i = -1;
my $lastDate = 0;
my $lastAuthor = '';
my $sth = $dbh->prepare("SELECT longdid,createtime FROM digte WHERE createtime >= ? ORDER BY createtime DESC");
$sth->execute(time - $DAYS_TO_SHOW*24*60*60);
my $count = $sth->rows;
while (my @h = $sth->fetchrow_array) {
    my ($longdid,$createdate) = @h;
    $i++ if $lastDate != $createdate;
    my $poem = new Kalliope::Poem (longdid => $longdid);
    my $authorName = $poem->author->name;
    if ($authorName ne $lastAuthor) {
	$blocks[$i]->{'descr'} .= $authorName.": ";
    }
    $blocks[$i]->{'descr'} .= "»".$poem->linkTitle."«, ";
    $blocks[$i]->{'count'}++;
    $blocks[$i]->{'createdate'} = $createdate;
    $lastDate = $createdate;
    $lastAuthor = $authorName;
}
for (my $j = 0; $j<=$i; $j++) {
    my $descr = $blocks[$j]->{'descr'};
    $descr =~ s/, $//;
    my $date = $blocks[$j]->{'createdate'};
    my $dateForDisplay = lc Kalliope::Date::longDate($date);
    $page->addItem("Tilføjelser $dateForDisplay",
	           $link."?date=".$date,$descr,
		   $blocks[$j]->{'createdate'});
}

$page->print;

