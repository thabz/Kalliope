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
use Kalliope;
use Kalliope::Page ();
use Kalliope::Web ();
use CGI ();

my $country = CGI::url_param('cn') || 'dk';

my @crumbs;
push @crumbs,[_('Værker'),''];

my $page = new Kalliope::Page (
	title => _('Værker'),
	lang => $country,
	crumbs => \@crumbs,
        pagegroup => 'worklist',
	nosubmenu => 1,
	icon => 'works-green',
        page => 'worksfront'); 

$page->addFrontMenu(&front($country));
$page->print;


sub front {
    my ($country) = @_;

    my @menuStruct = ({ 
        url => "kvaerker.pl?mode=titel&cn=$country", 
	    title => _('Værker efter titel'), 
	    status => 1,
        desc => _("Værker ordnet efter titel"),
        icon => 'gfx/icons/works-w96.png'
    },{
        url => "kvaerker.pl?mode=aar&cn=$country", 
	    title => _('Værker efter år'), 
	    status => 1,
        desc => _("Værker ordnet efter udgivelsesår"),
        icon => 'gfx/icons/works-w96.png'
    },{
        url => "kvaerker.pl?mode=digter&cn=$country", 
	    title => _('Værker efter digter'), 
	    status => 1,
        desc => _("Værker grupperet efter digter"),
        icon => 'gfx/icons/works-w96.png'
    },{
        url => "kvaerker.pl?mode=pop&cn=$country", 
	    title => _('Mest populære værker'), 
	    status => 1,
        desc => _("De mest læste værker i Kalliope"),
        icon => 'gfx/icons/pop-w96.png'
    });

    return @menuStruct;
}
