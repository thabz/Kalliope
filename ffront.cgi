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
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $poet = new Kalliope::Person(fhandle => $fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs;

my $page = newAuthor Kalliope::Page (
	                page => 'forside',
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
	status => $poet->{'vers'},
        desc => "${poetName}s samlede poetiske værker",
        icon => 'gfx/icons/works-h48.gif'
                    },{
        url => 'flines.pl?mode=1&', 
	title => 'Digttitler', 
	status => $poet->{'vaerker'}, 
        desc => "Vis titler på alle digte",
        icon => 'gfx/icons/poem-h48.gif'
                    },{
	url => 'flines.pl?mode=0&', 
	title => 'Førstelinier', 
	status => $poet->{'vaerker'},
        desc => "Vis førstelinier for samtlige digte",
        icon => 'gfx/icons/poem-h48.gif'
                    },{
	url => 'fpop.pl?', 
	title => 'Populære digte', 
	status => $poet->{'vaerker'},
        desc => "Top-10 over mest læste $poetName digte i Kalliope",
        icon => 'gfx/icons/pop-h48.gif'
                    },{
	url => 'fvaerker.pl?mode=prosa&', 
	title => 'Prosa', 
	desc => qq|${poetName}s prosatekster|,
	status => $poet->{'prosa'},
        icon => 'gfx/icons/works-h48.gif'
                    },{
	url => 'fpics.pl?', 
	title => 'Portrætter', 
	status => $poet->{'pics'},
        icon => 'gfx/icons/portrait-h48.gif',
        desc => "Portrætgalleri for $poetName"
                    },{
	url => 'biografi.cgi?', 
	title => 'Biografi', 
	status => $poet->{'bio'},
        desc => qq|En kortfattet introduktion til ${poetName}s liv og værk|,
        icon => 'gfx/icons/biography-h48.gif'
                    },{
	url => 'samtidige.cgi?', 
	title => 'Samtid', 
	status => !$poet->isUnknownPoet && $poet->yearBorn ne '?',
        desc => qq|Digtere som udgav værker i ${poetName}s levetid|,
        icon => 'gfx/icons/biography-h48.gif'
                    },{
	url => 'henvisninger.cgi?', 
	title => 'Henvisninger', 
	status => $poet->hasHenvisninger, 
        desc => 'Oversigt over tekster som henviser til '.$poetName.'s tekster.',
        icon => 'gfx/icons/links-h48.gif'
                    },{
	url => 'flinks.pl?', 
	title => 'Links', 
	status => $poet->{'links'}, 
        desc => 'Henvisninger til andre steder på internettet, som har relevant information om '.$poetName,
        icon => 'gfx/icons/links-h48.gif'
                    },{
        url => 'fsekundaer.pl?', 
        title => 'Bibliografi', 
        status => $poet->{'primaer'} || $poet->{'sekundaer'},
        desc => $poetName.'s bibliografi',
        icon => 'gfx/icons/secondary-h48.gif'
                    } );

map {$_->{'url'} = $_->{'url'}.'fhandle='.$poet->fhandle} @menuStruct;
$HTML = Kalliope::Page::frontMenu(@menuStruct);
$page->addBox( width => '80%',
	coloumn => 1,
	content => $HTML );

#
# Detaljer
#

if ($poet->getDetailsAsHTML) {
    my $HTML = '';
    if ($poet->thumbURI) {
	$HTML .= '<center><IMG BORDER=2 SRC="'.$poet->thumbURI.'"></center><br>';
    }
    $HTML .= '<span style="font-size: 12px">';
    $HTML .= '<b>Navn: </b>'.$poet->name.'<br>';
    $HTML .= $poet->getDetailsAsHTML;
    if ($poet->getType ne 'person') {
	$HTML .= '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>';
	$HTML .= '<b>Antal digte: </b>'.$poet->poemCount.'<br>';
    }
    $HTML .= '</span>';


    $page->addBox( width => '150',
	    coloumn => 2,
	    content => $HTML );
}

#
# Søgefelt
#
if ($poet->hasPoems) {
    $HTML = qq|<FORM METHOD="get" ACTION="fsearch.cgi"><span style="font-size: 12px">Søgning i |.$poet->name.qq|s værker:</span><br><INPUT SIZE=12 TYPE="text" NAME="needle"><INPUT TYPE="hidden" NAME="fhandle" VALUE="$fhandle"> <INPUT CLASS="button" TYPE="submit" NAME="Knap" VALUE=" Søg "></FORM>|;

     $page->addBox( width => '150',
#    title => 'Søgning hos '.$poet->name,
		    coloumn => 2,
		    content => $HTML );
}

$page->print;

