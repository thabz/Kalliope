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
my $poet = new Kalliope::Person(fhandle => $fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,['Links',''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
                                      page => 'links',
                                      crumbs => \@crumbs );

#Vis de tilgængelige links

my $out = "<TABLE>";
my $sth = $dbh->prepare("SELECT url,beskrivelse FROM links WHERE fid=?");
$sth->execute($poet->fid);
while (my $h = $sth->fetchrow_hashref) {
    $out .= '<TR><TD VALIGN="top"><A TARGET="_top" HREF="'.$h->{'url'}.'"><IMG ALIGN="left" SRC="gfx/globesmall.gif" BORDER=0 ALT="Click her for at følge nævnte link"></A></TD>';
    $out .= '<TD VALIGN="top">'.$h->{'beskrivelse'}.'</TD></TR>';
}
$sth->finish;
$out .= "</TABLE>";

$page->addBox( width => '75%',
               coloumn => 1,
               title => "Mere om ".$poet->name." på nettet",
	       content => $out);
$page->print;
