
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

package Kalliope::Search;

use Kalliope::DB ();
use Kalliope::Search::Free();
use Kalliope::Search::Keyword();
use Kalliope::Search::Author();
use Kalliope::PoemHome;

use strict;

my %objs = ( keyword => 'Keyword',
             free    => 'Free',
             work => 'Work',
  	     author  => 'Author' );

sub new {
    my ($class,%arg) = @_;
    my $obj = bless {}, $class;
#    my $obj = bless {},'Kalliope::Search::'.$objs{$arg{'type'}};
    map { $obj->{$_} = $arg{$_} } keys %arg;
    return $obj;
}

sub type {
    return shift->{'type'};
}

sub lang {
    return shift->{'lang'};
}

sub offset {
    return shift->{'offset'};
}

sub firstNumShowing {
    return int (shift->{'offset'} || 0);
}

sub lastNumShowing {
    my $self = shift;
    my $hits = $self->{'hits'} || $self->count;
    my $firstNumShowing = $self->firstNumShowing;
    my $lastNumShowing = $firstNumShowing  + 10 <= $hits ?
	                 $firstNumShowing  + 10 : $hits;

    return $lastNumShowing;
}

sub log {
    return;
}

sub hasSearchBox {
    return 0;
}

sub needle {
    return shift->{'needle'}
}

sub needleToUse {
    return shift->needle;
}

sub splitNeedle {
    return ();
}

sub escapedNeedle {
    return '';
}

sub searchBoxHTML {
    return '';
}

sub scriptName {
    return 'ksearch.cgi';
}

sub pageTitle {
    return "Søgning"
}

sub subPageTitle {
    my $needle = shift->{'needle'};
    if ($needle ne '') {
        return "efter »$needle«";
    } else {
        return "";
    }
}


sub getHTML {
    my $self = shift;

    my $hits = $self->count;
    return 'Søgningen gav intet resultat.' unless $hits;
    my $firstNumShowing = $self->firstNumShowing;
    my $lastNumShowing = $self->lastNumShowing;
    my @matches = $self->result;

    my $escapedNeedle = $self->escapedNeedle;
    my @needle = $self->splitNeedle;
    my $LA = $self->lang;

    my $HTML;
    my $i = $firstNumShowing+1;
    $HTML .= "Viser ".($firstNumShowing+1)."-".($lastNumShowing)." af $hits<BR><BR>";
    $HTML .= '<TABLE WIDTH="100%">';
    foreach my $d (@matches)  {
	my ($id,$id_class,$quality) = @{$d};
	my $item = $id_class->new(id => $id);
	if (!$item) {
	    print STDERR "Search.pm:getHTML: \$item er null. id = $id, \$id_class = $id_class, \$quality = $quality\n";
	    next;
	}

	$HTML .= qq|<TR><TD ALIGN="right" VALIGN="top">$i.</TD><TD WIDTH="100%">|;
	$HTML .= $item->getSearchResultEntry($escapedNeedle,@needle);
	$HTML .= '</TD></TR>';
	$i++;
    }
    $HTML .= '</TABLE>';

    if ($hits > 10) {
	my $extraURLParam = '&type='.$self->type.'&'.$self->getExtraURLParam;
	my $scriptName = $self->scriptName;
	for ($i = 0; $i <= int (($hits-1)/10) ; $i++) {
	    my $offset = $i*10;
	    my $iDisplay = $i+1;
	    if ($offset == $firstNumShowing) {
		$HTML .= "<B>$iDisplay </B>";
	    } else {
		$HTML .= qq|<A HREF="$scriptName?offset=$offset&sprog=$LA$extraURLParam">$iDisplay</A> |;
	    }
	}
    }
    return $HTML;
}

sub count {
    my $self = shift;
    my $args = $self->needleToUse;
    $args =~ s/[\(\)';|]//g;
    open(FILE,"swish-search -f index/swish.index -w $args |");
    my $hits = 0;
    while (my $line = <FILE>) {
	next unless $line;
	last if $line =~ /^\./;
	next if $line =~ /^#/;
	last if $line =~ /^err:/;
	$hits++;
    }
    close(FILE);
    return $hits;
}

sub result {
    my ($self,%options) = @_;
    my $limit = $options{limit} || 500;
    my $offset = $options{offset} || 0;
    my $matches = {};
    my $needle = $self->needleToUse;
    $needle =~ s/[\(\)';|]//g;
    print STDERR "Needle: $needle";
    
    if ($self->type eq 'all' || $self->type eq 'author') {
        my @persons = Kalliope::PersonHome::findByNeedle($self->lang, $needle, $limit, $offset);
        my $count = Kalliope::PersonHome::findCountByNeedle($self->lang, $needle);
        $matches->{'author'} = \@persons;
        $matches->{'authorcount'} = $count;
    }

    if ($self->type eq 'all' || $self->type eq 'work') {
        my @works = Kalliope::WorkHome::findByNeedle($self->lang, $needle, $limit, $offset);
        my $count = Kalliope::WorkHome::findCountByNeedle($self->lang, $needle);
        $matches->{'work'} = \@works;
        $matches->{'workcount'} = $count;
    }

    if ($self->type eq 'all' || $self->type eq 'poem') {
        my @poems = Kalliope::PoemHome::findByNeedle($self->lang, $needle, $limit, $offset);
        my $count = Kalliope::PoemHome::findCountByNeedle($self->lang, $needle);
        $matches->{'poem'} = \@poems;
        $matches->{'poemcount'} = $count;
    }


    return $matches;
    
#    open(FILE,"swish-search -m 100 -f index/swish.index -w $args |");
#    my $i = -1;
#    my $c = 0;
#    while (my $line = <FILE>) {
#	    next if $line =~ /^#/;
#	    last if $line =~ /^\./;
#	    last if $line =~ /^err:/;
#	    $i++;
#	    next if $i < $self->firstNumShowing;
#	    my ($quality,$id) = split / /,$line;
#	    next unless $id;
#	    $id =~ s/.html$//;
#	    $id =~ s/^.\/dump\///;
#	    my $type = '';
#	    if ($id =~ /:/) {
#         $id =~ s!:!/!;
#	        $type = 'Kalliope::Work';
#	    } else {
#	        $type = 'Kalliope::Poem';
#	    }
#	    push @matches,[$id,$type,$quality];
#	    $c++;
#	    last if $c > 9;
#   }
#    close(FILE);
#    return @matches;

}

sub findPersons {
    my ($lang,$needle) = @_;
    my @persons = Kalliope::PersonHome::findByNeedle($lang,$needle);
    return @persons;
}

1;

