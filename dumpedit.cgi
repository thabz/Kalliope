#!/usr/bin/perl

use Kalliope::DB;
use CGI qw /:standard/;


my $dir = param('dir');

my $dbh = Kalliope::DB::connect();

my $sth = $dbh->prepare("SELECT data,filename FROM editpages WHERE dir = ? ORDER BY filename ASC");
$sth->execute($dir);

print "Content-type: text/plain\n\n";

while (my ($data,$filename) = $sth->fetchrow_array) {
    next if $data =~ /\[Duplet\]/i;
    print "\n# $dir/$filename\n";
    print $data;
}
