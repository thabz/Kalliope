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
use Kalliope::Page;
use Kalliope::Forum;
use Kalliope::Tree;
use CGI qw(:standard);
use strict;

my @crumbs;
push @crumbs,['Forum','forumindex.cgi'];

my $page = new Kalliope::Page (
		title => 'Forum',
		thumb => 'gfx/icons/forum-h70.gif',
		page => 'forumindex',
		crumbs => \@crumbs,
                pagegroup => 'forum');

#
# Draw forum index
#

my $HTML;
$HTML .= '<TABLE>';

for (my $i = 0; $i < Kalliope::Forum::getNumberOfForas; ++$i) {
    my $forum = new Kalliope::Forum($i);
    $HTML .= '<TR><TD ROWSPAN=2 VALIGN="top"><IMG ALT="" SRC="'.$forum->getSmallIcon.'" WIDTH=48></TD>';
    $HTML .= '<TD CLASS="ffronttitle"><A HREF="'.$forum->getHeadersURL.'">'.$forum->getTitle.'</A></TD><TR>';
    my $latestHTML = '';
    if (my $latestPost = $forum->getLatestPost) {
	$latestHTML = 'Nyeste indlæg er skrevet '.$latestPost->dateForDisplay.' af '.$latestPost->from.'.';

    } else {
        $latestHTML = 'Ingen indlæg er endnu skrevet.';
    }
    $HTML .= '<TD CLASS="ffrontdesc">'.$forum->getDescription."<BR>$latestHTML</TD></TR>";
}
$HTML .= '</TABLE>';

$page->addBox(width => '50%',
              content => $HTML);

$page->print;

