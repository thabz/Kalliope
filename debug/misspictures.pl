#!/usr/bin/perl

use strict;

use lib '..';
use Kalliope::DB;

my $dir = '../fdirs';

my $dbh = Kalliope::DB::connect();
my $sth = $dbh->prepare("SELECT fhandle,fornavn,efternavn FROM fnavne");
$sth->execute();

while (my ($d,$for,$eft) = $sth->fetchrow_array) {
    print "Mangler billede: $for $eft ($d)\n" unless -e "$dir/$d/p1.jpg";
}
