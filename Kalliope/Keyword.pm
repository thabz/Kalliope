
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

package Kalliope::Keyword;

use strict ('vars');
use Carp;
use Kalliope::DB;
use Kalliope::Person;
use Kalliope::Poem;

my $dbh = Kalliope::DB->connect;

sub new {
    my ($class,%arg) = @_;
    my $sql;
    $sql = "id = '".$arg{'id'}."'" if defined $arg{'id'};
    $sql = "ord = '".$arg{'ord'}."'" if defined $arg{'ord'};
     my $sth = $dbh->prepare("SELECT * FROM keywords WHERE $sql");
    $sth->execute();
    my $obj = $sth->fetchrow_hashref;
    bless $obj,$class;
    return $obj;
}

sub id {
    return $_[0]->{'id'};
}

sub content {
    return $_[0]->{'beskrivelse'};
}
sub ord {
    return $_[0]->{'ord'};
}
sub title {
    return $_[0]->{'titel'};
}

sub sortString {
    return $_[0]->title;
}

sub clickableTitle {
    my ($self,$lang) = @_;
    return '<A CLASS=green HREF="keyword.cgi?keyword='.$self->ord().'&amp;sprog='.$lang.'">'.$self->title.'</A>';
}

sub linksToKeywords {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT keywords.id  FROM keywords,keywords_relation WHERE keywords_relation.otherid = ? AND keywords_relation.othertype = 'keyword' AND keywords_relation.keywordid = keywords.id ORDER BY keywords.titel");
    $sth->execute($self->id);
    my @list;
    while (my $id = $sth->fetchrow_array) {
         push @list, new Kalliope::Keyword(id => $id);
    }
    return @list;
}

sub linksToPersons {
    my ($self,$LA) = @_;
    my $sth = $dbh->prepare("SELECT keywordid FROM keywords_relation WHERE otherid = ? AND othertype = 'person'");
    $sth->execute($self->id);
    my @list;
    while (my $id = $sth->fetchrow_array) {
         push @list, Kalliope::PersonHome::findByFhandle($id);
    }
    return grep {$_->lang eq $LA} @list;
}

sub linksToPoems {
    my ($self,$limit,$LA) = @_;
    my $sth = $dbh->prepare("SELECT t.longdid FROM textxkeyword k, digte t, digthits h WHERE k.keyword = ? AND h.longdid = k.longdid AND t.longdid = k.longdid AND t.lang = ? ORDER BY h.hits DESC ".($limit eq 'all' ? '' : 'LIMIT 5'));
    $sth->execute($self->ord,$LA);
    my @list;
    while (my $id = $sth->fetchrow_array) {
         push @list, new Kalliope::Poem(longdid => $id);
    }
    return @list; 
}

sub smallIcon {
    return '<IMG alt="#" HEIGHT=48 BORDER=0 SRC="gfx/icons/keywords-h48.gif">';
}

sub getSearchResultEntry {
    my ($self,$escapedNeedle,@needle) = @_;
    my $content = Kalliope::Strings::stripHTML($self->content);
    my $title = $self->title;

    my $match;
    foreach my $ne (@needle) {
	my ($a,$b,$c) = $content =~ /(.{0,30})($ne)(.{0,30})/si;
	$a =~ s/\n+/ /g;
	$c =~ s/\n+/ /g;
	$match .= "...$a<b>$b</b>$c...<BR>" if $b;
	$title =~ s/($ne)/\n$1\t/gi;
    }
    $title =~ s/\n/<B>/g;
    $title =~ s/\t/<\/B>/g;
    
    my $HTML = '<IMG ALT="Nøgleord" ALIGN="right" SRC="gfx/icons/keywords-h48.gif">';
    $HTML .= '<A CLASS=blue HREF="keyword.cgi?keywordid='.$self->id.qq|&amp;needle=$escapedNeedle">|.$title.qq|</A><BR>|;
    $HTML .= qq|$match|;
    $HTML .= '<BR><BR>';
    return $HTML;
}
1;
