
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

sub clean {
    my @changed = @_;
    my $sth = $dbh->prepare("DELETE FROM xrefs WHERE fromvid = ?");
    foreach my $item (@changed) {
	my $vid = $item->{'fhandle'}."/".$item->{'vhandle'};
	$sth->execute($vid);
    }
}

sub insert {
    my @changed = @_;
    my $sth = $dbh->prepare("SELECT longdid,indhold as content FROM digte WHERE vid = ? UNION SELECT longdid,note as content FROM textnotes WHERE vid = ?");
    my $sthins = $dbh->prepare("INSERT INTO xrefs (fromid,toid,fromvid) VALUES (?,?,?)");

    foreach my $item (@changed) {
	my $vid = $item->{'fhandle'}."/".$item->{'vhandle'};
	$sth->execute($vid,$vid);
	while (my $h = $sth->fetchrow_hashref) {
	    my $hay = $h->{'content'};
	    while ($hay =~ s/<A D=([^>]+)>//si) {
		$sthins->execute($h->{'longdid'},$1,$vid);
	    }
  	    while ($hay =~ s/<xref digt="([^"]+)">//si) {
	        $sthins->execute($h->{'longdid'},$1,$vid);
	    }
	    while ($hay =~ s/<xref bibel="([^"]+)">//si) {
	        my $gah = $1;
 	        $gah =~ s/,.*$//;
    	        $sthins->execute($h->{'longdid'},$gah,$vid);
	    }
	}
    }
}

sub create {
    $dbh->do("DROP TABLE xrefs");
    $dbh->do("CREATE TABLE xrefs ( 
	fromid varchar(40) NOT NULL,
    fromvid varchar(40) NOT NULL,
	      toid varchar(40) NOT NULL)");
   $dbh->do(q/CREATE INDEX xrefs_fromid ON xrefs(fromid)/);
   $dbh->do(q/CREATE INDEX xrefs_fromvid ON xrefs(fromvid)/);
   $dbh->do(q/CREATE INDEX xrefs_toid ON xrefs(toid)/);
   $dbh->do(q/GRANT SELECT ON TABLE xrefs TO "www-data"/);
}

1;
