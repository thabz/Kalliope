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

my $sthinsert = $dbh->prepare("INSERT INTO forbogstaver (forbogstav,longdid,fhandle,vhandle,lang,type) VALUES (?,?,?,?,?,?)");

sub clean {
    my @changedWorks = @_;
    my $sth = $dbh->prepare("DELETE FROM forbogstaver WHERE fhandle = ? AND vhandle = ?");
    foreach my $entry (@changedWorks) {
       $sth->execute($entry->{'fhandle'},$entry->{'vhandle'});
    }
}

sub insert {
    my @changedWorks = @_;
    $sth = $dbh->prepare("SELECT foerstelinie,tititel as titel,longdid,fhandle,vhandle,lang FROM digte WHERE type='poem' AND fhandle = ? AND vhandle = ? ORDER BY lang");
    my @poems;
    foreach my $entry (@changedWorks) {
       $sth->execute($entry->{'fhandle'},$entry->{'vhandle'});
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
	$sthinsert->execute(substr($f->{'sort'},0,1), $$f{longdid}, $$f{fhandle}, $$f{vhandle},$f->{'lang'},$type);
    }
}

sub create {
$rc = $dbh->do("drop table if exists forbogstaver");
$rc = $dbh->do("CREATE TABLE forbogstaver ( 
              bid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
	      forbogstav char(2) NOT NULL,
	      longdid varchar(50) NOT NULL,
	      fhandle varchar(50) NOT NULL,
	      vhandle varchar(50) NOT NULL,
	      lang char(2) NOT NULL,
	      type ENUM('t','f') NOT NULL,
	      KEY forbogstav_key (forbogstav(2)), 
	      UNIQUE (bid))");
}
