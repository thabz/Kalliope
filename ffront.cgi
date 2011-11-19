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
	title => 'Værker', 
	status => $poet->hasWorks,
        desc => "${poetName}s samlede poetiske værker",
        icon => 'gfx/icons/works-w96.png'
                    },{
        url => 'flines.pl?mode=1&', 
	title => 'Digttitler', 
	status => $poet->hasPoems, 
        desc => "Vis titler på alle digte",
        icon => 'gfx/icons/poem-w96.png'
                    },{
	url => 'flines.pl?mode=0&', 
	title => 'Førstelinier', 
	status => $poet->hasPoems,
        desc => "Vis førstelinier for samtlige digte",
        icon => 'gfx/icons/poem-w96.png'
                    },{
	url => 'fsearch.cgi?', 
	title => 'Søgning', 
	status => $poet->hasPoems,
        desc => "Søg i ".$poetName."s tekster",
        icon => 'gfx/icons/search-w96.png'
                    },{
	url => 'fpop.pl?', 
	title => 'Populære digte', 
	status => $poet->hasPoems,
        desc => "Top-10 over mest læste $poetName digte i Kalliope",
        icon => 'gfx/icons/pop-w96.png'
                    },{
	url => 'fvaerker.pl?mode=prosa&', 
	title => 'Prosa', 
	desc => qq|${poetName}s prosatekster|,
	status => $poet->{'prosa'},
        icon => 'gfx/icons/works-w96.png'
                    },{
	url => 'fpics.pl?', 
	title => 'Portrætter', 
	status => $poet->{'pics'},
        icon => 'gfx/icons/portrait-w96.png',
        desc => "Portrætgalleri for $poetName"
                    },{
	url => 'biografi.cgi?', 
	title => 'Biografi', 
	status => 1,
        desc => qq|En kortfattet introduktion til ${poetName}s liv og værk|,
        icon => 'gfx/icons/biography-w96.png'
                    },{
	url => 'samtidige.cgi?', 
	title => 'Samtid', 
	status => !$poet->isUnknownPoet && $poet->yearBorn ne '?',
        desc => qq|Digtere som udgav værker i ${poetName}s levetid|,
        icon => 'gfx/icons/biography-w96.png'
                    },{
	url => 'henvisninger.cgi?', 
	title => 'Henvisninger', 
	status => $poet->hasHenvisninger, 
        desc => 'Oversigt over tekster som henviser til '.$poetName.'s tekster',
        icon => 'gfx/icons/links-w96.png'
                    },{
	url => 'flinks.pl?', 
	title => 'Links', 
	status => $poet->{'links'}, 
        desc => 'Henvisninger til andre steder på internettet, som har relevant information om '.$poetName,
        icon => 'gfx/icons/links-w96.png'
                    },{
        url => 'fsekundaer.pl?', 
        title => 'Bibliografi', 
        status => $poet->{'primaer'} || $poet->{'sekundaer'},
        desc => $poetName.'s bibliografi',
        icon => 'gfx/icons/secondary-w96.png'
                    } );

map {$_->{'url'} = $_->{'url'}.'fhandle='.$poet->fhandle} @menuStruct;

$page->addFrontMenu(@menuStruct);

$page->print;

