#!/usr/bin/perl -w

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
    $sql = 'longvid = "'.$arg{'longvid'}.'"' if defined $arg{'longvid'};
    $sql = 'vid = "'.$arg{'vid'}.'"' if defined $arg{'vid'};
    confess "Need some kind of id to initialize a new work\n" unless $sql;
    my $sth = $dbh->prepare("SELECT * FROM vaerker WHERE $sql");
    $sth->execute();
    my $obj = $sth->fetchrow_hashref;
    bless $obj,$class;
    return $obj;
}

sub vid {
    return $_[0]->{'vid'};
}

sub longvid {
    return $_[0]->{'longvid'};
}

sub title {
    return $_[0]->{'titel'};
}

sub subtitle {
    return $_[0]->{'underoverskrift'};
}


sub notes {
    my $self = shift;
    return $self->{'noter'}; 
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
    return $_[0]->{'fid'};
}

sub author {
    my $self = shift;
    return new Kalliope::Person('fid' => $self->fid); 
}

sub year {
    return $_[0]->{'aar'};
}

sub parenthesizedYear {
    my $self = shift;
    my $year = $self->year;
    return $year eq '?' ? '' : "($year)";
}

sub hasContent {
    return $_[0]->{'findes'} == 1;
}

sub iconURI {
    my $self = shift;
    #TODO: Måske skulle værker uden år have et specielt ikon.
    return $self->hasContent ? 'gfx/book_40.GIF' : 'gfx/book_40_high.GIF';
}

1;
