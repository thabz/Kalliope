#!/usr/bin/perl

#  Udskriver alle titel-linier for en forfatter.
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

do 'fstdhead.pl';
do 'dk_sort.pl';

@ARGV = split(/\?/,$ARGV[0]);

$fhandle = $ARGV[0];
$mode = $ARGV[1];
$LA = $ARGV[2];

chop($fhandle);
chop($mode);
chomp($LA);
fheaderHTML($fhandle);

do 'fstdhead.ovs';

print "<BR>\n";


$sth = $dbh->prepare("SELECT longdid, digte.titel, digte.foerstelinie FROM digte, vaerker WHERE digte.fid=? AND digte.vid = vaerker.vid AND digte.layouttype = 'digt' AND afsnit=0");
$sth->execute($fid);
$i=0;
while ($f[$i] = $sth->fetchrow_hashref) { 
    if ($mode == 1) {
	$f[$i]->{'sort'} = $f[$i]->{'titel'};
    } else {
	$f[$i]->{'sort'} = $f[$i]->{'foerstelinie'};
    }
    $i++; 
}

my $last="";
my $body;
my $antal = 0;
my @blocks = ();
foreach $f (sort dk_sort2 @f) {
    next unless $f->{'sort'};
    $line =  $mode == 1 ? $f->{'titel'} : $f->{'foerstelinie'};
    $linefix = $line;
    $linefix =~ s/^Aa/Å/ig;
    $idx = (ord lc substr($linefix,0,1)) - ord('a');
    $blocks[$idx]->{'head'} = '<DIV CLASS=listeoverskrifter>'.uc (chr $idx + ord('a')).'</DIV><BR>';
    $blocks[$idx]->{'count'}++;
    $blocks[$idx]->{'body'} .= '<A HREF="digt.pl?longdid='.$f->{'longdid'}.'">'.$line.'</A><BR>';
}
#
# Udskriv boks
#

if ($mode == 1) {
    beginwhitebox("Digttitler","","left");
} else {
    beginwhitebox("Førstelinier","","left");
}
Kalliope::doublecolumn(\@blocks);
endbox();

ffooterHTML();
