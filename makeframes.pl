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
	if (-e "fdirs/$fhandle/frame.png") {
	    if (!(-e "fdirs/$fhandle/frame.gif" )) {
		print "    Making frame.gif for $fhandle\n";
		system ("convert fdirs/$fhandle/frame.png fdirs/$fhandle/frame.gif"); 

	    }
	    $i++;
	}
    }
}




