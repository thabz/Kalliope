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
my $poet = new Kalliope::Person(fhandle => $fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,['Portrætter',''];

my $page = newAuthor Kalliope::Page ( poet => $poet, crumbs => \@crumbs );

my $i = 1;
my $HTML .= "<TABLE><TR>";
while (-e "fdirs/".$fhandle."/p".$i.".jpg") {
    $HTML .= '<TD WIDTH="33%" VALIGN="top" ALIGN="center">';
    $HTML .= Kalliope::Web::insertThumb({thumbfile=>"fdirs/$fhandle/_p$i.jpg",destfile=>"fdirs/$fhandle/p$i.jpg",alt=>$poet->name.'- klik for fuld størrelse'});
    $HTML .= '<BR>';
    if (-e "fdirs/".$fhandle."/p".$i.".txt") {
	open(IN,"fdirs/".$fhandle."/p".$i.".txt");
	while (<IN>) {
	    $HTML .= $_."<BR>";
	}
    }
    $HTML .= '('.Kalliope::filesize("fdirs/$fhandle/p$i.jpg").')';
    $HTML .= "</TD>";
    $i++;
    if ((($i-1)%3)==0) {
	$HTML .= "</TR><TR>";
    }
}
$HTML .= "</TR></TABLE>";

$page->addBox( title => 'Portrætter',
               width => '80%',
               coloumn => 1,
               align => 'center',
	       content => $HTML );
$page->print;
