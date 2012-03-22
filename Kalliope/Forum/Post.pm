
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

package Kalliope::Forum::Post;

use strict;
use utf8;
use Kalliope::Date();
use Kalliope::DB();

sub new {
    my ($class,$obj) = @_;
    bless $obj,$class;
    return $obj;
}

sub newFromId {
    my ($id) = @_;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT * FROM forum WHERE id = ?");
    $sth->execute($id);
    my $h = $sth->fetchrow_hashref;
    return new Kalliope::Forum::Post($h);
}

sub from {
    return shift->{'sender'};
}

sub fromEmail {
    return shift->{'email'};
}

sub getForumId {
    return shift->{'forum_id'};
}

sub subject {
    return shift->{'subject'};
}

sub date {
    return shift->{'date'};
}

sub dateForDisplay {
    return Kalliope::Date::shortDate(shift->{'date'});
}

sub content {
    return shift->{'content'};
}

sub contentAsHTML {
    my $HTML = shift->content;
#    $HTML =~ s/^>+/\t/gm;

    my @body;
    my $div=0;
    foreach (split(/\n/,$HTML)) {
	my $res="";
	/(^>*)(.*)/;
	my $length = length($1);
	if ($div < $length) {
	    foreach my $i ($div..$length-1) {
		$res .= '<BLOCKQUOTE STYLE="border-left: 2px solid rgb(185,185,174); padding:5px; margin: 3px; color: #808080" >';
	    }
	} elsif ($div > $length) {
	    $res .= "</BLOCKQUOTE>"x($div-$length);
	} else {
	    $res.= "<BR>";
	}
	$div = $length;
	my $rest = $2;
	$rest =~ s/</&lt;/g;
	$rest =~ s/>/&gt;/g;
	$rest = Kalliope::Web::linkParse($rest);
	$res .= "$rest\n";
	push @body, $res;
    }
    if ($div > 0) {
	push @body, "</BLOCKQUOTE>"x($div);
    }
    $HTML = join ('',@body);

#    $HTML =~ s/</&lt;/gm;
#    $HTML =~ s/>/&gt;/gm;
#    my $HTML = Kalliope::Web::linkParse($HTML);
#    $HTML =~ s/^\t(.*)\n/<div style="color: #808080; margin: 0px; padding: 0 0 0 10px">$1<\/div>/gm;
#    $HTML =~ s/\n/<BR>/g;
    return $HTML;
}

sub id {
    return shift->{'id'};
}

sub parent {
    return shift->{'parent'};
}

sub threadId {
    return shift->{'thread_id'};
}

sub insertIntoDB {
    my $self = shift;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("INSERT INTO forum (parent,forum_id,thread_id,latest_thread_activity,date,sender,email,subject,content) VALUES (?,?,?,?,?,?,?,?,?)");
    $sth->execute($self->{'parent'},
                  $self->{'forum_id'},
                  $self->{'thread_id'},
                  $self->{'date'},
                  $self->{'date'},
                  $self->{'sender'},
                  $self->{'email'},
                  $self->{'subject'},
                  $self->{'content'});

    # Set thread_id if first post of thread
    unless ($self->{'parent'}) {
	my $id = Kalliope::DB::getLastInsertId($dbh,"forum");
	$sth = $dbh->prepare("UPDATE forum SET thread_id = id WHERE id = ?");
	$sth->execute($id);
	$sth->finish();
    }

    # Update activity in first post of thread
    if ($self->{'parent'}) {
	$sth = $dbh->prepare("UPDATE forum SET latest_thread_activity = ? WHERE thread_id = ? AND parent = 0");
	$sth->execute($self->{'date'},$self->{'thread_id'});
    }
}

1;
