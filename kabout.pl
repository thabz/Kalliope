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

use CGI qw /:standard/;
$mycgi = new CGI;
#Udskriver about.html filen

do 'kstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);
chop($ARGV[0]);
chomp($ARGV[1]);
$abouttext = $ARGV[0]; 
$LA = $ARGV[1];

#$0 =~ /\/([^\/]*)$/;
#$wheretolinklanguage = $1.'?'.$abouttext;

#$wheretolinklanguage

&kheaderHTML("Kalliope - Om",$LA);

&kcenterpageheader("Om Kalliope");

beginwhitebox("","75%","left");

if ($abouttext =~ /\.\./ || !(-e "data.dk/$abouttext")) {
    print "Du som sidder ved ".$mycgi->remote_host()."... sådan leger vi ikke her! Men absolut et værdigt forsøg... :-)";
} else {
    open(FILE,"data.dk/$abouttext");
    foreach  (<FILE>) {
	print $_;
    }
}
endbox();

# Næste kolonne
do 'aboutrightmenu.pl';

&kfooterHTML;



