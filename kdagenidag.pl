#!/usr/bin/perl

do 'kstdhead.pl';

@maaneder = ("Januar","Februar","Marts","April","Maj","Juni","Juli","August","September", "Oktober","November","December");

&kheaderHTML("Kalliope - Dagen i dag");

# Get the input
read(STDIN, $data, $ENV{'CONTENT_LENGTH'});

# Split the name-value pairs
@pairs = split(/&/, $data);

foreach $pair (@pairs) 
{
	($name, $value) = split(/=/, $pair);

	# Convert the HTML encoding
	$value =~ tr/+/ /;
	$value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
	$value =~ s/<!--(.|\n)*-->//g;

	# Convert HTML stuff as necessary.
	$value =~ s/<([^>]|\n)*>//g;
	$FORM{$name} = $value;
}

$md=$FORM{"md"};
$dg=$FORM{"dg"};

#Hvis argument er tomt, så vælg dagen i dag.
if ($md eq "") {
	($sec,$min,$hour,$dg,$md,$year,$wday,$yday,$isdst)=localtime(time);
	$md++;
}

&kcenterpageheader("Dagen idag - ".$dg.". ".$maaneder[$md-1]);

#Start kasse
beginwhitebox('Dagen idag','','');

open(FILE,"data.$LA/dagenidag.txt");
$i=0;

if ($md<10) { $md="0".$md; };
if ($dg<10) { $dg="0".$dg; };

foreach (<FILE>) {
	if (/^$md\-$dg/) {
		($dato,$tekst)=split(/\%/);
		($tis,$prut,$aar)=split(/\-/,$dato);
		print "<FONT COLOR=#ff0000>$aar</FONT> $tekst<BR>";
		$i++;
	}
}
print "Ingen begivenheder...<BR>" if $i==0;

#Print søge-FORMen
#print "<BR><BR><BR>Vælg anden dato:\n";
print "<FORM METHOD=POST ACTION=\"kdagenidag.pl\">";
#Udskriv dage 1-31...
print "<FONT SIZE=2><select name=\"dg\">\n";
foreach (1..31) {
	print "<option value=\"$_\" ";
	if ($_==$dg) {
		print "SELECTED";
	};
	print ">$_";
}
print "</select></FONT>";
#Udskriv måneder
print "<FONT SIZE=2><select name=\"md\">\n";
foreach (0..11) {
	print "<option value=\"".($_+1)."\" ";
	if ($_==($md-1)) {
		print "SELECTED";
	};
	print ">$maaneder[$_]";
}
print "</select></FONT>";
print "<INPUT TYPE=submit VALUE=\"Søg\">";
print "</FORM>";
endbox();

# Næste kolonne

&kfooterHTML;
