#!/usr/bin/perl

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

package Web;
use DBI;
use URI::Escape;
use Exporter ();
use Kalliope::DB ();

@ISA = qw(Exporter);
@EXPORT = qw(kheaderHTML kfooterHTML beginwhitebox beginnotebox begindarkbluebox enddarkbluebox endbox $dbh);

$dbh = Kalliope::DB::connect;

sub kheaderHTML {
    $ENV{REQUEST_URI} =~ /([^\/]*)$/;
    $request_uri = $1;

#unless (defined($wheretolinklanguage)) {
#    $0 =~ /\/([^\/]*)$/;
#    $wheretolinklanguage = 'none';
#}

$kpagetitel=$_[0];
$LA = ( $_[1] || 'dk') unless (defined($LA));
$wheretolinklanguage = $_[2] || 'none';

#do 'kstdhead.ovs';

$0 =~ /([^\/]*)$/;
$file = $1;

if ($file eq 'forfatter') {
   $urlparams = 'sprog='.$LA.'&type=forfatter&fhandle='.$fhandle;
} elsif ($file eq 'hpage.pl') {
    chop $titel;
    $urlparams = 'sprog='.$LA.'&type=hpage&titel='.uri_escape($titel);
} elsif ($file eq 'keyword.cgi') {
    $urlparams = 'sprog='.$LA.'&type=hpage&titel='.uri_escape('Nøgleord');
} elsif ($file eq 'kvaerker.pl') {
    $urlparams = 'sprog='.$LA.'&type=kvaerker';
} elsif ($file eq 'flistaz.pl' || $file eq 'flist19.pl' || $file eq 'flistpics.pl' || $file eq 'flistpop.pl' || $file eq 'flistflittige.pl') {
    $urlparams = 'sprog='.$LA.'&type=flist';
}  elsif ($file eq 'klines.pl') {
    $urlparams = 'sprog='.$LA.'&type=lines';
} elsif ($file eq 'ksearchform.pl' || $file eq 'ksearchresult.pl') {
    $urlparams = 'sprog='.$LA.'&type=search';
} elsif ($file eq 'kstats.pl') {
    $urlparams = 'sprog='.$LA.'&type=stats';
} elsif ($file eq 'kfront.pl' || $file eq 'kabout.pl' || $file eq
'gaestebogvis.pl' || $file eq 'gaestebogedit.pl' || $file eq
'gaestebogsubmit.pl' || $file eq 'kdagenidag.pl') {
    $urlparams = 'sprog='.$LA.'&type=forside';
} elsif ($file eq 'kabout.pl') {
    $urlparams = 'sprog='.$LA.'&type=om';
} else {
    $urlparams = 'sprog='.$LA.'&type=normal&titel='.uri_escape($_[0]);
}

print "Content-type: text/html\n\n";
print '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">';
print "<HTML><HEAD><TITLE>$kpagetitel</TITLE>";
print '<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">';
print '<META name="description" content="Stort arkiv for ældre digtning">';
print '<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">';
#print $ekstrametakeywords;
print "</HEAD>\n";
print '<BODY LINK="#000000" VLINK="#000000" ALINK="#000000">';
print <<"EOJ";
<SCRIPT LANGUAGE="Javascript">
  if (!top.IamOK) {
     top.location.href = 'index.cgi?innerframe=' + escape ('$request_uri');
  } else {
     if (this.focus) {
        this.focus();
     }
     if (top.leftframe.changesprog) {
     top.leftframe.changesprog("$LA")
     top.leftframe.changelanguageurl("$wheretolinklanguage")
     }
     myRe = /$urlparams\$/;
     if (!myRe.test(top.topframe.location.href))
     top.topframe.location="topframe.cgi?$urlparams";
  }
</SCRIPT>
EOJ

print '<TABLE CELLPADDING=15 CELLSPACING=0 HEIGHT="100%" BORDER=0 WIDTH="100%">';
print "<TR>";
print '<TD WIDTH="100%">';
};



##################################################################################
# ffooterHTML
#
# Udskriv footer HTML for alle Kalliope siderne, ie. ikke forfattersiderne.
##################################################################################
sub kfooterHTML {
	print "</TD></TR></TABLE>";
#	print "<BR><FONT COLOR=#2020d0>Copyright &copy; 1999 <A CLASS=blue HREF=\"mailto:jesper\@kalliope.org\">Jesper Christensen</A></FONT>";
	print "</BODY></HTML>";
};

#######################################
#
# Standard box 
#

sub beginwhitebox {
    my ($title,$width,$align) = @_;
    print '<TABLE WIDTH="'.$width.'" ALIGN="center" BORDER=0 CELLPADDING=1 CELLSPACING=0><TR><TD ALIGN=right>';
    if ($title) {
	print '<DIV STYLE="position: relative; top: 16px; left: -10px;">';
	print '<TABLE BORDER=0 CELLPADDING=1 CELLSPACING=0><TR><TD BGCOLOR=black>';
	print '<TABLE ALIGN=center WIDTH="100%" CELLSPACING=0 CELLPADDING=2 BORDER=0><TR><TD CLASS="boxheaderlayer" BGCOLOR="#7394ad" BACKGROUND="gfx/pap.gif" >';
	print $title;
	print "</TD></TR></TABLE>";
	print "</TD></TR></TABLE>";
	print '</DIV>';
    }
    print '</TD></TR><TR><TD VALIGN=top BGCOLOR=black>';
    print '<TABLE WIDTH="100%" ALIGN=center CELLSPACING=0 CELLPADDING=15 BORDER=0>';
    print '<TR><TD '.($align ? 'ALIGN="'.$align.'"' : '').' BGCOLOR="#e0e0e0" BACKGROUND="gfx/lightpap.gif">';
}

sub beginnotebox {
    my ($title,$width,$align) = @_;
    beginwhitebox('Noter',$width,$align);
    return 1;
}

sub begindarkbluebox {
	print '<TABLE BORDER=0 CELLPADDING=1 CELLSPACING=0><TR><TD BGCOLOR=black>';
	print '<TABLE  ALIGN=center WIDTH="100%" CELLSPACING=0 CELLPADDING=5 BORDER=0><TR><TD CLASS="darkblue">';

}

sub enddarkbluebox {
    &endbox();
}

sub endbox {
    if (defined($_[0])) {
	print "</TD></TR></TABLE>";
	print "</TD></TR><TR><TD>";
	print '<DIV STYLE="position: relative; top: -10px; left: 10px;">';
	print '<TABLE BORDER=0 CELLPADDING=1 CELLSPACING=0><TR><TD BGCOLOR=black>';
	print '<TABLE WIDTH="100%" CELLSPACING=0 CELLPADDING=2 BORDER=0><TR><TD CLASS="boxheaderlayer" BGCOLOR="#7394ad" BACKGROUND="gfx/pap.gif" >';
	print $_[0];
	print "</TD></TR></TABLE>";
	print "</TD></TR></TABLE>";
	print '</DIV>';
	print '</TD></TR></TABLE>';
    } else {
	print "</TD></TR></TABLE>";
	print "</TD></TR></TABLE>";
    }
}

1;
