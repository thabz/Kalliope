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

my $LA = CGI::param('sprog');
my $needle = CGI::param('needle');
my $escapedNeedle = uri_escape($needle);

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

my $sth = $dbh->prepare("SELECT count(*) FROM haystack WHERE (MATCH titel,hay AGAINST (?) > 0) AND lang = ?");
$sth->execute($needle,$LA);
my $hits = $sth->fetchrow_array;

my $firstNumShowing = CGI::url_param('offset') || 0;
my $lastNumShowing = $firstNumShowing  + 10 <= $hits ?
                     $firstNumShowing  + 10 : $hits;

$sth = $dbh->prepare("SELECT id,id_class, MATCH titel,hay AGAINST (?) AS quality FROM haystack WHERE (MATCH titel,hay AGAINST (?) > 0) AND lang = ? ORDER BY quality DESC LIMIT $firstNumShowing,10");
$sth->execute($needle,$needle,$LA);

my @matches;
while (my $d = $sth->fetchrow_hashref)  {
    push @matches,[$$d{'id'},$$d{'id_class'},$$d{'quality'}];
}
$sth->finish();

my $HTML;
my $i = $firstNumShowing+1;

$HTML .= "Viser ".($firstNumShowing+1)."-".($lastNumShowing)." af $hits<BR><BR>";

$HTML .= '<TABLE WIDTH="100%">';
foreach my $d (@matches)  {
    my ($id,$id_class,$quality) = @{$d};
    my $item = $id_class->new(id => $id);
    
    $HTML .= qq|<TR><TD VALIGN="top">$i.</TD><TD>|;
    $HTML .= $item->getSearchResultEntry($escapedNeedle,@needle);
    $HTML .= '</TD></TR>';
    $i++;
}
$HTML .= '</TABLE>';

if ($hits > 10) {
    for ($i = 0; $i <= int (($hits-1)/10) ; $i++) {
	my $offset = $i*10;
	my $iDisplay = $i+1;
	if ($offset == $firstNumShowing) {
	    $HTML .= "<B>[$iDisplay] </B>";
	} else {
	    $HTML .= qq|<A HREF="ksearch.cgi?offset=$offset&needle=$escapedNeedle&sprog=$LA">[$iDisplay]</A> |;
	}
    }
}

unless ($hits) {
    $HTML = 'Søgningen gav intet resultat.';
}

my $formHTML = qq|<FORM METHOD="get" ACTION="ksearch.cgi"><INPUT NAME="needle" VALUE="$needle"><INPUT TYPE="hidden" NAME="sprog" VALUE="$LA"></FORM>|;

$page->addBox( width => '80%',
	content => $formHTML );


$page->addBox( width => '80%',
	       content => $HTML,
               end => "Tid i sekunder: ".(time-$starttid) );

$page->print();
