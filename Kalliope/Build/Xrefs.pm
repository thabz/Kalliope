
#
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

package Kalliope::Build::Xrefs;
    
use Kalliope::DB;
use strict;

my $dbh = Kalliope::DB::connect();

sub build {
    create();    
    my $sth = $dbh->prepare("SELECT longdid,indhold,noter FROM digte WHERE afsnit = 0");
    $sth->execute();
    my $sthins = $dbh->prepare("INSERT INTO xrefs VALUES (?,?)");
    while (my $h = $sth->fetchrow_hashref) {
        my $hay = $h->{'indhold'}.' '.$h->{'noter'};
	while ($hay =~ s/<A D=([^>]+)>//si) {
	    $sthins->execute($h->{'longdid'},$1);
	}

	while ($hay =~ s/<XREF DIGT="([^"]+)">//si) {
	    $sthins->execute($h->{'longdid'},$1);
	}

	while ($hay =~ s/<XREF BIBEL="([^"]+)">//si) {
	    my $gah = $1;
	    $gah =~ s/,.*$//;
	    $sthins->execute($h->{'longdid'},$gah);
	}

    }
}

sub create {
    $dbh->do("DROP TABLE IF EXISTS xrefs");
    $dbh->do("CREATE TABLE xrefs ( 
              fromid char(40) NOT NULL,
	      toid char(40) NOT NULL,
	      INDEX (fromid),
	      INDEX (toid))");
}

