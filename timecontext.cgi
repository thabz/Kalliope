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


use strict;
use CGI qw/:standard/;
use Kalliope::Help;
use Kalliope::Page::Popup;
use Kalliope::DB;
use Kalliope;

my $dbh = Kalliope::DB->connect();

my $year = CGI::param('center');
my $fromYear = $year-2;
my $toYear = $year+2;

my $sth = $dbh->prepare("SELECT * FROM timeline WHERE year >= ? AND year <= ? ORDER BY year ASC");
$sth->execute($fromYear,$toYear);

my $HTML;
while (my $h = $sth->fetchrow_hashref) {
    $HTML .= '<B>'.$h->{'year'}.'</B>: '.$h->{'description'}."<BR>\n";
}
Kalliope::buildhrefs(\$HTML); 

$HTML =~ s/<A(.*)HREF="([^"]*)"(.*)>/<A$1 onClick="javascript:opener.document.location = '$2';return false" HREF="javascript:{}"$3>/g;

my $title = "Begivenheder $fromYear - $toYear";
my $page = new Kalliope::Page::Popup ( title => $title );
$page->addBox( width => '100%',
               title => $title,
               content => $HTML );
$page->print;


