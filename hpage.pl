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
use CGI qw /:standard/;
$mycgi = new CGI;
#
do 'kstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

$LA = $ARGV[1];
chomp($LA);
unless ($LA eq "") {
    chop $ARGV[0];
} else {
    $LA = "dk";
};


if ($ARGV[0] =~ /\.\./ || !(-e "hist.$LA/".$ARGV[0].".txt")) {
    $text[0] = "Du som sidder ved ".$mycgi->remote_host()."... sådan leger vi ikke her! Men absolut et værdigt forsøg... :-)";
} else {
    open(FILE,"hist.$LA/".$ARGV[0].".txt");
    foreach (<FILE>) {
	if (/^T:/) {
	    $titel = $_;
	    $titel =~ s/^T://;
	    next;
	}
	if (/^P:/) {
	    chop;
	    s/^P://;
	    $pic = $_;
	    push @pictures,$pic;
	    open (FILE2,"gfx/hist/".$pic.".txt");
	    foreach (<FILE2>) {
		$caption{$pic}.=$_;
	    }
	    close(FILE2);
	    next;
	}
	push @text,$_;
    }
    close(FILE);
}
&kheaderHTML($titel,$LA);

print "<TABLE><TR><TD VALIGN=top>";

#Indled kasse til selve teksten
beginwhitebox("","100%","justify");

#Udskriv filen
print "<P CLASS=hist ALIGN=\"justify\">";
foreach (@text) {
    s/<A/<A CLASS=green/g;
    s/<P/<P CLASS=hist/g;
    print $_."\n";
}
print "</P>\n";
print "</TD></TR></TABLE>";
print "</td></tr></table>";


print "</TD><TD VALIGN=top ALIGN=center>";

if (@pictures) {

    #Indled kasse billeder
    beginwhitebox("Billeder",150,"center");

    foreach $file (@pictures) {
	print Kalliope::insertthumb('gfx/hist/_'.$file.'.jpg',"gfx/hist/$file.jpg");
	print '<BR><FONT SIZE=2>';
	
	print $caption{$file};
	print "</FONT><BR><BR>";
    }
    endbox();
}

print "</TD></TR></TABLE>";

kfooterHTML();
