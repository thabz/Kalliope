#!/usr/bin/perl

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

use Kalliope::Page ();
use CGI ();

my %titler = ( musen => 'Musen',
               tak => 'Tak',
               faq => 'Ofte stillede spørgsmål',
               attractions => 'Coming attractions',
	       about => 'Om' );

my $select = CGI::url_param('page');
my @crumbs = ([$titler{$select},'']);

my $page = new Kalliope::Page (
		title => 'Om Kalliope',
                pagegroup => 'welcome',
		crumbs => \@crumbs,
                page => $select); 

$page->addBox (width => '75%',
               content => &readFile(CGI::url_param('page')));
$page->print;


sub readFile {
    my $page = shift;
    my $HTML;
    if ($abouttext =~ /\.\./ || !(-e "data.dk/$page.html")) {
        Kalliope::Page::notFound();
    } else {
	open(FILE,"data.dk/$page.html");
	foreach  (<FILE>) {
	    $HTML .= $_;
	}
        close (FILE);
    }
    return $HTML;
}

