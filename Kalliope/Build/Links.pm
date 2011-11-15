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

package Kalliope::Build::Links;
    
use Kalliope::DB;
use strict;

my $dbh = Kalliope::DB::connect();

sub insert {
    my $sth = $dbh->prepare("SELECT fhandle FROM fnavne WHERE links = 1");
    $sth->execute;
    my $sthins = $dbh->prepare("INSERT INTO links (fhandle,url,beskrivelse) VALUES (?,?,?)");
    while (my $fn = $sth->fetchrow_hashref) {
	open (FILE,"../fdirs/".$fn->{'fhandle'}."/links.txt");
	while (<FILE>) {
	    my $url = $_;
	    my $desc = <FILE>;
	    $sthins->execute($fn->{'fhandle'},$url,$desc);
	}
	close (FILE)
    }
    $sth->finish;
    $sthins->finish;
}

sub create {
    $dbh->do("CREATE TABLE links ( 
              fhandle varchar(40) NOT NULL, -- REFERENCES fnavne(fhandle) ON DELETE CASCADE,
              url text NOT NULL,
              beskrivelse text NOT NULL)");
   $dbh->do(q/CREATE INDEX links_fhandle ON links(fhandle)/);
   $dbh->do(q/GRANT SELECT ON TABLE links TO public/);
}

sub drop {
    $dbh->do("DROP TABLE links");

}

1;
