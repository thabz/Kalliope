
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
    
use XML::Twig;
use Kalliope::DB;
use Kalliope::Date;
use strict;

my $dbh = Kalliope::DB::connect();

sub parse {
    my $filename = shift;
    my %persons;

    my $twig = new XML::Twig(keep_encoding => 1);
    $twig->parsefile($filename);
    foreach my $person ($twig->root->children('person')) {
	my $p;
	my $fhandle = $person->{'att'}->{'id'};
	$p->{'lang'} = $person->{'att'}->{'lang'};
	$p->{'type'} = $person->{'att'}->{'type'};
	$p->{'fhandle'} = $fhandle;

	if ($person->first_child('name')->first_child('firstname')) {
	    $p->{'firstname'} = $person->first_child('name')->first_child('firstname')->text;
	}

	if ($person->first_child('works')) {
	    my $works = $person->first_child('works')->text;
	    my @works = split ',',$works;
	    $p->{'works'} = \@works;
	    $p->{'workslist'} = $works;
	}

	if ($p->{'type'} ne 'collection') {
	    if ($person->first_child('name')->first_child('lastname')) {
	        $p->{'lastname'} = $person->first_child('name')->first_child('lastname')->text;
	    }

	    my $period = $person->first_child('period');

	    if ($period->first_child('born')) {
	        my $born = $period->first_child('born')->first_child('date')->text;
	        ($p->{'born'}) = Kalliope::Date::splitDate($born);
	        $p->{'bornfull'} = $born;
	        if ($period->first_child('born')->first_child('place')) {
		    $p->{'bornplace'} = $period->first_child('born')->first_child('place')->text;
	        }
	    }

	    if ($period->first_child('dead')) {
		my $dead = $period->first_child('dead')->first_child('date')->text;
		($p->{'dead'}) = Kalliope::Date::splitDate($dead);
		$p->{'deadfull'} = $dead;

		if ($period->first_child('dead')->first_child('place')) {
		    $p->{'deadplace'} = $period->first_child('dead')->first_child('place')->text;
		}
	    }

	    my $d;
	    $d = "<b>F&oslash;dt: </b>".$p->{'bornfull'};
	    $d .= ", ".$p->{'bornplace'} if $p->{'bornplace'};
	    $d .= '<br>';
	    $d .= "<b>D&oslash;d: </b>".$p->{'deadfull'};
	    $d .= ", ".$p->{'deadplace'} if $p->{'deadplace'};
	    $d .= '<br>';

	    if ($person->first_child('name')->first_child('fullname')) {
		$d .= '<b>Fulde navn: </b>'.$person->first_child('name')->first_child('fullname')->text;
	    }
	    if ($person->first_child('name')->first_child('pseudonym')) {
		$d .= '<b>Pseudonym: </b>'.$person->first_child('name')->first_child('pseudonym')->text;
	    }
	    if ($person->first_child('name')->first_child('realname')) {
		$d .= '<b>Dåbsnavn: </b>'.$person->first_child('name')->first_child('realname')->text;
	    }
	    if ($person->first_child('name')->first_child('alternative')) {
		$d .= '<b>Andet navn: </b>'.$person->first_child('name')->first_child('alternative')->text;
	    }
	    $p->{'detaljer'} = $d;
	}

	$persons{$fhandle} = $p;
    }
    return %persons;
}

sub create {
    $dbh->do("CREATE TABLE fnavne ( 
    fhandle varchar(20) NOT NULL PRIMARY KEY, 
    fornavn text DEFAULT '', 
    efternavn text DEFAULT '',
    detaljer text DEFAULT '',
    foedt varchar(8), 
    doed varchar(8), 
    sprog char(2), 
    land text,
    /* Beholdning */
    cols int,
    thumb int,
    pics int,
    bio int,
    biotext text,
    hashenvisninger int,
    links int,
    sekundaer int,
    primaer int,
    vaerker varchar(1000),
    vers int,
    prosa int,
    type varchar(32),
    fulltext_index_column tsvector,
    workslist text)
	");
	$dbh->do(q/CREATE INDEX fnavne_textsearch_idx ON fnavne USING gin(fulltext_index_column)/);
    $dbh->do(q/GRANT SELECT ON TABLE fnavne TO public/);
}


sub drop {
    $dbh->do("DROP TABLE fnavne");
}

sub insert {
    my %persons = @_;

    my %fhandle2fid;
    my $rc = $dbh->prepare("INSERT INTO fnavne (fhandle,fornavn,efternavn,foedt,doed,sprog,cols,thumb,pics,biotext,bio,links,sekundaer,primaer,vaerker,vers,prosa,detaljer,type,workslist) VALUES (?,?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    
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

        $rc->execute($fhandle,$person->{'firstname'},$person->{'lastname'},$person->{'born'} || '',$person->{'dead'} || '',$person->{'lang'},$fcols,$fthumb,$fpics,$biotext,$fbio,$flinks,$fsekundaer,$fprimaer,$fvaerkerindhold,$fvaerker,$fprosa,$person->{'detaljer'},$person->{'type'} || '',$person->{'workslist'});
	foreach (@keys) {
#	    &insertkeywordrelation($_,$lastid,'biografi');
	}
    }
    $dbh->do(qq||);
}

sub postinsert {
   my $SQL = q(
UPDATE fnavne SET vers = 1
WHERE 0 < 
(SELECT count(*) 
   FROM vaerker v
   WHERE v.fhandle = fnavne.fhandle
   AND v.hascontent = 'yes'
   AND v.type = 'poetry')
	   );
   $dbh->do($SQL);
   $SQL = q(
UPDATE fnavne SET prosa = 1
WHERE 0 < 
(SELECT count(*) 
   FROM vaerker v
   WHERE v.fhandle = fnavne.fhandle
   AND v.hascontent = 'yes'
   AND v.type = 'prose')
	   );
   $dbh->do($SQL);
   $SQL = q(
       UPDATE fnavne SET fulltext_index_column = 
          setweight(to_tsvector(coalesce(efternavn,'')), 'A') ||
          setweight(to_tsvector(coalesce(fornavn,'')), 'B')
  );
  $dbh->do($SQL);
}

sub buildHasHenvisninger {
    my $dbh = shift;
    my $sth = $dbh->prepare("SELECT fromid,toid FROM xrefs,digte WHERE xrefs.toid = digte.longdid AND digte.fid = ?");
    my $sthp = $dbh->prepare("SELECT fid FROM fnavne");
    my $sthu = $dbh->prepare("UPDATE fnavne SET hashenvisninger = ? WHERE fid = ?");
    $sthp->execute;
    while (my ($fid) = $sthp->fetchrow_array) {
	$sth->execute($fid);
	my $antal = $sth->rows;
        next unless $antal > 0;
        my $i = 0;
        while (my ($fromid,$toid) = $sth->fetchrow_array) {
           my $digt = new Kalliope::Poem(longdid => $fromid);
           $i++ unless $digt->fid == $fid;
        }
        $sthu->execute($i,$fid);
    }
}
