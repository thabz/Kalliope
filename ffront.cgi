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

use Kalliope;
use CGI (':standard');
use Kalliope::Person;
use Kalliope::Page;
use Kalliope::Web;
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs(front => 1);

my $page = newAuthor Kalliope::Page (
	                page => 'forside',
			subtitle => $poet->lifespan,
		        nosubmenu => 1,
                  	poet => $poet,
		       	crumbs => \@crumbs );


#
# Hovedmenu for digter ----------------------------------------------
#

my $poetName = $poet->name;
my $HTML;

my @menuStruct = (
      { url => 'fvaerker.pl?', 
	title => _('Værker'), 
	status => $poet->hasWorks,
        desc => _("%ss samlede poetiske værker",$poetName),
        icon => 'gfx/icons/works-w96.png'
                    },{
        url => 'flines.pl?mode=1&', 
	title => _('Digttitler'), 
	status => $poet->hasPoems, 
        desc => _("Vis titler på alle digte"),
        icon => 'gfx/icons/poem-w96.png'
                    },{
	url => 'flines.pl?mode=0&', 
	title => _('Førstelinier'), 
	status => $poet->hasPoems,
        desc => _("Vis førstelinier for samtlige digte"),
        icon => 'gfx/icons/poem-w96.png'
                    },{
	url => 'fsearch.cgi?', 
	title => _('Søgning'), 
	status => $poet->hasPoems,
        desc => _("Søg i %ss tekster",$poetName),
        icon => 'gfx/icons/search-w96.png'
                    },{
	url => 'fpop.pl?', 
	title => _('Populære digte'), 
	status => $poet->hasPoems,
        desc => _("Top-10 over mest læste %s digte i Kalliope",$poetName),
        icon => 'gfx/icons/pop-w96.png'
                    },{
	url => 'fvaerker.pl?mode=prosa&', 
	title => _('Prosa'), 
	desc => _("%ss prosatekster",$poetName),
	status => $poet->{'prosa'},
        icon => 'gfx/icons/works-w96.png'
                    },{
	url => 'fpics.pl?', 
	title => _('Portrætter'), 
	status => $poet->{'pics'},
        icon => 'gfx/icons/portrait-w96.png',
        desc => _("Portrætgalleri for %s",$poetName)
                    },{
	url => 'biografi.cgi?', 
	title => _('Biografi'), 
	status => 1,
        desc => _("En kortfattet introduktion til %ss liv og værk",$poetName),
        icon => 'gfx/icons/biography-w96.png'
                    },{
	url => 'samtidige.cgi?', 
	title => _('Samtid'), 
	status => !$poet->isUnknownPoet && $poet->yearBorn ne '?',
        desc => _("Digtere som udgav værker i %ss levetid",$poetName),
        icon => 'gfx/icons/biography-w96.png'
                    },{
	url => 'henvisninger.cgi?', 
	title => _('Henvisninger'), 
	status => $poet->hasHenvisninger, 
        desc => _('Oversigt over tekster som henviser til %ss tekster', $poetName),
        icon => 'gfx/icons/links-w96.png'
                    },{
	url => 'flinks.pl?', 
	title => _('Links'), 
	status => $poet->{'links'}, 
        desc => _('Henvisninger til andre steder på internettet som har relevant information om %s',$poetName),
        icon => 'gfx/icons/links-w96.png'
                    },{
        url => 'fsekundaer.pl?', 
        title => _('Bibliografi'), 
        status => $poet->{'primaer'} || $poet->{'sekundaer'},
        desc => _('Bibliografi for %s',$poetName),
        icon => 'gfx/icons/secondary-w96.png'
      } );

map {$_->{'url'} = $_->{'url'}.'fhandle='.$poet->fhandle} @menuStruct;

$page->addFrontMenu(@menuStruct);

$page->print;

