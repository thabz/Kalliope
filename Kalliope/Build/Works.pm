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
    my $sthforbogstaver = $dbh->prepare("DELETE FROM forbogstaver WHERE vid = ?");
    my $sthdigte = $dbh->prepare("DELETE FROM digte WHERE vid = ?");
    my $sthnotes = $dbh->prepare("DELETE FROM worknotes WHERE vid = ?");
    my $sthpictures = $dbh->prepare("DELETE FROM workpictures WHERE vid = ?");
    my $sthkeywords = $dbh->prepare("DELETE FROM workxkeyword WHERE vid = ?");
    my $sthworks = $dbh->prepare("DELETE FROM vaerker WHERE vid = ?");
    foreach my $item (@changed) {
	my $vid = $item->{'fhandle'}."/".$item->{'vhandle'};
	$sthforbogstaver->execute($vid);
	$sthdigte->execute($vid);
	$sthnotes->execute($vid);
	$sthpictures->execute($vid);
	$sthkeywords->execute($vid);
	$sthworks->execute($vid);
    }
}

sub insert {
    my @changed = @_;
    my $sthwork = $dbh->prepare("INSERT INTO vaerker (vid,fhandle,vhandle,titel,underoverskrift,aar,type,hascontent,quality,lang,status,cvstimestamp,dirty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)");
    my $sthnote = $dbh->prepare("INSERT INTO worknotes (vid,note,orderby) VALUES (?,?,?)");
    my $sthpicture = $dbh->prepare("INSERT INTO workpictures (vid,caption,url,orderby) VALUES (?,?,?,?)");
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
		$type,$hascontent,$quality,$person->lang,$status,
                Kalliope::Date::cvsTimestampToUNIX($timestamptxt));
	if ($workhead->first_child('notes')) {
	   my $i = 1;
           foreach my $note ($workhead->first_child('notes')->children('note')) {
   	       $sthnote->execute($vid,$note->text,$i++);
  	   }
	}
	if ($workhead->first_child('pictures')) {
	   my $i = 1;
           foreach my $pic ($workhead->first_child('pictures')->children('picture')) {
	       my $src = $pic->{'att'}->{'src'};
   	       $sthpicture->execute($vid,$pic->text,$src,$i++);
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

sub create {
    $dbh->do("DROP TABLE vaerker CASCADE");
 $dbh->do(q(
	CREATE TABLE vaerker ( 
              vid varchar(80) NOT NULL PRIMARY KEY,
              fhandle varchar(20) NOT NULL REFERENCES fnavne(fhandle),
              vhandle varchar(20) NOT NULL,
              titel text NOT NULL, 
	      underoverskrift text,
              aar char(40),
              type varchar(10), -- enum('poetry','prose'),
	      status varchar(20), -- enum('complete','incomplete'),
              hascontent char(3), --enum('yes','no'),
	      cvstimestamp int,
	      quality varchar(100), /* set('korrektur1','korrektur2','korrektur3', 'kilde','side'), */
	      lang char(10),
	      dirty int)
	   ));
 $dbh->do(q/CREATE INDEX vaerker_fhandle ON vaerker(fhandle)/);
 $dbh->do(q/CREATE INDEX vaerker_vhandle ON vaerker(vhandle)/);
 $dbh->do(q/CREATE INDEX vaerker_lang ON vaerker(lang)/);
 $dbh->do(q/CREATE INDEX vaerker_type ON vaerker(type)/);

    $dbh->do("DROP TABLE worknotes");
 $dbh->do(q/
	CREATE TABLE worknotes ( 
              vid varchar(80) NOT NULL REFERENCES vaerker(vid),
	      note text NOT NULL,
	      orderby int NOT NULL)
	    /);
 $dbh->do(q/CREATE INDEX worknotes_vid ON worknotes(vid)/);

    $dbh->do("DROP TABLE workpictures");
 $dbh->do(q(
	CREATE TABLE workpictures ( 
              vid varchar(80) NOT NULL REFERENCES vaerker(vid),
	      caption text NOT NULL,
	      url varchar(200) NOT NULL,
	      orderby int NOT NULL)
	    ));
 $dbh->do(q/CREATE INDEX workpictures_vid ON workpictures(vid)/);

    $dbh->do("DROP TABLE workxkeyword");
 $dbh->do(q(
	CREATE TABLE workxkeyword ( 
              vid varchar(80) NOT NULL REFERENCES vaerker(vid),
	      keyword varchar(100) NOT NULL)
	    ));
 $dbh->do(q/CREATE INDEX workxkeyword_vid ON workxkeyword(vid)/);
 $dbh->do(q/CREATE INDEX workxkeyword_keyword ON workxkeyword(keyword)/);
}
