#!/usr/bin/perl -w

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


package Kalliope::Work;

use strict ('vars');
use Carp;
use Kalliope::DB;
use Kalliope::Keyword;
use Kalliope::Person;

my $dbh = Kalliope::DB->connect;

sub new {
    my ($class,%arg) = @_;
    my $sql;
    $sql = 'vhandle = "'.$arg{'longvid'}.'" and fhandle = "'.$arg{'fhandle'}.'"' if defined $arg{'longvid'};
    $sql = 'vid = "'.$arg{'vid'}.'"' if defined $arg{'vid'};
    confess "Need some kind of id to initialize a new work\n" unless $sql;
    my $sth = $dbh->prepare("SELECT * FROM vaerker WHERE $sql");
    $sth->execute();
    my $obj = $sth->fetchrow_hashref;
    bless $obj,$class;
    confess "Work not found in DB\n" unless $obj->{'vid'};
    return $obj;
}

sub vid {
    return $_[0]->{'vid'};
}

sub longvid {
    return shift->{'vhandle'};
}

sub vhandle {
    return shift->{'vhandle'};
}

sub title {
    return shift->{'titel'};
}

sub titleWithYear {
    my $self = shift;
    return $self->title.' '.$self->parenthesizedYear;
}

sub subtitle {
    return shift->{'underoverskrift'};
}


sub notes {
    my $self = shift;
    return $self->{'noter'}; 
}

sub keywords {
    # FIXME: Simpel copy/paste fra Poem.pm
    my $self = shift;
    my @keywords;
    my $sth = $dbh->prepare("SELECT id FROM keywords_relation WHERE keywords_relation.otherid = ? AND keywords_relation.othertype = 'digt'");
    $sth->execute($self->did);
    while (my $id = $sth->fetchrow_array) {
       push @keywords,new Kalliope::Keyword($id);
    }
    return @keywords;
}

sub updateHitCounter {
    my $self = shift;
    my $longdid = $self->longdid;
    my $hits = $dbh->selectrow_array("select hits from digthits where longdid='$longdid'");
    $dbh->do("replace into digthits (longdid,hits,lasttime) VALUES (?,?,?)","",$longdid,++$hits,time());
}

sub fid {
    return $_[0]->{'fid'};
}

sub author {
    my $self = shift;
    return new Kalliope::Person('fid' => $self->fid); 
}

sub year {
    return $_[0]->{'aar'};
}

sub parenthesizedYear {
    my $self = shift;
    my $year = $self->year;
    return $year eq '?' ? '' : "($year)";
}

sub hasContent {
    return $_[0]->{'findes'} == 1;
}

sub iconURI {
    my $self = shift;
    #TODO: Måske skulle værker uden år have et specielt ikon.
    return $self->hasContent ? 'gfx/book_40.GIF' : 'gfx/book_40_high.GIF';
}

1;
