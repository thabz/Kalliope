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
use Kalliope::Poem ();

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
   <!ELEMENT lines (line)>
   <!ELEMENT title (#PCDATA)>
   <!ELEMENT date (#PCDATA)>
   <!ELEMENT author (#PCDATA)>
   <!ELEMENT notes (lines)>
   <!ELEMENT subtitle (#PCDATA)>
   <!ELEMENT line (#PCDATA)>
   <!ATTLIST line xml:space (default|preserve) 'preserve'>
   <!ELEMENT section (#PCDATA)> 
]>
EOS
    print "<kalliopework>";
    print "<head>";
    print "<title>".$vtitel."</title>\n";
    print "   <date>".$vaar."</date>\n";
    print "   <author id=\"".$fhandle."\">".$fefternavn.", ".$ffornavn."</author>\n";
    print "   <notes>".$vnoter."</notes>\n";
    print "</head>\n";
    print "<content>\n";
    while($d = $sth->fetchrow_hashref) {
	if ($d->{afsnit}) {
	    print "<section>".$d->{titel}."</section>\n";
	} else {
	    $d->{indhold} =~ s/\n+$/\n/;
	    print '<poem id="'.$d->{longdid}."\">\n";
	    print "   <title>".$d->{titel}."</title>\n";
	    print "   <subtitle>".$d->{underoverskrift}."</subtitle>\n" if $d->{underoverskrift};
	    $d->{noter} =~ s/<BR>/\n/gi;
	    $d->{noter} = join "\n", map {"<line>$_</line>"} split /\n/,$d->{noter};
	    print "   <notes>".$d->{noter}."</notes>\n" if $d->{noter};
	    my @verse = split /\n\n/,$d->{indhold};
	    foreach $verse (@verse) {
	        print "  <verse>\n";
		foreach $line (split /\n/,$verse) {
		    $line =~ /^(\s*)/;
		    my $indent = length $1;
		    print qq|    <line indent="$indent">$line</line>\n|;
		}
		print "  </verse>\n";
	    }
	    print "</poem>\n\n";
	}
    }
    print "</content></kalliopework>";
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
	    my $poem = new Kalliope::Poem (longdid => $d->{'longdid'});
	    print "\n<H3>".$poem->title."</H3>\n";
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
    $HEAD.= "Content-type: text/plain\n\n";
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

