#!/usr/bin/perl

do 'fstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

if (!($ARGV[1] eq "")) {
    chop($ARGV[0]);
    chomp($ARGV[1]);
}
$LA=$ARGV[1];

fheaderHTML($ARGV[0]);

do 'fvaerker.ovs';

print "<BR>";

beginwhitebox("Prosaværker","","left");

$opened = open(IN,"fdirs/".$fhandle."/vaerker.txt");

if ($opened) {
    print "<FONT SIZE=5>\n";
    while (<IN>) {
	@v=split(/=/,$_);
	if ($v[3] eq "p") {
	    $vhandle=$v[0];	#Værk handle
	    if (-e $fsdir."/".$vhandle.".txt") {
		print "<A HREF=\"vaerktoc.pl?".$fhandle."?".$vhandle."?$LA\">";
		print "<IMG SRC=\"gfx/book_40.GIF\" VALIGN=\"center\" BORDER=0 >";
		print "</A>";
	    }
	    else {
		print "<IMG SRC=\"book_40_high.GIF\" VALIGN=\"center\">";
	    }
	    if ($v[2] eq "\?") {
		print "<i>$v[1]</i><br>";
	    } else {
		print "<i>$v[1]</i> ($v[2])<br>";
	    }
	}
    }
    print "</FONT>";
} else {
    print "<IMG SRC=\"../../html/kalliope/gfx/excl.gif\">";
    #Der findes endnu ingen af ... værker i Kalliope
    print $ovs2{$LA};
}


endbox();

ffooterHTML();
