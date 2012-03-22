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


use strict;
use utf8;
use CGI qw/:standard/;
use Kalliope::Help;
use Kalliope::Page::Popup;
use Kalliope::DB;
use Kalliope;

my $SPAN = 2;

my $dbh = Kalliope::DB->connect();

my $year = CGI::param('center');
my $fromYear = $year-$SPAN;
my $toYear = $year+$SPAN;

my $sth = $dbh->prepare("SELECT * FROM timeline WHERE year >= ? AND year <= ? ORDER BY year ASC");
$sth->execute($fromYear,$toYear);

my $HTML = '';
my $picHTML = '';
while (my $h = $sth->fetchrow_hashref) {
    if ($h->{'type'} eq 'picture') {
        my $k;
	$k->{'thumbfile'} = $h->{'url'};
	$k->{'thumbfile'} =~ s/\/([^\/]+)$/\/_$1/;
	$k->{'destfile'} = $h->{'url'};
        $picHTML .= Kalliope::Web::insertThumb($k);
	$picHTML .= '<br><small>'.$h->{'description'}.'</small><br><br>';
    } else {
	$HTML .= '<B>'.$h->{'year'}.'</B>: '.$h->{'description'}."<BR>\n";
    }
}
Kalliope::buildhrefs(\$HTML); 

$HTML =~ s/<A(.*)HREF="([^"]*)"(.*)>/<A$1 onClick="javascript:opener.document.location = '$2';return false" HREF="javascript:{}"$3>/g;

my ($from2,$to2,$c2) = ($fromYear-(2*$SPAN)-1,$fromYear-1,$fromYear-$SPAN-1);
my $endHTML = qq|<A TITLE="Bladr tilbage til $from2-$to2" HREF="timecontext.cgi?center=$c2"><IMG VALIGN=center BORDER=0 SRC="gfx/leftarrow.gif" ALT="Bladr tilbage til $from2-$to2"></A>|;

($from2,$to2,$c2) = ($toYear+1,$toYear+1+(2*$SPAN),$toYear+$SPAN+1);
$endHTML .= qq|<A TITLE="Bladr frem til $from2-$to2" HREF="timecontext.cgi?center=$c2"><IMG VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Bladr frem til $from2-$to2"></A>|;

my $HTMLout = qq|<TABLE><TR><TD VALIGN="top">$HTML</TD><TD WIDTH="100" VALIGN="top">$picHTML</TD></TR></TABLE>|;

my $title = "Begivenheder $fromYear - $toYear";
my $page = new Kalliope::Page::Popup ( title => $title );
$page->addBox( width => '100%',
               title => $title,
	       end => $endHTML,
               content => $HTMLout );
$page->print;


