#!/usr/bin/perl

#  Udskriver alle titel-linier for en forfatter (specielt format til
#  Merete fra 'Grundtvig på Nettet')
#
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

do 'dk_sort.pl';

my $dbh = Kalliope::DB->connect;
$sth = $dbh->prepare("SELECT longdid, digte.titel FROM digte, vaerker, fnavne WHERE digte.fid=fnavne.fid AND fnavne.fhandle = 'grundtvig' AND digte.vid = vaerker.vid AND vaerker.type = 'v' AND afsnit=0");
$sth->execute();
$i=0;
while ($f[$i] = $sth->fetchrow_hashref) { 
    $f[$i]->{'sort'} = $f[$i]->{'titel'};
    $i++; 
}

my $last="";
my $body;
my $antal = 0;
my @blocks = ();
foreach $f (sort dk_sort2 @f) {
    next unless $f->{'sort'};
    $line =  $f->{'titel'};
    $linefix = $line;
    $linefix =~ s/^Aa/Å/ig;
    $idx = (ord lc substr($linefix,0,1)) - ord('A');
    $blocks[$idx]->{'head'} = uc (chr $idx + ord('A'));
    $blocks[$idx]->{'sort'} = $blocks[$idx]->{'head'};
    $blocks[$idx]->{'count'}++;
    $blocks[$idx]->{'body'} .= qq|<A HREF="http://www.kalliope.org/digt.pl?longdid=|.$f->{'longdid'}.'">'.$line."</A><BR>\n";
}

my $HTML;
foreach $block (sort dk_sort2 grep {$_} @blocks) {
   $HTML .= '<H2>'.$block->{'head'}."</H2>\n";
   $HTML .= $block->{'body'};
}

print "Content-type: text/html\n\n";
print <<"EOF";
<HTML><HEAD><TITLE>Meretes oversigt på Kalliope</TITLE></HEAD>
<BODY>
<H1>Samtlige Grundtvig digte på Kalliope<H1>
$HTML
</BODY>
EOF
