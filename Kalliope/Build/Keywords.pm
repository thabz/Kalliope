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

package Kalliope::Build::Works;
    
use XML::Twig;
use Kalliope::DB;
use Kalliope::Date;
use strict;

my $dbh = Kalliope::DB::connect();

sub insertkeywordrelation {
    my ($keyword,$otherid,$othertype,$ord) = @_;
    $sthkeyword = $dbh->prepare("INSERT INTO keywords_relation (keywordid,otherid,othertype) VALUES (?,?,?)");
    if ($othertype eq 'person') {
	$sthkeyword->execute($insertedfnavne{$keyword},$otherid,$othertype);
    } else {
	if ($keywords{$keyword}) {
	    $sthkeyword->execute($keywords{$keyword},$otherid,$othertype);
	} else {
	    &log("Nøgleordet '$keyword' i $othertype:$ord er ukendt.");
	}
    }
}

sub create {
   $rc = $dbh->do("drop table if exists keywords_relation");
   $rc = $dbh->do("CREATE TABLE keywords_relation ( 
              keywordid int UNSIGNED reaNOT NULL,
	      otherid varchar(100) NOT NULL,
	      othertype ENUM('digt','person','biografi','hist','keyword','vaerk') NOT NULL,
	      UNIQUE(keywordid,otherid,othertype))");
}
