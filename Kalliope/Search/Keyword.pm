
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

package Kalliope::Search::Keyword;
@ISA = qw/ Kalliope::Search /;

use Kalliope::DB ();
use URI::Escape;
use strict;

my $dbh = Kalliope::DB->connect;

sub pageTitle {
    my $title = shift->keyword->title;
    return "Søgning efter nøgleordet »$title«"
}

sub keyword {
    my $self = shift;
    return $self->{'keywordobj'} if $self->{'keywordobj'};
    my $obj = new Kalliope::Keyword(ord => $self->{'keyword'});
    $self->{'keywordobj'} = $obj;
    return $obj;
}

sub count {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT count(*) FROM keywords_relation as k,digte as d WHERE k.keywordid = ? AND k.othertype = 'digt' AND k.otherid = d.did AND d.lang = ?");
    $sth->execute($self->keyword->id,$self->lang);
    my ($hits) = $sth->fetchrow_array;
    $self->{'hits'} = $hits;
    return $hits;
}

sub needle {
    return shift->{'needle'};
}

sub result {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT d.did FROM keywords_relation as k,digte as d, digthits = h WHERE k.keywordid = ? AND k.othertype = 'digt' AND k.otherid = d.did AND d.lang = ? AND d.longdid = h.longdid ORDER BY h.hits DESC LIMIT ?,10");
    $sth->execute($self->keyword->id,$self->lang,$self->firstNumShowing);
    my @matches;
    while (my $d = $sth->fetchrow_hashref)  {
	push @matches,[$$d{'did'},'Kalliope::Poem',1];
    }
    $sth->finish();

    return @matches;
}

sub getExtraURLParam {
    return "keyword=".shift->keyword->ord;

}

