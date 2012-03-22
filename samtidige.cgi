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
use Kalliope::Timeline;
use Kalliope::Timeline::Event;
use strict;
use utf8;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $LA = url_param('sprog') || 'dk';
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs;
push @crumbs,[_('Samtidige digtere'),''];

my $page = newAuthor Kalliope::Page( 
    poet => $poet,
    page => 'samtidige',
	subtitle => _('Samtidige digtere'),
	coloumnwidths => [50,50],
    crumbs => \@crumbs
);

#
# Samtidige digtere -------------------------------------
#

my $sth = $dbh->prepare("SELECT DISTINCT f.* FROM fnavne as f,vaerker as v WHERE v.fhandle = f.fhandle AND v.aar > ? AND v.aar < ? AND f.fhandle != ? ORDER BY f.doed");
$sth->execute($poet->yearBorn,$poet->yearDead,$poet->fhandle);
my $antal = $sth->rows;
my @blocks;
if ($antal) {
    my $i = 0;
    while (my $h = $sth->fetchrow_hashref) {
        my $HTML .= '<div>';
        $HTML .= Kalliope::Web::insertFlag($h->{land},'');
	    $HTML .= '<a href="ffront.cgi?fhandle='.$h->{'fhandle'}.'">'.$h->{'fornavn'}.' '.$h->{'efternavn'};
	    $HTML .= ' <span class="gray">('.$h->{'foedt'}.'-'.$h->{'doed'}.')</span></a>';
	    $HTML .= '</div>';
	    my $c = $i < $antal/2 ? 0 : 1;
	    $blocks[$c]->{'body'} .= $HTML;
	    $blocks[$c]->{'count'}++;
	    
        $i++;
    }
    $blocks[0]->{'body'} .= '<br><br><SMALL><I>'._("Oversigt over digtere som udgav værker i %ss levetid.",$poet->name).'</I></SMALL>';
    $page->addDoubleColumn(@blocks);
}

$page->print;

