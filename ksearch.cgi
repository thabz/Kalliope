#!/usr/bin/perl -w

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

use CGI ();
use Kalliope::Person;
use Kalliope::Page;
use Kalliope::Poem;
use Kalliope::DB;
use URI::Escape;
use strict;

my $dbh = Kalliope::DB->connect;

my $LA = CGI::param('lang');
my $needle = CGI::param('needle');

my $needle2 = $needle;
$needle2 =~ s/^\s+//;
$needle2 =~ s/\s+$//;
$needle2 =~ s/[^a-zA-ZæøåÆØÅ ]//g;
my @needle = split /\s+/,$needle2;


#Log alle søgninger

my $remotehost = CGI::remote_host();
open (FIL,">>../stat/searches.log");
print FIL localtime()."\$\$".$remotehost."\$\$".$needle."\$\$\n";
close FIL;

my @crumbs;
push @crumbs,["Søgning efter »$needle«",''];

my $page = new Kalliope::Page (
		title => "Søgning efter »$needle«",
                pagegroup => 'search',
                lang => $LA,
                page => '',
                thumb => 'gfx/search_100.GIF',
                crumbs => \@crumbs );

my $starttid = time;

my $sth = $dbh->prepare("SELECT did, MATCH titel,haystack AGAINST (?) AS quality FROM digte WHERE (MATCH titel,haystack AGAINST (?) > 0) AND afsnit = 0 ORDER BY quality DESC LIMIT 10");
$sth->execute($needle,$needle);

my @matches;
while (my $d = $sth->fetchrow_hashref)  {
    push @matches,[$d->{'did'},$d->{'quality'}];
}
$sth->finish();

my $HTML;
my $i = 1;

foreach my $d (@matches)  {
    my ($did,$quality) = @{$d};
    my $poem = new Kalliope::Poem (did => $did);
    my $author = $poem->author;
    my $work = $poem->work;
    my $poemTitle = $poem->title;

    $HTML .= $i++.". ";

    my $content = $poem->contentForSearch();
    my $match;
    my $slash = '<SPAN STYLE="color: #a0a0a0">//</SPAN>';
    foreach my $ne (@needle) {
	my ($a,$b,$c) = $content =~ /(.{0,30})($ne)(.{0,30})/si;
	
	$a =~ s/\n+/ $slash /g;
	$c =~ s/\n+/ $slash /g;
	$match .= "...$a<b>$b</b>$c...<BR>" if $b;
	$poemTitle =~ s/($ne)/\n$1\t/gi;
    }
    $poemTitle =~ s/\n/<B>/g;
    $poemTitle =~ s/\t/<\/B>/g;
    
    $HTML .= '<A CLASS=blue HREF="digt.pl?longdid='.$poem->longdid.'&needle='.uri_escape($needle).'#offset">'.$poemTitle.qq|</A><BR>|;
    $HTML .= qq|$match|;
    $HTML .= '<SPAN STYLE="color: green">'.$author->name.'</SPAN>: <SPAN STYLE="color: #a0a0a0"><I>'.$work->title."</I> ".$work->parenthesizedYear."</SPAN><BR><BR>";

}

if ($i == 1) {
    $HTML = 'Søgningen gav intet resultat.';
}

my $formHTML = qq|<FORM METHOD="get" ACTION="ksearch.cgi"><INPUT NAME="needle" VALUE="$needle"><INPUT TYPE="hidden" NAME="lang" VALUE="$LA"></FORM>|;

$page->addBox( width => '80%',
	       content => $formHTML );


$page->addBox( width => '80%',
	       content => $HTML,
               end => "Tid i sekunder: ".(time-$starttid) );

$page->print();
