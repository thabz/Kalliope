
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

package Kalliope::Person;

use strict ('vars');
use Carp;
use Kalliope::DB;

my $dbh = Kalliope::DB->connect;

sub new {
    my ($class,%arg) = @_;
    my $sql;
    $sql = 'fhandle = "'.$arg{'fhandle'}.'"' if defined $arg{'fhandle'};
    $sql = 'fid = "'.$arg{'fid'}.'"' if defined $arg{'fid'};
    confess "Need some kind of id to initialize a new person\n" unless $sql;
    my $sth = $dbh->prepare("SELECT * FROM  fnavne WHERE $sql");
    $sth->execute();
    my $obj = $sth->fetchrow_hashref;
    bless $obj,$class;
    return $obj;
}

sub fhandle {
    return $_[0]->{'fhandle'};
}

sub fid {
    return $_[0]->{'fid'};
}

sub thumbURI {
    my $self = shift;
    return $self->{'thumb'} ? 'fdirs/'.$self->fhandle.'/thumb.jpg' : '';
}

sub hasBio {
   return $_[0]->{'bio'};
}

sub bio {
   my $self = shift;
   my $sth = $dbh->prepare("SELECT biotext FROM fnavne WHERE fid = ?");
   $sth->execute($self->fid);
   my $bio = $sth->fetchrow_array || '';
   $bio =~ s/<BR>/<BR>&nbsp;&nbsp;&nbsp;&nbsp;/gi;
   Kalliope::buildhrefs(\$bio);
   return $bio;
}

sub lifespan {
   my $self = shift;
   return "(".$self->yearBorn.'-'.$self->yearDead.')';
}

sub yearBorn {
   return $_[0]->{'foedt'};
}

sub yearDead {
   return $_[0]->{'doed'};
}


sub sortString {
   return $_[0]->reversedName;
}

sub name {
   return $_[0]->{'fornavn'}.' '.$_[0]->{'efternavn'};
}

sub efternavn {
   return $_[0]->{'efternavn'};
}

sub reversedName {
   return $_[0]->{'efternavn'}.', '.$_[0]->{'fornavn'};
}

sub bioURI {
    return 'biografi.cgi?fhandle='.$_[0]->fhandle;
}

sub worksURI {
    return 'fvaerker.pl?'.$_[0]->fhandle;
}

sub clickableTitle {
    return $_[0]->clickableNameGreen;
}

sub smallIcon {
     return '<IMG BORDER=0 HEIGHT=32 WIDTH=32 SRC="gfx/poet_40.GIF">';
}

sub clickableNameBlack {
   my $self = shift;
   return '<A CLASS=black HREF="'.$self->bioURI.'">'.$self->name.'</A>';
}

sub clickableNameGreen {
   my $self = shift;
   return '<A CLASS=green HREF="'.$self->bioURI.'">'.$self->name.'</A>';
}

sub concurrentPersons {

}

sub poeticalWorks {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT vid FROM vaerker WHERE fid=? AND type='v' ORDER BY aar");
    $sth->execute($self->fid);
    my @list;
    while (my ($vid) = $sth->fetchrow_array) {
        push @list, new Kalliope::Work('vid' => $vid);
    }
    return @list;
}

sub proseWorks {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT vid FROM vaerker WHERE fid=? AND type='p' ORDER BY aar");
    $sth->execute($self->fid);
    my @list;
    while (my ($vid) = $sth->fetchrow_array) {
        push @list, new Kalliope::Work('vid' => $vid);
    }
    return @list;
}
1;
