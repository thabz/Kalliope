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
push @crumbs,['Værker',''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
                    crumbs => \@crumbs, 
		    subtitle => 'Værker',
		    page => $mode eq 'prosa' ? 'prosa' : 'vaerker' );
my $HTML;

my @works = $mode eq 'poetical' ? $poet->poeticalWorks : $poet->proseWorks;
#@works = $poet->allWorks;

if ($#works >= 0) {
    my $nr;
    my $splitpos = ($#works+1 > 6) ? int(($#works+1) / 2 + 0.5 ) : 0;
    $HTML .= '<TABLE HEIGHT="100%" CELLPADDING=0 CELLSPACING=10><TR><TD WIDTH="50%" VALIGN=top>';
    $HTML .= '<TABLE>';
    foreach my $work (@works) {
	    $HTML .= '<TR><TD>';
	    if ($work->hasContent) {
	        my $iconfile = $work->status eq 'complete' ? 'icons/book-h48.gif' : 'icons/incomplete-h48.gif';
	        $HTML .= '<A HREF="vaerktoc.pl?fhandle='.$fhandle."&vhandle=".$work->vhandle.'">';
	        $HTML .= qq|<IMG HEIGHT=48 ALT="" BORDER=0 
	    	        SRC="gfx/$iconfile" VALIGN="middle"></A>
	    	        </TD><TD>|;
	        $HTML .= '<A HREF="vaerktoc.pl?fhandle='.$fhandle."&vhandle=".$work->vhandle.'"><FONT COLOR="black">';
	    } else {
	        my $iconfilena =  'icons/book-na-h48.gif';
	        $HTML .= qq|<IMG HEIGHT=48 ALT="" BORDER=0  
	    	SRC="gfx/$iconfilena" VALIGN="center">
	    	</TD><TD><FONT COLOR="#808080">|;
	    }
	    $HTML .= '<I>'.$work->title.'</I> '.$work->parenthesizedYear.'</FONT>';
	    $HTML .= '</A>' if $work->hasContent;
	    $HTML .= '</TD></TR>';
	    if (++$nr == $splitpos) {
	        $HTML .= '</TABLE></TD><TD BGCOLOR=black><IMG WIDTH=1 HEIGHT=1 SRC="gfx/trans1x1.gif" ALT="">';
	        $HTML .= '</TD><TD WIDTH="50%" VALIGN=top><TABLE>' ;
	    }
    }
    $HTML .= "</TABLE>";   
    $HTML .= '</TD></TR></TABLE>';
} else {
    my $name = $poet->name;
    $HTML .= qq|<IMG SRC="gfx/excl.gif">Der findes endnu ingen af ${name}s værker i Kalliope|;
}

$page->addBox(width => '75%',
              coloumn => 1,
              content => $HTML);

#if ($poet->yearDead>1932) {
if (0) {
    my $name = $poet->name;
    $page->addBox( title => 'Bemærk',
                   width => '200',
                   coloumn => 2,
	           content => qq|<IMG ALIGN="left" SRC="gfx/excl.gif">Ifølge reglerne om ophavsret, må ${name}s værker ikke kunne blive tilføjet Kalliope før 70 år efter digterens død.|);
}

$page->print;

