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

package Kalliope::Build::Keywords;

use XML::Twig;
use Kalliope::DB;
use Kalliope::Date;
use strict;

my $dbh = Kalliope::DB::connect();

my %keywords;

sub clean {
     $dbh->do("DELETE FROM keywords_images");
     $dbh->do("DELETE FROM keywords");
}

sub insert {
    my $sth = $dbh->prepare('INSERT INTO keywords (id,ord,beskrivelse,titel) VALUES (?,?,?,?)');	      
    my $sthimg = $dbh->prepare('INSERT INTO keywords_images (keyword_id,imgfile,beskrivelse) VALUES (?,?,?)');	      
    opendir (DIR,'../keywords');
    my $i = 0;
    my $pi = 0;
    while (my $file = readdir(DIR)) {
	unless ($file =~ /^\./ || $file eq 'CVS') {
	    $keywords{$file} = $i;
	    my $beskr = '';
	    open(FILE,'../keywords/'.$file);
	    my $titel = '';
	    my @images;
	    while (<FILE>) { 
		if (/^T:/) {
		    s/^T://;
		    chop;
		    $titel = $_;
		} elsif (/^K:/ || /^F:/) {
		    next;
		} elsif (/^P:/) {
		    s/^P://;
		    chop;
		    my $imgfile = $_;
		    open(IMGFILE,"../gfx/hist/$imgfile.txt");
		    my $beskrivelse = join (' ',<IMGFILE>);
		    close(IMGFILE);
		    push @images,{file => $imgfile, descr => $beskrivelse};
		} else {
		    $beskr .= $_ 
		}
	    };
	    close (FILE);
	    $sth->execute($i,$file,$beskr,$titel);
	    foreach my $img (@images) {
		$sthimg->execute($i,$$img{file},$$img{descr});
	    }
	}
	$i++;
    }

}

sub insertkeywordrelation {
    my ($keyword,$otherid,$othertype,$ord) = @_;
    my $sthkeyword = $dbh->prepare("INSERT INTO keywords_relation (keywordid,otherid,othertype) VALUES (?,?,?)");
    if ($othertype eq 'person') {
#$sthkeyword->execute($insertedfnavne{$keyword},$otherid,$othertype);
	$sthkeyword->execute('',$otherid,$othertype);
    } else {
	if ($keywords{$keyword}) {
	    $sthkeyword->execute($keywords{$keyword},$otherid,$othertype);
	} else {
	    &log("Nøgleordet '$keyword' i $othertype:$ord er ukendt.");
	}
    }
}

sub create {
#  $rc = $dbh->do("drop table if exists keywords_relation");
#   $rc = $dbh->do("CREATE TABLE keywords_relation ( 
#              keywordid int UNSIGNED reaNOT NULL,
#	      otherid varchar(100) NOT NULL,
#	      othertype ENUM('digt','person','biografi','hist','keyword','vaerk') NOT NULL,
#	      UNIQUE(keywordid,otherid,othertype))");
#
#
    $dbh->do("CREATE TABLE keywords ( 
	id int PRIMARY KEY NOT NULL,
        ord varchar(128) NOT NULL,
        titel text,
        beskrivelse text
	)");
    $dbh->do(q/CREATE INDEX keywords_ord ON keywords(ord)/);

    $dbh->do("CREATE TABLE keywords_images ( 
	keyword_id INT REFERENCES keywords(id),
        imgfile varchar(128),
        beskrivelse text
	)");
    $dbh->do(q/CREATE INDEX keywords_images_keyid ON keywords_images(keyword_id)/);
   $dbh->do(q/GRANT SELECT ON TABLE keywords TO public/);
   $dbh->do(q/GRANT SELECT ON TABLE keywords_images TO public/);
}

sub drop {
    $dbh->do("DROP TABLE keywords_images");
    $dbh->do("DROP TABLE keywords");
}
1;
