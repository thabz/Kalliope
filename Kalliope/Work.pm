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
    $sql = 'vid = "'.$arg{'id'}.'"' if defined $arg{'id'};
    confess "Need some kind of id to initialize a new work\n" unless $sql;
    my $sth = $dbh->prepare("SELECT * FROM vaerker WHERE $sql");
    $sth->execute();
    Kalliope::Page::notFound() unless $sth->rows;
    my $obj = $sth->fetchrow_hashref;
    bless $obj,$class;
    $obj->{'quality_obj'} = new Kalliope::Quality($obj->{'quality'});
    return $obj;
}

sub lastModified {
    return shift->{'cvstimestamp'};
}

sub isProse {
    return shift->{'type'} ne 'v';
}

sub vid {
    return shift->{'vid'};
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
    return $self->{'titleWithYear'} if $self->{'titleWithYear'};
    $self->{'titleWithYear'} = $self->title.' '.$self->parenthesizedYear;
    return return $self->{'titleWithYear'};
}

sub subtitle {
    return shift->{'underoverskrift'};
}

sub clickableTitle {
    my $self = shift;
    my $HTML = '<A HREF="vaerktoc.pl?fhandle='.$self->fhandle.'&vhandle='.$self->vhandle.'">';
    $HTML .= $self->title;
    $HTML .= '</A>';
    return $HTML;
}

sub notes {
    my $self = shift;
    my @notes = split /\n+/,$self->{'noter'};
    return @notes;
}

sub quality {
    return shift->{'quality_obj'};
}

sub status {
   return shift->{'status'};
}

sub pics {
   my $self = shift;
   my $pics = $self->{'pics'};
   my @result;
   my $fhandle = $self->author->fhandle;
   foreach my $line (split /\$\$\$/,$pics) {
      my ($url,$desc) = split /%/,$line;
      push @result,{ thumbfile => 'fdirs/'.$fhandle.'/_'.$url,
                     destfile =>  'fdirs/'.$fhandle.'/'.$url,
                     description => $desc };
   }	     
   return @result;
}

sub hasPics {
   return shift->{'pics'} ? 1 : 0;
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
    return shift->{'fid'};
}

sub fhandle {
    return shift->{'fhandle'};
}

sub author {
    my $self = shift;
    return new Kalliope::Person('fid' => $self->fid); 
}

sub year {
    return shift->{'aar'};
}

sub hasYear {
    my $self = shift;
    return $self->year ne '?' && $self->year ne '';
}

sub parenthesizedYear {
    my $self = shift;
    my $year = $self->year;
    return $self->hasYear ? "($year)" : '';
}

sub hasContent {
    return shift->{'findes'} == 1;
}

sub iconURI {
    my $self = shift;
    #TODO: Måske skulle værker uden år have et specielt ikon.
    return $self->hasContent ? 'gfx/icons/book-h48.gif' : 'gfx/icons/book-na-h48.gif';
}

sub getSearchResultEntry {
    my ($self,$escapedNeedle,@needle) = @_;
    my $author= $self->author;
    my $title = $self->title;

    foreach my $ne (@needle) {
	$title =~ s/($ne)/\n$1\t/gi;
    }
    $title =~ s/\n/<B>/g;
    $title =~ s/\t/<\/B>/g;
    
    my $HTML .= '<IMG ALT="Værk" ALIGN="right" SRC="gfx/icons/book-h48.gif">';
    $HTML .= '<A CLASS=blue HREF="vaerktoc.pl?vhandle='.$self->vhandle.qq|&fhandle=|.$author->fhandle.'"><i>'.$title.'</i> '.$self->parenthesizedYear.qq|</A><BR>|;
    $HTML .= '<SPAN STYLE="color: green">'.$author->name.'</SPAN><BR><BR>';
    return $HTML;
}

1;
