#!/usr/bin/perl

use lib '../';
use Kalliope::DB;
use POSIX;


my $dbh = Kalliope::DB->connect;

my ($mon,$year) = (2,1999);

my $sth = $dbh->prepare("SELECT count(*) FROM digte WHERE afsnit = 0 AND createtime < ?");

$unixdate = POSIX::mktime(0,0,0,1,2,1999-1900);

while ($unixdate < time+24*3600) {

   $sth->execute($unixdate);
   my $count = $sth->fetchrow_array;

   my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($unixdate);
   $year += 1900;
   $mon += 1;
   print "$year/$mon/$mday $count\n";
   $unixdate += 24*3600;

}
