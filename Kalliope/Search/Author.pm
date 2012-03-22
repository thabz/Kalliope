
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

package Kalliope::Search::Author;
@ISA = qw/ Kalliope::Search /;

use Kalliope::DB;
use URI::Escape;
use strict;
use utf8;

my $dbh = Kalliope::DB->connect;

sub pageTitle {
    my $needle = shift->{'needle'};
    if ($needle ne '') {
        return "Søgning efter »$needle«";
    } else {
        return "Søgning";
    }
}

sub hasSearchBox {
    return 1;
}

sub poet {
    return shift->{'poet'};
}

sub searchBoxHTML {
    my $self = shift;
    my $needle = $self->needle;
    my $fhandle = $self->poet->fhandle;
    return qq|<FORM METHOD="get" ACTION="fsearch.cgi"><INPUT NAME="needle" VALUE="$needle" autofocus><INPUT TYPE="hidden" NAME="fhandle" VALUE="$fhandle"> <INPUT CLASS="button" TYPE="submit" VALUE=" Søg "></FORM>|;
}

sub needleToUse {
    my $self = shift;
    return "fhandle=".$self->poet->fhandle." ".$self->{'needle'};
}

sub needle {
    return shift->{'needle'}
}

sub splitNeedle {
    my $needle2 = shift->needle;
    $needle2 =~ s/^\s+//;
    $needle2 =~ s/\s+$//;
    $needle2 =~ s/[^a-zA-ZæøåÆØÅ=\* ]//g;
    return split /\s+/,$needle2;
}

sub escapedNeedle {
    return uri_escape_utf8(shift->needle);
}

sub getExtraURLParam {
    my $self = shift;
    return 'needle='.uri_escape_utf8($self->needle).'&fhandle='.$self->poet->fhandle;
}

sub scriptName {
    return 'fsearch.cgi';
}

sub log {
    my $self = shift;
    return;
    my $remotehost = CGI::remote_host();
    open (FIL,">>../stat/searches.log");
    print FIL localtime()."\$\$".$remotehost."\$\$".$self->needle."\$\$\n";
    close FIL;
}

