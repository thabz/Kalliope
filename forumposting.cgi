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
use Kalliope::Forum::Post;
use CGI qw(:standard);
use strict;

my $page = new Kalliope::Page::Popup;

my $id = url_param('id');

unless ($id) {
    $page->print;
    exit;
}

my $post = Kalliope::Forum::Post::newFromId ($id);

#
# Draw forum
#

my $HTML = '<TABLE WIDTH="100%">';
$HTML .= '<TR><TH CLASS="forumheads" ALIGN="right">Fra:</TH><TD CLASS="forumheads" WIDTH="100%">'.$post->from.'</TD></TR>';
$HTML .= '<TR><TH  CLASS="forumheads" ALIGN="right">Emne:</TH><TD  CLASS="forumheads"WIDTH="100%">'.$post->subject.'</TD></TR>';
$HTML .= '<TR><TH  CLASS="forumheads" ALIGN="right">Dato:</TH><TD  CLASS="forumheads"WIDHT="100%">'.$post->dateForDisplay.'</TD></TR>';
$HTML .= '</TABLE>';

$page->addBox (width => '100%',
               theme => 'dark',
               content => $HTML);

$HTML = $post->content;
$HTML .= qq|<HR><A HREF="javascript:{}" onClick="return parent.composer('reply',$id)">Svar på dette indlæg</A>|;
$HTML .= qq|<SCRIPT>parent.markSelection($id)</SCRIPT>|;

$page->addBox (width => '100%',
               content => $HTML);

$page->print;


