
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
use utf8;

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

sub needleToUse {
    my $self = shift;
    return "lang=".$self->lang." keyword=".$self->keyword->ord;
}

sub getExtraURLParam {
    return "keyword=".shift->keyword->ord;
}

