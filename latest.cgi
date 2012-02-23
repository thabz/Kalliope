#!/usr/bin/perl -w

#  Viser senest tilføjede digte
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
use Kalliope::Poem;
use Kalliope::Page;
use Kalliope::DB;
use Kalliope::Date;
use strict;

my $DAYS_TO_SHOW = 100;

my @crumbs;
push @crumbs,['Digte',"poemsfront.cgi?sprog=dk"];
push @crumbs,['Tilføjelser',''];


my $page = new Kalliope::Page (
	        title => 'Digte',
		subtitle => 'Seneste tilføjelser',
                pagegroup => 'poemlist',
		changelangurl => 'poets.cgi?list=az&sprog=XX',
                page => 'latest',
                rss_feed_url => 'latest-feed.cgi',
                rss_feed_title => 'Kalliope - Seneste tilføjelser',
	        icon => 'poem-turkis',
		crumbs => \@crumbs
           );

$page->addBox ( title => "",
                width => '90%',
                coloumn => 0,
                content => &latestPoems($DAYS_TO_SHOW));

$page->addBox ( title => "Nørderi",
                width => '90%',
		align => 'center',
                coloumn => 0,
                content => '<IMG SRC="cron/plot.gif">');

$page->print;

sub latestPoems {
    my $DAYS_TO_SHOW = shift;
    my $dbh = Kalliope::DB->connect();
    my $HTML;
    my @blocks;
    my $i = -1;
    my $lastDate = 0;
    my $sth = $dbh->prepare("SELECT longdid,createtime FROM digte WHERE createtime >= ? ORDER BY createtime DESC");
    $sth->execute(time - $DAYS_TO_SHOW*24*60*60);
    my $count = $sth->rows;
    while (my @h = $sth->fetchrow_array) {
         my ($longdid,$createdate) = @h;
         $i++ if $lastDate != $createdate;
	 my $poem = new Kalliope::Poem (longdid => $longdid);
	 $blocks[$i]->{'body'} .= '<IMG ALT="" SRC="gfx/flags/'.$poem->author->country.'_light.gif">';
	 $blocks[$i]->{'body'} .= $poem->clickableTitle."<br>";
	 $blocks[$i]->{'count'}++;
	 $blocks[$i]->{'createdate'} = $createdate;
	 $lastDate = $createdate;
    }
    for (my $j = 0; $j<=$i; $j++) {
         my $dateForDisplay = lc Kalliope::Date::longDate($blocks[$j]->{'createdate'});
         $blocks[$j]->{'head'} = "<DIV CLASS=listeoverskrifter>$dateForDisplay</DIV><BR>";
    }
    $HTML = Kalliope::Web::doubleColumn(\@blocks);
    $HTML .= "<HR><SMALL><I>Der er i alt tilføjet $count digte indenfor de sidste $DAYS_TO_SHOW dage.</I></SMALL>";
}

1;
