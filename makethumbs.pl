#!/usr/bin/perl

#Make thumbnails of all images in fdirs

do_country("dk");
do_country("uk");
do_country("fr");
do_country("de");
do_country("se");
do_country("no");

sub do_country {
    open(FILE,"data.$_[0]/fnavne.txt");
    while(<FILE>) {
	($fhandle) = split(/=/);
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
    close(FILE);
}




