#!/usr/bin/perl
use DBI;

$dbh = DBI->connect("DBI:mysql:kalliope:localhost", "kalliope", "" ) or print STDERR ("Connect fejl: $DBI::errstr");
if ($dbh eq "") { die "Error!"; };

1;
