#!/usr/bin/perl -w

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
