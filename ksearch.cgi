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

use CGI ();
use Kalliope::Person;
use Kalliope::Page;
use Kalliope::Poem;
use Kalliope::Search;
use Kalliope::DB;
use URI::Escape;
use strict;

my $dbh = Kalliope::DB->connect;

my $search = new Kalliope::Search(lang => CGI::param('sprog') || '',
                                  type => CGI::param('type') || '',
                                  offset => CGI::param('offset') || 0,
				  needle => CGI::param('needle') || '',
				  keyword => CGI::param('keyword') || '');

$search->log;

my @crumbs = ([$search->pageTitle,'']);

my $page = new Kalliope::Page (
		title => $search->pageTitle,
                pagegroup => 'search',
                lang => $search->lang,
                page => '',
                thumb => 'gfx/search_100.GIF',
                crumbs => \@crumbs );

if ($search->hasSearchBox) {
    $page->addBox( width => '80%',
	           content => $search->searchBoxHTML);
}


my $starttid = time;
$page->addBox( width => '80%',
	content => $search->getHTML,
	end => "Tid i sekunder: ".(time-$starttid) );

$page->print();
