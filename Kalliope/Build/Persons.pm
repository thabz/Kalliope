
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

package Kalliope::Build::Persons;
    
use XML::DOM;
require Unicode::String;
use Kalliope::DB;
use Kalliope::Date;
use strict;

my $dbh = Kalliope::DB::connect();

sub parse {
   my $filename = shift;
   my $parser = new XML::DOM::Parser;
   my $doc = $parser->parsefile($filename);
 
   my %persons;
   my $persons = $doc->getElementsByTagName('person');
   my $n = $persons->getLength;

   for (my $i = 0; $i < $n; $i++) {
       my $p;
       my $person = $persons->item($i);
       my $fhandle = $person->getAttributeNode('id')->getValue;
       $p->{'lang'} = $person->getAttributeNode('lang')->getValue;
       $p->{'type'} = $person->getAttributeNode('type')->getValue;
       $p->{'fhandle'} = Unicode::String::utf8($fhandle)->latin1;

       if ($person->getElementsByTagName('firstname')->item(0)->getFirstChild) {
           my $firstname = Unicode::String::utf8($person->getElementsByTagName('firstname')->item(0)->getFirstChild->getNodeValue);
	   $p->{'firstname'} = $firstname->latin1;
       }

       if ($p->{'type'} ne 'collection') {
           my $lastname = Unicode::String::utf8($person->getElementsByTagName('lastname')->item(0)->getFirstChild->getNodeValue);
	   $p->{'lastname'} = $lastname->latin1;
	   my $born = $person->getElementsByTagName('born')->item(0)->getElementsByTagName('date')->item(0)->getFirstChild->getNodeValue;
	   ($p->{'born'}) = Kalliope::Date::splitDate($born);
	   $p->{'bornfull'} = $born;
	   if ($person->getElementsByTagName('born')->item(0)->getElementsByTagName('place')->item(0)) {
	       my $place = $person->getElementsByTagName('born')->item(0)->getElementsByTagName('place')->item(0)->getFirstChild->getNodeValue;
	       $p->{'bornplace'} = Unicode::String::utf8($place)->latin1;
	   }

	   my $dead = $person->getElementsByTagName('dead')->item(0)->getElementsByTagName('date')->item(0)->getFirstChild->getNodeValue;
	   ($p->{'dead'}) = Kalliope::Date::splitDate($dead);
	   $p->{'deadfull'} = $dead;
	   if ($person->getElementsByTagName('dead')->item(0)->getElementsByTagName('place')->item(0)) {
	       my $place = $person->getElementsByTagName('dead')->item(0)->getElementsByTagName('place')->item(0)->getFirstChild->getNodeValue;
	       $p->{'deadplace'} = Unicode::String::utf8($place)->latin1;
	   }
       }

       $persons{$fhandle} = $p;
   }
   return %persons;
}

sub create {
    $dbh->do("DROP TABLE IF EXISTS fnavne");
    $dbh->do("CREATE TABLE fnavne ( 
              fid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
              fhandle char(40) NOT NULL, 
              fornavn text DEFAULT '', 
              efternavn text DEFAULT '',
              foedt char(8), 
              doed char(8), 
              sprog char(2), 
              land text,
              /* Beholdning */
              cols int(2),
              thumb int(1),
              pics int(1),
              bio int(1),
              biotext text,
              links int(1),
              sekundaer int(1),
              primaer int(1),
              vaerker int(1),
              vers int(1),
              prosa int(1),
              KEY fhandle_index (fhandle(10)), 
              UNIQUE (fid))");
}

sub insert {
    my %persons = @_;

    my %fhandle2fid;
    my $rc = $dbh->prepare("INSERT INTO fnavne (fhandle,fornavn,efternavn,foedt,doed,sprog,cols,thumb,pics,biotext,bio,links,sekundaer,primaer,vaerker,vers,prosa) VALUES (?,?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?,?)");
    
    foreach my $fhandle (keys %persons) { 
	my $person = $persons{$fhandle};
	my $fdir = "../fdirs/$fhandle";

	my ($fcols,$fthumb,$pics,$fbio,$flinks,$fsekundaer,$fprimaer,$fvaerker,$fprosa,$fvaerkerindhold);	
	my  $biotext = '';
	my  @keys = ();

	if (-e $fdir."/thumb.jpg") {
	    $fthumb=1;
	}
	
	my $fpics = 0;
	while (-e $fdir."/p".($fpics+1).".jpg") { $fpics++; };
	$fcols++ if ($fpics);
	
	if (-e $fdir."/bio.txt") {
	    open(BIO,$fdir."/bio.txt");
	    while (<BIO>) {
		if (/^K:/) {
		    s/^K://;
		    chop;
		    push @keys,$_;
		} else {
		    $biotext .= $_;
		} 
	    }
	    close(BIO);
	    $fbio=1;
	    $fcols++;
	}
	
	if (-e $fdir."/links.txt") {
	    $flinks=1;
	    $fcols++;
	}
	
	if (-e $fdir."/sekundaer.txt") {
	    $fsekundaer=1;
	    $fcols++;
	}

	if (-e $fdir."/primaer.txt") {
	    $fprimaer=1;
	    $fcols++;
	}
	
	if (-e $fdir."/vaerker.txt") {
	    $fvaerker=1;
            # Undersøg om der er indhold i disse vaerker.
	    open (FILE,$fdir."/vaerker.txt");
	    foreach (<FILE>) {
		my ($vhandle,$titel,$vaar,$type) = split(/=/,$_);
		if ($type eq "p") {
		    $fprosa = 1;
		} elsif (-e $fdir."/".$vhandle.".txt") {
		    $fvaerkerindhold = 1;
		}
	    }
	    $fcols+=2;
	}   

        $rc->execute($fhandle,$person->{'firstname'},$person->{'lastname'},$person->{'born'} || '',$person->{'dead'} || '',$person->{'lang'},$fcols,$fthumb,$fpics,$biotext,$fbio,$flinks,$fsekundaer,$fprimaer,$fvaerkerindhold,$fvaerker,$fprosa);
	my $lastid = Kalliope::DB::getLastInsertId($dbh,"fnavne");
        $fhandle2fid{$fhandle} = $lastid;
	foreach (@keys) {
#	    &insertkeywordrelation($_,$lastid,'biografi');
	}
    }
    return %fhandle2fid;
}

