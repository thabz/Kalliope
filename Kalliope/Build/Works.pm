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
    my $sthworks = $dbh->prepare("DELETE FROM vaerker WHERE fhandle = ? AND vhandle = ?");
    my $sthnotes = $dbh->prepare("DELETE FROM worknotes WHERE fhandle = ? AND vhandle = ?");
    my $sthpictures = $dbh->prepare("DELETE FROM workpictures WHERE fhandle = ? AND vhandle = ?");
    my $sthkeywords = $dbh->prepare("DELETE FROM workxkeyword WHERE fhandle = ? AND vhandle = ?");
    foreach my $item (@changed) {
	$sthworks->execute($item->{'fhandle'},$item->{'vhandle'});
	$sthnotes->execute($item->{'fhandle'},$item->{'vhandle'});
	$sthpictures->execute($item->{'fhandle'},$item->{'vhandle'});
	$sthkeywords->execute($item->{'fhandle'},$item->{'vhandle'});
    }
}

sub insert {
    my @changed = @_;
    my $sthwork = $dbh->prepare("INSERT INTO vaerker (fhandle,fid,vhandle,titel,underoverskrift,aar,type,hascontent,quality,lang,status,cvstimestamp,dirty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)");
    my $sthnote = $dbh->prepare("INSERT INTO worknotes (fhandle,vhandle,note,orderby) VALUES (?,?,?,?)");
    my $sthpicture = $dbh->prepare("INSERT INTO workpictures (fhandle,vhandle,caption,url,orderby) VALUES (?,?,?,?,?)");
    my $sthkeyword = $dbh->prepare("INSERT INTO workxkeyword (fhandle,vhandle,keyword) VALUES (?,?,?)");
    foreach my $item (@changed) {
	my ($fhandle,$vhandle) = ($item->{'fhandle'},$item->{'vhandle'});
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
	$sthwork->execute($fhandle,0,$vhandle,$title,$subtitle,$year,
		$type,$hascontent,$quality,$person->lang,$status,
                Kalliope::Date::cvsTimestampToUNIX($timestamptxt));
	if ($workhead->first_child('notes')) {
	   my $i = 1;
           foreach my $note ($workhead->first_child('notes')->children('note')) {
   	       $sthnote->execute($fhandle,$vhandle,$note->text,$i++);
  	   }
	}
	if ($workhead->first_child('pictures')) {
	   my $i = 1;
           foreach my $pic ($workhead->first_child('pictures')->children('picture')) {
	       my $src = $pic->{'att'}->{'src'};
   	       $sthpicture->execute($fhandle,$vhandle,$pic->text,$src,$i++);
  	   }
	}
	if ($workhead->first_child('keywords')) {
           foreach my $key (split ',',$workhead->first_child('keywords')->text) {
   	       $sthkeyword->execute($fhandle,$vhandle,$key);
  	   }
	}
        Kalliope::Build::Timestamps::register($filename);
    }
}

sub create {
    $dbh->do("DROP TABLE IF EXISTS vaerker");
 $dbh->do(q(
	CREATE TABLE vaerker ( 
              vid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
              fhandle char(40) NOT NULL,
              fid INT NOT NULL,
              vhandle char(40) NOT NULL,
              titel text NOT NULL, 
	      underoverskrift text,
              aar char(40),
              type enum('poetry','prose'),
	      status enum('complete','incomplete'),
              hascontent enum('yes','no'),
	      cvstimestamp int,
	      quality set('korrektur1','korrektur2','korrektur3',
	                  'kilde','side'),
	      lang char(10),
	      dirty int,
	      INDEX (lang),
	      INDEX (vhandle),
	      INDEX (fhandle),
	      INDEX (type),
              UNIQUE (vid))
		  ));

    $dbh->do("DROP TABLE IF EXISTS worknotes");
 $dbh->do(q(
	CREATE TABLE worknotes ( 
              fhandle char(40) NOT NULL,
              vhandle char(40) NOT NULL,
	      note text NOT NULL,
	      orderby int NOT NULL,
	      INDEX (fhandle),
	      INDEX (vhandle))
	    ));

    $dbh->do("DROP TABLE IF EXISTS workpictures");
 $dbh->do(q(
	CREATE TABLE workpictures ( 
              fhandle char(40) NOT NULL,
              vhandle char(40) NOT NULL,
	      caption text NOT NULL,
	      url varchar(200) NOT NULL,
	      orderby int NOT NULL,
	      INDEX (fhandle),
	      INDEX (vhandle))
	    ));

    $dbh->do("DROP TABLE IF EXISTS workxkeyword");
 $dbh->do(q(
	CREATE TABLE workxkeyword ( 
              fhandle varchar(40) NOT NULL,
              vhandle varchar(40) NOT NULL,
	      keyword varchar(100) NOT NULL,
	      INDEX (fhandle),
	      INDEX (vhandle),
	      INDEX (keyword))
	    ));
}
