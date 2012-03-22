#!/usr/bin/perl

# Make thumbnails of all images in fdirs

use Kalliope::DB;
use utf8;

my $dbh = Kalliope::DB::connect();

my $sth = $dbh->prepare("SELECT fhandle FROM fnavne");
$sth->execute();

while ($fhandle = $sth->fetchrow_array) {
    if (-e "fdirs/$fhandle") {
	print $fhandle."\n";
	$i = 1;
	while (-e "fdirs/$fhandle/p$i.jpg") {
	    if (!(-e "fdirs/$fhandle/_p$i.jpg" )) {
		print "    Making thumb for $fhandle picture #$i\n";
		system ("convert -geometry x150 fdirs/$fhandle/p$i.jpg fdirs/$fhandle/_p$i.jpg"); 

	    }
	    $i++;
	}
    }
}




