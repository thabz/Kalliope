#!/usr/bin/perl
use CGI qw /:standard/;

$imgfile = url_param('imgfile');

print "Content-type: text/html\n\n";
print '<HTML><HEAD><TITLE>Billede</TITLE></HEAD>';
print '<BODY leftmargin=0 topmargin=0 marginheight=0 marginwidth=0 BGCOLOR="#ffffff">';
print "<IMG SRC=\"$imgfile\">";
print '</BODY></HTML>';
