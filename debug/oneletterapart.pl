#!/usr/bin/perl -w

#
# Finder alle ord som kun har eet bogstav til forskel
#


use strict;

use lib '..';
use Kalliope::DB;

my $dbh = Kalliope::DB->connect;

my $lang = $ARGV[0] || 'dk';
my @ord;

my $sth = $dbh->prepare("SELECT ord FROM dict WHERE sprog = ? ORDER BY ord");
$sth->execute($lang);
my $h;
while ($h = $sth->fetchrow_array) {
    push @ord,$h;
}

# Find words with just one letter apart 

my @groups;
foreach my $word1 (@ord) {
    my $length = length $word1;
    my $idx1 = ord (substr ($word1,0,1)) - ord ('a');
    my $idx2 = ord (substr ($word1,1,1)) - ord ('a');

    # Run through previous words with same length
    # and either same firstletter or same secondletter
    foreach my $word2 (@{$groups[$length][$idx1]},@{$groups[$length][$idx2]}) {
	my $diff = 0;
	# Compare the two words letter by letter
	for (my $j = 0; $j < $length; $j++) {
	    $diff++ if substr($word1,$j,1) ne substr($word2,$j,1);
	    last if $diff > 1;
	}
	print sprintf ("%-20s %-20s\n",$word1,$word2) if $diff == 1;
    }
    push @{$groups[$length][$idx1]},$word1;
    push @{$groups[$length][$idx2]},$word1;
}

