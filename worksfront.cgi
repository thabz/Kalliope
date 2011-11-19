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
push @crumbs,['Værker',''];

my $page = new Kalliope::Page (
		title => 'Værker',
		lang => $LA,
		crumbs => \@crumbs,
        pagegroup => 'worklist',
		nosubmenu => 1,
		icon => 'works-green',
        page => 'worksfront'); 

$page->addFrontMenu(&front($LA));
$page->print;


sub front {
    my ($LA) = @_;

    my @menuStruct = ({ 
        url => "kvaerker.pl?mode=titel&sprog=$LA", 
	    title => 'Værker efter titel', 
	    status => 1,
        desc => "Værker ordnet efter titel",
        icon => 'gfx/icons/works-w96.png'
    },{
        url => "kvaerker.pl?mode=aar&sprog=$LA", 
	    title => 'Værker efter år', 
	    status => 1,
        desc => "Værker ordnet efter udgivelsesår",
        icon => 'gfx/icons/works-w96.png'
    },{
        url => "kvaerker.pl?mode=digter&sprog=$LA", 
	    title => 'Værker efter digter', 
	    status => 1,
        desc => "Værker grupperet efter digter",
        icon => 'gfx/icons/works-w96.png'
    },{
        url => "kvaerker.pl?mode=pop&sprog=$LA", 
	    title => 'Mest populære værker', 
	    status => 1,
        desc => "De mest læste værker i Kalliope",
        icon => 'gfx/icons/pop-w96.png'
    });

    return @menuStruct;
}
