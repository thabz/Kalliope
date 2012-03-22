
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

package Kalliope::Strings;

use strict ('vars');
use Carp;
use Kalliope::DB;
use utf8;

my $dbh = Kalliope::DB->connect;

sub stripHTML {
    my $string = shift;
    $string =~ s/<[^>]*>//g;
    return $string;
}

sub abbr {
    my ($string,$size) = @_;
    return substr($string,0,$size).'...';
}

sub uc {
    my $str = shift;
    return '' unless $str;
    $str =~ tr/æøå/ÆØÅ/;
    return uc $str;
}

1;
