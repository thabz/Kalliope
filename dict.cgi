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

use CGI qw /:standard/;
use Kalliope::Web;
use Kalliope::Page;
use Kalliope::Strings;
use Kalliope::Keyword;
use Kalliope::DB;
use Kalliope::Sort;
use Kalliope;
use strict;

my $dbh = Kalliope::DB->connect;

my $page;

my $letter = url_param('letter') || 'a';
my $wid = url_param('wid');

my @crumbs;
push @crumbs,['Ordbog','dict.cgi'];
push @crumbs,[Kalliope::Strings::uc($letter),''];

$page = new Kalliope::Page (
	title => "Ordbog",
	pagegroup => 'history',
	page => 'dict',
	thumb => 'gfx/icons/keywords-h70.gif',
	lang => 'dk',
	crumbs => \@crumbs );

# Beskrivelse

if ($wid) {
    my $sth = $dbh->prepare("SELECT * FROM dict WHERE wid = ?");
    $sth->execute($wid);
    my $h = $sth->fetchrow_hashref;

    $letter = $h->{'firstletter'};

    my $HTML = "<b>$$h{word}</b>: ";
    $HTML .= $h->{'forkl'};

    $HTML .= qq|<br><br><a class="green" href="ksearch.cgi?sprog=dk&type=free&needle=$$h{word}">Søg</a> efter tekster, som indeholder dette ord.|;

    $page->addBox (
	    width => "80%",
	    coloumn => 0,
	    content => $HTML)
}

# Bogstavrække

my $sth = $dbh->prepare ("SELECT DISTINCT firstletter FROM dict ORDER BY firstletter ASC");
$sth->execute();
my $HTML;
my $minimenu;
while (my ($myletter) = $sth->fetchrow_array()) {
    my $class = ($myletter eq $letter) ? 'green' : '';
    $minimenu .= qq|<A CLASS="$class" TITLE="Ord som begynder med $myletter" HREF="dict.cgi?letter=$myletter"> |;
    $minimenu .= Kalliope::Strings::uc($myletter)."</A>"; 

}

# Ord i kategori

$sth = $dbh->prepare("SELECT * FROM dict WHERE firstletter = ? ORDER BY word");
$sth->execute($letter);
my $rows = $sth->rows;
my $i = 0;
$HTML = '<table width="100%"><tr><td width="50%" valign="top">';
while (my $h = $sth->fetchrow_hashref) {
    if (defined $wid && $wid eq $$h{wid}) {
        $$h{word} = "<b>$$h{word}</b>";
    }
    $HTML .= qq|<A HREF="dict.cgi?wid=$$h{wid}">$$h{word}</A><br>|;
    $HTML .= '</td><td width="50%" valign="top">' if ++$i == int($rows/2);
}
$HTML .= '</td></tr></table>';

$page->addBox ( title => 'Ord',
	width => "80%",
	coloumn => 0,
        title => $minimenu,
	content => $HTML );

$page->print;

