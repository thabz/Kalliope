#!/usr/bin/perl -w 

use lib '../';
use Kalliope::DB;
use Kalliope::Person;
use strict;

my %colors = (
    dk => 'black',
    se => 'magenta',
    de => 'orange',
    it => 'green',
    fr => 'burlywood',
    uk => 'blue',
    us => 'red',
    no => 'cyan'
);


my %sprog;
my %lines;

open (FILE,">tmp.dot");

my $dbh = Kalliope::DB->connect;

my $sth = $dbh->prepare("SELECT l.sprog,l.fhandle as fromhandle,fromid,toid,r.fhandle as tohandle,r.sprog 
             	         FROM xrefs,digte as pis, digte as lort, fnavne as l, fnavne as r 
			 WHERE toid = pis .longdid and fromid = lort.longdid and pis.fid = r.fid and lort.fid = l.fid");
$sth->execute;

print FILE "digraph kalliopexrefs {\n";

while (my ($fromlang,$fromhandle,$fromid,$toid,$tohandle,$tolang) = $sth->fetchrow_array) {
    next if $fromhandle eq $tohandle;
    my $line = "    $fromhandle -> $tohandle;\n";
    $sprog{$fromhandle} = $fromlang;
    $sprog{$tohandle} = $tolang;
    $lines{$line} = 1;
}

foreach my $handle (keys %sprog) {
    my $person = new Kalliope::Person (fhandle => $handle);
    my $sprog = $person->lang;
    my $name = $person->name;
    my $span = $person->lifespan;
    my $color = $colors{$sprog};
    print FILE qq|    $handle [ fontsize=9, fontname="Arial", label="$name\\n$span",fontcolor="$color" ];\n|; 
}

map { print FILE } keys %lines;

print FILE "}\n";

close FILE;

`dot -Tpng -o dot.gif tmp.dot`;
`rm tmp.dot`;

