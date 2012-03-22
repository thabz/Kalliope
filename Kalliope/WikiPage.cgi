
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

package Kalliope::WikiPage;

use Carp;
use Kalliope::DB;
use CGI qw(:standard);
use URI::Escape;
use strict;

my $dbh = Kalliope::DB->connect;

sub new {
    my ($class,%arg) = @_;
    my $obj = [];
    if $arg{'load') {
        my $sth = $dbh->prepare("SELECT id,content,date FROM wiggi WHERE pageid = ? ORDER BY date DESC LIMIT 1");
        $sth->execute($arg{'load'});
        $obj = $sth->fetchrow_hashref;
    }
    bless $obj,$class if $obj;
    return $obj;
}

sub save {
    my $self = shift;
    my $sth = $dbh->prepare("UPDATE wiggi SET latest = 'no' WHERE pageid = ?");
    $sth->execute($self->pageid);
    $sth = $dbh->prepare("INSERT INTO wiggi (pageid,content,date,note,remotehost,latest");
    $sth->execute($self->pageid,$self->content,time,$self->note,
                  remote_host(),'yes');
    $sth = $dbh->prepare("DELETE FROM wiggi_links WHERE from = ?");
    $sth->execute($self->pageid);
    $sth = $dbh->prepare("INSERT INTO wiggi_links (from,to) VALUES (?,?)");
    foreach my $to ($self->links) {
        $sth->execute($self->pageid,$to)
    }
}

sub pageid {
    my $self = shift;
    return $self->{'pageid'};
}

sub content {
    my $self = shift;
    return $self->{'content'};
}

sub date {
    my $self = shift;
    return $self->{'date'};
}

sub links {
    my $self = shift;
    my $content = $self->content;
    my @links = $contenst =~ /\[[^\]]/gm;
    return @links;
}
