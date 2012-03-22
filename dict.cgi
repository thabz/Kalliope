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

use utf8;
binmode STDOUT => ":utf8";
use CGI qw /:standard/;
use Kalliope::Web;
use Kalliope::Page;
use Kalliope::Strings;
use Kalliope::Keyword;
use Kalliope::DB;
use Kalliope::Sort;
use Kalliope;
use URI::Escape;
use Encode;
use strict;

my $dbh = Kalliope::DB->connect;

my $page;

my $wid = decode utf8 => url_param('wid');
my $letter = decode utf8 => url_param('letter');
my @crumbs;
push @crumbs,['Baggrund','metafront.cgi'];
push @crumbs,['Ordbog','dict.cgi'];
push @crumbs,[Kalliope::Strings::uc($letter),''] if $letter;

$page = new Kalliope::Page (
	title => "Ordbog",
	pagegroup => 'history',
	page => 'dict',
	icon => 'keywords-blue',
	lang => 'dk',
	crumbs => \@crumbs );

# Beskrivelse

if ($wid) {
    my $sth = $dbh->prepare("SELECT * FROM dict WHERE wid = ?");
    $sth->execute($wid);
    my $h = $sth->fetchrow_hashref;

    $letter = $h->{'firstletter'};

    my $HTML = "<b>$$h{word}</b>: ";
    my $forkl = $h->{'forkl'};
    Kalliope::buildhrefs(\$forkl);
    $HTML .= $forkl;

    $HTML .= qq|<br><br><a class="green" href="ksearch.cgi?sprog=dk&type=free&needle=|.uri_escape_utf8($$h{word}).q|">Søg</a> efter tekster, som indeholder dette ord.|;

    $page->addBox (
	    width => "80%",
	    coloumn => 0,
	    content => $HTML)
}

unless ($letter) {
    open FILE,'data/html/dictintro.html';
    binmode FILE => ":utf8";
    my $HTML = join '',<FILE>;
    close FILE;
    $page->addBox (
	    width => "80%",
	    coloumn => 0,
	    title => 'Indledning',
	    content => $HTML);

    $letter = 'a';
}

# Ord i kategori

my $sth = $dbh->prepare("SELECT * FROM dict WHERE firstletter = ? ORDER BY word");
$sth->execute($letter);
my $rows = $sth->rows;
my $i = 0;
my $HTML = '<table width="100%"><tr><td width="50%" valign="top">';
while (my $h = $sth->fetchrow_hashref) {
    if (defined $wid && $wid eq $$h{wid}) {
        $$h{word} = "<b>$$h{word}</b>";
    }
    $HTML .= qq|<A HREF="dict.cgi?wid=|.uri_escape_utf8($$h{wid}).qq|">$$h{word}</A><br>|;
    $HTML .= '</td><td width="50%" valign="top">' if ++$i == int($rows/2);
}
$HTML .= '</td></tr></table>';


# Bogstavrække

$sth = $dbh->prepare ("SELECT DISTINCT firstletter FROM dict ORDER BY firstletter ASC");
$sth->execute();
my $minimenu;
my @letters;
while (my ($myletter) = $sth->fetchrow_array()) {
    push @letters, { 'sort' => $myletter };
}
my @tabs;
foreach my $mymyletter (sort {  Kalliope::Sort::sort($a,$b) } @letters) {
    my $myletter = $mymyletter->{'sort'};
    my $tab;
    $tab->{'url'} = 'dict.cgi?letter='.uri_escape_utf8($myletter);
    $tab->{'text'} = Kalliope::Strings::uc($myletter);
    $tab->{'title'} = "Ord som begynder med $myletter";
    $tab->{'id'} = $myletter;
    push @tabs,$tab;
}

$HTML = Kalliope::Web::tabbedView($letter,$HTML,@tabs);

$page->addBox ( title => 'Ord',
	width => "80%",
	coloumn => 0,
	content => $HTML );

$page->print;

