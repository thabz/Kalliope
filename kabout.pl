#!/usr/bin/perl
use CGI qw /:standard/;
$mycgi = new CGI;
#Udskriver about.html filen

do 'kstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);
chop($ARGV[0]);
chomp($ARGV[1]);
$abouttext = $ARGV[0]; 
$LA = $ARGV[1];

#$0 =~ /\/([^\/]*)$/;
#$wheretolinklanguage = $1.'?'.$abouttext;

#$wheretolinklanguage

&kheaderHTML("Kalliope - Om",$LA);

&kcenterpageheader("Om Kalliope");

beginwhitebox("","75%","left");

if ($abouttext =~ /\.\./ || !(-e "data.dk/$abouttext")) {
    print "Du som sidder ved ".$mycgi->remote_host()."... sådan leger vi ikke her! Men absolut et værdigt forsøg... :-)";
} else {
    open(FILE,"data.dk/$abouttext");
    foreach  (<FILE>) {
	print $_;
    }
}
endbox();

# Næste kolonne
do 'aboutrightmenu.pl';

&kfooterHTML;



