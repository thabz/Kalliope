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
use Kalliope::Page::Popup;
use Kalliope::Forum;
use Kalliope::Tree();
use CGI qw(:standard);
use strict;

my $page = new Kalliope::Page::Popup;

#
# Draw forum
#

#my $HTML = '<TABLE WIDTH="100%">';
#$HTML .= '<TR><TH STYLE="border-bottom: 1px solid black" CLASS="forumheads" ALIGN="left">Fra</TH><TH STYLE="border-bottom: 1px solid black" CLASS="forumheads" ALIGN="left">Emne</TH><TH STYLE="border-bottom: 1px solid black" CLASS="forumheads" ALIGN="left">Dato</TH><TR>';
my @thread_ids = Kalliope::Forum::getLatestThreadIds(begin => 0, count => 20);
my $tree = new Kalliope::Tree('tree','gfx/tree',3,('Emne',("&nbsp;"x5).'Fra','Dato'));
my %translate;
$translate{0} = 0;

foreach my $thread_id (@thread_ids) {
    my @posts = Kalliope::Forum::getPostsInThread($thread_id);
    foreach my $post (@posts) {
	my $rid = "row".$post->id;
	my $from = ("&nbsp;"x5).qq|<SPAN CLASS="unsel" ID="${rid}a">&nbsp;|.$post->from.'&nbsp;</SPAN>';
	my $date = qq|<SPAN CLASS="unsel" ID="${rid}b">&nbsp;|.$post->dateForDisplay.'&nbsp;</SPAN>';
        my $subj = qq|<A ID="${rid}c" CLASS="unsel" HREF="javascript:{}" onClick="return parent.gotoPosting(|.$post->id.');">&nbsp;'.$post->subject.qq|&nbsp;</A>|;
        $translate{$post->id} = $tree->addNode($translate{$post->parent},1,($subj,$from,$date));
    }
}
my $HTML = $tree->getSimpleHTML().$tree->getJavaScript();
#$HTML .= '</TABLE>';
$HTML .= '<HR>';
#$HTML .= qq|<A HREF="javascript:{}" onClick="parent.composer('new',0)">Skriv nyt indlæg</A>|;
$HTML .= qq|<INPUT onClick="parent.composer('new',0);" TITLE="" CLASS="button" TYPE="submit" VALUE=" Nyt indlæg ">|;
#
# Output HTML
#

$page->addBox (width => '100%',
               content => $HTML);
$page->print;


