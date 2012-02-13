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

my %titler = ( musen => _('Musen Kalliope'),
               tak => _('Mange tak...'),
               interne => _('Interne sider'),
               faq => _('Ofte stillede spørgsmål'),
               attractions => _('Coming attractions'),
	           about => '' );

my $select = CGI::url_param('page');
my $title = $titler{$select};
my @crumbs = ([$title,'']);

my $HTML = &readFile(CGI::url_param('page'));

my $page = new Kalliope::Page (
		title => _('Om Kalliope'),
        pagegroup => 'om',
		subtitle => $title,
		crumbs => \@crumbs,
        page => $select); 

$page->addBox (width => '75%',
               content => $HTML);
$page->print;

sub readFile {
    my $file = shift;
    my $HTML;
    if ($file =~ /\.\./ || !(-e "data/html//$file.html")) {
        Kalliope::Page::notFound();
    } else {
	    open(FILE,"data/html/$file.html");
	    foreach  (<FILE>) {
	        $HTML .= $_;
	    }
        close (FILE);
    }
    return $HTML;
}

