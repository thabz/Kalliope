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

package Kalliope::Build::Firstletters;

use Kalliope::DB;
use Kalliope::Sort;

my $dbh = Kalliope::DB::connect();

my $sthinsert = $dbh->prepare("INSERT INTO forbogstaver (bid,forbogstav,longdid,fhandle,lang,type) VALUES (nextval('seq_forbogstaver_bid'),?,?,?,?,?)");

sub clean {
}

sub insert {
    my @changedWorks = @_;
    $sth = $dbh->prepare("SELECT foerstelinie,tititel as titel,longdid,fhandle,lang FROM digte WHERE type='poem' AND vid = ? ORDER BY lang");
    my @poems;
    foreach my $entry (@changedWorks) {
       $sth->execute($entry->{'fhandle'}."/".$entry->{'vhandle'});
       my @poems;
       while (my $poem = $sth->fetchrow_hashref) {
	   push @poems,$poem;
       }
       map { $_->{'sort'} = $_->{'titel'} } @poems;
       _insert('t',@poems);
       map { $_->{'sort'} = $_->{'foerstelinie'} } @poems;
       _insert('f',@poems);
    }
}

sub _insert {
    my ($type,@f) = @_;
    foreach $f (sort { Kalliope::Sort::sort ($a,$b) } @f) {
	next unless $f->{'sort'};
	$f->{'sort'} =~ s/Aa/Å/g;
	$f->{'sort'} =~ tr/ÁÀÉÈÖ0-9/AAEEØ........../;
	my $letter = substr($f->{'sort'},0,1);
	$letter = '.' unless $letter =~ /[A-ZÆØÅ]/;
	$sthinsert->execute($letter, $$f{longdid}, $$f{fhandle},$f->{'lang'},$type);
    }
}

sub create {
    $dbh->do(q/CREATE SEQUENCE seq_forbogstaver_bid INCREMENT 1 START 1/);
    $dbh->do("CREATE TABLE forbogstaver ( 
              bid int DEFAULT '0' NOT NULL PRIMARY KEY,
	      forbogstav char(1) NOT NULL,
	      longdid varchar(40) NOT NULL REFERENCES digte(longdid) ON DELETE CASCADE,
	      fhandle varchar(50), -- NOT NULL REFERENCES fnavne(fhandle) ON DELETE RESTRICT,
	      lang char(2) NOT NULL,
	      type char(1)) -- ENUM('t','f') NOT NULL
	      ");
   $dbh->do(q/CREATE INDEX forbogstaver_forbogstav ON forbogstaver(forbogstav)/);
   $dbh->do(q/CREATE INDEX forbogstaver_lang ON forbogstaver(lang)/);
   $dbh->do(q/CREATE INDEX forbogstaver_type ON forbogstaver(type)/);
   $dbh->do(q/GRANT SELECT ON TABLE forbogstaver TO public/);
}

sub drop {
    $dbh->do(q/DROP SEQUENCE seq_forbogstaver_bid/);
    $dbh->do("DROP TABLE forbogstaver");

}

1;


