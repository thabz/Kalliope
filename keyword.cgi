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
use utf8;

my $dbh = Kalliope::DB->connect;

my $page;

my $keywordid;
my $keywordord;
if (defined(url_param('keywordid'))) {
    $keywordid = url_param('keywordid');
} elsif (defined(url_param('keyword'))) {
    $keywordid = $dbh->selectrow_array("SELECT id FROM keywords WHERE ord = '".url_param('keyword')."'");
    $keywordord = url_param('keyword');
}

my $LA = url_param('sprog') || 'dk';
my $limit = url_param('limit') || '';


if (!$keywordid) {
    print STDERR "Ukendt nøgleord: $keywordord\n";
    my $page = new Kalliope::Page (
		title => 'Nøgleord',
                lang => $LA,
                pagegroup => 'history',
		icon => 'keywords-blue',
                page => 'keyword' );
    $page->addBox ( title => 'Fejl...',
                    width => "75%",
                    content => 'Du er blevet henvist til et ugyldigt nøgleord. Fejlen vil blive rettet hurtigst muligt!');
    $page->print;
} else {
    my $keyword = new Kalliope::Keyword(id => $keywordid);
    my $ord = $keyword->ord;
    my @crumbs;
    push @crumbs,['Baggrund','metafront.cgi'];
    push @crumbs,['Nøgleord','keywordtoc.cgi'];
    push @crumbs,[$keyword->title,''];

    $page = new Kalliope::Page (
	        title => 'Nøgleord',
		subtitle => $keyword->title,
                pagegroup => 'history',
                page => 'keyword',
		printer => url_param('printer') || 0,
		icon => 'keywords-blue',
                lang => $LA,
                crumbs => \@crumbs );

    $page->addBox (
#	    title => $keyword->title,
                    width => "80%",
                    coloumn => 0,
		    printer => 1,
		    align => 'justify',
		    end => qq|<a title="Udskriftsvenlig udgave" href="keyword.cgi?keyword=$keywordord&printer=1"><img src="gfx/print.gif" border=0></a>|,
                    content => Kalliope::buildhrefs(\$keyword->content) );
    
    #
    # Related keywords -----------------------------------------------
    #
    
    my $html;
    my @list = $keyword->linksToKeywords;
#    if ($#list >= 0) {
    if (0) {
	my $html;
	map {$html .= $_->clickableTitle($LA)."<br>" } @list;
	$page->addBox ( title => 'Nøgleord',
		        width => "200",
		        content => $html,
                        coloumn => 2 )
    }
    @list = $keyword->linksToPersons($LA);
    if ($#list >= 0) {
	my $html;
	map {$html .= $_->clickableTitle($LA)."<br>" } @list;
	$page->addBox ( title => 'Personer',
		        width => "200",
		        content => $html,
                        coloumn => 2 )
    }
    #TODO: Måske jeg vælge 5 tilfældige udfra f.eks. top 10.
    @list = $keyword->linksToPoems(5,$LA);
    if ($#list >= 0) {
	my $html;
	map {$html .= $_->clickableTitle($LA)."<br>" } @list;
        $html .= qq|<A HREF="ksearch.cgi?type=keyword&keyword=$ord&sprog=$LA">Flere ...</A><br><br>|;
	$page->addBox ( title => 'Eksempler på digte',
		        content => $html,
                        coloumn => 0 )
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
	$page->addBox ( width => "200",
		        content => $html,
                        coloumn => 2 )
    }
    $page->setColoumnWidths('80%','200');
    $page->print;
}

