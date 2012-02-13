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

my $LA = CGI::url_param('sprog') || 'dk';

my @crumbs;
push @crumbs,[_('Digtere'),''];

my $page = new Kalliope::Page (
	title => _('Digtere'),
	lang => $LA,
	crumbs => \@crumbs,
    pagegroup => 'poets',
	nosubmenu => 1,
    thumb => 'gfx/icons/works-h70.gif',
    page => 'worksfront'); 

$page->addFrontMenu(&front($LA));
$page->print;

sub front {
    my ($LA) = @_;

    my @menuStruct = ({ 
        url => "poets.cgi?list=az&sprog=$LA", 
	    title => _('Digtere efter navn'), 
	    status => 1,
        desc => _("Oversigt over digtere ordnet alfabetisk efter navn."),
        icon => 'gfx/icons/works-w96.png'
    },{
        url => "poets.cgi?list=19&sprog=$LA", 
	    title => _('Digtere efter år'), 
	    status => 1, 
        desc => _("Digtere ordnet kronologisk efter fødeår."),
        icon => 'gfx/icons/works-w96.png'
    },{
	    url => "poets.cgi?list=pics&sprog=$LA", 
	    title => _('Digtere efter udseende'), 
	    status => 1,
        desc => _("En oversigt med portrætter af alle digtere."),
        icon => 'gfx/icons/portrait-w96.png',
    },{
	    url => "poets.cgi?list=flittige&sprog=$LA", 
	    title => _('Flittigste digtere'), 
	    status => 1,
        desc => _("Digtere ordnet efter hvor rigt repræsenteret de er i Kalliope."),
        icon => 'gfx/icons/works-w96.png'
    },{
	    url => "poets.cgi?list=pop&sprog=$LA", 
	    title => _('Mest populære digtere'), 
	    desc => _('En oversigt over de mest læste digtere i Kalliope.'),
	    status => 1,
        icon => 'gfx/icons/pop-w96.png'});

    return @menuStruct;
}

