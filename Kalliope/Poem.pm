
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

package Kalliope::Poem;

use strict ('vars');
use Carp;
use Kalliope::DB;
use Kalliope::Keyword;
use Kalliope::Person;
use Kalliope::Work;
use Kalliope::Strings;

my $dbh = Kalliope::DB->connect;

sub new {
    my ($class,%arg) = @_;
    my $sql;
    $sql = 'longdid = "'.$arg{'longdid'}.'"' if defined $arg{'longdid'};
    $sql = 'did = '.$arg{'did'} if defined $arg{'did'};
    $sql = 'did = '.$arg{'id'} if defined $arg{'id'};
    confess "Need some kind of id to initialize a new poem\n" unless $sql;
    my $sth = $dbh->prepare("SELECT did,fid,vid,longdid,titel,underoverskrift,foerstelinie,layouttype FROM digte WHERE $sql");
    $sth->execute();
    Kalliope::Page::notFound() unless $sth->rows;
    my $obj = $sth->fetchrow_hashref;
    bless $obj,$class;
    return $obj;
}

sub did {
    return $_[0]->{'did'};
}

sub longdid {
    return $_[0]->{'longdid'};
}

sub isProse {
    return shift->{'layouttype'} eq 'prosa' ? 1 : 0;
}

sub title {
    return $_[0]->{'titel'};
}

sub sortString {
    return $_[0]->title;
}

sub subtitle {
    $_[0]->{'underoverskrift'} =~ s/\n/<BR>/g;
    return $_[0]->{'underoverskrift'};
}

sub subtitleAsHTML {
    my $self = shift;
    $self->{'underoverskrift'} = $self->extractFootnotes($self->{'underoverskrift'});
    my $subtitle = $self->{'underoverskrift'};
    $subtitle =~ s/\n/<br>/g;
    return $subtitle;
}

sub firstline {
    return $_[0]->{'title'};
}

sub extractFootnotes {
    my ($self,$content) = @_;
    my @footnotes = @{$self->{'footnotes'}};
    my $num = $#footnotes >= 0 ? $#footnotes + 2 : 1;
    while ($content =~ s/<footnote>(.*)<\/footnote>/<footmark id="footnote$num"\/>/mi) {
       push @{$self->{'footnotes'}},$1;
       $num++;
    }
    return $content;
}

sub footnotes {
    return @{shift->{'footnotes'}};
}

sub content {
    my $self = shift;
    unless (defined $self->{'content'}) {
	my $sth = $dbh->prepare("SELECT indhold,noter FROM digte WHERE did = ?");
	$sth->execute($self->did);
	my $data = $sth->fetchrow_hashref;
	$self->{'indhold'} = $data->{'indhold'};
	$self->{'noter'} = $data->{'noter'};
        $self->{'type'} = $data->{'type'};
	$self->{'indhold'} = $self->extractFootnotes($self->{'indhold'});
    }
    if ($self->{'layouttype'} eq 'prosa') {
        my @indhold;
	foreach my $line (split /\n/,$self->{'indhold'}) {
	    $line =~ s/^(\s+)/_nbsp($1)/e;
            push @indhold,"$line\n";
        }
        $self->{'indhold'} = join "",@indhold;
    } else {
	$self->{'indhold'} =~ s/ /&nbsp;/g;
    }
    $self->{'indhold'} =~ s/<w>/<span class="wide">/g;
    $self->{'indhold'} =~ s/<\/w>/<\/span>/g;
    $self->{'indhold'} =~ s/\n/<BR>\n/g;
    return $self->{'indhold'}; 
}

sub contentForSearch {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT indhold FROM digte WHERE did = ?");
    $sth->execute($self->did);
    my $data = $self->subtitle."\n";
    $data .= $sth->fetchrow_array;
    return Kalliope::Strings::stripHTML($data);
}

sub _nbsp {
    return '&nbsp;'x(length shift);
}

sub notes {
    my $self = shift;
    unless (defined $self->{'indhold'}) {
        $self->content;
    }
    return $self->{'noter'}; 
}

sub keywords {
    my $self = shift;
    my @keywords;
    my $sth = $dbh->prepare("SELECT keywordid FROM keywords_relation WHERE keywords_relation.otherid = ? AND keywords_relation.othertype = 'digt'");
    $sth->execute($self->did);
    while (my $id = $sth->fetchrow_array) {
       push @keywords,new Kalliope::Keyword(id => $id);
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

sub clickableTitle {
    my ($self) = @_;
    return $self->author->name.': <A CLASS=green HREF="digt.pl?longdid='.$self->longdid.'">»'.$self->title.'«</A> - '.$self->work->title.' '.$self->work->parenthesizedYear;
}

sub clickableTitleSimple {
    my ($self) = @_;
    return '<A CLASS=green HREF="digt.pl?longdid='.$self->longdid.'">'.$self->title.'</A>';
}

sub smallIcon {
    return '<IMG WIDTH=32 HEIGHT=32 BORDER=0 SRC="gfx/open_book_40.GIF">';
}

sub author {
    my $self = shift;
    return new Kalliope::Person('fid' => $self->fid); 
}

sub vid {
    return $_[0]->{'vid'};
}

sub work {
    my $self = shift;
    return $self->{'cache'}->{'work'} if defined $self->{'cache'}->{'work'};
    $self->{'cache'}->{'work'} = new Kalliope::Work('vid' => $self->vid); 
    return $self->{'cache'}->{'work'};
}

sub getSearchResultEntry {
    my ($self,$escapedNeedle,@needle) = @_;
    my $content = $self->contentForSearch();
    my $work = $self->work;
    my $author = $self->author;
    my $poemTitle = $self->title;

    my $match;
    my $slash = '<SPAN STYLE="color: #a0a0a0">//</SPAN>';
    foreach my $ne (@needle) {
	my ($a,$b,$c) = $content =~ /(.{0,30})($ne)(.{0,30})/si;
	$a =~ s/\n+/ $slash /g;
	$c =~ s/\n+/ $slash /g;
	$match .= "...$a<b>$b</b>$c...<BR>" if $b;
	$poemTitle =~ s/($ne)/\n$1\t/gi;
    }
    $poemTitle =~ s/\n/<B>/g;
    $poemTitle =~ s/\t/<\/B>/g;
    
    my $HTML .= '<IMG ALT="Digt" ALIGN="right" SRC="gfx/open_book_40.GIF">';
    $HTML .= '<A CLASS=blue HREF="digt.pl?longdid='.$self->longdid.qq|&needle=$escapedNeedle#offset">|.$poemTitle.qq|</A><BR>|;
    $HTML .= qq|$match|;
    $HTML .= '<SPAN STYLE="color: green">'.$author->name.'</SPAN>: <SPAN STYLE="color: #a0a0a0"><I>'.$work->title."</I> ".$work->parenthesizedYear."</SPAN><BR><BR>";
    return $HTML;
}

1;
