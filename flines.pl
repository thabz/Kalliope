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
use CGI ();
use Kalliope::Person ();
use Kalliope::Page ();
use Kalliope::Sort ();
use strict;

my $dbh = Kalliope::DB->connect;
my $fhandle = CGI::url_param('fhandle');

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

my $poet = Kalliope::PersonHome::findByFhandle($fhandle);
my $mode = CGI::url_param('mode') || 0;
my $title = $mode == 1 ? _("Digttitler") : _("Førstelinier");

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs = $poet->getCrumbs();
push @crumbs,[$title,''];

my $page = newAuthor Kalliope::Page ( 
    poet => $poet,
	subtitle => $title,
    page => $mode ? 'titlelines' : 'firstlines',
    columnrule => 1,
    crumbs => \@crumbs);


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
my $extraSQL = $mode == 1 ? "AND digte.tititel IS NOT NULL" : "AND digte.foerstelinie IS NOT NULL";
my $sth = $dbh->prepare("SELECT longdid, digte.tititel as titel, digte.foerstelinie, digte.vid,digte.type as type FROM digte, vaerker WHERE digte.fhandle = ? AND digte.vid = vaerker.vid AND digte.type = 'poem' $extraSQL");
$sth->execute($poet->fhandle);
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

    $line = qq|$line <SPAN STYLE="color: #808080">[$line2]</SPAN>| if $line eq $previousLine && $line2 ne '';

    unless ($i+1 > $#lines) {
	    my $nextf = $lines[$i+1];
	    my $nextline =  $mode == 1 ? $nextf->{'titel'} : $nextf->{'foerstelinie'};
	    $line = qq|$line <SPAN STYLE="color: #808080">[$line2]</SPAN>| if $line eq $nextline && $line2 ne '';
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
    print STDERR $f->{'vid'}." is missing\n" unless $w;
    next unless $w;

    my $url = $$f{type } eq 'section' ? qq(vaerktoc.pl?fhandle=$fhandle&vhandle=).$w->vhandle."#$$f{longdid}" : qq(digt.pl?longdid=$$f{'longdid'});
    
    $blocks[$idx]->{'body'} .= '<p CLASS="digtliste"><A TITLE="'._("Fra %s",$w->titleWithYear).qq(" href="$url">$line</A></p>);
    $previousLine = $line3;

}

#
# Udskriv boks
#

$page->addDoubleColumn(@blocks);

$page->print;

