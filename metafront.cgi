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
use Kalliope::Page ();
use Kalliope::Web ();
use CGI ();

my $LA = CGI::url_param('sprog') || 'dk';

my @crumbs;
push @crumbs,['Baggrund',''];

my $page = new Kalliope::Page (
		title => 'Baggrund',
		lang => $LA,
		crumbs => \@crumbs,
		nosubmenu => 1,
                pagegroup => 'history',
		icon => 'keywords-blue',
                page => 'historyfront'); 

$page->addFrontMenu(&front($LA));
$page->print;


sub front {
    my ($LA) = @_;

    my @menuStruct = ({ 
        url => "keywordtoc.cgi?sprog=$LA", 
	    title => 'Nøgleord', 
	    status => 1,
        desc => "Litteraturhistoriske skitser og forklaringer af litterære begreber",
        icon => 'gfx/icons/keywords-h48.gif'
    },{
        url => "dict.cgi", 
	    title => 'Ordbog', 
	    status => 1, 
        desc => "Forklaringer til svære eller usædvanlige ord som man støder på i de ældre digte",
        icon => 'gfx/icons/keywords-h48.gif'
    },{
	    url => "persons.cgi?list=az", 
	    title => 'Personer', 
	    status => 1,
        desc => "Litterært interessante personer som ikke har skrevet lyrik.",
        icon => 'gfx/icons/portrait-h48.gif',
    },{
	    url => "kabout.pl?page=about", 
	    title => 'Om Kalliope', 
	    status => 1,
        desc => "Om websitet Kalliope.",
        icon => 'gfx/icons/portrait-h48.gif',
    });

    return @menuStruct;
}
