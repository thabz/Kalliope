#!/usr/bin/perl -w

package Kalliope::Persons;
use strict ('vars');
use Carp;
use Kalliope::DB;
use Kalliope::Person;

my $dbh = Kalliope::DB->connect;

sub getPoets {
    my $lang = shift;
    my @list;
    my $sth = $dbh->prepare("SELECT fid FROM fnavne WHERE sprog = ?");
    $sth->execute($lang);
    while (my $fid = $sth->fetchrow_array) {
        push @list, new Kalliope::Person(fid => $fid);
    }
    return @list;
};
1;
