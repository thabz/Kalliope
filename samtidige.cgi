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
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $LA = url_param('sprog') || 'dk';
my $poet = new Kalliope::Person(fhandle => $fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,['Samtid',''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
                                      page => 'samtidige',
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
    $page->addBox( title => 'Samtidige digtere',
	    width => '80%',
            coloumn => 1,
	    content => $HTML );

}

#
# Historiske begivenheder --------------------------------------------------
#

my @events;

my @works = ($poet->poeticalWorks,$poet->proseWorks);
foreach my $w (grep { $_->hasYear } @works) {
    push @events, { year => $w->year,
                    descr => $poet->efternavn.': <i>'.$w->clickableTitle.'</i>' };
}

push @events , { year => $poet->yearBorn,
                 descr => $poet->name.' født.'} if $poet->yearBorn;

push @events , { year => $poet->yearDead,
                 descr => $poet->name.' død.'} if $poet->yearDead;

push @events, Kalliope::Timeline::getHistoryInTimeSpan($poet->yearBorn,$poet->yearDead);

if ($#events > 0) {
    my $antal = $#events + 1;
    my $i = 0;
    my $HTML = '<TABLE WIDTH="100%"><TR><TD WIDTH="50%" VALIGN="top">';

    $HTML .= '<TABLE>';
    my $last = 0;
    foreach my $e (sort { $a->{'year'} <=> $b->{'year'} } @events) {
        my $yearForDisplay = $last != $$e{year} ? $$e{year} : '';
        
	$HTML .= qq|<TR><TD CLASS="blue" VALIGN="top">$yearForDisplay&nbsp;</TD>|;
	$HTML .= '<TD VALIGN="top">'.$$e{descr}."</TD></TR>";
	$HTML .= '</TABLE></TD><TD WIDTH="50%" VALIGN="top"><TABLE>' if ++$i == int ($antal / 2);
	$last = $$e{year};
    }
    $HTML .= '</TABLE></TD></TR></TABLE>';
    Kalliope::buildhrefs(\$HTML);
    $page->addBox( title => 'Historiske begivenheder',
	    width => '80%',
	    coloumn => 1,
	    content => $HTML);
}

$page->print;

