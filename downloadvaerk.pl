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

use Kalliope::DB;
use CGI qw(:standard);

my $dbh = Kalliope::DB->connect;

$fhandle = url_param('fhandle');
$vhandle = url_param('vhandle');
$outputtype = url_param('mode');

($vtitel,$vaar,$vhandle,$fid,$vid,$vnoter) = $dbh->selectrow_array("SELECT titel,aar,vhandle,fid,vid,noter,type FROM vaerker WHERE vhandle = '$vhandle' AND fhandle = '$fhandle'");

($ffornavn,$fefternavn,$ffoedt,$fdoed) = $dbh->selectrow_array("SELECT fornavn,efternavn,foedt,doed FROM fnavne WHERE fhandle = '$fhandle'");

$sth = $dbh->prepare("SELECT longdid,titel,underoverskrift,indhold,noter,afsnit FROM digte WHERE vid=? AND fid=?");
$sth->execute($vid,$fid);

if ($outputtype eq 'XML') {
    print "Content-type: text/xml\n\n";
    print <<'EOS';
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE kalliopework [
   <!ELEMENT kalliopework (head, content)>
   <!ELEMENT head (title, date, author, notes)>
   <!ELEMENT content (section|poem)*>
   <!ELEMENT poem (title, subtitle?, notes*, lines)>
   <!ELEMENT title (#PCDATA)>
   <!ELEMENT date (#PCDATA)>
   <!ELEMENT author (#PCDATA)>
   <!ELEMENT notes (#PCDATA)>
   <!ELEMENT subtitle (#PCDATA)>
   <!ELEMENT lines (#PCDATA)>
   <!ATTLIST lines xml:space (default|preserve) 'preserve'>
   <!ELEMENT section (#PCDATA)> 
]>
EOS
    print "<KALLIOPEWORK>";
    print "<HEAD>";
    print "<TITLE>".$vtitel."</TITLE>\n";
    print "   <DATE>".$vaar."</DATE>\n";
    print "   <AUTHOR ID=\"".$fhandle."\">".$fefternavn.", ".$ffornavn."</AUTHOR>\n";
    print "   <NOTES>".$vnoter."</NOTES>\n";
    print "</HEAD>\n";
    print "<CONTENT>\n";
    while($d = $sth->fetchrow_hashref) {
	if ($d->{afsnit}) {
	    print "<SECTION>".$d->{titel}."</SECTION>\n";
	} else {
	    $d->{indhold} =~ s/\n+$/\n/;
	    print '<POEM ID="'.$d->{longdid}."\">\n";
	    print "   <TITLE>".$d->{titel}."</TITLE>\n";
	    print "   <SUBTITLE>".$d->{underoverskrift}."</SUBTITLE>\n" if $d->{underoverskrift};
	    print "   <NOTES>".$d->{noter}."</NOTES>\n" if $d->{noter};
	    print "   <LINES>".$d->{indhold}."</LINES>\n";
	    print "</POEM>\n\n";
	}
    }
    print "</CONTENT></KALLIOPEWORK>";
} elsif ($outputtype eq 'TXT') {
    print "Her kommer tekst versionen";
} elsif ($outputtype eq 'Printer') {
    print "Content-type: text/html\n\n";
    print "<HTML><HEAD><TITLE>$vtitel</TITLE></HEAD>\n";
    print "<BODY BGCOLOR=white>\n";
    print "<H1>$ffornavn $fefternavn: <I>$vtitel</I>";
    print " ($vaar)" if ($vaar ne '?');
    print '</H1>';
    print "<BR>\n";
    while($d = $sth->fetchrow_hashref) {
	if ($d->{afsnit}) {
	    print "\n<H2>".$d->{titel}."</H2>\n";
	} else {
	    $d->{indhold} =~ s/\n+$/\n/;
	    if ($d->{type} ne 'p') {
		$d->{indhold} =~ s/ /&nbsp;/g;
	    }

	    print "\n<H3>".$d->{titel}."</H3>\n";
	    $d->{'underoverskrift'} =~ s/\n/<BR>/g;
	    print "\n<FONT SIZE=-1>".$d->{underoverskrift}."</FONT><BR><BR><BR>\n" if $d->{underoverskrift};
	    $d->{'indhold'} =~ s/(\n)/<BR>$1/g;
	    print $d->{indhold};
	    print "<BR><BR><BR>\n";
	}
    }
    print "\n\n</BODY></HTML>";
} elsif ($outputtype eq 'PRC') {
    # PalmOS doc format
    print "Content-type: text/plain\n\n";
    print '<HEADER FONT=1 ALIGN="CENTER" TEXT="'.$ffornavn.' '.$fefternavn.'">'."\n";
    print '<HEADER FONT=2 ALIGN="CENTER" TEXT="'.$vtitel;
    print " ($vaar)" if ($vaar ne '?');
    print '">'."\n";
    print "<HRULE>\n";
    while($d = $sth->fetchrow_hashref) {
	if ($d->{afsnit}) {
	    print '<HEADER FONT=1 TEXT="'.$d->{titel}.'">'."\n";
	} else {
	    $d->{indhold} =~ s/\n+$/\n/;
	    $d->{indhold} =~ s/<[^>]+>//g;
	    print '<HEADER FONT=1 TEXT="'.$d->{titel}.'">'."\n";
	    print $d->{'underoverskrift'}."\n";
	    print $d->{indhold};
	    print "\n\n<HRULE>\n";
	}
    }
}

