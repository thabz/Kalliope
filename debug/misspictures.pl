#!/usr/bin/perl

use strict;

use lib '..';
use Kalliope::DB;

my $dir = '../fdirs';

my $dbh = Kalliope::DB::connect();
my $sth = $dbh->prepare("SELECT fhandle FROM fnavne");
$sth->execute();

while (my ($d) = $sth->fetchrow_array) {
    print "Mangler billede: $d\n" unless -e "$dir/$d/p1.jpg";
}
