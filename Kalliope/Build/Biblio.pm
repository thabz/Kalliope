
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

package Kalliope::Build::Biblio;
    
use Kalliope::DB;
use strict;

my $dbh = Kalliope::DB::connect();

sub build {
    create();    
    my $sth = $dbh->prepare("SELECT fhandle FROM fnavne");
    $sth->execute();
    my $sthins = $dbh->prepare("INSERT INTO biblio VALUES (?,?,?)");
    while (my ($fhandle) = $sth->fetchrow_array) {
	my @entries = &readfiles($fhandle);
	foreach my $entry (@entries) {
	    next unless $entry =~ /<biblio>/i;
	    my ($bibid,$txt) = $entry =~ /<biblio>([^<]*)<\/biblio>\s*(.*)$/i;
	    $sthins->execute($fhandle,$bibid,$txt);
	}
    }
}

sub create {
    $dbh->do("DROP TABLE IF EXISTS biblio");
    $dbh->do("CREATE TABLE biblio ( 
              fhandle char(40) NOT NULL,
	      bibid char(40) NOT NULL,
	      entry text,
	      INDEX (fhandle),
	      INDEX (bibid))");
}


sub readfiles {
    my $fhandle = shift;
    my @result;
    open (FILE,"../fdirs/$fhandle/primaer.txt");
    push @result,<FILE>;
    close (FILE);
    open (FILE,"../fdirs/$fhandle/sekundaer.txt");
    push @result,<FILE>;
    close (FILE);
    return @result;
}
