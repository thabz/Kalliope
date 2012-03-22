#!/usr/bin/perl -w

#  Copyright (C) 1999-2012 Jesper Christensen 
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
use utf8;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs;
push @crumbs,[_('Henvisninger'),''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
                                      page => 'henvisninger',
				      subtitle => _('Henvisninger'),
                                      crumbs => \@crumbs );

#
# Tekster der linker til denne digters tekster -------------------------------
#

my $sth = $dbh->prepare("SELECT fromid,toid FROM xrefs,digte WHERE xrefs.toid = digte.longdid AND digte.fid = ?");
$sth->execute($poet->fid);

my $antal = $sth->rows;
if ($antal > 0) {
    my $HTML;
    my $i = 0;
    $HTML .= '<TABLE CLASS="oversigt" WIDTH="100%">';
    $HTML .= '<TH>Fra</TH><TH></TH><TH>Til</TH>';

    while (my ($fromid,$toid) = $sth->fetchrow_array) {
        my $fromdigt = new Kalliope::Poem(longdid => $fromid);
        next if $fromdigt->fid == $poet->fid;
        my $todigt= new Kalliope::Poem(longdid => $toid);

        $HTML .= "<TR>";
        $HTML .= '<TD>'.$fromdigt->clickableTitle."</TD>";
        $HTML .= "<TD>&rarr;</TD>";
        $HTML .= '<TD>'.$todigt->clickableTitle."</TD>";
        $HTML .= "</TR>";
    }
    $HTML .= '</TABLE>';
    $HTML .= '<BR><SMALL><I>'._("Oversigt over tekster, som henviser til %ss tekster.",$poet->name).'</I></SMALL>';
    $page->addBox(
	    width => '80%',
            coloumn => 1,
	    content => $HTML );

} else {
    $page->addBox(
	    width => '80%',
            coloumn => 1,
	    content => _("Der findes ingen tekster, som henviser til %ss tekster.",$poet->name));
}

$page->print;

