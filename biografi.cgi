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

use CGI (':standard');
use Kalliope::Person;
use Kalliope::Page;
use Kalliope::Timeline;
use Kalliope::Timeline::Event;
use strict;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs;
push @crumbs,['Biografi',''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
                                      page => 'bio',
                                      coloumnwidths => [70,30],
				                      subtitle => 'Biografi',
				                      printer => url_param('printer') || 0,
                                      crumbs => \@crumbs );

#
# Biografi ----------------------------------------------
#
if ($poet->hasBio) {
$page->addBox( printtitle => $poet->name.' '.$poet->lifespan,
               width => '80%',
               coloumn => 0,
	           printer => 1,
	           align => 'justify',
	           end => qq|<a title="Udskriftsvenlig udgave" href="biografi.cgi?fhandle=$fhandle&printer=1"><img src="gfx/print.gif" border=0></a>|,
	           content => $poet->bio || '<IMG ALIGN="left" SRC="gfx/excl.gif">Der er endnu ikke forfattet en biografi for '.$poet->name );
}
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
    if (0) {
#    if ($poet->getType ne 'person') {
	$HTML .= '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>';
        $HTML .= '<b>Antal digte: </b>'.$poet->poemCount.'<br>';
    }
    $HTML .= '</span>';


    $page->addBox( width => '150',
	    coloumn => 1,
	    content => $HTML );
}

#
# Historiske begivenheder --------------------------------------------------
#

my @events;

my @works = ($poet->poeticalWorks,$poet->proseWorks);
foreach my $w (grep { $_->hasYear } @works) {
    my $titlepic = $w->getTitlepagePic;
    my $event;
    if ($titlepic) {
       $event = new Kalliope::Timeline::Event({ 
	       url => $titlepic->{'destfile'},
	       year => $w->year,
               description => "Titelblad til ".$poet->efternavn.'s <i>'.$w->clickableTitle.'</i> som udkommer '.$w->year."." });
    } elsif ($w->hasContent) {
        $event = new Kalliope::Timeline::Event({ 
		    year => $w->year,
                    description => $poet->efternavn.': <i>'.$w->clickableTitle.'</i>.' });
    } else {
            $event = new Kalliope::Timeline::Event({ 
		    year => $w->year,
                    description => $poet->efternavn.': <i>'.$w->title.'</i>.' });
    }
    push @events,$event;
}

push @events , new Kalliope::Timeline::Event({ year => $poet->yearBorn,
                 description => $poet->name.' født.'}) if $poet->yearBorn ne '?';
push @events , new Kalliope::Timeline::Event({ year => $poet->yearDead,
                 description => $poet->name.' død.'}) if $poet->yearDead;

my @personalEvents = Kalliope::Timeline::getEventsForPerson($poet->fhandle);

my $beginSpan = $poet->yearBorn;
if ($beginSpan eq '?' && $#personalEvents > 1) {
    $beginSpan = $personalEvents[0]->getYear;
}
push @events, @personalEvents;

$beginSpan =~ s/[^0-9]//g;
my @other = Kalliope::Timeline::getHistoryInTimeSpan($beginSpan,$poet->yearDead);
map {$_->useGrayText(1)} @other;
push @events, @other;

if ($#events > 0) {
    my $antal = $#events + 1;
    my $i = 0;
    my $HTML = '<TABLE WIDTH="100%"><TR><TD WIDTH="50%" VALIGN="top">';

    $HTML .= '<TABLE>';
    my $last = 0;
    foreach my $e (sort { $a->getYear cmp $b->getYear } @events) {
        my $yearForDisplay = $last ne $e->getYear ? $e->getYear : '';
        
	$HTML .= qq|<TR><TD CLASS="blue" VALIGN="top">$yearForDisplay&nbsp;</TD>|;
	$HTML .= '<TD VALIGN="top" class="gray">';
	if ($e->isImage) {
	    $HTML .= Kalliope::Web::insertThumb($e->getKalliopeImage);
	    $HTML .= '<br><small>'.$e->getText.'</small>';
	} else {
	    $HTML .= $e->getText;
	}
	$HTML .= "</TD></TR>\n";
	$HTML .= '</TABLE></TD><TD WIDTH="50%" VALIGN="top"><TABLE>' if ++$i == int ($antal / 2);
	$last = $e->getYear;
    }
    $HTML .= '</TABLE></TD></TR></TABLE>';
    Kalliope::buildhrefs(\$HTML);
    $page->addBox( title => 'Historiske begivenheder',
	    width => '80%',
	    coloumn => 0,
	    content => $HTML);
}


$page->print;

