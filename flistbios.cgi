#!/usr/bin/perl

use Kalliope;
use Kalliope::Persons;
use Kalliope::Strings;
use CGI qw(:standard);
do 'kstdhead.pl';

$LA = url_param('sprog');

$0 =~ /\/([^\/]*)$/;
$wheretolinklanguage = $1.'?';

&kheaderHTML('Digtere',$LA);

my @poets = Kalliope::Persons::getPoets($LA);

beginwhitebox("","","left");

print "<TABLE ALIGN=center border=0 cellspacing=10><TR>";
my $i=0;
foreach $poet (sort {$a->efternavn cmp $b->efternavn} @poets) {
    if ($poet->hasBio) {
	print "<TD align=center valign=top>";
        print '<DIV CLASS=biothumb>';
	print '<A CLASS=biothumb HREF="'.$poet->bioURI.'">';
        print Kalliope::Strings::abbr(Kalliope::Strings::stripHTML($poet->bio),200);
        print '</A>';
        print '</DIV>';
	print $poet->name."<BR>";
	print '<FONT COLOR="#808080">'.$poet->lifespan.'</FONT><BR>';
	print "</TD>";
	print "</TR><TR>" if (++$i % 3 == 0);
    }
}
print "</TR></TABLE>";

endbox();
&kfooterHTML;
