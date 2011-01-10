
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

package Kalliope::Search::Free;
@ISA = qw/ Kalliope::Search /;

use Kalliope::DB;
use URI::Escape;
use strict;

my $dbh = Kalliope::DB->connect;

sub pageTitle {
    my $needle = shift->{'needle'};
    return "Søgning efter »$needle«"
}

sub hasSearchBox {
    return 1;
}

sub searchBoxHTML {
    my $self = shift;
    my $needle = $self->needle;
    my $LA = $self->lang;
    return qq|<FORM METHOD="get" ACTION="ksearch.cgi"><INPUT NAME="needle" VALUE="$needle" autofocus><INPUT TYPE="hidden" NAME="sprog" VALUE="$LA"><INPUT TYPE="hidden" NAME="type" VALUE="free"> <INPUT CLASS="button" TYPE="submit" VALUE=" Søg "></FORM>|;
}

sub needle {
    return shift->{'needle'};
}

sub needleToUse {
    my $self = shift;
    return "lang=".$self->lang." ".$self->needle;
}

sub splitNeedle {
    my $needle2 = shift->needle;
    $needle2 =~ s/^\s+//;
    $needle2 =~ s/\s+$//;
    $needle2 =~ s/[^a-zA-ZæøåÆØÅ=\* ]//g;
    return split /\s+/,$needle2;
}

sub escapedNeedle {
    return uri_escape(shift->needle);
}


sub getExtraURLParam {
    my $self = shift;
    return 'needle='.uri_escape($self->needle);
}

sub log {
    my $self = shift;
    return;
    my $remotehost = CGI::remote_host();
    open (FIL,">>../stat/searches.log");
    print FIL localtime()."\$\$".$remotehost."\$\$".$self->needle."\$\$\n";
    close FIL;
}

