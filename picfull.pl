#!/usr/bin/perl

use CGI ();
use URI::Escape();
use strict;

my $imgfile = URI::Escape::uri_escape(CGI::param('imgfile'));
my $x = CGI::param('x');
my $y = CGI::param('y');

print "Content-type: text/html\n\n";
print <<"EOF";
<HTML>
<FRAMESET ROWS="20,*" BORDER=0>
   <FRAME FRAMEBORDER=0 MARGINWIDTH=0 MARGINHEIGHT=0 NORESIZE SCROLLING="no" SRC="picfullbar.cgi?imgfile=$imgfile&x=$x&y=$y">
   <FRAME FRAMEBORDER=0 MARGINWIDTH=0 MARGINHEIGHT=0 SCROLLING="auto" NAME="picframe">
</HTML>
EOF
print '<HTML><HEAD><TITLE>Billede</TITLE></HEAD>';
print '<BODY leftmargin=0 topmargin=0 marginheight=0 marginwidth=0 BGCOLOR="#ffffff">';
print "<IMG SRC=\"$imgfile\">";
print '</BODY></HTML>';
