#!/usr/bin/perl

do 'fstdhead.pl';

print "Content-type: text/html\n\n";
print "<HTML><HEAD><TITLE>$kpagetitel</TITLE></HEAD>\n";
print "<BODY BGCOLOR=#ffffff LINK=#000000 VLINK=#000000 ALINK=#000000>\n";
print "<FONT FACE=\"Georgia, Times\" SIZE=3\">\n";

@ARGV = split(/\?/,$ARGV[0]);

chop($ARGV[0]);
chop($ARGV[1]);
chomp($ARGV[2]);

$fhandle = $ARGV[0];
$longdid = $ARGV[1];
$LA = $ARGV[2];

udtraektilfheader($fhandle);

#Find og udskriv digtet

($vtype,$dtitel,$underoverskrift,$dindhold,$dnoter,$vtitel,$vaar,$vhandle,$vid) = $dbh->selectrow_array("SELECT V.type, D.titel, D.underoverskrift, D.indhold, D.noter, V.titel, aar, vhandle, D.vid FROM digte D, vaerker V WHERE D.longdid = '$longdid' AND V.vid = D.vid");

print "<FONT SIZE=+3><I>".$dtitel."</I></FONT><BR>\n";
if ($underoverskrift) {
    $underoverskrift =~ s/\n/<BR>/g;
    print "<FONT SIZE=-1>".$underoverskrift."</FONT><BR><BR>\n";
} else {
    print "<BR>";
}
if ($vtype ne 'p') {
	$dindhold =~ s/ /&nbsp;/g;
}

$dindhold =~ s/\n/<BR>/g;
print $dindhold;

#Udskriv disse oplysninger.
print "<BR><BR><BR>fra $ffornavn $fefternavn: ";
if ($vaar eq "\?") {
    print "<I>".$vtitel."</I><BR>\n";
} else {
    print "<I>".$vtitel."</I> (".$vaar.")<BR>\n";
}

print "</BODY></HTML>";
