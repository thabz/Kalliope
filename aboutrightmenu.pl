
goto SKIPTHIS;
# Næste kolonne
print "</TD><TD WIDTH=50 ALIGN=\"center\" VALIGN=\"top\">";
beginbluebox("Om","50","center");
#print "<table align=center border=0 cellpadding=1 cellspacing=0><tr width=\"100%\" ><td bgcolor=#000000>";
#print "<CENTER><FONT FACE=\"Helvetica, Arial\"COLOR=#e0e0f0><B>Om</B></FONT></CENTER>";
#print "<TABLE cellspacing=0 cellpadding=5 border=0 bgcolor=#e0e0f0 BORDER=5 WIDTH=\"100%\"><TR width=\"100%\" ><TD ALIGN=center>\n";
print"		<A HREF=\"kabout.pl?musen.html?$LA\">";
print"		<IMG SRC=\"../../html/kalliope/gfx/mouse.gif\" BORDER=0 ALT=\"Musen Kalliope.\"></A><BR>";
print"		Musen<BR>";
print"		<A HREF=\"kabout.pl?tak.html?$LA\">";
print"		<IMG SRC=\"../../html/kalliope/gfx/apple.gif\" BORDER=0 ALT=\"Tak til....\"></A><BR>";
print"		Mange tak<BR>";

if (-e "data.$LA/dagenidag.txt") {
    print"		<A HREF=\"kdagenidag.pl\">";		
    print"		<IMG SRC=\"../../html/kalliope/gfx/finger.gif\" BORDER=0 ALT=\"Dagen idag.\"></A><BR>";
    print"		Dagen idag<br>";
}

if (-e "data.$LA/links.html") {
    print"          <A HREF=\"klinks.pl\">";
    print"		<IMG SRC=\"../../html/kalliope/gfx/globe.gif\" BORDER=0 ALT=\"De obligatoriske weblinks.\"></A><BR>";
    print"		$ovs8{$LA}<br>";
}

print"		<A HREF=\"gaestebogvis.pl?$LA\">";
print"		<IMG SRC=\"../../html/kalliope/gfx/book.gif\" BORDER=0 ALT=\"Læs gæstebogen\"></A><BR>";
print"		Gæstebog<BR>";

print"		<A HREF=\"kabout.pl?teknisk.html?$LA\">";
print"		<IMG SRC=\"../../html/kalliope/gfx/database.gif\" BORDER=0 ALT=\"For nørder.\"></A><BR>";
print"		Teknisk<BR>";

print"		<A HREF=\"kdownload.pl?$LA\">";
print"		<IMG SRC=\"../../html/kalliope/gfx/floppy.gif\" BORDER=0 ALT=\"Download hele svineriet.\"></A><BR>";
print"		Download<BR>";
print"		<A HREF=\"kstats.pl?4?$LA\">";
print"		<IMG SRC=\"../../html/kalliope/gfx/equationpen.gif\" BORDER=0 ALT=\"Statistik.\"></A><BR>";
print"		Statistik<BR>";
endbox();
SKIPTHIS;
