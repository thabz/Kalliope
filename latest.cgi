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

my $page = new Kalliope::Page (
		title => 'Senest tilføjede digte',
                pagegroup => 'welcome',
		changelangurl => 'poets.cgi?list=az&sprog=XX',
                page => 'latest'
           );

$page->addBox ( title => "",
                width => '90%',
                coloumn => 0,
                content => &latestPoems);

$page->print;

sub latestPoems {
    my $dbh = Kalliope::DB->connect();
    my $HTML;
    my @blocks;
    my $i = -1;
    my $lastDate = 0;
    my $sth = $dbh->prepare("SELECT longdid,createtime FROM digte WHERE createtime >= ? ORDER BY createtime DESC");
    $sth->execute(time - 14*24*60*60);
    while (my @h = $sth->fetchrow_array) {
         my ($longdid,$createdate) = @h;
         $i++ if $lastDate != $createdate;
	 my $poem = new Kalliope::Poem (longdid => $longdid);
	 $blocks[$i]->{'body'} .= $poem->clickableTitle."<br>";
	 $blocks[$i]->{'count'}++;
	 $blocks[$i]->{'createdate'} = $createdate;
	 $lastDate = $createdate;
    }
    for (my $j = 0; $j<=$i; $j++) {
         my $dateForDisplay = Kalliope::Date::longDate($blocks[$j]->{'createdate'});
         $blocks[$j]->{'head'} = "<DIV CLASS=listeoverskrifter>$dateForDisplay</DIV><BR>";
    }
    return (Kalliope::Web::doubleColumn(\@blocks),'');
}

1;
