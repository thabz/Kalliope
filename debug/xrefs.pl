#!/usr/bin/perl -w

use strict;

use lib '..';
use Kalliope::DB;
use Kalliope::Poem;

my $dbh = Kalliope::DB::connect();

my $sthpoem = $dbh->prepare("SELECT longdid FROM digte WHERE longdid = ?");
my $sth = $dbh->prepare("SELECT fromid,toid FROM xrefs");
$sth->execute();


while (my @h = $sth->fetchrow_array) {
    my ($fromid,$toid) = @h;
    $sthpoem->execute($toid);
    if ($sthpoem->rows < 1) {
	my $poem = new Kalliope::Poem(longdid => $fromid);
	print "Dead link: $fromid (".$poem->author->fhandle."/".$poem->work->longvid.".txt) -> $toid\n";
    }
}
