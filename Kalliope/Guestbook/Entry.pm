
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

package Kalliope::Guestbook::Entry;

use strict;
use lib '..';
use Kalliope::Guestbook;

my $GUESTBOOK_DIR = '../gaestebog';

sub new {
    my ($class,%arg) = @_;
    my $obj;
    my $date = $arg{'id'};
    open (FILE,"$GUESTBOOK_DIR/$date");
    my ($time,$navn,$email,$web,$text);
    foreach (<FILE>) {
	chop;
	if (/^\*\*D:/) {
	    s/^\*\*D://;
	    $obj->{'date'} = $_;
	}
	if (/^\*\*N:/) {
	    s/^\*\*N://;
	    $obj->{'name'} = $_;
	}
	if (/^\*\*E:/) {
	    s/^\*\*E://;
	    $obj->{'email'} = $_;
	}
	if (/^\*\*W:/) {
	    s/^\*\*W://;
	    $obj->{'homepage'} = $_;
	}
	if (/^\*\*T:/) {
	    s/^\*\*T://;
	    $obj->{'text'} = $_;
	}
    }
    close (FILE);
    bless $obj,$class;
    return $obj; 
}

sub name {
    return $_[0]->{'name'} || '';
}

sub email {
    return $_[0]->{'email'} || '';
}

sub text {
    return $_[0]->{'text'} || '';
}

sub homepage {
    return $_[0]->{'web'};
}

sub date {
    return $_[0]->{'date'};
}

1;
