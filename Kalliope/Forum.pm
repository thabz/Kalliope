
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

package Kalliope::Forum;

use strict;
use Kalliope::DB();
use Kalliope::Forum::Post();

my $dbh = Kalliope::DB->connect;

my @foraInfo = ( {title => 'Løst og fast',
               desc  => 'Her kan du diskutere alt muligt',
	       smallicon  => 'gfx/evolution-48.png',
	       bigicon  => 'gfx/evolution-192.png'},
              {title => 'Tekstkritik',
               desc  => 'Her snakker vi tekstkritik',
	       smallicon  => 'gfx/evolution-48.png',
	       bigicon  => 'gfx/evolution-192.png'},
              {title => 'Kalliope',
               desc  => 'Her snakker vi om Kalliope',
	       smallicon  => 'gfx/evolution-48.png',
	       bigicon  => 'gfx/evolution-192.png'},
              {title => 'Hjælp',
               desc  => 'Her kan du spørge om hjælp til hvad som helst',
	       smallicon  => 'gfx/evolution-48.png',
	       bigicon  => 'gfx/evolution-192.png'},
	       );

sub new {
    my ($class,$forumid) = @_;
    my $self = bless {},$class;
    $self->{'id'} = $forumid;
    return $self;
}

sub getId {
    return shift->{'id'};
}

sub getTitle {
    my $self = shift;
    return $foraInfo[$self->getId]->{'title'};
}

sub getDescription {
    my $self = shift;
    return $foraInfo[$self->getId]->{'desc'};
}

sub getSmallIcon {
    my $self = shift;
    return $foraInfo[$self->getId]->{'smallicon'};
}

sub getBigIcon {
    my $self = shift;
    return $foraInfo[$self->getId]->{'bigicon'};
}


sub getForumTitle {
    my $self = shift;
    return $foraInfo[$self->getId]->{'title'};
}

sub getHeadersURL {
   return 'forum.cgi?forumid='.shift->getId;
}

sub getNumberOfForas {
   return 4;
}

sub getLatestPost {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT id FROM forum WHERE forum_id = ? ORDER BY date DESC LIMIT 1");
    $sth->execute($self->getId);
    my ($max) = $sth->fetchrow_array;
    return $max ? Kalliope::Forum::Post::newFromId($max) : undef;
}

sub getLatestThreadIds {
    my ($self,%arg) = @_;
    my $sth = $dbh->prepare("SELECT thread_id FROM forum WHERE parent = 0 AND forum_id = ? ORDER BY latest_thread_activity DESC LIMIT ?,?"); 
    $sth->execute($self->getId,$arg{'begin'},$arg{'count'});

    my @result = ();
    while (my ($h) = $sth->fetchrow_array) {
         push @result,$h;
    }
    return @result;
}

sub getPostsInThread {
    my ($self,$thread_id) = @_;
    my @result;
    my $sth = $dbh->prepare("SELECT * FROM forum WHERE thread_id = ? ORDER BY id");
    $sth->execute($thread_id);
    while (my $h = $sth->fetchrow_hashref) {
        push @result,new Kalliope::Forum::Post($h);
    }
    return @result;
}

#sub getThreadAsHTML {
#    my $thread_id = shift;
#    my $HTML;
#    foreach my $post (@posts) {
#	my $rid = "row".$post->id;
#        $HTML .= qq|<TR><TD ID="${rid}a" CLASS="unsel">|..qq|</TD><TD ID="${rid}b" CLASS="unsel"><A ID="${rid}d" CLASS="unsel" HREF="javascript:{}" onClick="return parent.gotoPosting(|.$post->id.');">'.$post->subject.qq|</A></TD><TD ID="${rid}c" CLASS="unsel">|.$post->dateForDisplay.'</TD></TR>';
#    }
#    return $HTML;
#}

