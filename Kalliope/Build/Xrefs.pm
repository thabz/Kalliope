
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
use utf8;

my $dbh = Kalliope::DB::connect();

sub insert {
    my @changed = @_;
    my $sth = $dbh->prepare("(SELECT longdid,indhold as content FROM digte WHERE vid = ?) UNION (SELECT t.longdid as longdid,t.note as content FROM textnotes t, digte d WHERE d.longdid = t.longdid AND d.vid = ?)");
    my $sthins = $dbh->prepare("INSERT INTO xrefs (fromid,toid) VALUES (?,?)");

    foreach my $item (@changed) {
	my $vid = $item->{'fhandle'}."/".$item->{'vhandle'};
	$sth->execute($vid,$vid);
	while (my $h = $sth->fetchrow_hashref) {
	    my $hay = $h->{'content'};
	    my $longdid = $h->{'longdid'};

	    while ($hay =~ s/<A\s+D=([^>]+)>//si) {
		$sthins->execute($longdid,$1);
	    }
	    while ($hay =~ s/<a\s+poem="([^>]+)"\s*>//si) {
		$sthins->execute($longdid,$1);
	    }
  	    while ($hay =~ s/<xref\s+digt="([^"]+)"\s*\/>//si) {
	        $sthins->execute($longdid,$1);
	    }
  	    while ($hay =~ s/<xref\s+poem="([^"]+)"\s*\/>//si) {
	        $sthins->execute($longdid,$1);
	    }
	    while ($hay =~ s/<xref\s+bibel="([^"]+)"\s*\/>//si) {
	        my $tmp = $1;
 	        $tmp =~ s/,.*$//;
    	        $sthins->execute($longdid,$tmp);
	    }
	}
    }
}

sub create {
    $dbh->do("CREATE TABLE xrefs ( 
	         fromid varchar(40) NOT NULL REFERENCES digte(longdid) ON DELETE CASCADE,
	         toid varchar(40) NOT NULL) -- REFERENCES digte(longdid) ON DELETE RESTRICT)");
   $dbh->do(q/CREATE INDEX xrefs_fromid ON xrefs(fromid)/);
   $dbh->do(q/CREATE INDEX xrefs_toid ON xrefs(toid)/);
   $dbh->do(q/GRANT SELECT ON TABLE xrefs TO public/);
}

sub drop {
    $dbh->do("DROP TABLE xrefs");
}

1;
