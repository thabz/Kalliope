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
use Kalliope::Poem;
use Kalliope::Page;
use CGI ();
use strict;

my $showAllNews = CGI::param('showall') eq 'yes' ? 1 : 0;

my $page = new Kalliope::Page (
		title => 'Kalliope - Det var Fanden gare mig Cæcirie!',
                pagegroup => 'welcome',
		frontpage => 1,
		changelangurl => 'poets.cgi?list=az&sprog=XX',
                page => 'news'
           );

$page->addBox ( title => "Sidste Nyheder",
                width => '100%',
                coloumn => 0,
                content => &latestNews,
                end => qq|<A HREF="index.cgi?showall=yes"><IMG VALIGN=center BORDER=0 HEIGHT=16 WIDTH=16  SRC="gfx/rightarrow.gif" ALT="Vis gamle nyheder"></A>| );

if (my $dayToday = &dayToday()) {
    $page->addBox ( title => "Dagen idag",
	    width => '100%',
	    coloumn => 1,
	    content => $dayToday,
	    end => '<A HREF="kdagenidag.pl"><IMG  HEIGHT=16 WIDTH=16 VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Vælg dato"></A>');
}

my ($sonnetText,$sonnetEnd) = &sonnet;
$page->addBox ( title => "Sonetten på pletten",
	coloumn => 1,
	width => '100%',
	content => $sonnetText,
	end => $sonnetEnd);
$page->print;

#
# Nyheder --------------------------------------------------------------
#

sub latestNews {
    my $HTML;
    open (NEWS,"data/news.html");
    foreach my $line (<NEWS>) {
	Kalliope::buildhrefs(\$line);
	if ($showAllNews) {
	    $line =~ s/^\#//;
	    $HTML .= qq|<p align="justify">$line</p>|;
	} elsif ($line =~ /^[^#]/) {
	    $HTML .= qq|<p align="justify">$line</p>|;
	}
    }
    close (NEWS);
    return $HTML;
}

#
# Dagen idag ------------------------------------------------------------
#

sub dayToday {
    my $HTML;
    my ($sec,$min,$hour,$dg,$md,$year,$wday,$yday,$isdst)=localtime(time);
    $md++;
    open(FILE,"data.dk/dagenidag.txt");

    my $i = 0;
    $md = "0".$md if $md < 10;
    $dg = "0".$dg if $dg < 10;
    foreach (<FILE>) {
	if (/^$md\-$dg/) {
	    my ($dato,$tekst) = split(/\%/);
	    my ($tis,$prut,$aar)=split(/\-/,$dato);
	    Kalliope::buildhrefs(\$tekst);
	    $HTML .= "<FONT COLOR=#ff0000>$aar</FONT> $tekst<BR>";
	    $i++;
	}
    }
    $HTML = "" unless $i;
    return $HTML;
}

#
# Sonnetten på pletten --------------------------------------------------
#

sub sonnet {
    my ($HTML,$END);
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT otherid FROM keywords_relation,keywords WHERE keywords.ord = 'sonnet' AND keywords_relation.keywordid = keywords.id AND keywords_relation.othertype = 'digt'");
    $sth->execute();
    my $rnd = int rand ($sth->rows - 1);
    my $i = 0;
    my $h;
    while ($h = $sth->fetchrow_hashref) {
	last if ($i++ == $rnd);
    }
    return ('','') unless $h;
    my $poem = new Kalliope::Poem(did => $h->{'otherid'});
    $HTML .= '<SMALL>'.$poem->content.'</SMALL>';
    $HTML =~ s/ /&nbsp;/g;
    $END = '<A TITLE="'.$poem->author->name.': »'.$poem->title.'«" HREF="digt.pl?longdid='.$poem->longdid.'"><IMG VALIGN=center BORDER=0 HEIGHT=16 WIDTH=16 SRC="gfx/rightarrow.gif" ALT="Vis digtet"></A>';
    return ($HTML,$END);

}
