#!/usr/bin/perl

#Udskriver about.html filen

do 'kstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);
chomp($ARGV[0]);
$LA = $ARGV[0];

&kheaderHTML("Kalliope - Download",$LA);

&kcenterpageheader("Download Kalliope");

beginbluebox("Filer","","center");

print "<TABLE CELLPADDING=10><TR><TD ALIGN=center>";
print "<A HREF=\"../../download/kalliope-cgi.tar.gz\">";
print "<IMG SRC=\"../../html/kalliope/gfx/floppy.gif\" BORDER=0></A><BR>";
print "kalliope-cgi.tar.gz<BR>";
($dev,$ino,$mode,$nlink,$uid,$gid,$rdev,$size,
 $atime,$mtime,$ctime,$blksize,$blocks)
    = stat("../../download/kalliope-cgi.tar.gz");
print "(".&sizeinmegs($size)."MB)</TD>";

print "<TD ALIGN=center>";
print "<A HREF=\"../../download/kalliope-gfx.tar.gz\">";
print "<IMG SRC=\"../../html/kalliope/gfx/floppy.gif\" BORDER=0></A><BR>";
print "kalliope-gfx.tar.gz<BR>";
($dev,$ino,$mode,$nlink,$uid,$gid,$rdev,$size,
 $atime,$mtime,$ctime,$blksize,$blocks)
    = stat("../../download/kalliope-gfx.tar.gz");
print "(".&sizeinmegs($size)."MB)</TD><TR></TABLE>";

endbox();

print "<BR>";

print "<table align=center border=0 cellpadding=1 cellspacing=0 width=\"75%\"><tr width=\"100%\" ><td bgcolor=#000000>";
print "<TABLE align=center cellspacing=0 cellpadding=15 border=0 bgcolor=ffffff BORDER=5 WIDTH=\"100%\"><TR width=\"100%\" >\n";
print "<TD>";

print <<EOT;
<H1>Vejledning</H1>
Maskineriet bag Kalliope, nemlig koden og al data er frit tilgængelig og kan downloades ovenfor. Filerne vil altid indeholde de nyeste ændringer. Kalliope er programmeret i <A CLASS=green HREF="http://www.perl.com/">Perl</A> og udviklet under operativsystemet <A CLASS=green HREF="http://www.linux.org/">Linux</A>, og afvikles fra en Linux box som kører <A CLASS=green HREF="http://www.apache.org/">Apache</A> webserveren.
<BR><BR>
Følgende er en kort vejledning i hvordan man kan sætte Kalliope på en Linux eller anden UNIX computer med en webserver og Perl fortolkeren installeret. Denne distribution af Kalliope består af to dele, koden og data samlet i filen <B>kalliope-cgi.tar.gz</B> samt grafikken samlet i filen <B>kalliope-gfx.tar.gz</B>. Udpak tar-arkiverne i dit <B>~/public_html/</B> dir. Opret to tomme dirs med navnene <B>~/public_html/cgi/stat/</B> og <B>~/public_html/cgi/gaestebog/</B> som alle (deriblandt webserveren) har execute og write permissions til. Webserveren skal vide, at filer med <B>.pl</B> extensions er gyldige CGI scripts og at disse må udføres fra dit public_html dir. På min æske konfigureres dette i Apaches <B>/etc/httpd/conf/access.conf</B>. Dette burde være alt, hvad der skal til. 
<BR><BR>
Man burde kunne køre Kalliope under en webserver til andre operativsystemer, såsom Microsofts berygtede produkter, men det kræver nok nogle få ændringer hist og her og alle vegne. 
<BR><BR>
Jeg yder <I>ingen</I> support på Kalliopes kode, og filerne indeholder ikke yderligere vejledning.
<BR><BR><BR>
<H1>GNU Public License</H1>
Kalliopes kildetekst er omfattet af <A CLASS=green HREF="kabout.pl?licence.html?dk">GNU Public License</A>. Dette betyder i korte træk, at man må bruge kildeteksten til hvad man ønsker og at man må udvikle videre på Kalliope, så længe at man også selv lader eens ændringer være frit tilgængelige samt omfattet af GNU Public License. Man må endda også tjene penge på produkter baseret på Kalliope, så længe kildeteksten forbliver frit tilgængelig.

EOT

print "</TD></TR></TABLE>";
print "</td></tr></table>";

# Næste kolonne
do 'aboutrightmenu.pl';

&kfooterHTML;

# Tager et tal og smider antal megs tilbage med en decimal.
sub sizeinmegs {
    local($tal)=$_[0] / (1024*1024);
    $tal = sprintf ("%.1f",$tal);
}

