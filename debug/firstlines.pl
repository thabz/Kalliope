#!/usr/bin/perl -w

use strict;

use lib '..';
use Kalliope::DB;
use Kalliope::Poem;

my $dbh = Kalliope::DB::connect();

my $sth = $dbh->prepare("SELECT longdid,foerstelinie FROM digte WHERE layouttype = 'digt' AND afsnit = 0");
$sth->execute;

while (my ($longdid,$line) = $sth->fetchrow_array) {
    next unless $line =~ /[;,\.:] *$/;
    my $poem = new Kalliope::Poem(longdid => $longdid);
    print "Bad firstline: $longdid (".$poem->author->fhandle."/".$poem->work->longvid.".txt) -> $line\n";
}
