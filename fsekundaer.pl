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
use strict;

my $fhandle = url_param('fhandle');
my $mode = url_param('mode');
my $filename =  $mode eq 's' ? 'sekundaer' : 'primaer';

my $poet = new Kalliope::Person(fhandle => $fhandle);

my $title = $mode eq 's' ? 'Sekundær litteratur' : 'Primær litteratur';
my $page = $mode eq 's' ? 'sekundaer' : 'primaer';

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,[$title,''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
                                      page => $page,
                                      crumbs => \@crumbs );

open (FILE,"fdirs/".$fhandle."/".$filename.'.txt');
my $HTML = join '<BR><BR>',<FILE>;
close (FILE);

$page->addBox( width => '75%',
               coloumn => 1,
	       title => $title,
	       content => $HTML );
$page->print;
