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
use Kalliope;
use Kalliope::Person;
use Kalliope::Page;
use Kalliope::Poem;
use Kalliope::Search;
use Kalliope::DB;
use URI::Escape;
use strict;

my $fhandle = CGI::param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

my $dbh = Kalliope::DB->connect;

my $search = new Kalliope::Search(lang => $poet->lang,
                                  type => 'author',
                                  offset => CGI::param('offset') || 0,
				  needle => CGI::param('needle') || '',
				  poet => $poet);
$search->log;

my @crumbs;
push @crumbs,[_('Digtere'),'poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,[$search->pageTitle,''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
	                              page => 'search',
				      subtitle => _('Søgning'),
	                              crumbs => \@crumbs );

if ($search->hasSearchBox) {
    $page->addBox( width => '80%',
                   coloumn => 1,
	           content => $search->searchBoxHTML);
}


if ($search->needle) {
$page->addBox( width => '80%',
	content => $search->getHTML,
	coloumn => 1);
}
$page->print();
