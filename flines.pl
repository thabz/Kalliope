#!/usr/bin/perl -w

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

use Kalliope;
use CGI (':standard');
use Kalliope::Person ();
use Kalliope::Page ();
use Kalliope::Sort ();
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');

unless ($fhandle) {
    my @ARGV = split(/\?/,$ARGV[0]);
    if (!($ARGV[1] eq "")) {
	chop($ARGV[0]);
	chomp($ARGV[1]);
    }
    print "Location: flines.pl?fhandle=".$ARGV[0];
    print "\n\n";
    exit;
}



my $poet = new Kalliope::Person(fhandle => $fhandle);
my $mode = url_param('mode');

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,[$mode ? 'Digttitler' : 'Førstelinier',''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
                              page => $mode ? 'titlelines' : 'firstlines',
                              crumbs => \@crumbs );


#
# Prepare hash of poetical works ------------------------------------------
#

#my %works;
#map {$works{$_->vid} = $_} $poet->poeticalWorks;

my %works = map {$_->vid => $_} $poet->poeticalWorks;

#
# Make blocks -------------------------------------------------------------
#

my @f;
my $sth = $dbh->prepare("SELECT longdid, digte.tititel as titel, digte.foerstelinie, digte.vid FROM digte, vaerker WHERE digte.fid=? AND digte.vid = vaerker.vid AND digte.layouttype = 'digt' AND afsnit=0");
$sth->execute($poet->fid);
while (my $f = $sth->fetchrow_hashref) { 
    $f->{'sort'} = $mode == 1 ? $f->{'titel'} : $f->{'foerstelinie'};
    push @f,$f;
}

my @blocks = ();
my $previousLine = '';
my @lines = sort { Kalliope::Sort::sort($a,$b) } @f;

my $idx = -1;
for (my $i = 0; $i <= $#lines; $i++) {
    my $f = $lines[$i];
    next unless $f->{'sort'};
    my $line =  $mode == 1 ? $f->{'titel'} : $f->{'foerstelinie'};
    my $line2 =  $mode == 1 ? $f->{'foerstelinie'} : $f->{'titel'};
    my $line3 = $line;

    $line = qq|$line <SPAN STYLE="color: #808080">[$line2]</SPAN>| if $line eq $previousLine;

    unless ($i+1 > $#lines) {
	my $nextf = $lines[$i+1];
	my $nextline =  $mode == 1 ? $nextf->{'titel'} : $nextf->{'foerstelinie'};
	$line = qq|$line <SPAN STYLE="color: #808080">[$line2]</SPAN>| if $line eq $nextline;
    }

    my $linefix = $line;
    $linefix =~ s/^Aa/Å/ig;
    my $linefixold = $previousLine;
    $linefixold =~ s/^Aa/Å/ig;

    my $firstLetterNew = uc substr($linefix,0,1);
    my $firstLetterOld = uc substr($linefixold,0,1);

    $idx++ if ($firstLetterOld ne $firstLetterNew);

    $blocks[$idx]->{'head'} = '<DIV CLASS=listeoverskrifter>'.$firstLetterNew.'</DIV><BR>';
    $blocks[$idx]->{'count'}++;
    my $w = $works{$f->{'vid'}};
    $blocks[$idx]->{'body'} .= '<SPAN CLASS="listeblue">&#149;</SPAN> <A TITLE="Fra '.$w->titleWithYear.'" HREF="digt.pl?longdid='.$f->{'longdid'}.'">'.$line.'</A><BR>';
    $previousLine = $line3;

}
#
# Udskriv boks
#

my $HTML = Kalliope::Web::doubleColumn(\@blocks);
my $title = $mode ? "Digttitler" : "Førstelinier";

$page->addBox( title => $title,
               coloumn => 1,
               width => '90%',
	       content => $HTML );
$page->print;

