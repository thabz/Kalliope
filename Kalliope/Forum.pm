
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

sub getLatestThreadIds {
    my %arg = @_;
    my $sth = $dbh->prepare("SELECT thread_id FROM forum WHERE parent = 0 ORDER BY latest_thread_activity DESC LIMIT ?,?"); 
    $sth->execute($arg{'begin'},$arg{'count'});

    my @result = ();
    while (my ($h) = $sth->fetchrow_array) {
         push @result,$h;
    }
    return @result;
}

sub getPostsInThread {
    my $thread_id = shift;
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

