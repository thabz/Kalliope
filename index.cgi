#!/usr/bin/perl -w

#  Udskriver Kalliopes forside: Nyheder, Dagen idag, Sonnetten på pletten.
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

use Kalliope();
use Kalliope::Poem();
use Kalliope::Page();
use Kalliope::Timeline();
use Kalliope::Server();
use CGI ();
use strict;

Kalliope::Server::newHit();

my @randomPagesTitles = ('Digtarkiv'); 

my $rnd = int rand($#randomPagesTitles+1);

my $showAllNews = CGI::param('showall') && CGI::param('showall') eq 'yes' ? 1 : 0;

my @crumbs = (['Velkommen','']);

my $page = new Kalliope::Page (
		title => 'Kalliope',
		subtitle => $randomPagesTitles[$rnd],
		frontpage => 1,
		nosubmenu => 1,
		crumbs => \@crumbs,
		changelangurl => 'poets.cgi?list=az&sprog=XX',
           );

$page->addBox (
                width => '100%',
                coloumn => 0,
                content => &latestNews($showAllNews),
                end => qq|<a class="more" href="index.cgi?showall=yes">Læs gamle nyheder...</a>| );

if (my $dayToday = &dayToday()) {
    $page->addBox ( title => "Dagen idag",
	    width => '100%',
	    coloumn => 1,
	    content => $dayToday,
	    end => '<A class="more" HREF="today.cgi">Vælg anden dato...</A>');
}

my ($sonnetText,$sonnetEnd) = &sonnet;
$page->addBox ( title => "Sonetten på pletten",
	coloumn => 1,
	width => '100%',
	content => $sonnetText,
	end => $sonnetEnd);
$page->print();

#
# Nyheder --------------------------------------------------------------
#

sub latestNews {
    my $showAllNews = shift;
    my $HTML;
    open (NEWS,"data/news.html");
    foreach my $line (<NEWS>) {
	Kalliope::buildhrefs(\$line);
	if ($showAllNews) {
	    $line =~ s/^\#//;
	    $HTML .= qq|<p align="justify">$line</p>|;
	} elsif ($line =~ /^[^#]/) {
	    $HTML .= qq|<p align="justify">$line</p>|;
	} else {
            last;
        }
    }
    close (NEWS);
    return $HTML;
}

#
# Dagen idag ------------------------------------------------------------
#

sub dayToday {
    return Kalliope::Timeline::getEventsGivenMonthAndDayAsHTML();
}

#
# Sonnetten på pletten --------------------------------------------------
#

sub sonnet {
    my ($HTML,$END);
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT d.longdid FROM textxkeyword t, digte d WHERE t.keyword = 'sonnet' AND t.longdid = d.longdid AND d.lang = 'dk' ORDER BY RAND() LIMIT 1");
    $sth->execute();
    my ($longdid) = $sth->fetchrow_array;
    return ('','') unless $longdid;
    my $poem = new Kalliope::Poem(longdid => $longdid);
    $HTML .= '<small>'.$poem->content(layout => 'plainpoem').'</small>';
    my $poet = $poem->author;
    $HTML .= '<br><div style="text-align:right"><i><small>'.$poet->name.'</small></i></div>';
    my $title = $poet->name.': »'.$poem->title.'«';
    $END = qq|<A class="more" TITLE="$title" HREF="digt.pl?longdid=|.$poem->longdid.qq|">Gå til digtet...</A>|;
    return ($HTML,$END);
}
