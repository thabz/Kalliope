#!/usr/bin/perl -w

use strict;

use lib '..';
use Kalliope::DB;

my $dbh = Kalliope::DB->connect;

my $lang = $ARGV[0] || 'dk';

my $sth = $dbh->prepare("SELECT ord FROM dict WHERE sprog = ? ORDER BY ord");
$sth->execute($lang);
my $h;
while ($h = $sth->fetchrow_array) {
    print "$h\n"
}
