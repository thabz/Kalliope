
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

package Kalliope::Build::Timestamps;
    
use Kalliope::DB;
use strict;

my $dbh = Kalliope::DB::connect();
my $sthlookup = $dbh->prepare("SELECT timestamp FROM timestamps WHERE filename = ?");
my $sthupdate = $dbh->prepare("UPDATE timestamps SET timestamp = ? WHERE filename = ?");
my $sthinsert = $dbh->prepare("INSERT INTO timestamps (filename,timestamp) VALUES (?,?)");

sub hasChanged {
    my $filename = shift;
    return filestamp($filename) != dbstamp($filename);
}

sub register {
    my $filename = shift;
    if (dbstamp($filename)) {
	$sthupdate->execute(filestamp($filename),$filename);
    } else {
	$sthinsert->execute($filename,filestamp($filename));
    }
}

sub filestamp {
    my @stat = stat(shift);
    return $stat[9];
}

sub dbstamp {
    $sthlookup->execute(shift);
    if ($sthlookup->rows > 0) {
	my ($timestamp) = $sthlookup->fetchrow_array;
	return $timestamp;
    } else {
	return undef;
    }
}

sub create {
    $dbh->do("DROP TABLE timestamps");
    $dbh->do("CREATE TABLE timestamps ( 
              filename varchar(255) NOT NULL PRIMARY KEY,
	      timestamp int NOT NULL)");
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

1;


