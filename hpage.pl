#!/usr/bin/perl
use Kalliope;
use CGI qw /:standard/;
$mycgi = new CGI;
#
do 'kstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);

$LA = $ARGV[1];
chomp($LA);
unless ($LA eq "") {
    chop $ARGV[0];
} else {
    $LA = "dk";
};


if ($ARGV[0] =~ /\.\./ || !(-e "hist.$LA/".$ARGV[0].".txt")) {
    $text[0] = "Du som sidder ved ".$mycgi->remote_host()."... sådan leger vi ikke her! Men absolut et værdigt forsøg... :-)";
} else {
    open(FILE,"hist.$LA/".$ARGV[0].".txt");
    foreach (<FILE>) {
	if (/^T:/) {
	    $titel = $_;
	    $titel =~ s/^T://;
	    next;
	}
	if (/^P:/) {
	    chop;
	    s/^P://;
	    $pic = $_;
	    push @pictures,$pic;
	    open (FILE2,"gfx/hist/".$pic.".txt");
	    foreach (<FILE2>) {
		$caption{$pic}.=$_;
	    }
	    close(FILE2);
	    next;
	}
	push @text,$_;
    }
    close(FILE);
}
&kheaderHTML($titel,$LA);

#&kcenterpageheader("Litteraturhistorie - $titel");

print "<TABLE><TR><TD VALIGN=top>";


#Indled kasse til selve teksten
beginwhitebox("","100%","justify");

#Udskriv filen
print "<P CLASS=hist ALIGN=\"justify\">";
foreach (@text) {
    s/<A/<A CLASS=green/g;
    s/<P/<P CLASS=hist/g;
    print $_."\n";
}
print "</P>\n";
print "</TD></TR></TABLE>";
print "</td></tr></table>";


print "</TD><TD VALIGN=top ALIGN=center>";

if (@pictures) {

    #Indled kasse billeder
    beginwhitebox("Billeder",150,"center");

    foreach $file (@pictures) {
	print Kalliope::insertthumb('gfx/hist/_'.$file.'.jpg',"gfx/hist/$file.jpg");
	print '<BR><FONT SIZE=2>';
	
	print $caption{$file};
	print "</FONT><BR><BR>";
    }
    endbox();
}

print "</TD></TR></TABLE>";

kfooterHTML();
