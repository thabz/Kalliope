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


package Kalliope::Guestbook;

use strict;
use Kalliope::Guestbook::Entry;
use Kalliope::DB;
use utf8;

my $dbh = Kalliope::DB->connect;
my $pagesize = 10;

sub setPageSize {
    $pagesize = shift;
}

sub pageCount {
    my $sth = $dbh->prepare("SELECT count(*) FROM guestbook WHERE active = TRUE");
    $sth->execute();
    my ($count) = $sth-fetchrow_array;
    return $count / $pagesize;
}

# @param $pageNum page offset. First page is 1.
sub getPage {
    my $pageNum = shift;
    my @result;
    $pageNum--;
    my $sth = $dbh->prepare("SELECT * FROM guestbook WHERE active = TRUE LIMIT ? OFFSET ?");
    $sth->execute($pagesize,$pageNum*$pagesize);
    while ($h = $sth->fetchrow_hashref) {
	push @result, new Kalliope::Guestbook::Entry($h);
    }
    return @result;
}

sub createEntry {
    my $data = shift;
    my $sth = $dbh->prepare("INSERT INTO guestbook (id,name,email,homepage,subject,body,unixtime,active) VALUES (nextval('seq_guestbook_id'),?,?,?,?,?,?,?)");
    $sth->execute($$data{'name'},$$data{'email'},$$data{'homepage'},$$data{'subject'},$$data{'body'},$$data{'unixtime'},1);
}

1;
