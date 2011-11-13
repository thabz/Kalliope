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
push @crumbs,['Digte',''];

my $page = new Kalliope::Page (
		title => 'Digte',
		lang => $LA,
		crumbs => \@crumbs,
		nosubmenu => 1,
                pagegroup => 'poemlist',
	        icon => 'poem-turkis',
                page => 'poemsfront'); 

$page->addFrontMenu(&front($LA));

$page->print;


sub front {
    my ($LA) = @_;

    my @menuStruct = (
      { url => "klines.pl?mode=1&forbogstav=A&sprog=$LA", 
	title => 'Digte efter titler', 
	status => 1,
        desc => "Digte ordnet efter titler",
        icon => 'gfx/icons/poem-h48.gif'
                    },{
        url => "klines.pl?mode=0&forbogstav=A&sprog=$LA", 
	title => 'Digte efter førstelinier', 
	status => 1,
        desc => "Digte ordnet efter førstelinier",
        icon => 'gfx/icons/poem-h48.gif'
                    },{
        url => "klines.pl?mode=2&sprog=$LA", 
	title => 'Mest populære digte', 
	status => 1,
        desc => "De mest læste digte i Kalliope",
        icon => 'gfx/icons/pop-h48.gif'
                    },{
        url => "latest.cgi", 
	title => 'Seneste tilføjelser', 
	status => 1,
        desc => "De senest tilføjede digte i Kalliope",
        icon => 'gfx/icons/poem-h48.gif'
		    } );

    return @menuStruct;
}
