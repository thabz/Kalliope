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
use CGI qw(:standard);
use strict;

my $page = new Kalliope::Page (
		title => 'Forum',
		thumb => 'gfx/evolution-192.png',
                pagegroup => 'forum');


#
# Draw forum
#

my $HTML = '<TABLE WIDTH="100%" HEIGHT="100%">';
$HTML .= '<TR><TD WIDTH="60%">';
$HTML .= '<IFRAME STYLE="width: 100%; height: 500px; border: 0px" NAME="headers" SRC="forumheaders.cgi" FRAMEBORDER=0 SCROLLING="no"></IFRAME>';
$HTML .= '</TD><TD WIDTH="40%">';
$HTML .= '<IFRAME STYLE="width: 100%; height: 500px; border: 0px" ID="postingframe" NAME="posting" SRC="forumposting.cgi" FRAMEBORDER=0 SCROLLING="no"></IFRAME>';
$HTML .= '</TD></TR></TABLE>';

$HTML .= <<"EOF";
<SCRIPT LANGUAGE="JavaScript1.3">
function gotoPosting(postingid) {
    document.getElementById('postingframe').src = 'forumposting.cgi?id='+postingid;
    return false;
}

function composer(mode,id) {
    window.open('forumcompose.cgi?mode='+mode+'&parentid='+id,'compose','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizeable=no,width=400,height=500'); 
    return false;
}

function resetHeaders() {
    headers.location = 'forumheaders.cgi';
    return false;
}

var oldSelection = 0;

function markSelection(id) {
    if (oldSelection) {
        headers.document.getElementById('row'+oldSelection+'a').className = 'unsel';
        headers.document.getElementById('row'+oldSelection+'b').className = 'unsel';
        headers.document.getElementById('row'+oldSelection+'c').className = 'unsel';
        headers.document.getElementById('row'+oldSelection+'d').className = 'unsel';

    }
    headers.document.getElementById('row'+id+'a').className = 'sel';
    headers.document.getElementById('row'+id+'b').className = 'sel';
    headers.document.getElementById('row'+id+'c').className = 'sel';
    headers.document.getElementById('row'+id+'d').className = 'sel';
    oldSelection = id;
}
</SCRIPT>


EOF

#
# Output HTML
#

$page->addHTML($HTML);
$page->print;

