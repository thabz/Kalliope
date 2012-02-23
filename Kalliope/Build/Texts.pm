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

package Kalliope::Build::Texts;
    
use XML::Twig;
use Kalliope::DB;
use Kalliope::Date;
use strict;

my $dbh = Kalliope::DB::connect();
my $sthGroup = $dbh->prepare("INSERT INTO digte (did,longdid,fhandle,parentdid,linktitel,toptitel,toctitel,tititel,foerstelinie,indhold,vaerkpos,vid,type,underoverskrift,lang,country,createtime,quality) VALUES (nextval('seq_digte_did'),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
my $sthseqval = $dbh->prepare("SELECT currval('seq_digte_did')");
my $sthseqlongdid = $dbh->prepare("SELECT nextval('seq_digte_longdid')");
my $sthnote = $dbh->prepare("INSERT INTO textnotes (longdid,note,lang,orderby) VALUES (?,?,?,?)");
my $sthpicture = $dbh->prepare("INSERT INTO textpictures (longdid,caption,url,lang,orderby) VALUES (?,?,?,?,?)");
my $sthkeyword = $dbh->prepare("INSERT INTO textxkeyword (longdid,keyword) VALUES (?,?)");
my $sthclean = $dbh->prepare("DELETE FROM digte WHERE vid = ?");
my $orderby;

sub clean {
    my ($fhandle,$vhandle) = @_;
    $sthclean->execute("$fhandle/$vhandle");
}

sub insert {
    my $sthselect = $dbh->prepare("SELECT fhandle,vhandle,vid,lang,country FROM vaerker WHERE dirty = 1");
    $sthselect->execute;
    my $sthupdate = $dbh->prepare("UPDATE vaerker SET dirty = 0 WHERE fhandle = ? AND vhandle = ?");
    my $orderby = 0;
    while (my ($fhandle,$vhandle,$vid,$lang,$country) = $sthselect->fetchrow_array) {
	clean($fhandle,$vhandle);
	my $filename  = "../fdirs/$fhandle/$vhandle.xml";
	print "           Inserting body $filename\n";
	my $twig = new XML::Twig(keep_encoding => 1,
		                 keep_spaces_in => ['body']);
	$twig->parsefile($filename);
	my $kalliopework = $twig->root;
	if ($kalliopework->first_child('workbody')) {
	    _insertGroup($fhandle,$vid,$lang,$country,undef,$kalliopework->first_child('workbody')->children);
	}
	$sthupdate->execute($fhandle,$vhandle);
    }
}

sub postinsert {
    my $SQL = q(
         UPDATE digte SET fulltext_index_column = 
            setweight(to_tsvector(coalesce(toptitel,'')), 'A') ||
            setweight(to_tsvector(coalesce(underoverskrift,'')), 'B') ||
            setweight(to_tsvector(coalesce(indhold,'')), 'B')
    );
    $dbh->do($SQL);
}

sub _insertGroup {
    my ($fhandle,$vid,$lang,$country,$parent,@nodes) = @_;
    foreach my $node (@nodes) {
 	my $head = $node->first_child('head');
	my $linktitle = $head->first_child('linktitle') ? $head->first_child('linktitle')->text : undef;
	my $toctitle = $head->first_child('toctitle') ? $head->first_child('toctitle')->sprint(1): undef;
	my $toptitle = $head->first_child('title') ? $head->first_child('title')->text : undef;
	my $indextitle = $head->first_child('indextitle') ? $head->first_child('indextitle')->text : undef;
	my $quality = $head->first_child('quality') ? $head->first_child('quality')->text : undef;
	my $longdid = $node->id;
	my $subtitle;
	if ($head->first_child('subtitle')) {
	    if ($head->first_child('subtitle')->first_child('line')) {
	        my @lines;
		foreach my $line ($head->first_child('subtitle')->children) {
		    push @lines,$line->text;
		}
		$subtitle = join "\n",@lines;
	    } else {
		$subtitle = $head->first_child('subtitle')->text;
	    }
	}

	my $type = $node->tag;
	unless ($longdid) {
	    $sthseqlongdid->execute();
	    ($longdid) = $sthseqlongdid->fetchrow_array;
	    $longdid = "dummy$longdid";
	}
	if ($type eq 'section' || $type eq 'group') {
	    if (!$indextitle) {
		$indextitle = $toptitle;
	    }
	    if (!$toctitle) {
		$toctitle = $toptitle;
	    }
	    if (!$linktitle) {
		$linktitle = $toptitle;
	    }
	    $sthGroup->execute($longdid,$fhandle,$parent,$linktitle,$toptitle,$toctitle,$indextitle,'','',$orderby++,$vid,$type,$subtitle,$lang,$country,_createtime($longdid),$quality);
	    doDepends($head,$longdid,$fhandle,$vid,$lang);
	    $sthseqval->execute();
	    my ($newparent) = $sthseqval->fetchrow_array;
	    _insertGroup($fhandle,$vid,$lang,$country,$newparent,$node->first_child('content')->children);
	} else {
	    my $longdid = $node->id;
 	    my $body = $node->first_child('body');
 	    my $firstline = $head->first_child('firstline') ? $head->first_child('firstline')->text : '';

            if (!$toptitle) {
		$toptitle = $firstline;
	    }
	    if (!$indextitle) {
		$indextitle = $toptitle;
	    }
	    if (!$toctitle) {
		$toctitle = $toptitle;
	    }
	    if (!$linktitle) {
		$linktitle = $toptitle;
	    }
	    
	    $sthGroup->execute($longdid,$fhandle,$parent,$linktitle,$toptitle,$toctitle,$indextitle,$firstline,$body->xml_string,$orderby++,$vid,$type,$subtitle,$lang,$country,_createtime($longdid),$quality);
	    doDepends($head,$longdid,$fhandle,$vid,$lang);
	}

    }
}

sub doDepends {
    my ($head,$longdid,$fhandle,$vid,$poemlang) = @_;
    if ($head->first_child('notes')) {
	my $i = 1;
	foreach my $note ($head->first_child('notes')->children('note')) {
	    my $notelang = $note->{'att'}->{'lang'} || 'da';
	    $sthnote->execute($longdid,$note->xml_string,$notelang,$i++);
	}
    }
    if ($head->first_child('pictures')) {
	my $i = 1;
	foreach my $pic ($head->first_child('pictures')->children('picture')) {
	    my $src = $pic->{'att'}->{'src'};
	    my $notelang = $pic->{'att'}->{'lang'} || 'da';
	    if (-e "../fdirs/$fhandle/$src") {
		$sthpicture->execute($longdid,$pic->xml_string,$src,$notelang,$i++);
	    } else {
		print STDERR "Image $src for $longdid not found.\n";
	    }
	}
    }
    if ($head->first_child('keywords')) {
	foreach my $key (split ',',$head->first_child('keywords')->text) {
	    $sthkeyword->execute($longdid,$key);
	}
    }

	}

sub create {
    $dbh->do(q/CREATE SEQUENCE seq_digte_did INCREMENT 1 START 1/);
    $dbh->do(q/CREATE SEQUENCE seq_digte_longdid INCREMENT 1 START 1/);
    $dbh->do(q|CREATE TABLE digte ( 
              did int NOT NULL PRIMARY KEY, 
	      parentdid int REFERENCES digte(did),
              longdid varchar(40) NOT NULL UNIQUE,
              fhandle VARCHAR(20) NOT NULL, -- REFERENCES fnavne(fhandle) ON DELETE RESTRICT,
              vid VARCHAR(80) NOT NULL REFERENCES vaerker(vid) ON DELETE CASCADE,
              vaerkpos INT,
              toctitel text,
	      tititel text,
	      toptitel text,
	      linktitel text,
              foerstelinie text,
              underoverskrift text,
              indhold text,
	      type varchar(10), -- enum('poem','prose','group','section'),
	      quality varchar(50), --set('korrektur1','korrektur2','korrektur3', 'kilde','side'),
              layouttype char(5) default 'digt', -- enum('prosa','digt') default 'digt',
	      createtime INT NOT NULL,
	      fulltext_index_column tsvector,
	      lang char(2),
	      country char(2))|);

 $dbh->do(q/CREATE INDEX digte_longdid ON digte(longdid)/);
 $dbh->do(q/CREATE INDEX digte_fhandle ON digte(fhandle)/);
 $dbh->do(q/CREATE INDEX digte_lang ON digte(lang)/);
 $dbh->do(q/CREATE INDEX digte_country ON digte(country)/);
 $dbh->do(q/CREATE INDEX digte_type ON digte(type)/);
 $dbh->do(q/CREATE INDEX digte_createtime ON digte(createtime)/);
 $dbh->do(q/CREATE INDEX digte_vid ON digte(vid)/);
 $dbh->do(q/CREATE INDEX digte_textsearch_idx ON digte USING gin(fulltext_index_column)/);
 
   $dbh->do(q/GRANT SELECT ON TABLE digte TO public/);


    $dbh->do(q(
	CREATE TABLE textnotes ( 
              longdid varchar(40) NOT NULL REFERENCES digte(longdid) ON DELETE CASCADE,
	      note text NOT NULL,
	      lang char(2) NOT NULL,
	      orderby int NOT NULL)
	    ));
   $dbh->do(q/CREATE INDEX textnotes_longdid ON textnotes(longdid)/);
   $dbh->do(q/GRANT SELECT ON TABLE textnotes TO public/);

    $dbh->do(q(
	CREATE TABLE textpictures ( 
              longdid varchar(40) NOT NULL REFERENCES digte(longdid) ON DELETE CASCADE,
	      caption text,
	      lang char(2) NOT NULL,
	      url varchar(200) NOT NULL,
	      orderby int NOT NULL)
	    ));
   $dbh->do(q/CREATE INDEX textpictures_longdid ON textpictures(longdid)/);
   $dbh->do(q/GRANT SELECT ON TABLE textpictures TO public/);

    $dbh->do(q(
	CREATE TABLE textxkeyword ( 
              longdid varchar(40) NOT NULL REFERENCES digte(longdid) ON DELETE CASCADE,
	      keyword varchar(100) NOT NULL -- REFERENCES keywords(ord)
	    )
	    ));
   $dbh->do(q/CREATE INDEX textxkeyword_longdid ON textxkeyword(longdid)/);
   $dbh->do(q/CREATE INDEX textxkeyword_keyword ON textxkeyword(keyword)/);
   $dbh->do(q/GRANT SELECT ON TABLE textxkeyword TO public/);

   $dbh->do(q(
	CREATE TABLE digthits /* IF NOT EXISTS */ ( 
              longdid varchar(40) NOT NULL,
	      hits int,
	      lasttime int)
	    ));

}

sub drop {
    $dbh->do("DROP TABLE textxkeyword");
    $dbh->do("DROP TABLE textpictures");
    $dbh->do("DROP TABLE textnotes");
    $dbh->do(q/DROP SEQUENCE seq_digte_did/);
    $dbh->do(q/DROP SEQUENCE seq_digte_longdid/);
    $dbh->do("DROP TABLE digte");
}

sub _createtime {
    my $longdid = shift;
    my ($year,$mon,$day) = $longdid =~ /(\d\d\d\d)(\d\d)(\d\d)/;
    my $time = POSIX::mktime(0,0,2,$day,$mon-1,$year-1900) || 0;
    return $time;
}

1;
