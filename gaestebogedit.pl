#!/usr/bin/perl


do 'kstdhead.pl';

@ARGV = split (/\?/,$ARGV[0]);
chomp $ARGV[0];
$LA = $ARGV[0];

&kheaderHTML("Kalliope - skriv i gæstebog",$LA);

&kcenterpageheader("Skriv i gæstebogen");

&beginwhitebox('Skriv i gæstebogen','');

print "<FORM METHOD=POST ACTION=\"gaestebogsubmit.pl?$LA\">";
print "<TABLE CELLSPACING=0 >";

print "<TR><TD>Navn:</TD><TD><INPUT TYPE=text NAME=navn SIZE=30></TD></TR>";
print "<TR><TD>E-mail:</TD><TD><INPUT TYPE=text NAME=email SIZE=30> (Valgfri!)</TD></TR>";
print "<TR><TD>Hjemmeside:</TD><TD><INPUT TYPE=text NAME=web VALUE=\"http://\" SIZE=30> (Valgfri!)</TD></TR>";

print "</TABLE>";

print "<BR>Ordet er dit: <BR>";
print "<TEXTAREA WRAP=virtual NAME=thetext COLS=50 ROWS=11>";
print "</TEXTAREA><BR><BR><CENTER>";
print "<INPUT TYPE=submit NAME=\"knap\" VALUE=\"OK\"> ";
print "<INPUT TYPE=\"Reset\" VALUE=\"Slet\">";
print "</CENTER></FORM>";
&endbox();

&beginwhitebox('Bemærk','75%');
print "Det er tilladt at skrive næsten alt i gæstebogen. Både konstruktiv kritik, ros, foreslag og spydigheder er på sin plads. Det du skriver skal blot være relateret til Kalliope."; 
print "Tvivlsomme indlæg vil blive fjernet fra gæstebogen. Man skal dog gøre sig særdeles umage for at opnå den ære.";
&endbox();

&kfooterHTML;

