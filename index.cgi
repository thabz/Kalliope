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

use strict;
use CGI qw(:standard);
use Kalliope::Server;

Kalliope::Server::newHit;

my $innerframe = url_param('innerframe') || 'kfront.pl?dk';

print "Content-type: text/html\n\n";
print <<"EOF";
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Frameset//EN" "http://www.w3.org/TR/REC-html40/frameset.dtd">
<HTML>
<HEAD>
<TITLE>Kalliope</TITLE>
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
</HEAD>
<SCRIPT LANGUAGE="Javascript">
<!--
   IamOK = 1;
   if (top.location != location) top.location.href = location.href;
//-->
</SCRIPT>
<FRAMESET ROWS="100,*" BORDER=0 >
   <FRAME FRAMEBORDER=0 MARGINWIDTH=0 MARGINHEIGHT=0 NORESIZE SCROLLING="no" SRC="topframe.cgi?type=forside&sprog=dk" NAME="topframe">
   <FRAMESET COLS="100,*" BORDER=0>
      <FRAME FRAMEBORDER=0 MARGINWIDTH=0 MARGINHEIGHT=0 NORESIZE SCROLLING="no" SRC="leftframe.html" NAME="leftframe">
      <FRAME FRAMEBORDER=0 MARGINWIDTH=0 MARGINHEIGHT=0 NORESIZE SCROLLING="auto" SRC="$innerframe" NAME="mainframe">
   </FRAMESET>
</FRAMESET>

</HTML>

EOF
