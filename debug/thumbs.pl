#!/usr/bin/perl

use strict;

use lib '..';
use Kalliope::DB;

my $dir = '../fdirs';

my $dbh = Kalliope::DB::connect();
my $sth = $dbh->prepare("SELECT fhandle FROM fnavne");
$sth->execute();

while (my ($d) = $sth->fetchrow_array) {
    if (-e "$dir/$d/p1.jpg" && !-e "$dir/$d/thumb.jpg") {
	print "Mangler thumb: $d\n"
    }
}
