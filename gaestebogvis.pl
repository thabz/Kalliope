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

do 'kstdhead.pl';

@ARGV = split (/\?/,$ARGV[0]);
chomp $ARGV[0];
$LA = $ARGV[0];

&kheaderHTML("Kalliope - Gæstebog",$LA);
&kcenterpageheader("Gæstebog");


print "<BR>";

beginwhitebox("","","");
print "<CENTER><A HREF=\"gaestebogedit.pl?$LA\">";
print "<IMG WIDTH=48 HEIGHT=48 ALT=\"Bidrag til galskaben\" BORDER=0 SRC=\"gfx/clip.gif\"><BR>";
print "Skriv i gæstebogen.";
print "<A/></CENTER>";
endbox();
print '<BR><BR>';


$gdir = "../gaestebog";
opendir (DIR,$gdir);
#Følgende grep skal bare udvides hvis du vil vælge f.eks. en måneds entries ud.
@files = reverse sort grep {-f "$gdir/$_"} readdir(DIR);
closedir (DIR);

foreach (@files ) {
    open (FILE,"$gdir/$_");
    foreach (<FILE>) {
	chop;
	if (/^\*\*D:/) {
	    s/^\*\*D://;
	    $time=$_;
	}
	if (/^\*\*N:/) {
	    s/^\*\*N://;
	    $navn=$_;
	}
	if (/^\*\*E:/) {
	    s/^\*\*E://;
	    $email=$_;
	}
	if (/^\*\*W:/) {
	    s/^\*\*W://;
	    $web=$_;
	}
	if (/^\*\*T:/) {
	    s/^\*\*T://;
	    $text=$_;
	}

    }
    close (FILE);

    print '<table align=center border=0 cellpadding=0 cellspacing=0 width="75%"><tr><td bgcolor="#000000">';
    print '<TABLE align=center cellspacing=1 cellpadding=5 BORDER=0 WIDTH="100%"><TR width="100%">';
    print '<TD BGCOLOR=#7394ad BACKGROUND="gfx/pap.gif">';
    print "<TABLE width=\"100%\" cellpadding=0 border=0><TR><TD>";
    print "<B>";
    if ($email) {
	print qq(<A target="_top" HREF="mailto:$email">$navn</A>);
    } else {
	print $navn;
    }
    print "</B>";
    if (($web ne '') && !($web =~ /http\:\/\/$/)) {
	print qq(<BR><A TARGET="_top" HREF="$web">$web</A>);
    };

    print "</TD>";
    print "<TD ALIGN=right>";
    ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($time);
    @months = ("jan","feb","mar","apr","maj","jun",
	       "jul","aug","sep","okt","nov","dec");
    $year+=1900;
    if ($min<10) { $min = "0".$min; };
    if ($hour<10) { $hour = "0".$hour; };

    print "$mday. $months[$mon] $year $hour:$min";

    print "</TD></TR></TABLE>";

    print "</TD></TR>";

#    print "<TABLE align=center cellspacing=0 cellpadding=15 border=0 bgcolor=ffffff BORDER=5 WIDTH=\"100%\"><TR width=\"100%\" >\n";
    print '<TR  ><TD BGCOLOR=#eoeoeo BACKGROUND="gfx/lightpap.gif">';
    
    print $text;
    
    print "</TD></TR></TABLE>";
    print "</td></tr></table>";
    print "<BR>";
}

beginwhitebox("","","");
print "<CENTER><A HREF=\"gaestebogedit.pl?$LA\">";
print "<IMG WIDTH=48 HEIGHT=48 ALT=\"Bidrag til galskaben\" BORDER=0 SRC=\"gfx/clip.gif\"><BR>";
print "Skriv i gæstebogen.";
print "<A/></CENTER>";
endbox();


do 'aboutrightmenu.pl';

&kfooterHTML;

