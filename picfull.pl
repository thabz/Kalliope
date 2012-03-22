#!/usr/bin/perl

use CGI ();
use URI::Escape();
use strict;
use utf8;

my $imgfile = URI::Escape::uri_escape_utf8(CGI::param('imgfile'));
my $x = CGI::param('x');
my $y = CGI::param('y');

print "Content-type: text/html\n\n";
print <<"EOF";
<HTML>
<FRAMESET ROWS="20,*" BORDER=0>
   <FRAME FRAMEBORDER=0 MARGINWIDTH=0 MARGINHEIGHT=0 NORESIZE BORDER=0 SCROLLING="no" SRC="picfullbar.cgi?imgfile=$imgfile&x=$x&y=$y">
   <FRAME FRAMEBORDER=0 MARGINWIDTH=0 MARGINHEIGHT=0 NORESIZE BORDER=0 NAME="picframe" SRC="empty.html">
</FRAMESET>
</HTML>
EOF
