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

use CGI qw /:standard/;
use Kalliope;
use Kalliope::Keyword;
use Web;
use strict;

my $keywordid;
if (defined(url_param('keywordid'))) {
    $keywordid = url_param('keywordid');
} elsif (defined(url_param('keyword'))) {
    $keywordid = $dbh->selectrow_array("SELECT id FROM keywords WHERE ord = '".url_param('keyword')."'");
}

my $LA = url_param('sprog');
my $limit = url_param('limit') || '';

&kheaderHTML("Kalliope - Nøgleord",$LA);

my $keyword = new Kalliope::Keyword(id => $keywordid);

if (!$keywordid) {
    beginwhitebox('Fejl...',"75%","left");
    print 'Du er blevet henvist til et ugyldigt nøgleord. Fejlen vil blive rettet hurtigst muligt!';
    endbox();
} else {
    print '<TABLE VALIGN=top WIDHT="100%"><TR><TD VALIGN=top>';
    my $sth = $dbh->prepare("SELECT * FROM keywords WHERE id = ?");
    $sth->execute ($keywordid);
    my $h = $sth->fetchrow_hashref;
    beginwhitebox($keyword->title,"80%","left");
    print '<DIV STYLE="text-align: justify">';
    print Kalliope::buildhrefs(\$keyword->content);
    print '</DIV>';
    endbox();
    
    print '</TD><TD VALIGN=top WIDTH="20%">';
    #
    # Related keywords -----------------------------------------------
    #
    begindarkbluebox();
    my $html;
    my @list = $keyword->linksToKeywords;
    push @list,$keyword->linksToPersons;
    #TODO: Måske jeg vælge 5 tilfældige udfra f.eks. top 10.
    push @list,$keyword->linksToPoems(5,$LA);
    if ($#list >= 0) {
	beginwhitebox('Se også',"100%","left");
        foreach my $k (sort Kalliope::sortObject @list) {
	    $html .= $k->smallIcon.' '.$k->clickableTitle($LA).'<BR><BR>';
	}
	$html =~ s/<BR><BR>$//;
	print $html;
	endbox();
    }

    $sth = $dbh->prepare("SELECT imgfile,beskrivelse FROM keywords_images WHERE keyword_id = $keywordid");
    $sth->execute ();
    $html = '';
    if ($sth->rows) {
	beginwhitebox('Billeder',"100%","left");
	while (my $k = $sth->fetchrow_hashref) {
	    $html .= Kalliope::insertthumb({thumbfile=>'gfx/hist/_'.$k->{imgfile}.'.jpg',destfile=>'gfx/hist/'.$k->{imgfile}.'.jpg',alt=>'Klik for fuld størrelse'});
	    $html .= '<BR><SMALL>'.$k->{beskrivelse}.' ('.Kalliope::filesize('gfx/hist/'.$k->{imgfile}.'.jpg').')</SMALL><BR><BR>';
	}
	$html =~ s/\<BR\>\<BR\>$//;
	print $html;
	endbox();
    }
    print '<BR><BR>';
    endbox();
    print '</TD></TR></TABLE>';
}

&kfooterHTML;
