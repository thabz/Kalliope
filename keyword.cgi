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
use Kalliope::Web;
use Kalliope::Page;
use Kalliope::Keyword;
use Kalliope::DB;
use Kalliope::Sort;
use Kalliope;
use strict;

my $dbh = Kalliope::DB->connect;

my $page;

my $keywordid;
if (defined(url_param('keywordid'))) {
    $keywordid = url_param('keywordid');
} elsif (defined(url_param('keyword'))) {
    $keywordid = $dbh->selectrow_array("SELECT id FROM keywords WHERE ord = '".url_param('keyword')."'");
}

my $LA = url_param('sprog') || 'dk';
my $limit = url_param('limit') || '';

my $keyword = new Kalliope::Keyword(id => $keywordid);

if (!$keywordid) {
    my $page = new Kalliope::Page (
		title => 'Nøgleord',
                lang => $LA,
                pagegroup => 'history',
                thumb => 'gfx/icons/keywords-h70.gif',
                page => 'keyword' );
    $page->addBox ( title => 'Fejl...',
                    width => "75%",
                    content => 'Du er blevet henvist til et ugyldigt nøgleord. Fejlen vil blive rettet hurtigst muligt!');
    $page->print;
} else {
    my $ord = $keyword->ord;
    my @crumbs;
    push @crumbs,['Nøgleord','keywordtoc.cgi'];
    push @crumbs,[$keyword->title,''];

    $page = new Kalliope::Page (
		title => $keyword->title,
                pagegroup => 'history',
                page => 'keyword',
                thumb => 'gfx/icons/keywords-h70.gif',
                lang => $LA,
                crumbs => \@crumbs );

    $page->addBox ( title => $keyword->title,
                    width => "80%",
                    coloumn => 0,
                    content => '<DIV STYLE="text-align: justify">'.Kalliope::buildhrefs(\$keyword->content).'</DIV>' );
    
    #
    # Related keywords -----------------------------------------------
    #
    
    my $html = qq|<A HREF="ksearch.cgi?type=keyword&keyword=$ord&sprog=$LA">Vis alle digte som har dette nøgleord</A><br><br>|;
    my @list = $keyword->linksToKeywords;
    push @list,$keyword->linksToPersons($LA);
    #TODO: Måske jeg vælge 5 tilfældige udfra f.eks. top 10.
    push @list,$keyword->linksToPoems(5,$LA);
    if ($#list >= 0) {
        foreach my $k (sort { Kalliope::Sort::sortObject($a,$b) } @list) {
	    $html .= $k->smallIcon.' '.$k->clickableTitle($LA).'<BR><BR>';
	}
	$html =~ s/<BR><BR>$//;
	$page->addBox ( title => 'Se også',
		        width => "100%",
		        content => $html,
                        coloumn => 1 )
    }

    my $sth = $dbh->prepare("SELECT imgfile,beskrivelse FROM keywords_images WHERE keyword_id = $keywordid");
    $sth->execute ();
    $html = '';
    if ($sth->rows) {
	while (my $k = $sth->fetchrow_hashref) {
	    $html .= Kalliope::Web::insertThumb({thumbfile=>'gfx/hist/_'.$k->{imgfile}.'.jpg',destfile=>'gfx/hist/'.$k->{imgfile}.'.jpg',alt=>'Klik for fuld størrelse'});
	    $html .= '<BR><SMALL>'.$k->{beskrivelse}.' ('.Kalliope::filesize('gfx/hist/'.$k->{imgfile}.'.jpg').')</SMALL><BR><BR>';
	}
	$html =~ s/\<BR\>\<BR\>$//;
	$page->addBox ( title => 'Billeder',
		        width => "100%",
		        content => $html,
                        coloumn => 1 )
    }
    $page->setColoumnWidths('80%','200');
    $page->print;
}

