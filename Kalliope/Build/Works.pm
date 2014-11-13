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
use utf8;

my $dbh = Kalliope::DB::connect();

sub findmodified {
    my $sth = $dbh->prepare("SELECT fhandle,workslist FROM fnavne");
    $sth->execute;
    my @changed;
    while (my ($fhandle,$workslist) = $sth->fetchrow_array) {
	my @works = split ',',$workslist;
	foreach my $vhandle (@works) {
	    my $filename = "../fdirs/$fhandle/$vhandle.xml";
	    if (Kalliope::Build::Timestamps::hasChanged($filename)) {
	       push @changed,{'fhandle'=>$fhandle,'vhandle'=>$vhandle};
	    }
	}
    }
    return @changed;
}

sub clean {
    my @changed = @_;
    my $sthworks = $dbh->prepare("DELETE FROM vaerker WHERE vid = ?");
    foreach my $item (@changed) {
	my $vid = $item->{'fhandle'}."/".$item->{'vhandle'};
	$sthworks->execute($vid);
    }
}

sub insert {
    my @changed = @_;
    my $sthwork = $dbh->prepare("INSERT INTO vaerker (vid,fhandle,vhandle,titel,underoverskrift,aar,type,hascontent,quality,lang,country,status,cvstimestamp,dirty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)");
    my $sthnote = $dbh->prepare("INSERT INTO worknotes (vid,note,lang,orderby) VALUES (?,?,?,?)");
    my $sthpicture = $dbh->prepare("INSERT INTO workpictures (vid,caption,url,orderby,lang,type) VALUES (?,?,?,?,?,?)");
    my $sthkeyword = $dbh->prepare("INSERT INTO workxkeyword (vid,keyword) VALUES (?,?)");
    foreach my $item (@changed) {
	my ($fhandle,$vhandle) = ($item->{'fhandle'},$item->{'vhandle'});
	my $vid = "$fhandle/$vhandle";
	my $person = Kalliope::PersonHome::findByFhandle($fhandle);
	my $filename  = "../fdirs/$fhandle/$vhandle.xml";
	print "           Inserting head $filename\n";
	my $twig = new XML::Twig(keep_encoding => 1);
	$twig->parsefile($filename);
	my $kalliopework = $twig->root;
	my $status = $kalliopework->{'att'}->{'status'} || 'incomplete';
	my $type = $kalliopework->{'att'}->{'type'} || 'poetry';
	my $worklang = $kalliopework->{'att'}->{'lang'} || $person->lang();
	my $workhead = $kalliopework->first_child('workhead');
	my $title = $workhead->first_child('title')->text;
	my $subtitle = $workhead->first_child('subtitle') ? 
	    $workhead->first_child('subtitle')->text : '';
	my $year = $workhead->first_child('year') ? 
	    $workhead->first_child('year')->text : '';
	my $timestamptxt =  $workhead->first_child('cvs-timestamp')->text;
	my $quality =  $workhead->first_child('quality') ? $workhead->first_child('quality')->text : '';
	my $hascontent = $kalliopework->first_child('workbody') ? 'yes' : 'no';
	$sthwork->execute($vid,$fhandle,$vhandle,$title,$subtitle,$year,
		$type,$hascontent,$quality,$worklang,$person->country(),$status,
                Kalliope::Date::cvsTimestampToUNIX($timestamptxt));
	if ($workhead->first_child('notes')) {
	   my $i = 1;
           foreach my $note ($workhead->first_child('notes')->children('note')) {
	       my $notelang = $note->{'att'}->{'lang'} || 'da';
   	       $sthnote->execute($vid,$note->sprint(1),$notelang,$i++);
  	   }
	}
	if ($workhead->first_child('pictures')) {
	   my $i = 1;
           foreach my $pic ($workhead->first_child('pictures')->children('picture')) {
	       my $notelang = $pic->{'att'}->{'lang'} || 'da';
	       my $src = $pic->{'att'}->{'src'};
	       my $type = $pic->{'att'}->{'type'};
   	       $sthpicture->execute($vid,$pic->sprint(1),$src,$i++,$notelang,$type);
  	   }
	}
	if ($workhead->first_child('keywords')) {
           foreach my $key (split ',',$workhead->first_child('keywords')->text) {
   	       $sthkeyword->execute($vid,$key);
  	   }
	}
        Kalliope::Build::Timestamps::register($filename);
    }
}

sub postinsert {
  my $SQL = q(
       UPDATE vaerker SET fulltext_index_column = 
          setweight(to_tsvector(coalesce(titel,'')), 'A') ||
          setweight(to_tsvector(coalesce(underoverskrift,'')), 'B')  
  );
  $dbh->do($SQL);
}

sub create {
 $dbh->do(q(
	CREATE TABLE vaerker ( 
              vid varchar(80) NOT NULL PRIMARY KEY,
              fhandle varchar(20) NOT NULL, -- REFERENCES fnavne(fhandle) ON DELETE RESTRICT,
              vhandle varchar(20) NOT NULL,
              titel text NOT NULL, 
	      underoverskrift text,
              aar varchar(40),
              type varchar(10), -- enum('poetry','prose'),
	      status varchar(20), -- enum('complete','incomplete'),
              hascontent char(3), --enum('yes','no'),
	      cvstimestamp bigint,
	      quality varchar(100), /* set('korrektur1','korrektur2','korrektur3', 'kilde','side'), */
	      lang char(2) NOT NULL,
	      country char(2) NOT NULL,
	      fulltext_index_column tsvector,
	      dirty int)
	   ));
 $dbh->do(q/CREATE INDEX vaerker_fhandle ON vaerker(fhandle)/);
 $dbh->do(q/CREATE INDEX vaerker_vhandle ON vaerker(vhandle)/);
 $dbh->do(q/CREATE INDEX vaerker_lang ON vaerker(lang)/);
 $dbh->do(q/CREATE INDEX vaerker_country ON vaerker(country)/);
 $dbh->do(q/CREATE INDEX vaerker_type ON vaerker(type)/);
 $dbh->do(q/CREATE INDEX vaerker_textsearch_idx ON vaerker USING gin(fulltext_index_column)/);
 $dbh->do(q/GRANT SELECT ON TABLE vaerker TO public/);

 $dbh->do(q/
	CREATE TABLE worknotes ( 
              vid varchar(80) NOT NULL REFERENCES vaerker(vid) ON DELETE CASCADE,
	      note text NOT NULL,
	      lang char(2) NOT NULL,
	      orderby int NOT NULL)
	    /);
 $dbh->do(q/CREATE INDEX worknotes_vid ON worknotes(vid)/);
 $dbh->do(q/GRANT SELECT ON TABLE worknotes TO public/);

 $dbh->do(q(
	CREATE TABLE workpictures ( 
              vid varchar(80) NOT NULL REFERENCES vaerker(vid) ON DELETE CASCADE,
	      caption text NOT NULL,
	      type varchar(20),
	      lang char(2) NOT NULL,
	      url varchar(200) NOT NULL,
	      orderby int NOT NULL)
	    ));
 $dbh->do(q/CREATE INDEX workpictures_vid ON workpictures(vid)/);
 $dbh->do(q/GRANT SELECT ON TABLE workpictures TO public/);

 $dbh->do(q(
	CREATE TABLE workxkeyword ( 
              vid varchar(80) NOT NULL REFERENCES vaerker(vid) ON DELETE CASCADE,
	      keyword varchar(100) NOT NULL)
	    ));
 $dbh->do(q/CREATE INDEX workxkeyword_vid ON workxkeyword(vid)/);
 $dbh->do(q/CREATE INDEX workxkeyword_keyword ON workxkeyword(keyword)/);
 $dbh->do(q/GRANT SELECT ON TABLE workxkeyword TO public/);
}

sub drop {
    $dbh->do("DROP TABLE workxkeyword");
    $dbh->do("DROP TABLE workpictures");
    $dbh->do("DROP TABLE worknotes");
    $dbh->do("DROP TABLE vaerker");
}

1;
