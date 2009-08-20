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

use Kalliope;
use CGI (':standard');
use Kalliope::Person;
use Kalliope::Page;
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs;
push @crumbs,['Portrætter',''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
	subtitle => 'Portrætter',
	page => 'pics',
        crumbs => \@crumbs );

my $i = 1;
my $HTML .= "<TABLE><TR>";
foreach my $pic ($poet->pics) {
    $HTML .= '<TD WIDTH="33%" VALIGN="top" ALIGN="center">';
    $HTML .= Kalliope::Web::insertThumb({
	    thumbfile => $$pic{thumbfile},
	    destfile => $$pic{file},
	    alt => $poet->name.'- klik for fuld størrelse'});
    $HTML .= '<BR>';
    $HTML .= $$pic{text};
    $HTML .= "</TD>";
    $i++;
    if ((($i-1)%3)==0) {
	$HTML .= "</TR><TR>";
    }
}
$HTML .= "</TR></TABLE>";

$page->addBox( width => '80%',
               coloumn => 1,
               align => 'center',
	       content => $HTML );
$page->print;
