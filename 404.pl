#!/usr/bin/perl
use CGI qw (:standard);
use utf8;

do 'kstdhead.pl';

$errorcode = url_param('errorcode');

$errortitles[404] = '404 - dokumentet ikke fundet';
$errortitles[500] = '500 - intern serverfejl';
$errortexts[404] = qq (
Beklager... et af følgende må være sket:<BR><BR>
<UL>
<LI>Du er blevet henvist til en side, som ikke længere eksisterer i Kalliope.
<LI>Kalliope indeholder en ukorrekt henvisning.
<LI>Du har skrevet noget pladder i din browsers URL felt.
</UL>);
$errortexts[500] = qq (Der er opstået en scriptfejl i Kalliope. Beklager! En
fejlrapport er automatisk sendt til system administratoren. );

&kheaderHTML($errortitles[$errorcode]);
&beginwhitebox($errortitles[$errorcode],"75%",'');
print $errortexts[$errorcode];
&endbox('<A HREF="kfront.pl"><IMG BORDER=0 SRC="gfx/rightarrow.gif" ALT="Kalliopes forside">');
&kfooterHTML;
