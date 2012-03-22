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
use utf8;
use Kalliope;
use Kalliope::Page ();
use Kalliope::Web ();
use CGI ();

my $country = Kalliope::Internationalization::country();

my @crumbs;
push @crumbs,[_("Digte"),''];

my $page = new Kalliope::Page (
		title => _('Digte'),
		lang => $country,
		crumbs => \@crumbs,
		nosubmenu => 1,
                pagegroup => 'poemlist',
	        icon => 'poem-turkis',
                page => 'poemsfront'); 

$page->addFrontMenu(&front($country));

$page->print;


sub front {
    my ($country) = @_;

    my @menuStruct = (
      { url => "klines.pl?mode=1&forbogstav=A&cn=$country", 
	title => _('Digte efter titler'), 
	status => 1,
        desc => _("Digte ordnet efter titler"),
        icon => 'gfx/icons/poem-w96.png'
                    },{
        url => "klines.pl?mode=0&forbogstav=A&cn=$country", 
	title => _('Digte efter førstelinier'), 
	status => 1,
        desc => _("Digte ordnet efter førstelinier"),
        icon => 'gfx/icons/poem-w96.png'
                    },{
        url => "klines.pl?mode=2&cn=$country", 
	title => _('Mest populære digte'), 
	status => 1,
        desc => _("De mest læste digte i Kalliope"),
        icon => 'gfx/icons/pop-w96.png'
                    },{
        url => "latest.cgi", 
	title => _('Seneste tilføjelser'), 
	status => 1,
        desc => _("De senest tilføjede digte i Kalliope"),
        icon => 'gfx/icons/poem-w96.png'
		    } );

    return @menuStruct;
}
