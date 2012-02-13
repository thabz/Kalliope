#!/usr/bin/perl -w

#  En digters samlede værker.
#
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
use Kalliope;
use Kalliope::Person;
use Kalliope::Page;
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');

unless ($fhandle) {
    my @ARGV = split(/\?/,$ARGV[0]);
    if (!($ARGV[1] eq "")) {
	chop($ARGV[0]);
	chomp($ARGV[1]);
    }
    print "Location: fvaerker.pl?fhandle=".$ARGV[0];
    print "\n\n";
    exit;
}

my $poet = Kalliope::PersonHome::findByFhandle($fhandle);
my $mode = url_param('mode') || 'poetical';

my @crumbs = $poet->getCrumbs();
push @crumbs,[_('Værker'),''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
                    crumbs => \@crumbs, 
		    subtitle => _('Værker'),
		    page => $mode eq 'prosa' ? 'prosa' : 'vaerker' );
my $HTML;

my @works = $mode eq 'poetical' ? $poet->poeticalWorks : $poet->proseWorks;
#@works = $poet->allWorks;

if ($#works >= 0) {
    my @menuItems;
    foreach my $work (@works) {
        my $iconfile;
        if ($work->hasContent) {
            $iconfile = $work->status eq 'complete' ? 'gfx/icons/book-w96.png' : 'gfx/icons/incomplete-w96.png';
        } else {
            $iconfile = 'gfx/icons/book-na-w96.png';
        }
        push @menuItems, { 
            url => 'vaerktoc.pl?fhandle='.$fhandle."&vhandle=".$work->vhandle, 
    	    title => $work->title, 
    	    status => 1,
    	    unclickable => !$work->hasContent,
            desc => $work->parenthesizedYear,
            icon => $iconfile
        }
    }    
    $page->addFrontMenu(@menuItems);
} else {
    my $name = $poet->name;
    my $HTML = '<IMG SRC="gfx/excl.gif">'._("Der findes endnu ingen af %ss værker i Kalliope",${name});
    $page->addBox(coloumn => 0,
                  content => $HTML);
}

$page->print;
