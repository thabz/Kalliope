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

use Kalliope;
use Kalliope::Poem();
use Kalliope::Page();
use Kalliope::Timeline();
use Kalliope::Server();
use Kalliope::DB;
use CGI ();
use strict;

my $dbh = Kalliope::DB::connect();

Kalliope::Server::newHit();

my @randomPagesTitles = (_('Digtarkiv')); 

my $rnd = int rand($#randomPagesTitles+1);

my $showAllNews = CGI::param('showall') && CGI::param('showall') eq 'yes' ? 1 : 0;

my @crumbs = ([_('Velkommen'),'']);

my $page = new Kalliope::Page(
		title => 'Kalliope',
		subtitle => $randomPagesTitles[$rnd],
#		rss_feed_url => 'news-feed.cgi',
#		rss_feed_title => 'Seneste nyheder',
		frontpage => 1,
		nosubmenu => 1,
		crumbs => \@crumbs,
		coloumnwidths => [50,50],
		changelangurl => 'poets.cgi?list=az&amp;sprog=XX',
);

$page->addBox(coloumn => 0,
              content => &about,
              cssClass => 'frontpage-about');

&latestNews($showAllNews);

if (my $dayToday = &dayToday()) {
    $page->addBox ( title => _("Dagen idag"),
	                coloumn => 1,
	                cssClass => 'hidemobile',
	                content => $dayToday,
	                end => '<a class="more" href="today.cgi">'._("Vælg anden dato...").'</a>');
}

my ($sonnetText,$sonnetEnd) = &sonnet;
$page->addBox ( title => _("Sonetten på pletten"),
                coloumn => 1,
                cssClass => 'hidemobile',
                content => $sonnetText,
                end => $sonnetEnd);
	            
$page->print();

#
# Nyheder --------------------------------------------------------------
#

sub latestNews {
    my $showAllNews = shift;
    my $limit = $showAllNews ? "" : "LIMIT 3";
    my $sth = $dbh->prepare("SELECT entry, pubdate FROM news ORDER BY pubdate DESC $limit");
    $sth->execute;
    while (my $item = $sth->fetchrow_hashref) {
        my ($year,$month,$day) = split '-', $item->{'pubdate'};
        $page->addBox ( coloumn => 0,
                        titleAlign => 'right',
                        title => "$day-$month-$year",
                        content => $item->{'entry'});
    }
    $page->addBox(
        coloumn => 0,
        content => $showAllNews ? '' : qq|<a class="more" href="index.cgi?showall=yes">|.&_("Læs gamle nyheder...").qq|</a>|
        );
}

sub about {
    my $HTML = _('<p><i>Kalliope</i> er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning. Kalliope indeholder også udenlandsk digtning, men primært i et omfang som kan bruges til belysning af den danske samling.</p>');
    #$HTML .= '<p>Når en forfatter har været død i over 70 år, bliver vedkommendes værk offentlig ejendom. Se evt. <A CLASS=green HREF="kabout.pl?page=attractions">coming attractions</A>. Derfor er det tilladt at bruge indholdet samlet i Kalliope til hvad man måtte ønske og af samme grund finder man ikke den nyere lyrik i samlingen. Det er gratis for alle at bruge Kalliope.</p>';
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
    my $language = Kalliope::Internationalization::http_accept_sprog();
    my $sth = $dbh->prepare("SELECT d.longdid FROM textxkeyword t, digte d WHERE t.keyword = 'sonnet' AND t.longdid = d.longdid AND d.lang = '$language' ORDER BY RANDOM() LIMIT 1");
    $sth->execute();
    my ($longdid) = $sth->fetchrow_array;
    return ('','') unless $longdid;
    my $poem = new Kalliope::Poem(longdid => $longdid);
    $HTML .= '<small>'.$poem->content(layout => 'plainpoem').'</small>';
    my $poet = $poem->author;
    $HTML .= '<br><div style="text-align:right"><i><small>'.$poet->name.'</small></i></div>';
    my $title = $poet->name.': »'.$poem->linkTitle.'«';
    $END = qq|<A class="more" TITLE="$title" HREF="digt.pl?longdid=|.$poem->longdid.qq|">|;
    $END .= _("Gå til digtet...")."</A>";
    return ($HTML,$END);
}
