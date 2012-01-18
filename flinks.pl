#!/usr/bin/perl

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
use Kalliope::DB;
use strict;

my $fhandle = url_param('fhandle');
my $dbh = Kalliope::DB->connect;
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs;
push @crumbs,['Links',''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
                                      page => 'links',
               subtitle => "Mere om ".$poet->name." på nettet",
                                      crumbs => \@crumbs );

#Vis de tilgængelige links

my $out = "<TABLE>";
my $sth = $dbh->prepare("SELECT url,beskrivelse FROM links WHERE fhandle = ?");
$sth->execute($poet->fhandle);
while (my $h = $sth->fetchrow_hashref) {
    $out .= '<TR><TD VALIGN="top"><A TARGET="_top" HREF="'.$h->{'url'}.'"><IMG 
	ALIGN="left" SRC="gfx/icons/links-w96.png" width="48" height="48" BORDER=0 ALT="Click her for at følge nævnte link"></A></TD>';
    $out .= '<TD VALIGN="top">'.$h->{'beskrivelse'}.'</TD></TR>';
}
$sth->finish;
$out .= "</TABLE>";

$page->addBox( width => '75%',
               coloumn => 1,
	       content => $out);
$page->print;
