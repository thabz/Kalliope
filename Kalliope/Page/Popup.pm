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

package Kalliope::Page::Popup;
use Kalliope::Page;
use utf8;
binmode STDOUT => ":utf8";
@ISA = ('Kalliope::Page');

sub addHTML {
   my ($self,$HTML) = @_;
   $self->{'html'} .= $HTML;
}

sub print {
    $self = shift;
    my $titleForWindow = $self->{'title'}." - Kalliope";
    #$self->_printCookies;
    print "Content-type: text/html; charset=UTF-8\n\n";
    print '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">';
    print <<"EOF";
<HTML><HEAD><TITLE>$titleForWindow</TITLE>
<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">
</HEAD>
<BODY LINK="#000000" VLINK="#000000" ALINK="#000000" LEFTMARGIN=0 TOPMARGIN=0 MARGINHEIGHT=0 MARGINWIDTH=0 STYLE="padding:10px">
<DIV CLASS="bodypopup">
<TABLE CELLPADDING=10 WIDTH="100%"><TR><TD>
$$self{html}
</TD></TR></TABLE>
</DIV>
</BODY></HTML>
EOF
}
