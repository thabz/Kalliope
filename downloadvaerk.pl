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

use Kalliope;
use Kalliope::DB;
use CGI qw(:standard);
use Kalliope::Poem ();
use utf8;
binmode STDOUT => ":utf8";

my $dbh = Kalliope::DB->connect;

$fhandle = url_param('fhandle');
$vhandle = url_param('vhandle');
$outputtype = url_param('mode');

if ($outputtype eq 'XML') {
    print "Content-type: text/xml\n\n";
    open (FILE,"fdirs/$fhandle/$vhandle.xml");
    binmode FILE => ":utf8";
    while (<FILE>) {
	if (/^<!DOCTYPE kalliopework/) { 
	    s!../../data!data!;
	}
	print $_;
    }
    close (FILE);
} elsif ($outputtype eq 'TXT') {
    print "Her kommer tekst versionen";
} elsif ($outputtype eq 'Printer') {
    ($vtitel,$vsubtitle,$vaar,$vhandle,$vid) = $dbh->selectrow_array("SELECT titel,underoverskrift,aar,vhandle,vid,type FROM vaerker WHERE vhandle = '$vhandle' AND fhandle = '$fhandle'");

    ($ffornavn,$fefternavn,$ffoedt,$fdoed) = $dbh->selectrow_array("SELECT fornavn,efternavn,foedt,doed FROM fnavne WHERE fhandle = '$fhandle'");

    $sth = $dbh->prepare("SELECT longdid,toptitel,foerstelinie,underoverskrift,indhold FROM digte WHERE vid=? AND fhandle=? ORDER BY vaerkpos");
    $sth->execute($vid,$fhandle);
    print "Content-type: text/html; charset=UTF-8\n\n";
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
	    my $poem = new Kalliope::Poem (longdid => $d->{'longdid'});
	    print "\n<H3>".$poem->topTitle."</H3>\n";
	    $d->{'underoverskrift'} =~ s/\n/<BR>/g;
	    print "\n<FONT SIZE=-1>".$poem->subtitle."</FONT><BR><BR><BR>\n" if $poem->subtitle;
	    print $poem->content;
	    print "<BR><BR><BR>\n";
	}
    }
    print "\n\n</BODY></HTML>";
} elsif ($outputtype eq 'PRC') {
    # PalmOS doc format
    my $HTML;
    $HEAD.= "Content-type: text/plain; charset=UTF-8\n\n";
    $HEAD .= '<HEADER FONT=2 ALIGN="CENTER" TEXT="'.$vtitel;
    $HEAD .= " ($vaar)" if ($vaar ne '?');
    $HEAD .= '">'."\n";
    $HEAD .= '<HEADER FONT=1 ALIGN="CENTER" TEXT="'.$ffornavn.' '.$fefternavn.'">'."\n";
    my $TOC = qq|<HEADER FONT=1 TEXT="Indholdsfortegnelse">\n|;
    while($d = $sth->fetchrow_hashref) {
	if ($d->{afsnit}) {
	    $HTML .= '<HEADER FONT=1 TEXT="'.$d->{titel}.'">'."\n";
	    $TOC .= '<B>'.$d->{'titel'}."</B>\n";
	} else {
	    $d->{indhold} =~ s/\n+$/\n/;
	    $d->{indhold} =~ s/<[^>]+>//g;
	    $HTML .= qq|<LABEL NAME="$$d{longdid}">|;
	    $HTML .= '<HEADER FONT=1 TEXT="'.$d->{titel}.'">'."\n";
	    $HTML .= $d->{'underoverskrift'}."\n";
	    $HTML .= $d->{indhold};
	    $HTML .= "\n\n<HRULE>\n";
	    $TOC .= qq|  <LINK TEXT="$$d{titel}" X=10 TAG="$$d{longdid}" DIR="FORWARD" STYLE="BARE">\n|;
	}
    }
    print $HEAD."<HRULE>\n\n".$TOC."<HRULE>\n\n".$HTML;
}

