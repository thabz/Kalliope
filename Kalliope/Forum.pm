
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
use Kalliope::DB ();
use Kalliope::Forum::Post();
use utf8;


my @foraInfo = ( {title => 'Løst og fast',
               desc  => 'Her kan du diskutere alt muligt',
	       smallicon  => 'gfx/icons/forum-w48.gif',
	       bigicon  => 'gfx/icons/forum-h70.gif'},
              {title => 'Tekstkritik',
               desc  => 'Her snakker vi tekstkritik',
	       smallicon  => 'gfx/icons/forum-w48.gif',
	       bigicon  => 'gfx/icons/forum-h70.gif'},
              {title => 'Kalliope',
               desc  => 'Her snakker vi om Kalliope',
	       smallicon  => 'gfx/icons/forum-w48.gif',
	       bigicon  => 'gfx/icons/forum-h70.gif'},
              {title => 'Hjælp',
               desc  => 'Her kan du spørge om hjælp til hvad som helst',
	       smallicon  => 'gfx/icons/forum-w48.gif',
	       bigicon  => 'gfx/icons/forum-h70.gif'},
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
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT id FROM forum WHERE forum_id = ? ORDER BY date DESC LIMIT 1");
    $sth->execute($self->getId);
    my ($max) = $sth->fetchrow_array;
    return $max ? Kalliope::Forum::Post::newFromId($max) : undef;
}

sub getLatestThreadIds {
    my ($self,%arg) = @_;
    my $begin = $arg{'begin'};
    my $count = $arg{'count'};
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT thread_id FROM forum WHERE parent = 0 AND forum_id = ? ORDER BY latest_thread_activity DESC LIMIT $begin,$count"); 
    $sth->execute($self->getId);

    my @result = ();
    while (my ($h) = $sth->fetchrow_array) {
         push @result,$h;
    }
    return @result;
}

sub getNumberOfThreads {
    my $self = shift;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT count(*) FROM forum WHERE parent = 0 AND forum_id = ?"); 
    $sth->execute($self->getId);
    my ($count) = $sth->fetchrow_array;
    return $count;
}

sub getPostsInThread {
    my ($self,$thread_id) = @_;
    my @result;
    my $dbh = Kalliope::DB->connect;
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

