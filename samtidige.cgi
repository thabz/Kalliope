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

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $LA = url_param('sprog') || 'dk';
my $poet = new Kalliope::Person(fhandle => $fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs;
push @crumbs,['Samtid',''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
                                      page => 'samtidige',
				      subtitle => 'Samtidige digtere',
                                      crumbs => \@crumbs );


#
# Samtidige digtere -------------------------------------
#

my $sth = $dbh->prepare("SELECT DISTINCT f.* FROM fnavne as f,vaerker as v WHERE v.fid = f.fid AND v.aar > ? AND v.aar < ? AND f.fid != ? ORDER BY f.doed");
$sth->execute($poet->yearBorn,$poet->yearDead,$poet->fid);
my $antal = $sth->rows;
if ($antal) {
    my $HTML;
    my $i = 0;
    $HTML .= '<TABLE WIDTH="100%"><TR><TD VALIGN=top>';
    $HTML .= '<TABLE BORDER=0 CELLPADDING=0 CELLSPADING=0>';
    while (my $h = $sth->fetchrow_hashref) {
	$HTML .= '<TR><TD VALIGN="top"><IMG WIDTH="20" HEIGHT="20" ALT="" SRC="gfx/flags/'.$h->{'sprog'}.'_light.gif"></TD><TD><A HREF="ffront.cgi?fhandle='.$h->{'fhandle'}.'">'.$h->{'fornavn'}.' '.$h->{'efternavn'}.' <FONT COLOR="#808080">('.$h->{'foedt'}.'-'.$h->{'doed'}.')</FONT></A></TD></TR>';
	if ($i == int($antal/2) - 1 ) {
	    $HTML .= '</TABLE></TD><TD VALIGN=top>';
	    $HTML .= '<TABLE BORDER=0 CELLPADDING=0 CELLSPADING=0>';
	}
        $i++;
    }
    $HTML .= '</TABLE>';
    $HTML .= '</TD></TR></TABLE>';
    $HTML .= '<BR><SMALL><I>Oversigt over digtere som udgav værker i '.$poet->name.'s levetid.</I></SMALL>';
    $page->addBox(
	    width => '80%',
            coloumn => 1,
	    content => $HTML );

}

$page->print;

